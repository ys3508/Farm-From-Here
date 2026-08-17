import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { CinematicScene, SPLASH_TIMINGS } from '@/features/onboarding/CinematicScene';
import { onboardingSequence } from '@/features/onboarding/sequence';
import { hasLocalSessionTrace } from '@/features/auth/localSession';

/** The only difference between the two versions of this screen. */
const NEW_VISITOR_LINE = 'Your journey begins here';
const RETURNING_LINE = 'Welcome home :)';

/**
 * SPLASH — one screen, two lines of text.
 *
 * Both versions share the illustration, the layered fade-in, the placement and
 * the 3s runtime. A returning visitor gets "Welcome home :)" instead of "Your
 * journey begins here", and that is the entire difference (owner, 2026-08-17).
 * There is deliberately no separate welcome-back screen any more.
 *
 * Which line to show is decided from a LOCAL storage trace, so nothing here
 * waits on the network. Where the user goes afterwards is decided by the real
 * session, in app/index.tsx — a stale token on disk must not be enough to walk
 * someone into the app.
 *
 * Note this is the IN-APP splash. The native splash image (assets/splash-icon.png,
 * via the expo-splash-screen plugin) still covers the moment before JS boots.
 */
export default function SplashScreen() {
  const router = useRouter();
  const [scriptLine, setScriptLine] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void hasLocalSessionTrace().then((returning) => {
      if (!cancelled) setScriptLine(returning ? RETURNING_LINE : NEW_VISITOR_LINE);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const finish = useCallback(() => {
    onboardingSequence.markSplashPlayed();
    // Back to the gate, which sends signed-in users straight to My World and
    // everyone else to login. Keeping that decision in one place means the
    // splash never has to reason about auth.
    router.replace('/');
  }, [router]);

  return (
    <CinematicScene
      scene="splash"
      scriptLine={scriptLine}
      timings={SPLASH_TIMINGS}
      onFinish={finish}
    />
  );
}
