import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '../tokens';
import { Text } from './Text';

export type IllustrationSlotProps = {
  /** What the commissioned painting should depict. Shown in the placeholder. */
  brief: string;
  /** Filename the asset should eventually land at, under assets/illustrations/. */
  assetName: string;
  height?: number;
  /** Stand-in emoji so the screen reads as designed before art arrives. */
  glyph?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * A CLEARLY-MARKED SLOT FOR A HAND-PAINTED ASSET.
 *
 * design.md: "Code cannot generate the paintings themselves; do not fake them —
 * leave the slot and note it." This component is that note, rendered. Every place
 * the product wants real illustration uses one, so the full art order can be
 * produced by grepping for `<IllustrationSlot`.
 *
 * When real art arrives: drop the file at assets/illustrations/<assetName> and
 * replace the usage with <Image source={...} />.
 */
export function IllustrationSlot({
  brief,
  assetName,
  height = 140,
  glyph = '🎨',
  style,
}: IllustrationSlotProps) {
  return (
    <View
      accessible
      accessibilityLabel={`Illustration placeholder: ${brief}`}
      style={[styles.slot, { height }, style]}
    >
      <Text variant="title" center>
        {glyph}
      </Text>
      <Text variant="caption" weight="bold" tone="muted" center style={styles.tag}>
        ILLUSTRATION SLOT
      </Text>
      <Text variant="small" tone="secondary" center style={styles.brief}>
        {brief}
      </Text>
      <Text variant="caption" tone="muted" center>
        assets/illustrations/{assetName}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: colors.paperDeep,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.xxs,
  },
  tag: { letterSpacing: 1.2 },
  brief: { paddingHorizontal: spacing.sm },
});
