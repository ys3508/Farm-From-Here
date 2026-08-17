import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors, spacing } from '../tokens';
import { Text } from './Text';

export type LogoProps = {
  size?: 'sm' | 'lg';
  /** Hide the wordmark and show only the mark (for tight headers). */
  markOnly?: boolean;
};

/**
 * Logo lock-up. Placement is fixed by this component so every screen agrees
 * (design.md: "Logo placement — consistent across screens").
 *
 * The mark below is a simple drawn sprout — a deliberate stand-in with the right
 * silhouette and palette. The final hand-painted wordmark replaces it; see the
 * IllustrationSlot convention.
 */
export function Logo({ size = 'lg', markOnly = false }: LogoProps) {
  const dim = size === 'lg' ? 44 : 30;

  return (
    <View style={styles.row}>
      <Svg width={dim} height={dim} viewBox="0 0 48 48" accessibilityLabel="Farm From Here">
        <Circle cx="24" cy="24" r="22" fill={colors.paperDeep} stroke={colors.leafDeep} strokeWidth="2.5" />
        {/* stem */}
        <Path d="M24 38 V22" stroke={colors.leafDeep} strokeWidth="3" strokeLinecap="round" />
        {/* left leaf */}
        <Path
          d="M24 26 C16 26 12 21 12 15 C19 15 24 19 24 26 Z"
          fill={colors.leaf}
          stroke={colors.leafDeep}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* right leaf */}
        <Path
          d="M24 30 C32 30 36 25 36 19 C29 19 24 23 24 30 Z"
          fill={colors.leafLight}
          stroke={colors.leafDeep}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* soil line */}
        <Path d="M14 39 H34" stroke={colors.soil} strokeWidth="3" strokeLinecap="round" />
      </Svg>

      {markOnly ? null : (
        <View>
          <Text variant={size === 'lg' ? 'heading' : 'subheading'} display weight="bold">
            Farm From Here
          </Text>
          {size === 'lg' ? (
            <Text variant="caption" tone="muted" weight="medium" style={styles.tagline}>
              EVERYTHING ON THIS MAP IS REAL
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tagline: { letterSpacing: 1.1 },
});
