import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { CinematicScene, WELCOME_TIMINGS } from '@/features/onboarding/CinematicScene';
import { onboardingSequence } from '@/features/onboarding/sequence';

/**
 * WELCOME BACK — the returning user's scene, once per launch, ~2s.
 *
 * Same faces, same rhythm and same placement as the splash (they share
 * CinematicScene); only the illustration, the script line and the timings
 * differ. Tappable to skip, and it auto-enters the app.
 *
 * A user who just signed in does NOT come through here — they go straight to My
 * World. This is for opening the app with a session already in hand.
 */
export default function WelcomeBackScreen() {
  const router = useRouter();

  const finish = useCallback(() => {
    onboardingSequence.markWelcomePlayed();
    router.replace('/(app)/world');
  }, [router]);

  return (
    <CinematicScene
      scene="welcome"
      scriptLine="Welcome Back"
      timings={WELCOME_TIMINGS}
      onFinish={finish}
    />
  );
}
