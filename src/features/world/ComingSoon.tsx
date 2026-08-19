import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { BrandText, brandColors, brandSpacing } from '@/design/brand';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * A DESIGNED "NOT YET" — for Quest, Farm and Community.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Locked modules are NARRATIVE, NOT BROKEN (CLAUDE.md invariant 8). The user
 * sees the whole world on day one and watches it unlock. So these tabs are:
 *
 *   ✓ visible, reachable, and calm
 *   ✗ never greyed out, never a crash, never a dead button
 *
 * One illustration and one hand-written line. Building their real content is
 * explicitly out of scope for this spec.
 */

export type ComingSoonProps = {
  /** Tab name, e.g. "Quest". */
  title: string;
  /** The tab's subtitle, e.g. "GROW SEEDS". */
  kicker: string;
  /** One hand-written line. Keep it short and unhurried. */
  line: string;
};

export function ComingSoon({ title, kicker, line }: ComingSoonProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + brandSpacing.xxl }]}>
      <View style={styles.body}>
        <QuietDune />

        <View style={styles.copy}>
          <BrandText textRole="kicker" tone="inkSoft" center style={styles.kicker}>
            {kicker}
          </BrandText>
          <BrandText textRole="title" tone="ink" center>
            {title}
          </BrandText>
          <BrandText textRole="whisper" tone="primary" center>
            {line}
          </BrandText>
        </View>
      </View>
    </View>
  );
}

/**
 * A small, quiet dune with one sprout — the same world, seen from further off.
 *
 * A CLEARLY-MARKED SLOT would be the alternative, but this screen needs to feel
 * finished rather than unbuilt: "coming soon" is deliberate storytelling here,
 * so a dashed placeholder box would say the wrong thing. It is simple line work
 * on purpose and is not pretending to be the final painting.
 */
function QuietDune() {
  return (
    <Svg width="100%" height={180} viewBox="0 0 300 180">
      <G opacity={0.9}>
        <Circle cx="228" cy="44" r="18" fill="#F3EEDF" />
        <Circle cx="248" cy="50" r="13" fill="#F3EEDF" />
        <Circle cx="210" cy="52" r="12" fill="#F3EEDF" />
      </G>

      <Ellipse cx="150" cy="168" rx="150" ry="46" fill="#F5EFE1" />
      <Ellipse cx="72" cy="176" rx="86" ry="34" fill="#EFE7D5" />
      <Ellipse cx="236" cy="178" rx="78" ry="30" fill="#EFE7D5" />

      <G transform="translate(150 148)">
        <Path d="M0 0 C -0.4 -12, -0.6 -20, 0 -30" stroke="#7B5E3B" strokeWidth="2.4"
          strokeLinecap="round" fill="none" />
        <Path d="M0 -18 C -9 -22, -13 -30, -11 -36 C -4 -35, -1 -27, 0 -20 Z" fill="#8FB463" />
        <Path d="M0 -25 C 8 -29, 12 -37, 10 -43 C 3 -42, 1 -33, 0 -26 Z" fill="#7FA455" />
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brandColors.bg,
    paddingHorizontal: brandSpacing.xl,
  },
  body: { flex: 1, justifyContent: 'center', gap: brandSpacing.xxl },
  copy: { alignItems: 'center', gap: brandSpacing.sm },
  kicker: { letterSpacing: 2 },
});
