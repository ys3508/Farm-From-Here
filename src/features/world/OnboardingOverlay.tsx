import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { ONBOARDING_STEP_FADE_MS, STARTER_GROWTH, STARTER_SEEDS } from '@/config/myWorld';
import { BrandButton, BrandText, brandRadius, brandSpacing } from '@/design/brand';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * ONBOARDING — a short guided intro, played once, on the world itself.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * It runs ON My World rather than on separate screens, so the user is never
 * taken out of the world they are being introduced to.
 *
 * ⚠️ IT CREDITS NOTHING. The 'balances' step below REVEALS the Seeds and Growth
 *    the signup trigger already granted (handle_new_user, Step 1). It does not
 *    write a ledger row and does not touch a balance. Owner decision, 2026-08-19
 *    — see the long note in src/config/myWorld.ts. Crediting here would
 *    double-grant.
 *
 * The one thing it does grant is the FIRST COMPANION CREATURE, which is a fixed
 * onboarding reward and an intentional exception to the general rule that
 * creatures must be earned. That grant moves no currency at all.
 */

export const ONBOARDING_STEPS = ['welcome', 'balances', 'tabs', 'box', 'granted'] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** The step that is pointing at each element, so the screen can highlight it. */
export function highlights(step: OnboardingStep) {
  return {
    balances: step === 'balances',
    tabs: step === 'tabs',
    box: step === 'box',
  };
}

type Copy = { line: string; cta: string };

/**
 * Hand-written, deliberately few words. The UI recedes; this is a world, not a
 * tutorial. Note the Growth/Seeds line never says "XP" — the user-facing word
 * is always "Growth" (CLAUDE.md invariant 1).
 */
const COPY: Record<OnboardingStep, Copy> = {
  welcome: {
    line: 'This is your world.\nQuiet for now — it fills as you go.',
    cta: 'Look around',
  },
  balances: {
    line: `You start with ${STARTER_SEEDS.toLocaleString()} Seeds and ${STARTER_GROWTH.toLocaleString()} Growth.\nSeeds are spent on real things. Growth only ever rises.`,
    cta: 'Got it',
  },
  tabs: {
    line: 'Four places to be.\nThree of them are still on their way.',
    cta: 'Next',
  },
  box: {
    line: 'Something arrived for you.',
    cta: 'Open the box',
  },
  granted: {
    line: 'Someone to keep you company.\nTap them whenever you pass by.',
    cta: 'Begin',
  },
};

export type OnboardingOverlayProps = {
  step: OnboardingStep;
  /** Advance, open the box, or finish — the screen decides what each means. */
  onAdvance: () => void;
  /** Skip the rest of the tour. Never skips the creature; the screen grants it. */
  onSkip: () => void;
  /** True while the creature grant is in flight. */
  busy?: boolean;
  /** Set when the grant failed, shown in place of the line. */
  error?: string | null;
};

export function OnboardingOverlay({
  step,
  onAdvance,
  onSkip,
  busy = false,
  error = null,
}: OnboardingOverlayProps) {
  const fade = useRef(new Animated.Value(0)).current;

  // Re-fade the card on every step change, so the copy swaps softly rather
  // than snapping.
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: ONBOARDING_STEP_FADE_MS,
      useNativeDriver: true,
    }).start();
  }, [step, fade]);

  const copy = COPY[step];
  const isLast = step === 'granted';

  return (
    // `box-none` on the root: the world stays tappable underneath, which is what
    // lets the user tap the box itself during the 'box' step rather than only
    // the button. Nothing here throws a full-screen scrim over the dunes.
    <View style={styles.root} pointerEvents="box-none">
      <Animated.View style={[styles.card, { opacity: fade }]}>
        {/* THE WORLD SPEAKING — the serif 'lead' role, the same voice the
            onboarding screens and the Grow card use. It used to be body sans,
            which is what made the consumer home look like a different app
            (revise/2026-08-19-homestead-ui-polish.md §1). */}
        <BrandText textRole="lead" tone="ink" center>
          {error ?? copy.line}
        </BrandText>

        <BrandButton
          label={error ? 'Try again' : copy.cta}
          onPress={onAdvance}
          loading={busy}
          style={styles.cta}
        />

        {!isLast && !error ? (
          <BrandButton label="Skip" variant="link" onPress={onSkip} />
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
    justifyContent: 'flex-end',
    padding: brandSpacing.xl,
  },
  card: {
    alignItems: 'center',
    gap: brandSpacing.md,
    padding: brandSpacing.xl,
    borderRadius: brandRadius.sheet,
    // Warm ivory at 92%: readable over painted sand, still letting the dunes
    // show faintly through so it rests on the world instead of covering it.
    backgroundColor: 'rgba(247, 244, 236, 0.92)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  cta: { alignSelf: 'stretch' },
});
