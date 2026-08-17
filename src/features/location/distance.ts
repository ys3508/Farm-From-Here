/**
 * Distance to a real farm.
 *
 * The distance is COMPUTED, never stored (design.md / spec). The user moves; a
 * persisted distance would be wrong the moment they walked to the bus stop.
 */

export type Coords = { latitude: number; longitude: number };

const EARTH_RADIUS_KM = 6371;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in kilometres. */
export function distanceKm(a: Coords, b: Coords): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * "3.2 km away" — the exact form the spec asks for. Returns null when we have no
 * location, so callers render an honest empty state instead of a fake 0 km.
 */
export function formatDistance(from: Coords | null, to: Coords): string | null {
  if (!from) return null;
  const km = distanceKm(from, to);
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}

/**
 * Deep link into the device's maps app for real navigation to a real farm.
 * Apple Maps handles the geo:/maps: split poorly across platforms, so a Google
 * Maps universal link is used — it opens the native app when installed and the
 * web map otherwise, on both iOS and Android.
 */
export function googleMapsUrl(to: Coords): string {
  return `https://www.google.com/maps/search/?api=1&query=${to.latitude},${to.longitude}`;
}
