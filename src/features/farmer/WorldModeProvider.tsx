import { useRouter } from 'expo-router';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { DEFAULT_WORLD, type WorldMode } from '@/config/farmerWorld';
import { useAuth } from '@/features/auth/AuthProvider';

import { useFarmerMembership } from './useFarmerMembership';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * WORLD MODE — the single source of truth for which world you are in.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Spec: revise/2026-08-19-farmer-world-and-tabs.md
 *
 * ONE value, `activeWorld`, drives BOTH:
 *   • the pan position of the two-panel canvas (app/(app)/world.tsx), and
 *   • the left half of the bottom tab bar (app/(app)/_layout.tsx).
 *
 * They are derived, never stored separately, so the toggle, the pan and the
 * tabs cannot drift out of step. The toggle, a swipe past the seam and a tab
 * press are three entry points to the same one setter.
 *
 * It lives ABOVE the tab navigator because the tab bar itself reads it. That
 * also means it survives moving between tabs: a farmer who goes to Community
 * and comes back is still in Farmer World.
 *
 * ⚠️ `enterFarmerWorld()` is the ONLY way in, and it refuses when the profile
 * has no `farm_members` row. A pure consumer cannot reach Farmer World through
 * any code path — not the toggle, not a swipe, not a stale value — they get the
 * application entry instead.
 */

type WorldModeValue = {
  /** Which world is active. The single source of truth. */
  activeWorld: WorldMode;
  /** True only for a profile with a real farm_members row. */
  isFarmer: boolean;
  /** True until the farmer gate has an answer; treat as "not a farmer". */
  gateLoading: boolean;
  /** The farmer's farm name, once loaded. Null for a consumer, never invented. */
  farmName: string | null;
  /**
   * Ask for a world. A non-farmer asking for 'farmer-world' is routed to the
   * application entry instead and `activeWorld` does not change.
   */
  requestWorld: (world: WorldMode) => void;
};

const WorldModeContext = createContext<WorldModeValue | null>(null);

/** Where a non-farmer's right toggle goes. Stubbed until Step 2 builds it. */
const APPLICATION_ROUTE = '/(app)/apply';

export function WorldModeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { profile } = useAuth();
  const { isFarmer, farmName, loading } = useFarmerMembership(profile?.id);

  const [activeWorld, setActiveWorld] = useState<WorldMode>(DEFAULT_WORLD);

  // A farmer who somehow lands in Farmer World and then loses the membership
  // (signed out, switched account) must not be left in a world that no longer
  // exists for them. Deriving the effective value costs nothing and removes a
  // whole class of stale-state bug.
  const effectiveWorld: WorldMode = isFarmer ? activeWorld : 'my-world';

  const requestWorld = useCallback(
    (world: WorldMode) => {
      if (world === 'farmer-world' && !isFarmer) {
        // No Farmer World to pan into. The right toggle is the invitation.
        router.push(APPLICATION_ROUTE);
        return;
      }
      setActiveWorld(world);
    },
    [isFarmer, router],
  );

  const value = useMemo<WorldModeValue>(
    () => ({
      activeWorld: effectiveWorld,
      isFarmer,
      gateLoading: loading,
      farmName,
      requestWorld,
    }),
    [effectiveWorld, isFarmer, loading, farmName, requestWorld],
  );

  return <WorldModeContext.Provider value={value}>{children}</WorldModeContext.Provider>;
}

export function useWorldMode() {
  const ctx = useContext(WorldModeContext);
  if (!ctx) throw new Error('useWorldMode must be used inside <WorldModeProvider>.');
  return ctx;
}
