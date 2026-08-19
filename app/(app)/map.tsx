import { useMemo } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { Button, Card, IllustrationSlot, Logo, Text, colors, radius, spacing } from '@/design';
import { formatDistance, googleMapsUrl } from '@/features/location/distance';
import { useUserLocation } from '@/features/location/useUserLocation';
import { useFarms } from '@/features/farms/useFarms';
import type { Farm } from '@/lib/supabase/types';

/**
 * THE STYLISED MAP — a world view, not a GPS rendering.
 *
 * Farm pins are laid out for legibility, NOT projected from latitude/longitude:
 * V1.0 is a hand-drawn food map, not a navigation product. The real coordinates
 * are still used for the two things that must be true:
 *   1. the distance text ("3.2 km away"), computed live and never stored;
 *   2. "Open in Google Maps", which navigates to the real place.
 *
 * Only real, contracted farms appear (demo fixtures are filtered in useFarms).
 */
export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { farms, loading, error, demoVisible } = useFarms();
  const { coords, status, request } = useUserLocation();

  // Stable, pleasing pin placement derived from the farm's index — deliberately
  // not a projection. Swapping in a real projection later touches only this.
  const pins = useMemo(
    () =>
      farms.slice(0, 6).map((farm, i) => ({
        farm,
        x: 52 + ((i * 97) % 210),
        y: 60 + ((i * 61) % 150),
      })),
    [farms],
  );

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: spacing.xxxl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Logo size="sm" />

      <View style={styles.headings}>
        <Text variant="title" display>
          Your food map
        </Text>
        <Text variant="body" tone="secondary">
          Every farm here is a real, contracted farm with a real farmer.
        </Text>
      </View>

      {/* ── The map surface ─────────────────────────────────────────────────── */}
      <View style={styles.mapFrame}>
        <Svg width="100%" height={280} viewBox="0 0 320 280">
          {/* paper ground */}
          <Rect x="0" y="0" width="320" height="280" rx="18" fill={colors.paperDeep} />

          {/* fields — the stylised patchwork a farmers-market map is made of */}
          <G opacity={0.55}>
            <Ellipse cx="70" cy="70" rx="58" ry="40" fill={colors.leafLight} />
            <Ellipse cx="235" cy="105" rx="66" ry="44" fill="#D9E3B8" />
            <Ellipse cx="120" cy="205" rx="72" ry="46" fill="#E3D6AE" />
            <Ellipse cx="255" cy="225" rx="50" ry="34" fill={colors.leafLight} />
          </G>

          {/* winding lane */}
          <Path
            d="M-10 235 C 60 215, 90 165, 150 155 S 250 120, 335 60"
            stroke={colors.soil}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            opacity={0.5}
          />
          <Path
            d="M-10 235 C 60 215, 90 165, 150 155 S 250 120, 335 60"
            stroke={colors.paper}
            strokeWidth="2"
            strokeDasharray="7 9"
            fill="none"
          />

          {/* a few drawn trees for texture */}
          {[
            [40, 150],
            [285, 165],
            [190, 60],
            [95, 115],
          ].map(([cx, cy], i) => (
            <G key={i} opacity={0.85}>
              <Path d={`M${cx} ${cy + 12} V${cy + 2}`} stroke={colors.soil} strokeWidth="3" strokeLinecap="round" />
              <Circle cx={cx} cy={cy - 5} r="9" fill={colors.leaf} stroke={colors.leafDeep} strokeWidth="1.5" />
            </G>
          ))}

          {/* real farm pins */}
          {pins.map(({ farm, x, y }) => (
            <G key={farm.id}>
              <Path
                d={`M${x} ${y + 16} L${x - 9} ${y} A9 9 0 1 1 ${x + 9} ${y} Z`}
                fill={colors.tomato}
                stroke="#8E2F1F"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <Circle cx={x} cy={y - 2} r="3.4" fill={colors.paper} />
            </G>
          ))}
        </Svg>

        <View style={styles.mapNote}>
          <Text variant="caption" tone="muted">
            Stylised view — pins are placed for legibility, not by GPS.
          </Text>
        </View>
      </View>

      <IllustrationSlot
        brief="The real map art: a hand-painted bird's-eye food map of the user's neighbourhood — orchard rows, market stalls, hand-lettered lane names — replacing the geometry above."
        assetName="world-map-base.png"
        glyph="🗺️"
        height={120}
      />

      {/* ── Location ────────────────────────────────────────────────────────── */}
      {status !== 'granted' ? (
        <Card>
          <Text variant="subheading" display>
            How far is it, really?
          </Text>
          <Text variant="small" tone="secondary" style={styles.gapSm}>
            {status === 'denied'
              ? 'Location is off, so distances are hidden. Turn it on in Settings to see how far each farm is.'
              : 'Share your location and each farm shows its real distance. We never store where you are.'}
          </Text>
          {status !== 'denied' ? (
            <View style={styles.gap}>
              <Button label="Show distances" variant="secondary" onPress={() => void request()} />
            </View>
          ) : null}
        </Card>
      ) : null}

      {/* ── The real farms ──────────────────────────────────────────────────── */}
      {loading ? (
        <Text variant="small" tone="muted">
          Loading farms…
        </Text>
      ) : error ? (
        <Card>
          <Text variant="subheading" display>
            Could not load farms
          </Text>
          <Text variant="small" tone="secondary" style={styles.gapSm}>
            {error}
          </Text>
        </Card>
      ) : farms.length === 0 ? (
        <Card>
          <Text variant="subheading" display>
            The first farm is being signed
          </Text>
          <Text variant="small" tone="secondary" style={styles.gapSm}>
            This map only ever shows real farms under contract. Nothing is invented to fill it out
            — when a farmer signs, they appear here.
          </Text>
        </Card>
      ) : (
        farms.map((farm) => <FarmCard key={farm.id} farm={farm} userCoords={coords} />)
      )}

      {demoVisible ? (
        <Card locked>
          <Text variant="caption" weight="bold" tone="muted">
            DEMO DATA IS VISIBLE
          </Text>
          <Text variant="caption" tone="muted" style={styles.gapSm}>
            EXPO_PUBLIC_SHOW_DEMO_DATA is true, so development fixtures are listed above. Turn it
            off before showing this to anyone.
          </Text>
        </Card>
      ) : null}
    </ScrollView>
  );
}

