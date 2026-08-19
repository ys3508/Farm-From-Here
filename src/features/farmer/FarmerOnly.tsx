import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { brandColors } from '@/design/brand';

import { useWorldMode } from './WorldModeProvider';

/**
 * Wraps a screen that only exists for a profile with a `farm_members` row.
 *
 * The tab bar already hides the farmer tabs from a consumer, but a route is
 * reachable by URL and by deep link — and "a pure consumer sees no farmer
 * screens" is a rule about what exists for them, not about which buttons are
 * on screen. So the gate is enforced at the screen, not only at the bar.
 *
 * It sends them home rather than showing a refusal: there is nothing to explain
 * and nothing they did wrong. The invitation lives on the toggle.
 *
 * For a farmer it also DECLARES THE WORLD: standing on a farmer screen means
 * being in Farmer World, so a deep link straight to /post cannot leave the
 * canvas parked in My World with a tab bar that disagrees with the screen.
 */
export function FarmerOnly({ children }: { children: React.ReactNode }) {
  const { isFarmer, gateLoading, activeWorld, requestWorld } = useWorldMode();

  useEffect(() => {
    if (isFarmer && activeWorld !== 'farmer-world') requestWorld('farmer-world');
    // Mount-time only: leaving for My World from the canvas must not be undone
    // by a farmer screen that is still mounted behind the tab bar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFarmer]);

  if (gateLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={brandColors.primary} />
      </View>
    );
  }

  if (!isFarmer) return <Redirect href="/(app)/world" />;

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brandColors.bg,
  },
});
