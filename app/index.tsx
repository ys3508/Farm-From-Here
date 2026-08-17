import { Redirect } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import { colors } from '@/design';
import { useAuth } from '@/features/auth/AuthProvider';
import { isSupabaseConfigured } from '@/lib/env';

/**
 * Route gate. Three outcomes:
 *   • Supabase not configured → the setup screen, so an unconfigured checkout
 *     looks deliberate rather than broken.
 *   • Signed in  → My World (the home).
 *   • Signed out → the sign-in screen.
 */
export default function Index() {
  const { session, initialising } = useAuth();

  if (!isSupabaseConfigured) return <Redirect href="/setup" />;

  if (initialising) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return <Redirect href={session ? '/(app)/world' : '/(auth)/sign-in'} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
