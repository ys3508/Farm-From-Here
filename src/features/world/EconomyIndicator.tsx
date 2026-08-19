import { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, View } from 'react-native';

import { BrandText, brandColors, brandRadius, brandSpacing } from '@/design/brand';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * SEEDS + GROWTH — one restrained indicator, fixed top-right.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * DISPLAY ONLY. It reads the two cached balances (profiles.seeds_balance and
 * profiles.growth_xp, both caches of their ledgers) and shows them. Nothing in
 * this component writes anything, and there is still no spend UI — the one
 * thing it can do is OPEN THE DETAIL VIEW (polish spec §4), which is itself
 * read-only. Without `onPress` it stays exactly what it was: a label.
 *
 * The two quantities are NEVER combined, summed or converted into each other:
 *   🌱 Seeds  — spendable, earned only by real-world good, never bought.
 *   ⭐ Growth — progression, only ever rises, never spent in V1.
 * (CLAUDE.md invariant 1. And the word is "Growth" — never "XP".)
 *
 * Style: warm-ivory and semi-transparent so the dunes read through it. It must
 * not feel like a game HUD; the user should feel they entered a world, not
 * opened a dashboard.
 *
 * ART: assets/my_world/seeds.png and assets/my_world/growth.png, cut from the
 * owner's ui_design/my_world/xp.png on their instruction (2026-08-19) — the
 * green clover is Seeds, the gold star is Growth.
 */

const ICONS = {
  seeds: require('../../../assets/my_world/seeds.png'),
  growth: require('../../../assets/my_world/growth.png'),
} as const;

export type EconomyIndicatorProps = {
  seeds: number;
  growth: number;
  /** Softly ringed while onboarding is pointing at it. */
  highlighted?: boolean;
  /**
   * Opens the read-only Seeds/Growth detail. Omit it and the pill is inert
   * display, exactly as it was before §4.
   */
  onPress?: () => void;
};

export function EconomyIndicator({
  seeds,
  growth,
  highlighted = false,
  onPress,
}: EconomyIndicatorProps) {
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(glow, {
      toValue: highlighted ? 1 : 0,
      duration: 340,
      useNativeDriver: true,
    }).start();
  }, [highlighted, glow]);

  const pill = (
    <>
      <Animated.View
        style={[
          styles.ring,
          { opacity: glow, transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }] },
        ]}
      />
      <View style={styles.pill}>
        <Amount kind="seeds" value={seeds} label="Seeds" />
        <View style={styles.divider} />
        <Amount kind="growth" value={growth} label="Growth" />
      </View>
    </>
  );

  if (!onPress) {
    return (
      <View style={styles.root} pointerEvents="none">
        {pill}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      // ONE control, not two: the two amounts are read out together and open
      // one screen, so the individual figures stop being separate a11y nodes.
      accessibilityRole="button"
      accessibilityLabel={`${seeds.toLocaleString()} Seeds, ${growth.toLocaleString()} Growth`}
      accessibilityHint="Opens your Seeds and Growth detail"
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}
    >
      {pill}
    </Pressable>
  );
}

function Amount({
  kind,
  value,
  label,
}: {
  kind: keyof typeof ICONS;
  value: number;
  label: string;
}) {
  return (
    <View
      style={styles.amount}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${value.toLocaleString()} ${label}`}
    >
      <Image source={ICONS[kind]} style={styles.icon} resizeMode="contain" accessibilityIgnoresInvertColors />
      <BrandText textRole="amount" tone="ink">
        {value.toLocaleString()}
      </BrandText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'flex-end' },
  pressed: { opacity: 0.75 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: brandSpacing.sm,
    paddingHorizontal: brandSpacing.md,
    paddingVertical: brandSpacing.xs,
    borderRadius: brandRadius.pill,
    // Warm ivory, see-through. The dunes must still read behind it.
    backgroundColor: 'rgba(247, 244, 236, 0.82)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  amount: { flexDirection: 'row', alignItems: 'center', gap: brandSpacing.xxs },
  icon: { width: 22, height: 22 },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: brandSpacing.xxs,
    backgroundColor: brandColors.line,
  },
  ring: {
    position: 'absolute',
    top: -7,
    right: -7,
    bottom: -7,
    left: -7,
    borderRadius: brandRadius.pill,
    borderWidth: 2,
    borderColor: brandColors.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
});
