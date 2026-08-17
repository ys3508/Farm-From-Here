import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/features/auth/AuthProvider';
import { onboardingSequence } from '@/features/onboarding/sequence';
import { isPreviewMode } from '@/features/dev/preview';

/**
 * Already signed in? The auth screens are not somewhere you should be.
 *
 * The one exception is the sign-up wizard. Third-party sign-up creates the
 * Supabase account the instant the provider returns, which is before the user
 * has told us their name — without the profile-setup check below, this redirect
 * would fire mid-wizard and they would never reach step 3.
 */
export default function AuthLayout() {
  const { session, initialising } = useAuth();

  const settingUpProfile = onboardingSequence.isProfileSetupInProgress();

  // Preview mode is always "signed in", so this redirect would make login and
  // sign up unreachable — which is exactly what preview mode exists to avoid.
  if (!isPreviewMode && !initialising && session && !settingUpProfile) {
    return <Redirect href="/(app)/world" />;
  }

  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