function FarmCard({ farm, userCoords }: { farm: Farm; userCoords: { latitude: number; longitude: number } | null }) {
  /* A farm may have NO PIN. Since Step 2A a grower can publish at city
   * precision — a backyard is not required to give a street address — so
   * coordinates are nullable and this card must degrade rather than assume.
   * Spec: revise/2026-08-19-step2a-farmer-application.md, "coarse location". */
  const farmCoords =
    farm.latitude !== null && farm.longitude !== null
      ? { latitude: farm.latitude, longitude: farm.longitude }
      : null;

  const distance = farmCoords ? formatDistance(userCoords, farmCoords) : null;

  return (
    <Card>
      <View style={styles.farmHead}>
        <Text variant="heading" display style={styles.farmName}>
          {farm.name}
        </Text>
        {farm.is_demo ? (
          <View style={styles.demoTag}>
            <Text variant="caption" weight="bold" tone="danger">
              DEMO
            </Text>
          </View>
        ) : null}
      </View>

      {distance ? (
        <Text variant="small" weight="bold" tone="seeds">
          {distance}
        </Text>
      ) : (
        <Text variant="small" tone="muted">
          {farmCoords ? 'Distance hidden — location off' : farm.address ?? 'Location not published'}
        </Text>
      )}

      {farm.description ? (
        <Text variant="small" tone="secondary" style={styles.gapSm} numberOfLines={3}>
          {farm.description}
        </Text>
      ) : null}

      {/* No pin, no map link. Sending someone to a map of nothing is worse
          than not offering the button. */}
      {farmCoords ? (
        <View style={styles.gap}>
          <Button
            label="Open in Google Maps"
            variant="secondary"
            onPress={() => void Linking.openURL(googleMapsUrl(farmCoords))}
          />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  headings: { gap: spacing.xs },
  mapFrame: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    overflow: 'hidden',
    backgroundColor: colors.paperDeep,
  },
  mapNote: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    backgroundColor: colors.bgRaised,
  },
  farmHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  farmName: { flexShrink: 1 },
  demoTag: {
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.danger,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
  },
  gap: { marginTop: spacing.md },
  gapSm: { marginTop: spacing.xs },
});
