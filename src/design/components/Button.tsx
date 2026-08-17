import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, shadow, spacing } from '../tokens';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'provider';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  /** Emoji or small node rendered before the label. Provider buttons use this. */
  leading?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  leading,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  accessibilityHint,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyle[variant],
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' ? colors.textInverse : colors.textPrimary}
          />
        ) : (
          <>
            {leading ? <View style={styles.leading}>{leading}</View> : null}
            <Text
              variant="subheading"
              weight="bold"
              tone={variant === 'primary' ? 'inverse' : 'primary'}
              style={variant === 'provider' ? styles.providerLabel : undefined}
            >
              {label}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const variantStyle: Record<Variant, ViewStyle> = {
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryPressed,
    ...shadow.sticker,
  },
  secondary: {
    backgroundColor: colors.bgRaised,
    borderColor: colors.borderStrong,
    ...shadow.sticker,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  provider: {
    backgroundColor: colors.bgRaised,
    borderColor: colors.border,
    paddingVertical: spacing.md,
  },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    paddingVertical: spacing.lg - 2,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  inner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  leading: { width: 22, alignItems: 'center' },
  providerLabel: { flexShrink: 1 },
  pressed: { transform: [{ translateY: 1 }], opacity: 0.92 },
  disabled: { opacity: 0.45 },
});
