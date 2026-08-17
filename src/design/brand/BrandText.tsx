import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { brandColors, brandFont, brandShadow, brandType } from './tokens';

type Variant = keyof typeof brandType;
type Tone = 'ink' | 'inkSoft' | 'primary' | 'primaryDeep' | 'onImage' | 'accentWarm';
type Family = 'display' | 'body' | 'script';

export type BrandTextProps = RNTextProps & {
  variant?: Variant;
  family?: Family;
  tone?: Tone;
  weight?: 'light' | 'regular' | 'medium' | 'semibold';
  center?: boolean;
  /** Adds the legibility shadow for text sitting directly on an illustration. */
  onImage?: boolean;
};

const toneColor: Record<Tone, string> = {
  ink: brandColors.ink,
  inkSoft: brandColors.inkSoft,
  primary: brandColors.primary,
  primaryDeep: brandColors.primaryDeep,
  onImage: brandColors.onImage,
  accentWarm: brandColors.accentWarm,
};

function resolveFamily(family: Family, weight: BrandTextProps['weight']) {
  if (family === 'display') {
    if (weight === 'light') return brandFont.displayLight;
    if (weight === 'medium' || weight === 'semibold') return brandFont.displayMedium;
    return brandFont.display;
  }
  if (family === 'script') {
    return weight === 'semibold' ? brandFont.scriptBold : brandFont.script;
  }
  if (weight === 'semibold') return brandFont.bodySemi;
  if (weight === 'medium') return brandFont.bodyMedium;
  return brandFont.body;
}

/** The text primitive for every brand-system screen. */
export function BrandText({
  variant = 'body',
  family = 'body',
  tone = 'ink',
  weight,
  center = false,
  onImage = false,
  style,
  ...rest
}: BrandTextProps) {
  const base: TextStyle = {
    ...brandType[variant],
    fontFamily: resolveFamily(family, weight),
    color: toneColor[onImage && tone === 'ink' ? 'onImage' : tone],
    ...(center ? { textAlign: 'center' as const } : null),
    ...(onImage ? brandShadow.onImageText : null),
  };
  return <RNText {...rest} style={[base, style]} />;
}
