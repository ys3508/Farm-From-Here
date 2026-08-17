/**
 * The single identifier field on Login accepts Email, Username or Phone. This
 * module works out which one was typed.
 *
 * The rules are fixed by spec, in this order:
 *   contains "@"                    → email
 *   all digits, or starts with "+"  → phone
 *   anything else                   → username
 *
 * State of the three paths:
 *   email    ✅ real
 *   username ✅ real — resolved to an email server-side, then signed in normally
 *   phone    ⛔ STILL A STUB. SMS was never wired (it costs money per message)
 *              and Spec B explicitly does not connect it. Phone input is routed
 *              to the existing stub, which says so plainly.
 */

export type IdentifierKind = 'email' | 'phone' | 'username';

export function classifyIdentifier(raw: string): IdentifierKind {
  const value = raw.trim();
  if (value.includes('@')) return 'email';

  // Digits with the punctuation people actually type, optionally led by "+".
  if (/^\+?[\d\s()\-.]+$/.test(value) && /\d/.test(value)) return 'phone';

  return 'username';
}

/** Strips the formatting humans type, keeping a leading +. */
export function normalisePhone(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/[^\d]/g, '');
  return trimmed.startsWith('+') ? `+${digits}` : digits;
}

/**
 * One wording for every failed sign-in, whichever of the three was typed.
 *
 * Saying "no such user" versus "wrong password" would let anyone test whether an
 * account exists. (Note the real exposure right now is the username → email
 * lookup itself — see the warning in migration 20260817000700.)
 */
export const SIGN_IN_FAILED_MESSAGE =
  'Those details did not match an account. Check them and try again.';

/** Shown when a username belongs to an account that has no password at all. */
export const SOCIAL_ONLY_ACCOUNT_MESSAGE =
  'This account signs in with Google, Facebook, X or Apple. Use "More options" below.';
