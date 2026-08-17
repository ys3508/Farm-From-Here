/**
 * ════════════════════════════════════════════════════════════════════════════
 * BRAND TOKENS — the design system going forward.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Owner-approved palette (2026-08-17). This is the direction the whole app
 * moves to.
 *
 * ⚠️ SCOPE, DELIBERATELY LIMITED THIS ROUND (owner's call, 2026-08-17):
 *    Only the onboarding screens — splash, welcome-back, login, sign up — read
 *    from this file today. My World, the map and the profile screen still read
 *    the older `src/design/tokens.ts` and are visually UNCHANGED, because this
 *    round was scoped to onboarding only.
 *
 *    So two palettes coexist on purpose. THIS ONE IS THE STANDARD. When a screen
 *    gets re-skinned, it moves here and stops importing the old tokens. The old
 *    file dies when the last screen migrates — do not add anything new to it.
 *
 * Hard rule: THE BRAND COLOUR IS GREEN, NOT BLUE. Any default blue that shows up
 * (link colour, focus ring, selection) must be pointed at `primary`.
 */

export const brandColors = {
  /** Warm off-white. The global background. */
  bg: '#F7F4EC',
  /** Cards and scrims. */
  surface: '#FFFFFF',
  /** Primary text — deep forest, never pure black. */
  ink: '#2C3A2E',
  /** Secondary text. */
  inkSoft: '#5A6B58',
  /** Main green — buttons, emphasis. */
  primary: '#4C8C4A',
  /** Deep green — pressed states, headings. */
  primaryDeep: '#2F5E3A',
  /** Sky accent. Use sparingly. */
  accentSky: '#8FB4C4',
  /** Warm gold — milestones and celebration moments only. */
  accentWarm: '#E8B04B',
  /** Hairlines and input underlines. */
  line: '#E3DECF',

  /** Text placed directly on an illustration. Always paired with a soft shadow. */
  onImage: '#FFFFFF',
} as const;

/**
 * The translucent white card that floats over an illustration.
 *
 * It wraps ONLY the input area — never the whole lower half — so the grass,
 * clouds and door stay visible around it. Opacity is tunable here in one place:
 * high enough that a hairline underline and grey placeholder stay readable over
 * busy painted grass, low enough that the illustration still reads through.
 */
export const scrim = {
  /**
   * Warm white at ~90%, not the flat white it started as. The painting has to
   * read faintly through the sheet; at full opacity the card reads as a form
   * pasted over the art rather than resting on it.
   */
  cardBackground: 'rgba(247, 244, 236, 0.90)',
  cardBorder: 'rgba(255, 255, 255, 0.7)',
  /**
   * Fraction of the screen the illustration keeps above the card. 0.52 sits in
   * the 50–55% the design calls for: enough for the clouds and the running dog
   * to survive on a short phone.
   */
  revealFraction: 0.52,
  /**
   * Warm-white margin down each side of the illustration, as a fraction of
   * screen width. Applied to EVERY onboarding scene so login and sign up have
   * identical margins regardless of each painting's own aspect ratio.
   */
  artSideInset: 0.08,
} as const;

/** Soft, hand-drawn. 14 is the house radius; primary buttons go pill. */
export const brandRadius = {
  sm: 8,
  md: 14,
  lg: 20,
  /** Top corners of the risen sheet — larger than `md`, to read as lifted paper. */
  sheet: 28,
  pill: 999,
} as const;

/** Generous — breathing room over density. */
export const brandSpacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/**
 * Type families.
 *   display — Cormorant, an elegant thin serif. Owner picked it over Playfair
 *             on 2026-08-17: at wide letter-spacing it reads like a book plate
 *             and matches the fine pencil texture of the illustrations.
 *   body    — Inter, clean humanist sans.
 *   script  — Dancing Script, for the handwritten lines only.
 */
export const brandFont = {
  displayLight: 'Cormorant_300Light',
  display: 'Cormorant_400Regular',
  displayMedium: 'Cormorant_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  script: 'DancingScript_500Medium',
  scriptBold: 'DancingScript_600SemiBold',
} as const;

/**
 * Letter-spacing for the display face. The spec asks for ~0.08–0.16em; React
 * Native takes absolute points, so these are precomputed per size.
 */
export const brandType = {
  /**
   * "FARM FROM HERE" on splash / welcome-back.
   * 30 is chosen so the wordmark still fits on ONE line at 375pt — the narrowest
   * phone we care about — with the 16pt gutters below. The spec prefers one line
   * over a larger size that wraps.
   */
  wordmark: { fontSize: 30, lineHeight: 38, letterSpacing: 30 * 0.14 },
  /** Fallback for anything narrower still; wraps to FARM FROM / HERE. */
  wordmarkWrapped: { fontSize: 26, lineHeight: 34, letterSpacing: 26 * 0.14 },
  /** Screen headings inside cards. */
  title: { fontSize: 26, lineHeight: 32, letterSpacing: 26 * 0.04 },
  /** "Real world. Real growth." */
  subtitle: { fontSize: 15, lineHeight: 22, letterSpacing: 15 * 0.16 },
  body: { fontSize: 15, lineHeight: 22, letterSpacing: 0 },
  small: { fontSize: 13, lineHeight: 19, letterSpacing: 0 },
  caption: { fontSize: 11, lineHeight: 16, letterSpacing: 0.3 },
  /** "Your journey begins here" / "Welcome Back". */
  script: { fontSize: 24, lineHeight: 32, letterSpacing: 0 },
} as const;

/**
 * Shadows are very light or absent — separation comes from whitespace and
 * colour, not from heavy elevation. The one exception is text sitting directly
 * on an illustration, which needs a shadow to stay legible over painted grass.
 */
export const brandShadow = {
  card: {
    shadowColor: '#2C3A2E',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  /** For white text over the illustrations. Not decoration — legibility. */
  onImageText: {
    textShadowColor: 'rgba(44, 58, 46, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
} as const;

export const brandTheme = {
  colors: brandColors,
  scrim,
  radius: brandRadius,
  spacing: brandSpacing,
  font: brandFont,
  type: brandType,
  shadow: brandShadow,
} as const;
