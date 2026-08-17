import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Is there a sign-in trace on THIS DEVICE?
 *
 * Used only to pick the splash's handwritten line — "Welcome home :)" versus
 * "Your journey begins here". It reads local storage and nothing else: no
 * network call, no token refresh, no waiting on Supabase. Startup must never
 * block on this.
 *
 * Deliberately NOT an authority on whether the user is really signed in. The
 * token could be expired or revoked. Routing after the splash uses the real
 * session from AuthProvider; this only decides which six words to show, and
 * being wrong costs nothing.
 *
 * supabase-js stores its session under `sb-<project-ref>-auth-token`, so the
 * key pattern is what we look for rather than any particular project ref.
 */
const SUPABASE_SESSION_KEY = /^sb-.+-auth-token$/;

export async function hasLocalSessionTrace(): Promise<boolean> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return keys.some((key) => SUPABASE_SESSION_KEY.test(key));
  } catch {
    // Storage unavailable — treat as a fresh install. The friendlier failure:
    // a returning user briefly gets the new-user line instead of an error.
    return false;
  }
}
