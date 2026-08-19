import { BOX_SIZE, FIRST_CREATURE_POSITION } from '@/config/myWorld';

import { StarterBox } from './StarterBox';
import { project, type Viewport } from './worldCoords';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * THE DAY-1 CREATURE SLOT — the mount point for the starter companion.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Spec: revise/2026-08-19-homestead-ui-polish.md §5
 *
 * ⚠️ THE CREATURE IS NOT BUILT HERE, AND MUST NOT BE. It is being designed in
 * its own round (revise/2026-08-19-creature-design.md and the prompt/art
 * explorations beside it). This component exists so that when the real starter
 * creature arrives, it drops into ONE known place and nobody has to re-derive
 * where the day-1 protagonist stands or re-do the layout around it.
 *
 * WHAT IT OWNS: the position and size of whoever occupies the day-1 spot. That
 * lives here rather than in the panel so there is exactly one answer to "where
 * does the first thing in an empty world stand".
 *
 * WHAT IT RENDERS TODAY: the existing cardboard box art, unchanged, as a
 * TEMPORARY STAND-IN. No new empty-state art was invented for this round — no
 * seeds, no plots, no "claim your land", no distant farm. The empty world is
 * deliberate and the creature is what fills it.
 *
 * ⚠️ The box currently reads as "you have nothing", which is the wrong story.
 * That is a known cost of the stand-in and is exactly what the creature fixes;
 * do not "improve" it with different placeholder art in the meantime.
 *
 * ── WHEN THE CREATURE LANDS ─────────────────────────────────────────────────
 * Swap `<StarterBox …/>` below for the creature component. Keep the props and
 * the anchor maths as they are: `onPress` is already wired to the first-life
 * grant and `highlighted` is already wired to the onboarding tour's pointing
 * step, so the creature inherits both behaviours for free.
 * ────────────────────────────────────────────────────────────────────────────
 */

export type Day1CreatureSlotProps = {
  /** The panel's drawable box. The anchor is projected onto exactly this. */
  viewport: Viewport;
  /** Runs the first-life grant. Safe to call twice — the grant is exactly-once. */
  onPress: () => void;
  /** True while the onboarding tour is pointing at this spot. */
  highlighted?: boolean;
};

export function Day1CreatureSlot({ viewport, onPress, highlighted = false }: Day1CreatureSlotProps) {
  /* The day-1 protagonist's world coordinate, projected to the screen. Slightly
   * left of centre and low on the dunes — dead centre reads as a UI element
   * rather than something that happens to be standing there. The creature will
   * inherit this exact spot, which is the point of the slot. */
  const size = viewport.width * BOX_SIZE;
  const anchor = project(FIRST_CREATURE_POSITION, viewport);

  return (
    <StarterBox
      left={anchor.x - size / 2}
      // Anchored by its FEET, not its box: whatever stands here should meet the
      // sand at the anchor point, so a taller creature grows upward from it.
      top={anchor.y - size}
      size={size}
      onPress={onPress}
      highlighted={highlighted}
    />
  );
}
