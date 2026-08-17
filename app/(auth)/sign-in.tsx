import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import {
  BrandButton,
  BrandField,
  BrandText,
  Collapsible,
  OnboardingStage,
  ScrimCard,
  brandSpacing,
} from '@/design/brand';
import { useAuth } from '@/features/auth/AuthProvider';
import { ProviderButtons } from '@/features/auth/ProviderButtons';

/**
 * LOGIN — a single screen.
 *
 * The whole illustration sits above the card, uncropped; the card starts where
 * the painting ends rather than covering it.
 *
 * All auth reuses Step 1's logic untouched; this screen only decides WHICH
 * existing method to call from what the user typed.
 */
export default function LoginScreen() {
  const router = useRouter();
  const { signInWithIdentifier, continueAsGuest, busy } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    const value = identifier.trim();
    if (!value) return setError('Enter your email, username or phone number.');
    if (!password) return setError('Enter your password.');

    try {
      // One call for all three kinds. It works out which was typed, resolves a
      // username to its account, and reports failures in one shared wording so
      // nobody can probe which accounts exist.
      await signInWithIdentifier(value, password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in. Please try again.');
    }
  };

  const guest = async () => {
    try {
      await continueAsGuest();
      router.replace('/');
    } catch (err) {
      Alert.alert(
        'Could not continue as a guest',
        err instanceof Error ? err.message : 'Please try again.',
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <OnboardingStage scene="login">
        <ScrimCard fillRemaining>
          <BrandText family="display" variant="title" center>
            Good to see you
          </BrandText>

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
            autoComplete="current-password"
            value={password}
            onChangeText={setPassword}
            error={error ?? undefined}
          />

          <BrandButton label="Log in" loading={busy} onPress={submit} />

          <Collapsible label="More options" expandedLabel="Fewer options">
            <ProviderButtons />
          </Collapsible>

          <BrandButton
            label="Look around as a guest"
            variant="link"
            disabled={busy}
            onPress={guest}
            accessibilityHint="Browse without an account"
          />

          <View style={styles.footer}>
            <BrandText variant="small" tone="inkSoft">
              No account?
            </BrandText>
            <BrandButton
              label="Sign up"
              variant="link"
              onPress={() => router.push('/(auth)/sign-up')}
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: brandSpacing.xs,
  },
  footerLink: { alignSelf: 'auto', paddingHorizontal: 0 },
});
