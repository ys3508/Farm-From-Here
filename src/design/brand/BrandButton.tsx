import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { BrandText } from './BrandText';
import { brandColors, brandRadius, brandSpacing } from './tokens';

type Variant = 'primary' | 'quiet' | 'provider' | 'link';

export type BrandButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  leading?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

/**
 * Buttons for the brand system.
 *   primary  — pill, solid green. One per screen.
 *   quiet    — outlined, transparent; sits on the white card.
 *   provider — third-party sign-in row.
 *   link     — text only, for "Sign up" / "More options".
 */
export function BrandButton({
  label,
  onPress,
  variant = 'primary',
  leading,
  loading = false,
  disabled = false,
  style,
  accessibilityHint,
}: BrandButtonProps) {
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
        pressed && !isDisabled && (variant === 'primary' ? styles.pressedPrimary : styles.pressed),
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? brandColors.surface : brandColors.primary}
        />
      ) : (
        <View style={styles.inner}>
          {leading ? <View style={styles.leading}>{leading}</View> : null}
          <BrandText
            variant={variant === 'link' ? 'small' : 'body'}
            weight={variant === 'primary' ? 'semibold' : 'medium'}
            tone={variant === 'primary' ? 'onImage' : variant === 'link' ? 'primaryDeep' : 'ink'}
          >
            {label}
          </BrandText>
        </View>
      )}
    </Pressable>
  );
}

const variantStyle: Record<Variant, ViewStyle> = {
  primary: {
    backgroundColor: brandColors.primary,
    borderRadius: brandRadius.pill,
    paddingVertical: brandSpacing.lg,
  },
  quiet: {
    backgroundColor: 'transparent',
    borderRadius: brandRadius.md,
    borderWidth: 1,
    borderColor: brandColors.line,
    paddingVertical: brandSpacing.md,
  },
  provider: {
    backgroundColor: brandColors.surface,
    borderRadius: brandRadius.md,
    borderWidth: 1,
    borderColor: brandColors.line,
    paddingVertical: brandSpacing.md,
  },
  link: {
    backgroundColor: 'transparent',
    paddingVertical: brandSpacing.sm,
  },
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: brandSpacing.xl,
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: brandSpacing.sm },
  leading: { width: 20, alignItems: 'center' },
  pressed: { opacity: 0.6 },
  pressedPrimary: { backgroundColor: brandColors.primaryDeep },
  disabled: { opacity: 0.45 },
});
