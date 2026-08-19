import { brandType } from './tokens';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * TEXT ROLES — what a piece of text IS, not which font it uses.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Spec: revise/2026-08-19-homestead-ui-polish.md §1
 *
 * WHY THIS FILE EXISTS. Every screen already went through <BrandText>, so no
 * font was ever hand-set — and the home still drifted, because each screen
 * picked its own `variant` + `family` pair. The onboarding screens and the
 * farmer world reached for the serif for their titles and the script for their
 * hand-written lines; the consumer home quietly rendered everything in body
 * sans, and the two halves of one app stopped looking related.
 *
 * A role names the JOB. Pick the job and the type comes with it, identically,
 * everywhere. That is what makes "the consumer home matches onboarding" a
 * property of the system rather than a thing someone remembered to do.
 *
 * ⚠️ If you are about to write `variant=` and `family=` together on a screen,
 * you want a role instead — either one of these or a new one added here.
 */

/* The primitives live here rather than in BrandText.tsx so the dependency runs
 * one way — BrandText reads the roles, the roles never read BrandText. */

/** Every size in the type scale. */
export type TextVariant = keyof typeof brandType;
export type TextFamily = 'display' | 'body' | 'script';
export type TextWeight = 'light' | 'regular' | 'medium' | 'semibold';

/** What a role is allowed to set. Exported so BrandText can widen to it. */
export type TextRoleStyle = {
  variant: TextVariant;
  family: TextFamily;
  weight?: TextWeight;
};

export const textRoles = {
  /**
   * The name of a screen, a world or a thing — "Quest", the farm's name.
   * The book-plate serif, and the loudest type in the app after the wordmark.
   */
  title: { variant: 'title', family: 'display' },

  /**
   * THE WORLD SPEAKING. One short line of prose in the serif: the onboarding
   * lines on the dunes, an empty world explaining itself. Not a heading — this
   * is the voice the product talks in, and it is the piece the consumer home
   * was missing.
   */
  lead: { variant: 'lead', family: 'display' },

  /**
   * A HAND-WRITTEN ASIDE. The script face, used sparingly and never for more
   * than one line: "A real farm is being signed.", what a creature murmurs when
   * you tap it. It should read as pencil in a margin.
   */
  whisper: { variant: 'script', family: 'script' },

  /** Ordinary reading copy. */
  body: { variant: 'body', family: 'body' },

  /** Secondary copy — hints under an action, the quiet half of a row. */
  detail: { variant: 'small', family: 'body' },

  /** A tracked-out, all-caps kicker sitting above a title. */
  kicker: { variant: 'caption', family: 'body', weight: 'semibold' },

  /** The small print under a row or a control. Never the only copy present. */
  hint: { variant: 'caption', family: 'body' },

  /**
   * A NUMBER THE USER OWNS — a Seeds or Growth balance, a ledger amount.
   *
   * Sans on purpose, and the one place the serif is wrong: Cormorant's figures
   * are old-style and low-contrast, and a balance has to be read at a glance
   * rather than admired.
   */
  amount: { variant: 'small', family: 'body', weight: 'semibold' },

  /** A control's label — a tab, a toggle segment, a pill. */
  label: { variant: 'caption', family: 'body', weight: 'medium' },
} as const satisfies Record<string, TextRoleStyle>;

export type TextRole = keyof typeof textRoles;
