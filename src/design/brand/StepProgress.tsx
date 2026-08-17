import { StyleSheet, View } from 'react-native';

import { brandColors, brandRadius, brandSpacing } from './tokens';

export type StepProgressProps = {
  /** How many segments to draw. */
  total: number;
  /** 1-based index of the step the user is on. */
  current: number;
  /**
   * 1-based indices the user's path skips entirely — third-party sign-up never
   * sets a password, so step 2 does not apply to them. Skipped segments render
   * as done: the bar must never imply there is something still to go back for.
   */
  skipped?: number[];
  /** Announced to screen readers, e.g. "Step 2 of 3". */
  accessibilityLabel?: string;
};

/**
 * A hand-rolled three-pill progress bar. No third-party library — it is three
 * rounded rectangles and there is nothing a dependency would add.
 *
 * Filled = done, current, or skipped. Outlined = still ahead.
 */
export function StepProgress({
  total,
  current,
  skipped = [],
  accessibilityLabel,
}: StepProgressProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? `Step ${current} of ${total}`}
      accessibilityValue={{ min: 1, max: total, now: current }}
      style={styles.row}
    >
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const reached = step <= current || skipped.includes(step);
        return <View key={step} style={[styles.pill, reached ? styles.done : styles.todo]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: brandSpacing.sm, alignSelf: 'stretch' },
  pill: { flex: 1, height: 5, borderRadius: brandRadius.pill },
  done: { backgroundColor: brandColors.primary },
  todo: { backgroundColor: brandColors.line },
});
