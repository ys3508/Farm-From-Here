import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

import { env, isSupabaseConfigured } from '../env';
import type { Database } from './types';

/**
 * The Supabase client. One instance for the whole app.
 *
 * Storage note: the session is kept in AsyncStorage rather than SecureStore.
 * Supabase sessions routinely exceed SecureStore's 2 KB comfortable limit and
 * get silently truncated on Android, which logs the user out at random. This is
 * the pattern Supabase documents for Expo. If the threat model later demands
 * hardware-backed storage, chunk the token across SecureStore keys — do not just
 * swap the adapter.
 *
 * `detectSessionInUrl: false` is required on native: there is no URL bar, and
 * OAuth returns through a deep link that we parse explicitly in AuthProvider.
 */
export const supabase = createClient<Database>(
  // Fall back to a syntactically valid dummy so createClient does not throw at
  // import time when the app is unconfigured — callers gate on isSupabaseConfigured.
  isSupabaseConfigured ? env.supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? env.supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      // PKCE is the correct flow for a native app: the code verifier never
      // leaves the device, so an intercepted deep link is not a usable session.
      // The OAuth callback therefore carries `?code=` and must be exchanged —
      // see exchangeCodeForSession() in AuthProvider.
      flowType: 'pkce',
    },
  },
);
