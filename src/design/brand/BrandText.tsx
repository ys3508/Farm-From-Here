import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import {
  textRoles,
  type TextFamily,
  type TextRole,
  type TextRoleStyle,
  type TextVariant,
  type TextWeight,
} from './textRoles';
import { brandColors, brandFont, brandShadow, brandType } from './tokens';

type Variant = TextVariant;
type Tone = 'ink' | 'inkSoft' | 'primary' | 'primaryDeep' | 'onImage' | 'accentWarm';
type Family = TextFamily;

export type BrandTextProps = RNTextProps & {
  /**
   * WHAT THIS TEXT IS — 'lead', 'whisper', 'amount'. Prefer this over picking a
   * variant and a family by hand: a role is the same type everywhere it is
   * used, which is what keeps the two worlds looking like one app
   * (see textRoles.ts). Anything set explicitly still wins over the role.
   *
   * Named `textRole` rather than `role` because React Native's own `role` prop
   * is the ACCESSIBILITY role, and intersecting the two would silently reduce
   * both to `never`.
   */
  textRole?: TextRole;
  variant?: Variant;
  family?: Family;
  tone?: Tone;
  weight?: TextWeight;
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
  textRole,
  variant,
  family,
  tone = 'ink',
  weight,
  center = false,
  onImage = false,
  style,
  ...rest
}: BrandTextProps) {
  // The role supplies the defaults; an explicit prop always overrides it, so a
  // one-off tweak never has to abandon the role and re-pick a font by hand.
  const fromRole: TextRoleStyle | undefined = textRole ? textRoles[textRole] : undefined;
  const resolvedVariant: Variant = variant ?? fromRole?.variant ?? 'body';
  const resolvedFamily: Family = family ?? fromRole?.family ?? 'body';
  const resolvedWeight = weight ?? fromRole?.weight;

  const base: TextStyle = {
    ...brandType[resolvedVariant],
    fontFamily: resolveFamily(resolvedFamily, resolvedWeight),
    color: toneColor[onImage && tone === 'ink' ? 'onImage' : tone],
    ...(center ? { textAlign: 'center' as const } : null),
    ...(onImage ? brandShadow.onImageText : null),
  };
  return <RNText {...rest} style={[base, style]} />;
}
