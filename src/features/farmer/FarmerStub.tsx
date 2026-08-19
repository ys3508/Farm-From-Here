import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandButton, BrandText, brandColors, brandRadius, brandSpacing } from '@/design/brand';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * A NAVIGABLE PLACEHOLDER for a screen the Step-2 farmer portal will build.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Spec: revise/2026-08-19-farmer-world-and-tabs.md — "If those screens already
 * exist in the repo, wire to them. If they don't yet, create navigable
 * placeholders and say so." They did not exist. These are the placeholders.
 *
 * DELIBERATELY DIFFERENT FROM ComingSoon. A locked consumer tab is narrative:
 * "Farm" is *meant* to say "not yet" and stay calm about it (CLAUDE.md
 * invariant 8). This is not that. This is an unbuilt screen shown only to a
 * farmer, and it says so plainly and names the spec that will build it, so the
 * first real farmer is never left tapping something that quietly does nothing.
 *
 * Every one of these dies the moment its Step-2 screen lands.
 */

export type FarmerStubProps = {
  /** What this screen will be, e.g. "Create a plot". */
  title: string;
  /** One line on what it is FOR — the farmer should learn something here. */
  line: string;
  /** The section of the Step-2 spec that specifies it, e.g. "§3". */
  specSection: string;
};

export function FarmerStub({ title, line, specSection }: FarmerStubProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.root, { paddingTop: insets.top + brandSpacing.xxl }]}>
      <View style={styles.body}>
        <BrandText variant="caption" weight="semibold" tone="inkSoft" style={styles.kicker}>
          FARMER WORLD
        </BrandText>
        <BrandText variant="title" family="display" tone="ink">
          {title}
        </BrandText>
        <BrandText variant="body" tone="inkSoft">
          {line}
        </BrandText>

        <View style={styles.note}>
          <BrandText variant="small" weight="semibold" tone="primaryDeep">
            Not built yet
          </BrandText>
          <BrandText variant="caption" tone="inkSoft">
            This screen is specified in revise/skills/2026-08-17-step2-farmer-portal.md{' '}
            {specSection}. The Farmer World shell routes here so the navigation is real; the
            screen itself arrives with Step 2.
          </BrandText>
        </View>

        {router.canGoBack() ? (
          <BrandButton label="Back" variant="quiet" onPress={() => router.back()} />
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
  body: { flex: 1, justifyContent: 'center', gap: brandSpacing.sm },
  kicker: { letterSpacing: 1.6 },
  note: {
    gap: brandSpacing.xxs,
    marginTop: brandSpacing.lg,
    marginBottom: brandSpacing.lg,
    padding: brandSpacing.lg,
    borderRadius: brandRadius.md,
    backgroundColor: brandColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: brandColors.line,
  },
});
