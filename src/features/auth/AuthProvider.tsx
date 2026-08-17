import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/env';
import type { Profile } from '@/lib/supabase/types';
import {
  SIGN_IN_FAILED_MESSAGE,
  SOCIAL_ONLY_ACCOUNT_MESSAGE,
  classifyIdentifier,
  normalisePhone,
} from './identifier';
import { isPreviewMode, previewProfile, previewSession } from '@/features/dev/preview';

WebBrowser.maybeCompleteAuthSession();

/**
 * PHONE / SMS IS STILL A STUB.
 *
 * Step 1 left it unwired because SMS costs money per message, and Spec B is
 * explicit that this round does not connect it. One message, used by both the
 * dedicated entry point and the identifier router, so they cannot drift.
 *
 * To activate: enable Supabase → Providers → Phone with a Twilio account, then
 * replace the throw with supabase.auth.signInWithOtp({ phone }) plus a verify
 * screen.
 */
const PHONE_STUB_MESSAGE =
  'Phone sign-in is not connected yet. It needs a paid SMS provider (Twilio) — ' +
  'see .env.local.example. Use your email or username for now.';

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

  /**
   * Returns the new user's id ONLY when signup also produced a session, i.e.
   * when email confirmation is switched off. With confirmation on there is no
   * session yet, so the caller cannot write anything owned by that account —
   * the avatar upload depends on knowing which.
   */
  signUpWithEmail: (
    email: string,
    password: string,
    displayName?: string,
    extraMetadata?: Record<string, unknown>,
  ) => Promise<{ userId: string | null; hasSession: boolean }>;
  /**
   * Writes the profile details collected on the last step of the sign-up
   * wizard. Used by the third-party path, where the account already exists by
   * the time we can ask for a name.
   */
  saveProfileDetails: (details: { displayName?: string; username?: string }) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  /**
   * Signs in from whatever the user typed — email, username or phone. Throws a
   * user-facing message on failure.
   */
  signInWithIdentifier: (identifier: string, password: string) => Promise<void>;
  /** True when a username is free and legal. False on any network trouble. */
  isUsernameAvailable: (candidate: string) => Promise<boolean>;
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
    // Preview mode hands back a fixed fake account so every screen can be
    // reviewed without signing up. Dev builds only — see src/features/dev/preview.ts.
    if (isPreviewMode) {
      setSession(previewSession);
      setProfile(previewProfile);
      setInitialising(false);
      return;
    }

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

  // Profile follows the session. Skipped in preview mode, where the profile is
  // a fixture and there is no backend to load it from.
  useEffect(() => {
    if (isPreviewMode) return;
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
        const { data, error } = await supabase.auth.signUp({
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
        return { userId: data.user?.id ?? null, hasSession: !!data.session };
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
   * `username` goes to `profiles.username`, where a case-insensitive unique
   * index enforces it. This path is for third-party sign-up, where a session
   * already exists. Email sign-up has no session yet when confirmation is on,
   * so there the username travels as auth metadata and a trigger copies it —
   * see apply_username_from_metadata() in migration 20260817000700.
   */
  const saveProfileDetails = useCallback(
    async ({ displayName, username }: { displayName?: string; username?: string }) => {
      const userId = session?.user.id;
      if (!userId) throw new Error('You are not signed in.');

      setBusy(true);
      try {
        const patch: { display_name?: string; username?: string } = {};
        const name = displayName?.trim();
        const handle = username?.trim();
        if (name) patch.display_name = name;
        if (handle) patch.username = handle;

        if (Object.keys(patch).length > 0) {
          const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
          if (error) {
            // 23505 is a unique violation — here, always the username index.
            if ((error as { code?: string }).code === '23505') {
              throw new Error('That username has just been taken. Please choose another.');
            }
            throw error;
          }
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

  const isUsernameAvailable = useCallback(async (candidate: string) => {
    const { data, error } = await supabase.rpc('is_username_available', { candidate });
    if (error) {
      // Do not claim a name is free when we could not check. The database's
      // unique index is the real gate, so a false negative here is harmless.
      console.warn('[auth] username check failed:', error.message);
      return false;
    }
    return data === true;
  }, []);

  /**
   * The three-way sign-in behind the single identifier field.
   *
   *   email    → straight to Supabase
   *   username → resolved to an email, then the same call
   *   phone    → the SMS stub, untouched by this round
   *
   * Every failure that could reveal whether an account exists uses one shared
   * message. The exception is an account with no password at all, which gets a
   * specific hint — otherwise a Google-only user retypes their password forever
   * with no idea why it never works.
   */
  const signInWithIdentifier = useCallback(
    async (identifier: string, password: string) => {
      const value = identifier.trim();
      const kind = classifyIdentifier(value);

      if (kind === 'phone') {
        // Still the Step 1 stub — Spec B explicitly does not connect SMS.
        normalisePhone(value);
        throw new Error(PHONE_STUB_MESSAGE);
      }

      let email = value;

      if (kind === 'username') {
        const { data, error } = await supabase.rpc('email_for_username', { candidate: value });
        if (error) throw new Error(SIGN_IN_FAILED_MESSAGE);
        if (!data?.found || !data.email) throw new Error(SIGN_IN_FAILED_MESSAGE);
        if (!data.has_password) throw new Error(SOCIAL_ONLY_ACCOUNT_MESSAGE);
        email = data.email;
      }

      setBusy(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(SIGN_IN_FAILED_MESSAGE);
      } finally {
        setBusy(false);
      }
    },
    [],
  );

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

  /** PHONE / SMS — deliberate stub. See PHONE_STUB_MESSAGE at the top of the file. */
  const startPhoneSignIn = useCallback(async (_phone: string): Promise<never> => {
    throw new Error(PHONE_STUB_MESSAGE);
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
      signInWithIdentifier,
      isUsernameAvailable,
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
      signInWithIdentifier,
      isUsernameAvailable,
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
