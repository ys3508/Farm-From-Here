import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import {
  FARMER_APPLICATION_COPY,
  WORLD_SETTLE_SPRING,
  WORLD_TOGGLE_LABELS,
  type WorldMode,
} from '@/config/farmerWorld';
import { BrandText, brandColors, brandRadius, brandSpacing } from '@/design/brand';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * THE MODE TOGGLE — left is My World, right is Farmer World.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Spec: revise/2026-08-19-farmer-world-and-tabs.md
 *
 * It is the single visible statement of which world you are in. It does not
 * hold state: it renders `activeWorld` and asks for the other one. Tapping the
 * right side and swiping past the seam are the same action through two doors,
 * so a swipe SNAPS this control rather than leaving it behind.
 *
 * Same visual language as the Growth/Seeds pill it sits opposite: warm ivory,
 * semi-transparent, hairline white edge. It must read as part of the world, not
 * as a settings control bolted on top of it.
 *
 * FOR A NON-FARMER the right side is not a locked door and never says "Farmer
 * World" — it carries the invitation copy and opens the application entry.
 */

export type WorldToggleProps = {
  activeWorld: WorldMode;
  /** False when the profile has no farm_members row. Changes the right label. */
  isFarmer: boolean;
  onRequestWorld: (world: WorldMode) => void;
};

export function WorldToggle({ activeWorld, isFarmer, onRequestWorld }: WorldToggleProps) {
  /* The knob slides between two segments whose widths depend on their labels,
   * so both are measured rather than assumed. Until they have reported, the
   * knob simply has zero width and nothing jumps. */
  const [slots, setSlots] = useState<Record<WorldMode, { x: number; width: number }>>({
    'my-world': { x: 0, width: 0 },
    'farmer-world': { x: 0, width: 0 },
  });

  const measure = (world: WorldMode) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setSlots((prev) =>
      prev[world].x === x && prev[world].width === width
        ? prev
        : { ...prev, [world]: { x, width } },
    );
  };

  const slide = useRef(new Animated.Value(activeWorld === 'my-world' ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: activeWorld === 'my-world' ? 0 : 1,
      ...WORLD_SETTLE_SPRING,
      // Width/left are not native-driver animatable, and the knob has to change
      // width because the two labels differ in length.
      useNativeDriver: false,
    }).start();
  }, [activeWorld, slide]);

  const left = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [slots['my-world'].x, slots['farmer-world'].x],
  });
  const width = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [slots['my-world'].width, slots['farmer-world'].width],
  });

  const rightLabel = isFarmer
    ? WORLD_TOGGLE_LABELS['farmer-world']
    : FARMER_APPLICATION_COPY.toggle;

  return (
    <View style={styles.pill} accessibilityRole="tablist">
      <Animated.View style={[styles.knob, { left, width }]} pointerEvents="none" />

      <Segment
        label={WORLD_TOGGLE_LABELS['my-world']}
        active={activeWorld === 'my-world'}
        onLayout={measure('my-world')}
        onPress={() => onRequestWorld('my-world')}
      />
      <Segment
        label={rightLabel}
        active={activeWorld === 'farmer-world'}
        onLayout={measure('farmer-world')}
        onPress={() => onRequestWorld('farmer-world')}
        // A consumer is not switching worlds, they are opening an invitation.
        hint={isFarmer ? undefined : FARMER_APPLICATION_COPY.title}
      />
    </View>
  );
}

function Segment({
  label,
  active,
  onPress,
  onLayout,
  hint,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
  hint?: string;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      // The label is drawn by a child <BrandText>, which does not name the
      // control for a screen reader on its own.
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      accessibilityHint={hint}
      onLayout={onLayout}
      onPress={onPress}
      style={({ pressed }) => [styles.segment, pressed && styles.pressed]}
    >
      <BrandText
        textRole="label"
        weight={active ? 'semibold' : 'medium'}
        style={{ color: active ? brandColors.primaryDeep : brandColors.inkSoft }}
      >
        {label}
      </BrandText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: brandSpacing.xxs,
    borderRadius: brandRadius.pill,
    // Matched to EconomyIndicator — the two must read as one family.
    backgroundColor: 'rgba(247, 244, 236, 0.82)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  segment: {
    paddingHorizontal: brandSpacing.md,
    paddingVertical: brandSpacing.xs,
    borderRadius: brandRadius.pill,
  },
  pressed: { opacity: 0.6 },
  knob: {
    position: 'absolute',
    top: brandSpacing.xxs,
    bottom: brandSpacing.xxs,
    borderRadius: brandRadius.pill,
    backgroundColor: brandColors.surface,
  },
});
