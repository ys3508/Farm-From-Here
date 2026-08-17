import { BlurView } from 'expo-blur';
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { brandRadius, brandShadow, brandSpacing, scrim } from './tokens';

export type ScrimCardProps = {
  children: React.ReactNode;
  /**
   * Fraction of screen height the illustration keeps above the card.
   * The house value is 0.52 — see `scrim.revealFraction`.
   */
  reveal?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * The warm-white sheet that RISES FROM THE BOTTOM of an onboarding screen.
 *
 * The point of the design is that this is a translucent sheet floating on a
 * full-bleed painting, not a white box that swallows it. So:
 *   • it is anchored to the bottom edge and never grows past `reveal`, which
 *     keeps the top half of the illustration — the grass, the clouds, the dog —
 *     visible on every screen;
 *   • it is frosted rather than opaque, so the painting shows faintly through;
 *   • its content scrolls INSIDE it, so a long form lengthens the scroll rather
 *     than eating the picture.
 *
 * Login and sign up share it. Login has less in it and so sits naturally
 * shorter, revealing more of the scene — that is intended, not a bug.
 */
export function ScrimCard({ children, reveal = scrim.revealFraction, style }: ScrimCardProps) {
  const { height } = useWindowDimensions();
  const maxHeight = height * (1 - reveal);

  return (
    <View style={[styles.shell, { maxHeight }, style]}>
      {/*
       * expo-blur gives a real frosted pane on iOS and Android. On web its
       * support is patchy, so the translucent tint underneath is what carries
       * the effect there — the card is readable either way, which is why the
       * colour is not left to the blur alone.
       */}
      {Platform.OS !== 'web' ? (
        <BlurView intensity={28} tint="light" style={StyleSheet.absoluteFill} />
      ) : null}
      <View style={styles.tint} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    // Rounded only at the top: a sheet of paper lifted from the bottom edge.
    borderTopLeftRadius: brandRadius.sheet,
    borderTopRightRadius: brandRadius.sheet,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: scrim.cardBorder,
    ...brandShadow.card,
  },
  tint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: scrim.cardBackground,
  },
  content: {
    padding: brandSpacing.xl,
    paddingBottom: brandSpacing.xxl,
    gap: brandSpacing.lg,
  },
});
