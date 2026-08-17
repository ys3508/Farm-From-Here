import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { CinematicScene, SPLASH_TIMINGS } from '@/features/onboarding/CinematicScene';
import { onboardingSequence } from '@/features/onboarding/sequence';

/**
 * SCREEN 0 — SPLASH. Shown to signed-OUT visitors, once per launch.
 *
 * Signed-in users get the shorter welcome-back scene instead and never wait
 * through this one (owner's call, 2026-08-17).
 *
 * Note this is the IN-APP splash. There is also a native splash image
 * (assets/splash-icon.png, configured by the expo-splash-screen plugin) which
 * covers the moment before JS boots. Native splash → this scene → login.
 */
export default function SplashScreen() {
  const router = useRouter();

  const finish = useCallback(() => {
    onboardingSequence.markSplashPlayed();
    router.replace('/(auth)/sign-in');
  }, [router]);

  return (
    <CinematicScene
      scene="splash"
      scriptLine="Your journey begins here"
      timings={SPLASH_TIMINGS}
      onFinish={finish}
    />
  );
}
