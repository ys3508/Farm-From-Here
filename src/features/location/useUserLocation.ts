import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

import type { Coords } from './distance';

type State = {
  coords: Coords | null;
  status: 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';
  request: () => Promise<void>;
};

/**
 * The user's current position, held in memory only.
 *
 * NEVER persisted — not to the profiles table, not to AsyncStorage. The schema
 * deliberately has no user lat/lng column. Coarse accuracy is plenty: the map is
 * stylised, and all we need is "3.2 km away".
 */
export function useUserLocation(): State {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<State['status']>('idle');

  const request = useCallback(async () => {
    setStatus('requesting');
    try {
      const { status: permission } = await Location.requestForegroundPermissionsAsync();
      if (permission !== 'granted') {
        setStatus('denied');
        return;
      }
      const position = await Location.getLastKnownPositionAsync({})
        .then((last) => last ?? Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));

      setCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setStatus('granted');
    } catch {
      // Simulators without a location fixture, airplane mode, etc. Distances
      // simply do not render; nothing else in the app depends on this.
      setStatus('unavailable');
    }
  }, []);

  useEffect(() => {
    void request();
  }, [request]);

  return { coords, status, request };
}
