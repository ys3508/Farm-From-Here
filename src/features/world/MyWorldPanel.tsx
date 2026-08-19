import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { greeningLevelForGrowth } from '@/config/myWorld';
import { useAuth } from '@/features/auth/AuthProvider';

import { Day1CreatureSlot } from './Day1CreatureSlot';
import { LifeSprite } from './LifeSprite';
import { OnboardingOverlay, highlights, type OnboardingStep } from './OnboardingOverlay';
import { WorldBackground } from './WorldBackground';
import { useOnboardingSeen } from './useOnboardingSeen';
import { useWorldLives } from './useWorldLives';
import { placeLife, scaleForId } from './worldCoords';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * MY WORLD — the player's single living canvas.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Spec: revise/2026-08-17-my-world.md
 *
 * A quiet white sand-dune world where handmade watercolour lives appear as the
 * user participates, and a little ground vegetation creeps in as their Growth
 * rises. This is NOT a dashboard — the user should feel they entered a world.
 *
 * ⚠️ THIS USED TO BE THE WHOLE SCREEN. It became a PANEL when Farmer World
 * landed (revise/2026-08-19-farmer-world-and-tabs.md): My World is now the
 * lower of two panels on one vertical canvas, and app/(app)/world.tsx owns the
 * stacking, the pan and the mode toggle. Nothing about the world itself
 * changed — it simply gets its size from its parent instead of measuring the
 * window, because a panel is exactly one screen tall by construction.
 *
 * WHAT THIS SCREEN DELIBERATELY IS NOT:
 *   ✗ no pan / zoom / roaming WITHIN the world — V1 renders ONE static screen
 *     of it. Lives are *stored* at world coordinates so V2's roamable world
 *     needs zero migration, but the camera is fixed. (worldCoords.ts holds the
 *     seam.) The two-world pan above is a different axis and moves the whole
 *     panel, not the camera inside it.
 *   ✗ no day/night, no time-of-day, no crossfade, no tint, no weather.
 *   ✗ no GROVE — no tree adoption, no farmer updates, no growth-stage art, no
 *     tree detail. Only the tap seam is reserved. (LifeSprite.onZoomToDetail.)
 *   ✗ no payments, of any kind.
 *   ✗ no creature dialogue, AI, desktop presence or feeding flow.
 *
 * ECONOMY: this panel READS the two balances and writes to neither ledger. The
 * starter Seeds and Growth onboarding shows were granted at signup by
 * handle_new_user; onboarding reveals them rather than crediting again.
 */

export type MyWorldPanelProps = {
  /** The panel's box. World coordinates are projected onto exactly this. */
  width: number;
  height: number;
  /**
   * Reports whether the onboarding tour is currently pointing at the balances.
   *
   * The balances pill itself no longer lives in this panel — it is fixed above
   * BOTH worlds now (polish spec §3), so the tour cannot highlight it directly
   * any more. The panel still owns the tour, so it says when to glow and the
   * canvas does the glowing.
   */
  onBalancesHighlighted?: (highlighted: boolean) => void;
};

export function MyWorldPanel({ width, height, onBalancesHighlighted }: MyWorldPanelProps) {
  const { profile } = useAuth();

  const { lives, loading, granting, isEmpty, grantFirstLife } = useWorldLives(profile?.id);
  const { seen, loading: seenLoading, markSeen } = useOnboardingSeen(profile?.id);

  const viewport = { width, height };

  const [step, setStep] = useState<OnboardingStep | null>(null);
  const [grantError, setGrantError] = useState<string | null>(null);

  /* ── When the tour runs ──────────────────────────────────────────────────
   * Only for a world that is still empty and has not been walked through on
   * this device. Everything here is about whether to PLAY the tour; whether the
   * creature can be granted is the database's business, not this component's. */
  useEffect(() => {
    if (loading || seenLoading || step !== null) return;
    if (isEmpty && seen === false) setStep('welcome');
  }, [loading, seenLoading, isEmpty, seen, step]);

  const greeningLevel = greeningLevelForGrowth(profile?.growth_xp ?? 0);
  const marks = step ? highlights(step) : { balances: false, tabs: false, box: false };

  // Hand the balances step up to whoever is drawing the pill.
  useEffect(() => {
    onBalancesHighlighted?.(marks.balances);
  }, [marks.balances, onBalancesHighlighted]);

  /**
   * The creature grant. Safe to call more than once — the database's
   * `unique (profile_id, creature_id)` makes a repeat a no-op, so a double tap
   * or a re-entered flow cannot produce a second life.
   *
   * Grants NO Seeds and NO Growth.
   */
  const openTheBox = async () => {
    setGrantError(null);
    const result = await grantFirstLife();

    if (result.status === 'failed') {
      setGrantError(`That did not open. ${result.message}`);
      return;
    }
    setStep('granted');
  };

  const advance = () => {
    switch (step) {
      case 'welcome':
        setStep('balances');
        break;
      case 'balances':
        setStep('tabs');
        break;
      case 'tabs':
        setStep('box');
        break;
      case 'box':
        void openTheBox();
        break;
      case 'granted':
        void markSeen();
        setStep(null);
        break;
      default:
        break;
    }
  };

  /**
   * Skipping ends the WALKTHROUGH, not the reward. The box stays on the dunes
   * and stays tappable, so the first creature is still there to be collected —
   * it is never silently forfeited.
   */
  const skip = () => {
    void markSeen();
    setStep(null);
    setGrantError(null);
  };

  /**
   * Tapping the box outside the tour re-nudges toward the first-creature flow,
   * exactly as the spec asks. It jumps straight to the box step rather than
   * replaying the whole intro.
   */
  const handleBoxPress = () => {
    if (step === 'box') {
      void openTheBox();
      return;
    }
    if (step === null) setStep('box');
  };

  const ready = viewport.width > 0 && viewport.height > 0;

  return (
    <View style={[styles.root, { width, height }]}>
      <WorldBackground />

      {ready ? (
        <>
          {/* ── The lives ──────────────────────────────────────────────────
           * Each is drawn at its STORED world coordinate. Nothing is
           * re-scattered on open — the world looks the same every return. */}
          {lives.map((life) => {
            const placement = placeLife(life.position, viewport, scaleForId(life.id));
            return (
              <LifeSprite
                key={life.id}
                life={life}
                left={placement.left}
                top={placement.top}
                size={placement.size}
                greeningLevel={greeningLevel}
                // No onZoomToDetail in V1 — GROVE supplies it later and the tap
                // becomes a zoom with no rewrite here. See LifeSprite.
              />
            );
          })}

          {/* ── The day-1 protagonist ──────────────────────────────────────
           * Exists ONLY while the world is empty. The moment the first life
           * lands, `isEmpty` flips and it is gone.
           *
           * It goes through Day1CreatureSlot rather than rendering the box
           * directly: the slot owns the spot, and the real starter creature
           * drops into it next round without touching this file. The box is a
           * stand-in, not the empty state's answer. */}
          {isEmpty && !loading ? (
            <Day1CreatureSlot
              viewport={viewport}
              onPress={handleBoxPress}
              highlighted={marks.box}
            />
          ) : null}
        </>
      ) : null}

      {/* Seeds + Growth used to hang here, riding with this panel. They are
          now fixed above both worlds — one person, one balance (polish spec
          §3). See app/(app)/world.tsx. */}

      {step ? (
        <OnboardingOverlay
          step={step}
          onAdvance={advance}
          onSkip={skip}
          busy={granting}
          error={grantError}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
});
