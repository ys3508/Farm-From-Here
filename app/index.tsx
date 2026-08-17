import { Redirect } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import { brandColors } from '@/design/brand';
import { useAuth } from '@/features/auth/AuthProvider';
import { onboardingSequence } from '@/features/onboarding/sequence';
import { isSupabaseConfigured } from '@/lib/env';

/**
 * Route gate.
 *
 *   not configured        → setup instructions
 *   restoring session     → spinner
 *   signed in,  1st time  → welcome-back scene (~2s) → My World
 *   signed in,  after     → My World
 *   signed out, 1st time  → splash scene (~3.5s) → login
 *   signed out, after     → login
 *
 * "First time" means first time THIS LAUNCH. A returning user sees the short
 * welcome scene once and is never made to sit through the long splash.
 *
 * Someone who just signed in on the login screen does not pass through here at
 * all — (auth)/_layout sends them straight to My World, which is right: you do
 * not need welcoming back one second after typing your password.
 */
export default function Index() {
  const { session, initialising } = useAuth();

  if (!isSupabaseConfigured) return <Redirect href="/setup" />;

  if (initialising) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={brandColors.primary} />
      </View>
    );
  }

  if (session) {
    return onboardingSequence.hasPlayedWelcome() ? (
      <Redirect href="/(app)/world" />
    ) : (
      <Redirect href="/welcome-back" />
    );
  }

  return onboardingSequence.hasPlayedSplash() ? (
    <Redirect href="/(auth)/sign-in" />
  ) : (
    <Redirect href="/splash" />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brandColors.bg,
  },
});
