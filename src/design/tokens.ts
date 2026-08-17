/**
 * FARM FROM HERE — design tokens.
 *
 * The single source of truth for colour, type scale, spacing, radius and shadow.
 * Per design.md: "Every later step reuses this system. Do not let each step invent
 * its own look." Never hard-code a hex value in a component — add it here first.
 *
 * Feel: a living hand-drawn community food map. Warm earthy farmers-market palette,
 * paper-sticker texture, tactile. NOT a cold tech product.
 */

/* ── Colour ──────────────────────────────────────────────────────────────────
 * Named by role, not by hue, so a repaint changes one file. The raw swatch names
 * (tomato, citrus…) exist because the palette is literally produce.
 */
export const palette = {
  // Paper — the ground everything sits on. Warm off-white, like market butcher paper.
  paper: '#FBF3E4',
  paperDeep: '#F3E4C8',
  paperEdge: '#E7D3B0',

  // Ink — hand-lettered brown-black, never pure #000.
  ink: '#33291F',
  inkSoft: '#6E5C48',
  inkFaint: '#9C886F',

  // Produce accents
  leafDeep: '#2F5B33',
  leaf: '#5C8F45',
  leafLight: '#A9C77E',
  tomato: '#C4452F',
  tomatoSoft: '#E38071',
  citrus: '#E08A2E',
  honey: '#EFC663',
  berry: '#8E4A6B',
  sky: '#7FA8B8',
  soil: '#7B5E3B',
} as const;

export const colors = {
  ...palette,

  // Semantic roles — components should prefer these over raw swatches.
  bg: palette.paper,
  bgRaised: '#FFFBF2',
  bgSunken: palette.paperDeep,
  border: palette.paperEdge,
  borderStrong: '#D6BC92',

  textPrimary: palette.ink,
  textSecondary: palette.inkSoft,
  textMuted: '#9C886F',
  textInverse: '#FFFBF2',

  // The two economies get fixed colours everywhere in the app, so a user learns
  // "green sprout = Seeds, gold = Growth" and never has to re-read a label.
  seeds: palette.leaf,
  seedsInk: palette.leafDeep,
  growth: '#C79A2E',
  growthInk: '#8A6714',
  impact: palette.berry,

  primary: palette.leafDeep,
  primaryPressed: '#254A29',
  danger: palette.tomato,

  // "Coming soon" modules. Deliberately muted, never grey-dead — locked modules
  // are narrative, not broken (CLAUDE.md invariant 8).
  lockedBg: '#F1E6D2',
  lockedInk: '#A08F76',
} as const;

/* ── Spacing ─────────────────────────────────────────────────────────────────
 * 4pt base. Use the scale, not arbitrary numbers.
 */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/* ── Radius ──────────────────────────────────────────────────────────────────
 * Generous and soft — paper stickers with rounded die-cut corners.
 */
export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/* ── Type scale ──────────────────────────────────────────────────────────────
 * `display` = Fraunces (warm high-contrast serif, stands in for hand-lettering).
 * `body`    = Nunito (rounded, legible, friendly).
 * See src/design/typography.ts for the loaded font family names.
 */
export const fontFamily = {
  display: 'Fraunces_700Bold',
  displaySemi: 'Fraunces_600SemiBold',
  displayRegular: 'Fraunces_400Regular',
  displayItalic: 'Fraunces_600SemiBold_Italic',
  body: 'Nunito_400Regular',
  bodyMedium: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
} as const;

export const typeScale = {
  hero: { fontSize: 40, lineHeight: 46 },
  title: { fontSize: 28, lineHeight: 34 },
  heading: { fontSize: 21, lineHeight: 27 },
  subheading: { fontSize: 17, lineHeight: 23 },
  body: { fontSize: 15, lineHeight: 22 },
  small: { fontSize: 13, lineHeight: 19 },
  caption: { fontSize: 11, lineHeight: 15 },
} as const;

/* ── Elevation ───────────────────────────────────────────────────────────────
 * Paper stickers cast a short warm shadow, never a cold grey one.
 */
export const shadow = {
  sticker: {
    shadowColor: '#5B4630',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  lifted: {
    shadowColor: '#5B4630',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;

export const theme = { colors, spacing, radius, fontFamily, typeScale, shadow } as const;
export type Theme = typeof theme;
