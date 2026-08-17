import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { brandRadius, brandShadow, brandSpacing, scrim } from './tokens';

export type ScrimCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * The translucent white card that floats over an illustration.
 *
 * It wraps ONLY the input area, never the whole lower half of the screen — the
 * point is that the grass, clouds and door stay visible around it. Sizing is up
 * to the caller; this component owns the surface treatment so login and sign up
 * can never drift apart.
 */
export function ScrimCard({ children, style }: ScrimCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: scrim.cardBackground,
    borderRadius: brandRadius.lg,
    borderWidth: 1,
    borderColor: scrim.cardBorder,
    padding: brandSpacing.xl,
    gap: brandSpacing.lg,
    ...brandShadow.card,
  },
});
