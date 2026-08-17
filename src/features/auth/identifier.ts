/**
 * The single identifier field on Login / Sign up accepts Email, Username or
 * Phone. This module works out which one was typed and routes to the right
 * existing Step 1 auth method — it adds NO new auth logic of its own.
 *
 * State of the three paths right now:
 *   email    ✅ fully wired (supabase.auth.signUp / signInWithPassword)
 *   phone    ⛔ STUB — Step 1 deliberately left SMS unwired; it costs money per
 *                message. AuthProvider.startPhoneSignIn throws a clear message.
 *   username ⛔ STUB — Supabase has no native username auth. It needs a
 *                username → email/phone lookup table, which is out of scope.
 *
 * So of the three, only email completes today. Both stubs say so plainly rather
 * than failing in a confusing way, which is better than pretending to work.
 */

export type IdentifierKind = 'email' | 'phone' | 'username';

/** Anything with an @ is an email; digits (with the usual punctuation) is a phone. */
export function classifyIdentifier(raw: string): IdentifierKind {
  const value = raw.trim();
  if (value.includes('@')) return 'email';

  const digitsOnly = value.replace(/[\s()\-.]/g, '');
  if (/^\+?\d{6,15}$/.test(digitsOnly)) return 'phone';

  return 'username';
}

/** Strips the formatting humans type, keeping a leading +. */
export function normalisePhone(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/[^\d]/g, '');
  return trimmed.startsWith('+') ? `+${digits}` : digits;
}

/**
 * ⛔ USERNAME LOGIN IS A STUB.
 *
 * To finish it later: add a `username` column to `profiles` (unique, case-folded),
 * then a SECURITY DEFINER RPC that maps username → email so this can call the
 * existing password sign-in. Do not store passwords anywhere yourself.
 */
export const USERNAME_STUB_MESSAGE =
  'Username sign-in is not connected yet — it needs a username lookup that has not been built. ' +
  'Please use your email address for now.';
