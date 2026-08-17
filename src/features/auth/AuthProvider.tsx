import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/env';
import type { Profile } from '@/lib/supabase/types';

WebBrowser.maybeCompleteAuthSession();

/** The four OAuth providers wired to Supabase. Apple additionally has a native path. */
export type OAuthProvider = 'google' | 'facebook' | 'twitter' | 'apple';

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  /** True until the persisted session has been restored. Gate routing on this. */
  initialising: boolean;
  busy: boolean;

  /** Referral code typed on the sign-in screen, held until signup completes. */
  pendingReferralCode: string;
  setPendingReferralCode: (code: string) => void;

  signUpWithEmail: (
    email: string,
    password: string,
    displayName?: string,
    extraMetadata?: Record<string, unknown>,
  ) => Promise<void>;
  /**
   * Writes the profile details collected on the last step of the sign-up
   * wizard. Used by the third-party path, where the account already exists by
   * the time we can ask for a name.
   */
  saveProfileDetails: (details: { displayName?: string; username?: string }) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>;
  signInWithAppleNative: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  startPhoneSignIn: (phone: string) => Promise<never>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Deep link OAuth comes back to. Must be listed in
 * Supabase → Authentication → URL Configuration → Redirect URLs.
 * In Expo Go this resolves to an exp:// URL; in a build, farmfromhere://.
 */
