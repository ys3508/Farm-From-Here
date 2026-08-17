import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius, spacing, typeScale, fontFamily } from '../tokens';
import { Text } from './Text';

export type FieldProps = TextInputProps & {
  label: string;
  hint?: string;
  error?: string;
};

export function Field({ label, hint, error, style, ...rest }: FieldProps) {
  return (
    <View style={styles.wrap}>
      <Text variant="small" weight="bold" tone="secondary">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        {...rest}
        style={[styles.input, !!error && styles.inputError, style]}
      />
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs, alignSelf: 'stretch' },
  input: {
    backgroundColor: colors.bgRaised,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fontFamily.body,
    fontSize: typeScale.body.fontSize,
    color: colors.textPrimary,
  },
  inputError: { borderColor: colors.danger },
});
