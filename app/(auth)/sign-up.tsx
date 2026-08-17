import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BrandButton,
  BrandField,
  BrandText,
  Collapsible,
  SceneBackground,
  ScrimCard,
  brandSpacing,
} from '@/design/brand';
import { REFERRAL_REWARD_SEEDS } from '@/config/economy';
import { useAuth } from '@/features/auth/AuthProvider';
import { ProviderButtons } from '@/features/auth/ProviderButtons';
import {
  USERNAME_STUB_MESSAGE,
  classifyIdentifier,
  normalisePhone,
} from '@/features/auth/identifier';
import { onboardingSequence } from '@/features/onboarding/sequence';

/**
 * SCREEN 2 — SIGN UP.
 *
 * Same scrim-card treatment as Login, on the signup illustration.
 *
 * The referral row sits at the TOP of the card and is COLLAPSED by default:
 * someone who has a code finds it immediately, and someone who does not is
 * never led to think a code is required.
 *
 * The reward itself is Step 1 logic, untouched: 500 Seeds to each side, written
 * through seeds_ledger, and granted only once signup actually completes —
 * entering a code here does nothing on its own.
 */
export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signUpWithEmail, startPhoneSignIn, busy, pendingReferralCode, setPendingReferralCode } =
    useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setNotice(null);

    const value = identifier.trim();
    if (!value) return setError('Enter an email, username or phone number.');

    const kind = classifyIdentifier(value);
    if (kind === 'username') return setError(USERNAME_STUB_MESSAGE);

    try {
      if (kind === 'phone') {
        await startPhoneSignIn(normalisePhone(value));
        return;
      }

      if (password.length < 8) return setError('Password must be at least 8 characters.');
      if (password !== confirm) return setError('The two passwords do not match.');

      await signUpWithEmail(value, password);
      setNotice(
        'Account created. If email confirmation is switched on for this project, tap the link we ' +
          'just sent you. Your Growth, Seeds and any referral reward are granted the moment the ' +
          'account exists.',
      );
      // Straight into the app — a brand-new user is not "back".
      onboardingSequence.markWelcomePlayed();
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the account. Please try again.');
    }
  };

  return (
    <SceneBackground scene="signup">
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + brandSpacing.xxl, paddingBottom: insets.bottom + brandSpacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <BrandText family="display" weight="light" variant="wordmark" onImage center>
              FARM FROM HERE
            </BrandText>
          </View>

          <ScrimCard>
            <BrandText family="display" variant="title" center>
              Create your account
            </BrandText>

            {/* Top of the card, collapsed by default. */}
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
              placeholder="Email, username or phone"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              value={identifier}
              onChangeText={setIdentifier}
            />

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

            {notice ? (
              <BrandText variant="small" tone="primaryDeep">
                {notice}
              </BrandText>
            ) : null}

            <BrandButton label="Create account" loading={busy} onPress={submit} />

            <Collapsible label="More options" expandedLabel="Fewer options">
              <ProviderButtons />
            </Collapsible>

            <View style={styles.footer}>
              <BrandText variant="small" tone="inkSoft">
                Already have an account?
              </BrandText>
              <BrandButton
                label="Log in"
                variant="link"
                onPress={() => router.back()}
                style={styles.footerLink}
              />
            </View>
          </ScrimCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SceneBackground>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: brandSpacing.lg,
    gap: brandSpacing.xl,
  },
  header: { alignItems: 'center' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: brandSpacing.xs,
  },
  footerLink: { alignSelf: 'auto', paddingHorizontal: 0 },
});
