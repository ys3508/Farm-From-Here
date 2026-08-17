import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/features/auth/AuthProvider';

/** Already signed in? The auth screens are not somewhere you should be. */
export default function AuthLayout() {
  const { session, initialising } = useAuth();

  if (!initialising && session) return <Redirect href="/(app)/world" />;

  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
