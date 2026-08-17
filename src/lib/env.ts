/**
 * Environment access. Expo inlines `process.env.EXPO_PUBLIC_*` at bundle time,
 * so these MUST be referenced as full static property paths — destructuring
 * `process.env` or building the key name dynamically yields undefined.
 *
 * Missing config is NOT a crash. The owner will open Expo Go before filling in
 * `.env.local`, and a red error screen makes the app look broken when it is only
 * unconfigured. Instead `isSupabaseConfigured` is false and the app shows a
 * setup screen with instructions.
 */

const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const rawAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** True only when both values are present and not the .env.local.example stubs. */
export const isSupabaseConfigured =
  rawUrl.startsWith('https://') &&
  !rawUrl.includes('YOUR-PROJECT-REF') &&
  rawAnonKey.length > 20 &&
  !rawAnonKey.includes('YOUR-ANON');

export const env = {
  supabaseUrl: rawUrl,
  supabaseAnonKey: rawAnonKey,
  appScheme: process.env.EXPO_PUBLIC_APP_SCHEME || 'farmfromhere',
} as const;

/** Human-readable reason the app is in setup mode, for the setup screen. */
export function supabaseConfigProblem(): string | null {
  if (isSupabaseConfigured) return null;
  if (!rawUrl) return 'EXPO_PUBLIC_SUPABASE_URL is not set.';
  if (rawUrl.includes('YOUR-PROJECT-REF'))
    return 'EXPO_PUBLIC_SUPABASE_URL still holds the example placeholder.';
  if (!rawAnonKey) return 'EXPO_PUBLIC_SUPABASE_ANON_KEY is not set.';
  if (rawAnonKey.includes('YOUR-ANON'))
    return 'EXPO_PUBLIC_SUPABASE_ANON_KEY still holds the example placeholder.';
  return 'Supabase environment variables look malformed.';
}
