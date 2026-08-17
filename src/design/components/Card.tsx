import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, shadow, spacing } from '../tokens';
import { Text } from './Text';

export type CardProps = {
  children?: React.ReactNode;
  /** Renders the card in its "coming soon" narrative state (CLAUDE.md invariant 8). */
  locked?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/**
 * The paper-sticker surface. Everything the user reads sits on one of these.
 * A locked card is deliberately still legible and still shows its content —
 * "coming soon" is storytelling, not a broken button.
 */
export function Card({ children, locked = false, onPress, style, accessibilityLabel }: CardProps) {
  const body = (
    <View style={[styles.card, locked && styles.locked, style]}>
      {children}
      {locked ? (
        <View style={styles.lockBadge}>
          <Text variant="caption" weight="bold" tone="muted">
            COMING SOON
          </Text>
        </View>
      ) : null}
    </View>
  );

  if (!onPress || locked) return body;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgRaised,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadow.sticker,
  },
  locked: {
    backgroundColor: colors.lockedBg,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    shadowOpacity: 0.06,
    elevation: 1,
  },
  lockBadge: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    backgroundColor: colors.paperDeep,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  pressed: { transform: [{ translateY: 1 }], opacity: 0.94 },
});
