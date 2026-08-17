import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
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
import { useAuth } from '@/features/auth/AuthProvider';
import { ProviderButtons } from '@/features/auth/ProviderButtons';
import {
  USERNAME_STUB_MESSAGE,
  classifyIdentifier,
  normalisePhone,
} from '@/features/auth/identifier';

/**
 * LOGIN — still a single screen. Only the card visual changed this round: the
 * sheet now rises from the bottom and lets the painting breathe above it.
 *
 * All auth reuses Step 1's logic untouched; this screen only decides WHICH
 * existing method to call from what the user typed.
 */
export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signInWithEmail, startPhoneSignIn, continueAsGuest, busy } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    const value = identifier.trim();
    if (!value) return setError('Enter your email, username or phone number.');

    const kind = classifyIdentifier(value);

    // Username is still a stub — say so before asking for a password check.
    if (kind === 'username') return setError(USERNAME_STUB_MESSAGE);

    try {
      if (kind === 'phone') {
        // Phone remains the deliberate Step 1 stub; this throws a clear message.
        await startPhoneSignIn(normalisePhone(value));
        return;
      }

      if (!password) return setError('Enter your password.');
      await signInWithEmail(value, password);
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
    <SceneBackground scene="login">
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.stage, { paddingTop: insets.top }]}>
          {/* Wordmark sits on the illustration, just above the sheet. */}
          <View style={styles.brand}>
            <BrandText family="display" weight="light" variant="wordmark" onImage center>
              FARM FROM HERE
            </BrandText>
          </View>

          <ScrimCard>
            <BrandText family="display" variant="title" center>
              Welcome back
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
        </View>
      </KeyboardAvoidingView>
    </SceneBackground>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  // Everything is pushed to the bottom so the sheet rises from the edge and the
  // painting keeps the top half of the screen.
  stage: { flex: 1, justifyContent: 'flex-end' },
  brand: { alignItems: 'center', paddingBottom: brandSpacing.lg },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: brandSpacing.xs,
  },
  footerLink: { alignSelf: 'auto', paddingHorizontal: 0 },
});
