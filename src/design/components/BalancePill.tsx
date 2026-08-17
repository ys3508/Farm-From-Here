import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../tokens';
import { Text } from './Text';

export type BalancePillProps = {
  kind: 'seeds' | 'growth';
  value: number;
  compact?: boolean;
};

/**
 * The two economies, rendered. Seeds and Growth ALWAYS use their own colour and
 * their own glyph so they are never visually interchangeable — they are different
 * quantities with different rules (CLAUDE.md invariant 1).
 *
 * Note the user-facing word is "Growth", never "XP".
 */
export function BalancePill({ kind, value, compact = false }: BalancePillProps) {
  const isSeeds = kind === 'seeds';
  return (
    <View
      accessible
      accessibilityLabel={`${value.toLocaleString()} ${isSeeds ? 'Seeds' : 'Growth'}`}
      style={[
        styles.pill,
        compact && styles.compact,
        { backgroundColor: isSeeds ? '#EAF2DC' : '#F8EECB', borderColor: isSeeds ? colors.leafLight : colors.honey },
      ]}
    >
      <Text variant={compact ? 'small' : 'subheading'}>{isSeeds ? '🌱' : '✨'}</Text>
      <Text
        variant={compact ? 'small' : 'subheading'}
        weight="bold"
        tone={isSeeds ? 'seeds' : 'growth'}
      >
        {value.toLocaleString()}
      </Text>
      {!compact ? (
        <Text variant="small" weight="medium" tone={isSeeds ? 'seeds' : 'growth'}>
          {isSeeds ? 'Seeds' : 'Growth'}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
  },
  compact: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs },
});
