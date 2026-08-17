/**
 * Per-launch onboarding state.
 *
 * Module scope on purpose: these reset when the JS bundle reloads, which is
 * exactly "once per app launch". Persisting them would mean the splash never
 * plays again; not tracking them would replay it every time the router
 * re-evaluates the index route.
 */

let splashPlayed = false;
let profileSetupInProgress = false;

export const onboardingSequence = {
  hasPlayedSplash: () => splashPlayed,
  markSplashPlayed: () => {
    splashPlayed = true;
  },

  /**
   * True while someone is partway through the sign-up wizard.
   *
   * Third-party sign-up creates the Supabase account the moment the provider
   * returns — well before the user has given us their name. Without this flag
   * the auth layout would see a live session and bounce them into My World,
   * and they would never reach step 3. It is cleared when the wizard finishes
   * or is abandoned.
   *
   * If the app is killed mid-wizard the flag resets, and on the next launch the
   * user simply lands in My World with an incomplete profile — the owner's
   * chosen behaviour (2026-08-17), not an accident.
   */
  isProfileSetupInProgress: () => profileSetupInProgress,
  beginProfileSetup: () => {
    profileSetupInProgress = true;
  },
  endProfileSetup: () => {
    profileSetupInProgress = false;
  },
};
