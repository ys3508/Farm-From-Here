import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FARMER_APPLICATION_COPY } from '@/config/farmerWorld';
import { BrandButton, BrandText, brandColors, brandRadius, brandSpacing } from '@/design/brand';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * THE APPLICATION ENTRY — what the right toggle opens for a NON-farmer.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Spec: revise/2026-08-19-farmer-world-and-tabs.md
 *
 * A profile with no `farm_members` row has no Farmer World to pan into, so the
 * right side of the toggle is an invitation rather than a locked door. This is
 * the only farmer-adjacent thing a pure consumer ever sees.
 *
 * ⚠️ COPY IS A PLACEHOLDER the owner will finalise — it is read from
 * FARMER_APPLICATION_COPY in config/farmerWorld.ts and is not written out
 * anywhere else. Note what it refuses to say: "farm" is never the only word.
 * A backyard with three tomato plants belongs on this map as much as an
 * orchard does — that is the `individual` / "Community grower" tier and it is
 * the top of the funnel, not an afterthought.
 *
 * ⚠️ THE FORM ITSELF IS NOT BUILT. Tier selection, the address/places lookup,
 * photos, supporting documents and the approval trigger are all Step 2 §2.
 * Pressing the button says so rather than doing nothing.
 */
export default function FarmerApplicationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [reachedTheForm, setReachedTheForm] = useState(false);

  return (
    <View style={[styles.root, { paddingTop: insets.top + brandSpacing.xxl }]}>
      <View style={styles.body}>
        <BrandText textRole="title" tone="ink">
          {FARMER_APPLICATION_COPY.title}
        </BrandText>
        <BrandText textRole="body" tone="inkSoft">
          {FARMER_APPLICATION_COPY.subtitle}
        </BrandText>

        {reachedTheForm ? (
          <View style={styles.note}>
            <BrandText textRole="detail" weight="semibold" tone="primaryDeep">
              The application form is not built yet
            </BrandText>
            <BrandText textRole="hint" tone="inkSoft">
              It is specified in revise/skills/2026-08-17-step2-farmer-portal.md §2 — the
              community-grower / verified-farm choice, where you grow, photos, and the
              supporting material a working farm sends in. This round built the way in, not
              the form.
            </BrandText>
          </View>
        ) : (
          <BrandButton
            label={FARMER_APPLICATION_COPY.button}
            onPress={() => setReachedTheForm(true)}
            style={styles.cta}
          />
        )}

        {router.canGoBack() ? (
          <BrandButton label="Not now" variant="link" onPress={() => router.back()} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brandColors.bg,
    paddingHorizontal: brandSpacing.xl,
  },
  body: { flex: 1, justifyContent: 'center', gap: brandSpacing.md },
  cta: { marginTop: brandSpacing.lg },
  note: {
    gap: brandSpacing.xxs,
    marginTop: brandSpacing.lg,
    padding: brandSpacing.lg,
    borderRadius: brandRadius.md,
    backgroundColor: brandColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: brandColors.line,
  },
});
