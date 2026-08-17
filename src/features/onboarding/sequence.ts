/**
 * Whether the splash / welcome-back animation has already played THIS LAUNCH.
 *
 * Module scope on purpose: the flags reset when the JS bundle reloads, which is
 * exactly "once per app launch". Persisting them would mean a returning user
 * never sees the welcome scene again, and not tracking them at all would replay
 * the animation every time the router re-evaluates the index route.
 */

let splashPlayed = false;
let welcomePlayed = false;

export const onboardingSequence = {
  hasPlayedSplash: () => splashPlayed,
  markSplashPlayed: () => {
    splashPlayed = true;
  },

  hasPlayedWelcome: () => welcomePlayed,
  markWelcomePlayed: () => {
    welcomePlayed = true;
  },
};
