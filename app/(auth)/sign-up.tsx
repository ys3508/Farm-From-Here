import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';

import {
  BrandButton,
  BrandField,
  BrandText,
  Collapsible,
  OnboardingStage,
  ScrimCard,
  StepProgress,
  brandColors,
  brandRadius,
  brandSpacing,
} from '@/design/brand';
import { REFERRAL_REWARD_SEEDS } from '@/config/economy';
import { useAuth } from '@/features/auth/AuthProvider';
import { ProviderButtons } from '@/features/auth/ProviderButtons';
import { classifyIdentifier } from '@/features/auth/identifier';
import { validateUsernameFormat } from '@/features/auth/username';
import { pickAvatar, uploadAvatar } from '@/features/profile/avatar';
import { onboardingSequence } from '@/features/onboarding/sequence';

/**
 * SIGN UP — a three-step wizard.
 *
 *   Email path:       1 account → 2 password → 3 profile → create
 *   Third-party path: 1 account → (2 skipped) → 3 profile → create
 *
 * The third-party path is the subtle one: Supabase creates the account the
 * moment the provider returns, so by step 3 the user already exists and
 * "Create account" is really "finish setting up". `beginProfileSetup()` keeps
 * the auth layout from bouncing them into My World in the meantime.
 *
 * Referral reward is untouched Step 1 logic: 500 Seeds each side, through
 * seeds_ledger, only once the account actually exists.
 */
type Step = 1 | 2 | 3;
type Path = 'credentials' | 'thirdParty';

