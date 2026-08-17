import { useCallback, useEffect, useState } from 'react';

import { isSupabaseConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase/client';
import type { Farm } from '@/lib/supabase/types';

/** Demo fixtures stay hidden unless this is explicitly turned on. */
const showDemo = process.env.EXPO_PUBLIC_SHOW_DEMO_DATA === 'true';

/**
 * Real, active, contracted farms — the only thing that may appear on the map.
 * Development fixtures (`is_demo`) are filtered out by default so a seeded row
 * can never be mistaken for a real place (CLAUDE.md invariant 6).
 */
export function useFarms() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    let query = supabase.from('farms').select('*').eq('is_active', true).order('name');
    if (!showDemo) query = query.eq('is_demo', false);

    const { data, error: queryError } = await query;
    if (queryError) setError(queryError.message);
    setFarms(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { farms, loading, error, reload: load, demoVisible: showDemo };
}
