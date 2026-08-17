import { useCallback, useEffect, useState } from 'react';

import { isPreviewMode, previewGrowthLedger, previewSeedsLedger } from '@/features/dev/preview';
import { isSupabaseConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase/client';
import type { GrowthLedgerEntry, SeedsLedgerEntry } from '@/lib/supabase/types';

/**
 * Recent ledger history for the signed-in user.
 *
 * The BALANCES come from the profile (profiles.growth_xp / seeds_balance) — read
 * those via useAuth().profile. This hook is the audit trail behind them: the
 * ledgers are the source of truth, so if a balance ever looks wrong, these rows
 * are the answer.
 *
 * Nothing here writes. RLS gives the client SELECT only; Seeds and Growth are
 * minted exclusively by SECURITY DEFINER triggers on the server.
 */
export function useLedgers(profileId: string | undefined, limit = 20) {
  const [growth, setGrowth] = useState<GrowthLedgerEntry[]>([]);
  const [seeds, setSeeds] = useState<SeedsLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (isPreviewMode) {
      setGrowth(previewGrowthLedger);
      setSeeds(previewSeedsLedger);
      setLoading(false);
      return;
    }

    if (!profileId || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const [growthResult, seedsResult] = await Promise.all([
      supabase
        .from('growth_ledger')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('seeds_ledger')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(limit),
    ]);

    if (growthResult.error) console.warn('[economy] growth ledger:', growthResult.error.message);
    if (seedsResult.error) console.warn('[economy] seeds ledger:', seedsResult.error.message);

    setGrowth(growthResult.data ?? []);
    setSeeds(seedsResult.data ?? []);
    setLoading(false);
  }, [profileId, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  return { growth, seeds, loading, reload: load };
}

/** Human-readable label for a ledger row, for the My Growth / My Seeds lists. */
export function describeSource(source: string): string {
  const labels: Record<string, string> = {
    signup: 'Welcome to Farm From Here',
    signup_bonus: 'Welcome bonus',
    referral: 'Referral reward',
    daily_movement: 'Movement — 5,000 steps',
    quest_completion: 'Quest completed',
    adoption: 'Adoption',
    farm_visit: 'Farm visit',
    redemption: 'Reward redeemed',
    admin_adjustment: 'Adjustment',
  };
  return labels[source] ?? source;
}
