import { Alert, Platform, View, StyleSheet } from 'react-native';

import { BrandButton, BrandText, brandSpacing } from '@/design/brand';
import { useAuth, type OAuthProvider } from './AuthProvider';

const PROVIDERS: { key: OAuthProvider; label: string; glyph: string }[] = [
  { key: 'google', label: 'Continue with Google', glyph: 'G' },
  { key: 'facebook', label: 'Continue with Facebook', glyph: 'f' },
  { key: 'twitter', label: 'Continue with X', glyph: '𝕏' },
];

/**
 * The third-party row, shared by Login and Sign up so they cannot drift.
 *
 * Wired to the EXISTING Step 1 OAuth logic — this is presentation only. Apple
 * is always present because the App Store requires Sign in with Apple wherever
 * other third-party logins are offered.
 */
export function ProviderButtons() {
  const { signInWithOAuth, signInWithAppleNative, busy } = useAuth();

  const run = async (fn: () => Promise<unknown>, what: string) => {
    try {
      await fn();
    } catch (err) {
      Alert.alert(
        `Could not ${what}`,
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      );
    }
  };

  return (
    <View style={styles.stack}>
      {PROVIDERS.map((provider) => (
        <BrandButton
          key={provider.key}
          label={provider.label}
          variant="provider"
          disabled={busy}
          leading={
            <BrandText variant="body" weight="semibold">
              {provider.glyph}
            </BrandText>
          }
          onPress={() => run(() => signInWithOAuth(provider.key), `continue with ${provider.key}`)}
        />
      ))}

      <BrandButton
        label={Platform.OS === 'ios' ? 'Sign in with Apple' : 'Continue with Apple'}
        variant="provider"
        disabled={busy}
        // U+F8FF is an Apple-only private-use glyph and renders as a blank box
        // on Android, so it is iOS-only here.
        leading={
          <BrandText variant="body" weight="semibold">
            {Platform.OS === 'ios' ? '' : '🍏'}
          </BrandText>
        }
        onPress={() => run(signInWithAppleNative, 'continue with Apple')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: brandSpacing.sm },
});
