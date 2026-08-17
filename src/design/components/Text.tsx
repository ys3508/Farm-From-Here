import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { colors, fontFamily, typeScale } from '../tokens';

type Variant = keyof typeof typeScale;
type Tone = 'primary' | 'secondary' | 'muted' | 'inverse' | 'seeds' | 'growth' | 'impact' | 'danger';

export type TextProps = RNTextProps & {
  variant?: Variant;
  /** Display face (Fraunces) instead of body face (Nunito). Headings only. */
  display?: boolean;
  tone?: Tone;
  weight?: 'regular' | 'medium' | 'bold';
  italic?: boolean;
  center?: boolean;
};

const toneColor: Record<Tone, string> = {
  primary: colors.textPrimary,
  secondary: colors.textSecondary,
  muted: colors.textMuted,
  inverse: colors.textInverse,
  seeds: colors.seedsInk,
  growth: colors.growthInk,
  impact: colors.impact,
  danger: colors.danger,
};

function resolveFamily(display: boolean, weight: TextProps['weight'], italic: boolean) {
  if (display) {
    if (italic) return fontFamily.displayItalic;
    if (weight === 'regular') return fontFamily.displayRegular;
    if (weight === 'medium') return fontFamily.displaySemi;
    return fontFamily.display;
  }
  if (weight === 'bold') return fontFamily.bodyBold;
  if (weight === 'medium') return fontFamily.bodyMedium;
  return fontFamily.body;
}

/**
 * The only text primitive in the app. Using raw <Text> from react-native bypasses
 * the type scale and the loaded fonts, so prefer this everywhere.
 */
export function Text({
  variant = 'body',
  display = false,
  tone = 'primary',
  weight,
  italic = false,
  center = false,
  style,
  ...rest
}: TextProps) {
  const base: TextStyle = {
    ...typeScale[variant],
    fontFamily: resolveFamily(display, weight, italic),
    color: toneColor[tone],
    ...(center ? { textAlign: 'center' as const } : null),
  };
  return <RNText {...rest} style={[base, style]} />;
}
