/**
 * Username rules.
 *
 * These mirror the constraints in
 * supabase/migrations/20260817000700_username_and_avatars.sql. The database is
 * the authority — it has the CHECK constraints and the case-insensitive unique
 * index, so a race or a direct API call still cannot get past it. This file
 * exists so the user gets an instant, specific message instead of a rejected
 * insert. IF YOU CHANGE ONE, CHANGE BOTH.
 */

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 32;

/** Letters, digits and underscore only. */
const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/;

/**
 * Names nobody may take. Configurable — add to this list AND to
 * `is_reserved_username()` in the migration.
 */
export const RESERVED_USERNAMES = [
  'admin',
  'administrator',
  'root',
  'system',
  'support',
  'help',
  'official',
  'farmfromhere',
  'mod',
  'moderator',
  'staff',
  'api',
  'null',
  'undefined',
] as const;

/**
 * The canonical form. Uniqueness and login both work on this, so `Alice` and
 * `alice` are the same person — the display form the user typed is what gets
 * stored, but never what gets compared.
 */
export function normaliseUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Returns a message to show the user, or null when the name is shaped correctly. */
export function validateUsernameFormat(raw: string): string | null {
  const value = raw.trim();

  if (!value) return 'Choose a username.';
  if (value.length < USERNAME_MIN_LENGTH) {
    return `Usernames need at least ${USERNAME_MIN_LENGTH} characters.`;
  }
  if (value.length > USERNAME_MAX_LENGTH) {
    return `Usernames can be at most ${USERNAME_MAX_LENGTH} characters.`;
  }
  if (!USERNAME_PATTERN.test(value)) {
    return 'Use only letters, numbers and underscores.';
  }
  if ((RESERVED_USERNAMES as readonly string[]).includes(normaliseUsername(value))) {
    return 'That username is reserved. Please choose another.';
  }
  return null;
}
