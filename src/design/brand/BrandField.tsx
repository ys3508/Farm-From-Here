import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { BrandText } from './BrandText';
import { brandColors, brandFont, brandSpacing, brandType } from './tokens';

export type BrandFieldProps = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
};

/**
 * Underlined input — a hairline rather than a boxed field, so the card stays
 * light and the illustration behind it keeps breathing. The underline picks up
 * the brand green on focus (never the platform default blue).
 */
export function BrandField({ label, hint, error, style, ...rest }: BrandFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? (
        <BrandText variant="caption" weight="medium" tone="inkSoft">
          {label}
        </BrandText>
      ) : null}

      <TextInput
        accessibilityLabel={label ?? rest.placeholder}
        placeholderTextColor={brandColors.inkSoft}
        selectionColor={brandColors.primary}
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        style={[
          styles.input,
          focused && styles.inputFocused,
          !!error && styles.inputError,
          style,
        ]}
      />

      {error ? (
        <BrandText variant="caption" style={styles.error}>
          {error}
        </BrandText>
      ) : hint ? (
        <BrandText variant="caption" tone="inkSoft">
          {hint}
        </BrandText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: brandSpacing.xs, alignSelf: 'stretch' },
  input: {
    fontFamily: brandFont.body,
    fontSize: brandType.body.fontSize,
    color: brandColors.ink,
    paddingVertical: brandSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.line,
  },
  inputFocused: { borderBottomColor: brandColors.primary },
  inputError: { borderBottomColor: '#B4472F' },
  error: { color: '#B4472F' },
});
