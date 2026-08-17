import { Redirect } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import { brandColors } from '@/design/brand';
import { useAuth } from '@/features/auth/AuthProvider';
import { isPreviewMode } from '@/features/dev/preview';
import { onboardingSequence } from '@/features/onboarding/sequence';
import { isSupabaseConfigured } from '@/lib/env';

/**
 * Route gate.
 *
 *   not configured      → setup instructions
 *   restoring session   → spinner
 *   splash not yet seen → splash (3s, once per launch, both user types)
 *   signed in           → My World, never through login
 *   signed out          → login
 *
 * The splash plays first for everyone; it just says something different to a
 * returning visitor. The signed-in/signed-out branch below is what actually
 * routes, and it reads the real session rather than the local trace the splash
 * used to pick its wording.
 */
export default function Index() {
  const { session, initialising } = useAuth();

  // Preview mode has no backend to configure, so the setup screen would only be
  // in the way. It stays reachable from the preview index.
  if (!isSupabaseConfigured && !isPreviewMode) return <Redirect href="/setup" />;

  if (initialising) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={brandColors.primary} />
      </View>
    );
  }

  if (!onboardingSequence.hasPlayedSplash()) return <Redirect href="/splash" />;

  return session ? <Redirect href="/(app)/world" /> : <Redirect href="/(auth)/sign-in" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brandColors.bg,
  },
});
