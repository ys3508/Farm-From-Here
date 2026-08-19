import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { FARMER_WORLD_PLATE } from '@/config/farmerWorld';
import { BrandText, brandColors, brandRadius, brandSpacing } from '@/design/brand';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * FARMER WORLD — the upper panel of the canvas, and the My Farm home.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Spec: revise/2026-08-19-farmer-world-and-tabs.md
 *
 * Tab slot 1 in Farmer World is "My Farm", and this is it: the farmer's
 * home/dashboard, standing on the sky plate directly above My World. The
 * management actions — create plot, add adoptable, edit farm profile — live
 * HERE rather than in the tab bar, which is reserved for the two things a
 * farmer does constantly: look at their farm, and post.
 *
 * ⚠️ PLACEHOLDER DEPTH. The Step-2 farmer portal
 * (revise/skills/2026-08-17-step2-farmer-portal.md) had NOT been built when
 * this shipped — there is no plot list, no adoptable creation and no update
 * flow in the repo yet. This panel is therefore the real world-switching shell
 * with navigable stubs behind each action. It deliberately shows NO invented
 * numbers: an un-wired count renders as a dash and says so, because a fake
 * "3 people are waiting for your photos" would be a lie told to a real farmer.
 *
 * ART: assets/my_world/farmer-world-background.png — pale sky, cumulus, one
 * sapling rising through the cloud. Its bottom edge meets the top edge of the
 * My World plate at the seam; matching the two is the owner's job, not this
 * component's.
 */

/** Management actions. Each routes to a placeholder until Step 2 lands. */
const ACTIONS: { label: string; hint: string; route: string }[] = [
  {
    label: 'Create a plot',
    hint: 'The unit you post updates about',
    route: '/(app)/plot-new',
  },
  {
    label: 'Add something to adopt',
    hint: 'A tree, a crop, an animal',
    route: '/(app)/adoptable-new',
  },
  {
    label: 'Edit farm profile',
    hint: 'Description, photos, contact',
    route: '/(app)/farm-profile',
  },
];

export type FarmerWorldPanelProps = {
  /** Exactly one panel height — the canvas stacks two of these. */
  height: number;
  /** The real farm's name. Null until it loads; never substituted. */
  farmName: string | null;
  /** Top safe-area inset, so the card clears the status bar and the toggle. */
  topInset: number;
};

export function FarmerWorldPanel({ height, farmName, topInset }: FarmerWorldPanelProps) {
  const router = useRouter();

  return (
    <View style={[styles.root, { height }]}>
      <Image
        source={FARMER_WORLD_PLATE.source}
        // `cover`, for the same reason as the My World plate: the art is far
        // taller than a phone, so `contain` would letterbox the sky.
        resizeMode="cover"
        style={styles.plate}
        accessibilityIgnoresInvertColors
      />

      <View style={[styles.body, { paddingTop: topInset + brandSpacing.xxxl }]}>
        <View style={styles.card}>
          <BrandText textRole="kicker" tone="inkSoft" style={styles.kicker}>
            YOUR FARM
          </BrandText>
          <BrandText textRole="title" tone="ink">
            {farmName ?? 'Your farm'}
          </BrandText>

          {/* The waiting count is the heartbeat of this screen — and it is not
              wired yet. It shows as a dash rather than a plausible number. */}
          <View style={styles.waiting}>
            <BrandText textRole="lead" tone="ink">
              — people are waiting for your photos
            </BrandText>
            <BrandText textRole="hint" tone="inkSoft">
              The count and the plot list arrive with the Step-2 farmer portal.
            </BrandText>
          </View>

          <View style={styles.actions}>
            {ACTIONS.map((action) => (
              <Pressable
                key={action.route}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                accessibilityHint={action.hint}
                onPress={() => router.push(action.route)}
                style={({ pressed }) => [styles.action, pressed && styles.pressed]}
              >
                <View style={styles.actionCopy}>
                  <BrandText textRole="detail" weight="semibold" tone="primaryDeep">
                    {action.label}
                  </BrandText>
                  <BrandText textRole="hint" tone="inkSoft">
                    {action.hint}
                  </BrandText>
                </View>
                <BrandText textRole="detail" tone="inkSoft">
                  ›
                </BrandText>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: '100%', overflow: 'hidden', backgroundColor: brandColors.bg },
  plate: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  body: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: brandSpacing.lg,
    paddingBottom: brandSpacing.xl,
  },
  card: {
    gap: brandSpacing.sm,
    padding: brandSpacing.lg,
    borderRadius: brandRadius.lg,
    // The same warm ivory as the economy pill and the toggle — the sky has to
    // read faintly through it rather than being covered by a dashboard.
    backgroundColor: 'rgba(247, 244, 236, 0.90)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  kicker: { letterSpacing: 1.6 },
  waiting: { gap: brandSpacing.xxs, paddingBottom: brandSpacing.xs },
  actions: { gap: brandSpacing.xs },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: brandSpacing.md,
    paddingVertical: brandSpacing.sm,
    paddingHorizontal: brandSpacing.md,
    borderRadius: brandRadius.md,
    backgroundColor: brandColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: brandColors.line,
  },
  actionCopy: { gap: brandSpacing.xxs },
  pressed: { opacity: 0.7 },
});