function redirectUri() {
  return AuthSession.makeRedirectUri({ path: 'auth/callback' });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [initialising, setInitialising] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pendingReferralCode, setPendingReferralCode] = useState('');

  // Read inside async callbacks without making them depend on render state.
  const referralRef = useRef('');
  referralRef.current = pendingReferralCode;

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[auth] could not load profile:', error.message);
      return;
    }
    setProfile(data ?? null);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setInitialising(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitialising(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) setProfile(null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Profile follows the session.
  useEffect(() => {
    if (session?.user.id) void loadProfile(session.user.id);
  }, [session?.user.id, loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (session?.user.id) await loadProfile(session.user.id);
  }, [session?.user.id, loadProfile]);

  /**
   * OAuth signups cannot carry custom metadata through the provider, so the
   * referral code is claimed right after the session lands. Email and Guest
   * signups pass it as metadata instead and are handled by handle_new_user().
   * Either way the reward is paid once, through seeds_ledger, and a bad code
   * never blocks the signup.
   */
  const claimPendingReferral = useCallback(async () => {
    const code = referralRef.current.trim();
    if (!code) return;

    const { data, error } = await supabase.rpc('claim_referral_code', { input_code: code });

    if (error) {
      // A referral problem must never strand a user who just signed in
      // successfully, so this is logged, not thrown.
      console.warn('[auth] referral claim failed:', error.message);
    } else if (!data?.ok) {
      console.info('[auth] referral not applied:', data?.reason);
    }
    setPendingReferralCode('');
  }, []);

  const signUpWithEmail = useCallback(
    async (
      email: string,
      password: string,
      displayName?: string,
      extraMetadata?: Record<string, unknown>,
    ) => {
      setBusy(true);
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Read by handle_new_user() to grant the opening Growth + Seeds and
            // to settle the referral. Anything in extraMetadata is stored on
            // auth.users but ignored by the trigger — see saveProfileDetails.
            data: {
              ...extraMetadata,
              display_name: displayName?.trim() || null,
              referral_code: referralRef.current.trim() || null,
            },
          },
        });
        if (error) throw error;
        setPendingReferralCode('');
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  /**
   * Saves the wizard's final step.
   *
   * `display_name` goes to `profiles`, which the "update own profile" RLS policy
   * already allows — no new backend.
   *
   * ⚠️ `username` goes to auth metadata, NOT to `profiles`. There is no
   * `profiles.username` column and adding one is a migration, which this round
   * is explicitly not allowed to do. Storing it here keeps the value safe and
   * in one predictable place for Spec B to migrate and enforce uniqueness on.
   * TODO(Spec B): add profiles.username (unique, case-folded), backfill from
   * auth.users.raw_user_meta_data->>'username', then read it from the profile.
   */
  const saveProfileDetails = useCallback(
    async ({ displayName, username }: { displayName?: string; username?: string }) => {
      const userId = session?.user.id;
      if (!userId) throw new Error('You are not signed in.');

      setBusy(true);
      try {
        const name = displayName?.trim();
        if (name) {
          const { error } = await supabase
            .from('profiles')
            .update({ display_name: name })
            .eq('id', userId);
          if (error) throw error;
        }

        const handle = username?.trim();
        if (handle) {
          // NOT checked for uniqueness — that is Spec B's job.
          const { error } = await supabase.auth.updateUser({ data: { username: handle } });
          if (error) throw error;
        }

        await refreshProfile();
      } finally {
        setBusy(false);
      }
    },
    [session?.user.id, refreshProfile],
  );

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } finally {
      setBusy(false);
    }
  }, []);

  const signInWithOAuth = useCallback(
    async (provider: OAuthProvider) => {
      setBusy(true);
      try {
        const redirectTo = redirectUri();
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo, skipBrowserRedirect: true },
        });
        if (error) throw error;
        if (!data?.url) throw new Error('Supabase did not return an authorization URL.');

        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type !== 'success') return; // user dismissed the sheet

        // PKCE: the callback carries ?code=, exchanged here for a session.
        const code = new URL(result.url).searchParams.get('code');
        if (!code) throw new Error('No authorization code in the callback URL.');

        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;

        await claimPendingReferral();
      } finally {
        setBusy(false);
      }
    },
    [claimPendingReferral],
  );

  /**
   * Native Sign in with Apple. Apple requires this whenever other third-party
   * logins are offered, and the native sheet is a far better experience than
   * the web flow. Falls back to the browser flow off-iOS.
   */
  const signInWithAppleNative = useCallback(async () => {
    if (Platform.OS !== 'ios') return signInWithOAuth('apple');

    setBusy(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error('Apple did not return an identity token.');

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });
      if (error) throw error;

      await claimPendingReferral();
    } catch (err) {
      // The user cancelling the sheet is not an error worth surfacing.
      if ((err as { code?: string }).code === 'ERR_REQUEST_CANCELED') return;
      throw err;
    } finally {
      setBusy(false);
    }
  }, [signInWithOAuth, claimPendingReferral]);

  /**
   * Guest = Supabase anonymous sign-in. A real auth.users row is created, so the
   * guest gets a profile and their opening grants like anyone else and can be
   * upgraded to a full account later without losing their Growth or Seeds.
   *
   * Requires Authentication → Providers → "Allow anonymous sign-ins" to be ON.
   */
  const continueAsGuest = useCallback(async () => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInAnonymously({
        options: { data: { referral_code: referralRef.current.trim() || null } },
      });
      if (error) throw error;
      setPendingReferralCode('');
    } finally {
      setBusy(false);
    }
  }, []);

  /**
   * PHONE / SMS — DELIBERATE STUB.
   *
   * The UI is built (app/(auth)/phone.tsx) but the backend is not wired: SMS
   * costs money per message and the spec says not to block Step 1 on it.
   * To activate: enable Supabase → Providers → Phone with a Twilio account,
   * then replace this body with supabase.auth.signInWithOtp({ phone }) plus a
   * verifyOtp screen.
   */
  const startPhoneSignIn = useCallback(async (_phone: string): Promise<never> => {
    throw new Error(
      'Phone sign-in is not connected yet. It needs a paid SMS provider (Twilio) ' +
        'wired to Supabase — see .env.local.example. Use email or a social login for now.',
    );
  }, []);

  const signOut = useCallback(async () => {
    setBusy(true);
    try {
      await supabase.auth.signOut();
      setProfile(null);
    } finally {
      setBusy(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      initialising,
      busy,
      pendingReferralCode,
      setPendingReferralCode,
      signUpWithEmail,
      saveProfileDetails,
      signInWithEmail,
      signInWithOAuth,
      signInWithAppleNative,
      continueAsGuest,
      startPhoneSignIn,
      signOut,
      refreshProfile,
    }),
    [
      session,
      profile,
      initialising,
      busy,
      pendingReferralCode,
      signUpWithEmail,
      saveProfileDetails,
      signInWithEmail,
      signInWithOAuth,
      signInWithAppleNative,
      continueAsGuest,
      startPhoneSignIn,
      signOut,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>.');
  return ctx;
}
