import { env, isMapboxConfigured } from '@/lib/env';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * ADDRESS LOOKUP — one seam, one provider, one purpose.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Spec: revise/2026-08-19-step2a-farmer-application.md §2c
 *
 * ⚠️ THIS EXISTS TO HELP SOMEONE TYPE THEIR OWN ADDRESS. Nothing more.
 *
 * It must NEVER be used to pull farm data out of a third-party directory —
 * places APIs will happily return "farms near here", and putting any of that on
 * the map would break the product's founding rule that only real, contracted
 * farms appear (CLAUDE.md invariant 6). The query is always text the applicant
 * typed about their own place.
 *
 * OPTIONAL BY DESIGN. With no token configured, `suggest()` returns nothing and
 * the form falls back to typed city + state — which is a COMPLETE answer under
 * the coarse-location rule, not a degraded one. Nothing in the application flow
 * may require this to succeed.
 *
 * Provider: Mapbox (owner's pick, 2026-08-19). Swapping providers means
 * rewriting only this file, as long as it keeps returning AddressSuggestion.
 */

export type AddressSuggestion = {
  /** Stable id from the provider, for list keys. */
  id: string;
  /** What the applicant sees and what lands in `address`. */
  label: string;
  /** Present only when the provider resolved a real point. */
  latitude: number | null;
  longitude: number | null;
  /**
   * Whether this result is a street address or only a place/region.
   *
   * It maps straight onto `location_precision`, which is why the form never has
   * to ask "how precise is this?" — picking a city gives `city`, picking a
   * street address gives `exact`.
   */
  precision: 'city' | 'exact';
};

/** True when autocomplete can run at all. The form uses this to decide copy. */
export const addressLookupAvailable = isMapboxConfigured;

/** Mapbox place types that count as a street-level answer. */
const EXACT_TYPES = new Set(['address', 'poi']);

/**
 * Suggestions for a typed query. Returns [] on any failure — a lookup that is
 * down must never block an application.
 *
 * `signal` lets the caller drop a response for a query the user has already
 * typed past.
 */
export async function suggestAddresses(
  query: string,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (!addressLookupAvailable || trimmed.length < 3) return [];

  try {
    const url =
      'https://api.mapbox.com/geocoding/v5/mapbox.places/' +
      `${encodeURIComponent(trimmed)}.json` +
      `?access_token=${encodeURIComponent(env.mapboxToken)}` +
      // Places and regions as well as addresses: a city IS a valid answer here.
      '&types=address,place,locality,region,poi' +
      '&limit=5';

    const response = await fetch(url, { signal });
    if (!response.ok) return [];

    const body = (await response.json()) as {
      features?: {
        id?: string;
        place_name?: string;
        place_type?: string[];
        center?: [number, number];
      }[];
    };

    return (body.features ?? []).map((feature, index): AddressSuggestion => {
      const isExact = (feature.place_type ?? []).some((t) => EXACT_TYPES.has(t));
      return {
        id: feature.id ?? `suggestion-${index}`,
        label: feature.place_name ?? '',
        // Mapbox centres are [lng, lat] — the reverse of everything else here.
        longitude: feature.center?.[0] ?? null,
        latitude: feature.center?.[1] ?? null,
        precision: isExact ? ('exact' as const) : ('city' as const),
      };
    }).filter((s) => s.label.length > 0);
  } catch {
    // Aborted, offline, rate-limited — all the same answer: no suggestions.
    return [];
  }
}
