import { useCallback, useEffect, useState } from 'react';

import { isPreviewMode, previewFarmMembership } from '@/features/dev/preview';
import { isSupabaseConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase/client';
import type { FarmMember } from '@/lib/supabase/types';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * THE FARMER GATE — one row in `farm_members`, and nothing else.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Spec: revise/2026-08-19-farmer-world-and-tabs.md
 *
 * One profile can be both a player and a farmer. There is NO farmer account
 * type, no second app and no flag on `profiles`: farmer capability is exactly
 * "this profile has a row in farm_members", written by the Step-2 approval
 * flow. So this hook is the whole gate, and every piece of farmer UI in the app
 * hangs off its answer.
 *
 * A profile with no row is a pure consumer and must see ZERO farmer UI — no
 * farmer tabs, no farmer screens, and no peek of the Farmer World. The one
 * thing they do see is the application entry, which is an invitation rather
 * than a locked door (Step 2 §2, "an entry point somewhere discoverable").
 *
 * ⚠️ `loading` matters: until the answer is in, treat the profile as NOT a
 * farmer. Flashing farmer UI at a consumer for one frame is worse than a farmer
 * waiting a beat for theirs.
 *
 * V1.0 has ONE farm per farmer. `farm_members` is many-to-many and the schema
 * keeps it that way, but there is deliberately no multi-farm switcher UI
 * (Step 2 §1), so this reads the first membership and stops.
 */

export type FarmerMembership = {
  /** The farm_members row. Null when this profile is a pure consumer. */
  member: Pick<FarmMember, 'id' | 'farm_id' | 'role'> | null;
  /** The farm's name, once it has loaded. Never invented — null until read. */
  farmName: string | null;
};

export type FarmerMembershipState = FarmerMembership & {
  /** The gate. True only for a profile with a real farm_members row. */
  isFarmer: boolean;
  /** True until the gate has an answer. Treat as "not a farmer" while true. */
  loading: boolean;
  reload: () => Promise<void>;
};

const NOT_A_FARMER: FarmerMembership = { member: null, farmName: null };

export function useFarmerMembership(profileId: string | undefined): FarmerMembershipState {
  const [membership, setMembership] = useState<FarmerMembership>(NOT_A_FARMER);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profileId) {
      setMembership(NOT_A_FARMER);
      setLoading(false);
      return;
    }

    // Preview mode answers from a fixture — see previewFarmMembership for how
    // to review the consumer (non-farmer) side instead.
    if (isPreviewMode) {
      setMembership(previewFarmMembership);
      setLoading(false);
      return;
    }

    // No backend configured: nobody is a farmer. Guessing "yes" here would put
    // management UI in front of a user the database never approved.
    if (!isSupabaseConfigured) {
      setMembership(NOT_A_FARMER);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('farm_members')
      .select('id, farm_id, role')
      .eq('profile_id', profileId)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      // A failed read is NOT a farmer. The gate fails closed on purpose.
      if (error) console.warn('[farmer] could not read farm_members:', error.message);
      setMembership(NOT_A_FARMER);
      setLoading(false);
      return;
    }

    // The name comes from a second read rather than an embedded join: the
    // shared `ReadOnly<>` table helper in lib/supabase/types.ts declares an
    // empty `Relationships`, so `farms(name)` would type as an error object.
    // The gate is already answered by this point, so the name arriving a beat
    // later costs nothing.
    const { data: farm } = await supabase
      .from('farms')
      .select('name')
      .eq('id', data.farm_id)
      .maybeSingle();

    setMembership({ member: data, farmName: farm?.name ?? null });
    setLoading(false);
  }, [profileId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    ...membership,
    isFarmer: membership.member !== null,
    loading,
    reload: load,
  };
}