export default function SignUpScreen() {
  const router = useRouter();
  const {
    signUpWithEmail,
    saveProfileDetails,
    isUsernameAvailable,
    busy,
    session,
    pendingReferralCode,
    setPendingReferralCode,
  } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [path, setPath] = useState<Path>('credentials');

  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [realName, setRealName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Avatar is optional: chosen here, uploaded once an account exists to own it.
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarNotice, setAvatarNotice] = useState<string | null>(null);

  // Hold the wizard open across the third-party round trip, and let go on exit.
  useEffect(() => {
    onboardingSequence.beginProfileSetup();
    return () => onboardingSequence.endProfileSetup();
  }, []);

  /**
   * A session appearing while we are still on step 1 means a provider just came
   * back: the account exists, the password step is meaningless, so jump to the
   * profile step.
   */
  useEffect(() => {
    if (session && step === 1) {
      setPath('thirdParty');
      setStep(3);
    }
  }, [session, step]);

  const leave = () => {
    onboardingSequence.endProfileSetup();
    router.replace('/');
  };

  // ── Step 1 ────────────────────────────────────────────────────────────────
  const submitStep1 = async () => {
    setError(null);
    const value = identifier.trim();
    if (!value) return setError('Enter an email address or phone number.');

    // Sign up takes Email or Phone only — no username. Login differs on purpose.
    const kind = classifyIdentifier(value);
    if (kind === 'username') {
      return setError('That does not look like an email address or a phone number.');
    }
    if (kind === 'phone') {
      // Phone sign-up cannot complete: SMS was never wired (Step 1 stub). Better
      // to say so now than after they have filled in two more steps.
      return setError(
        'Phone sign-up is not connected yet — it needs a paid SMS provider. ' +
          'Please use an email address for now.',
      );
    }

    // Shape first — instant and offline — then the one query that needs a round
    // trip. The database's unique index is still the real authority; this check
    // exists so the user is told now rather than after filling in two more steps.
    const formatProblem = validateUsernameFormat(username);
    if (formatProblem) return setError(formatProblem);

    setCheckingUsername(true);
    try {
      const available = await isUsernameAvailable(username.trim());
      if (!available) return setError('That username is taken. Please choose another.');
    } finally {
      setCheckingUsername(false);
    }

    setStep(2);
  };

  // ── Step 2 ────────────────────────────────────────────────────────────────
  const submitStep2 = () => {
    setError(null);
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('The two passwords do not match.');
    setStep(3);
  };

  // ── Step 3 ────────────────────────────────────────────────────────────────
  const chooseAvatar = async () => {
    setAvatarNotice(null);
    const picked = await pickAvatar();
    if (picked.status === 'denied') {
      setAvatarNotice('Photo access is off. You can turn it on in Settings, or skip this.');
      return;
    }
    if (picked.status === 'picked') setAvatarUri(picked.uri);
  };

  const create = async () => {
    setError(null);
    if (!realName.trim()) return setError('Enter your name.');

    try {
      let profileId: string | undefined;

      if (path === 'thirdParty') {
        // The account already exists — this fills in what the provider could not.
        await saveProfileDetails({ displayName: realName, username });
        profileId = session?.user.id;
      } else {
        const result = await signUpWithEmail(identifier.trim(), password, realName, {
          username: username.trim() || null,
        });
        // Only usable when signup also produced a session. With email
        // confirmation switched on it does not, and nothing can be written on
        // that account's behalf until they click the link.
        profileId = result.hasSession ? (result.userId ?? undefined) : undefined;
      }

      if (avatarUri && profileId) {
        const uploaded = await uploadAvatar(profileId, avatarUri);
        if (!uploaded.ok) {
          // A failed photo must never cost someone their account. It is saved,
          // they are told, and they can add the photo from their profile later.
          setAvatarNotice(
            `Your account is ready, but the photo did not upload: ${uploaded.message}`,
          );
          return; // stay put so the message is actually read
        }
      } else if (avatarUri && !profileId) {
        setAvatarNotice(
          'Your account is ready. Confirm your email, then add your photo from your profile.',
        );
        return;
      }

      leave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the account.');
    }
  };

  const title =
    step === 1 ? 'Create your account' : step === 2 ? 'Set a password' : 'A little about you';

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <OnboardingStage scene="signup">
        <ScrimCard fillRemaining>
          <StepProgress
              total={3}
              current={step}
              // Third-party users never set a password, so step 2 shows as done
              // rather than as something still waiting for them.
              skipped={path === 'thirdParty' ? [2] : []}
            />

            <BrandText family="display" variant="title" center>
              {title}
            </BrandText>

            {step === 1 ? (
              <>
                <Collapsible label="Have a referral code?" expandedLabel="Referral code">
                  <BrandField
                    placeholder="e.g. K7QW2MPD"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={12}
                    value={pendingReferralCode}
                    onChangeText={(text) => setPendingReferralCode(text.toUpperCase())}
                    hint={`You both get ${REFERRAL_REWARD_SEEDS} Seeds once your signup is finished.`}
                  />
                </Collapsible>

                <BrandField
                  placeholder="Email or phone"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  autoComplete="email"
                  value={identifier}
                  onChangeText={setIdentifier}
                />

                {/*
                 * TODO(Spec B): username is collected but NOT checked for
                 * uniqueness, and cannot be logged in with. It is stored on auth
                 * metadata because profiles has no username column yet — adding
                 * one is a migration, which this round may not do.
                 */}
                <BrandField
                  placeholder="Username"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={24}
                  value={username}
                  onChangeText={setUsername}
                  error={error ?? undefined}
                />

                <BrandButton label="Continue" loading={checkingUsername} onPress={submitStep1} />

                <Collapsible label="— or — More options" expandedLabel="Fewer options">
                  <ProviderButtons />
                </Collapsible>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <BrandField
                  placeholder="Password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  value={password}
                  onChangeText={setPassword}
                />
                <BrandField
                  placeholder="Confirm password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  value={confirm}
                  onChangeText={setConfirm}
                  error={error ?? undefined}
                />
                <View style={styles.row}>
                  <BrandButton
                    label="Back"
                    variant="quiet"
                    style={styles.half}
                    onPress={() => {
                      setError(null);
                      setStep(1);
                    }}
                  />
                  <BrandButton label="Continue" style={styles.half} onPress={submitStep2} />
                </View>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <View style={styles.avatarRow}>
                  <View style={styles.avatar}>
                    {avatarUri ? (
                      <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                    ) : (
                      <BrandText variant="title" tone="inkSoft">
                        {(realName.trim()[0] ?? '🌱').toUpperCase()}
                      </BrandText>
                    )}
                  </View>
                  <View style={styles.avatarCopy}>
                    <Pressable onPress={chooseAvatar}>
                      <BrandText variant="small" weight="medium" tone="primaryDeep">
                        {avatarUri ? 'Choose a different photo' : 'Add a photo'}
                      </BrandText>
                    </Pressable>
                    <BrandText variant="caption" tone="inkSoft">
                      {avatarNotice ?? 'Optional. You can add one later.'}
                    </BrandText>
                  </View>
                </View>

                <BrandField
                  placeholder="Your name"
                  autoCapitalize="words"
                  autoComplete="name"
                  value={realName}
                  onChangeText={setRealName}
                  error={error ?? undefined}
                />

                <View style={styles.row}>
                  <BrandButton
                    label="Back"
                    variant="quiet"
                    style={styles.half}
                    // Third-party users have no password step to go back to.
                    onPress={() => {
                      setError(null);
                      setStep(path === 'thirdParty' ? 1 : 2);
                    }}
                  />
                  <BrandButton
                    label="Create account"
                    style={styles.primaryHalf}
                    loading={busy}
                    onPress={create}
                  />
                </View>
              </>
            ) : null}

            <View style={styles.footer}>
              <BrandText variant="small" tone="inkSoft">
                Already have an account?
              </BrandText>
              <BrandButton
                label="Log in"
                variant="link"
                onPress={leave}
                style={styles.footerLink}
              />
          </View>
        </ScrimCard>
      </OnboardingStage>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  row: { flexDirection: 'row', gap: brandSpacing.md },
  half: { flex: 1 },
  // The primary action gets the wider share so its label stays on one line.
  primaryHalf: { flex: 1.6, paddingHorizontal: brandSpacing.md },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: brandSpacing.lg },
  avatar: {
    width: 64,
    height: 64,
    overflow: 'hidden',
    borderRadius: brandRadius.pill,
    backgroundColor: brandColors.bg,
    borderWidth: 1,
    borderColor: brandColors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: brandRadius.pill },
  avatarCopy: { flex: 1, gap: brandSpacing.xxs },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: brandSpacing.xs,
  },
  footerLink: { alignSelf: 'auto', paddingHorizontal: 0 },
});
