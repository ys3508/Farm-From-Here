import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  PAN_CAPTURE_SLOP,
  SEAM_CROSS_FRACTION,
  SWIPE_FLICK_VELOCITY,
  SWIPE_UP_ENTERS_FARMER_WORLD,
  WORLD_SETTLE_SPRING,
  type WorldMode,
} from '@/config/farmerWorld';
import { TAB_BAR_HEIGHT } from '@/config/myWorld';
import { brandSpacing } from '@/design/brand';
import { FarmerWorldPanel, WorldToggle, useWorldMode } from '@/features/farmer';
import { MyWorldPanel } from '@/features/world';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * THE CANVAS — two worlds, one continuous vertical surface.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Spec: revise/2026-08-19-farmer-world-and-tabs.md
 *
 *   ┌──────────────────┐  ← Farmer World (only mounted for a farmer)
 *   │  sky, sapling    │
 *   ├──────────────────┤  ← the seam
 *   │  dunes, lives    │  ← My World, always home
 *   └──────────────────┘
 *   ▔▔▔▔ tab bar ▔▔▔▔▔▔   ← fixed; never moves with the pan
 *
 * `activeWorld` (WorldModeProvider) is the SINGLE SOURCE OF TRUTH. This screen
 * derives the pan position from it, and (app)/_layout.tsx derives the left half
 * of the tab bar from it. Nothing else stores "which world am I in", so the
 * toggle, the canvas and the tabs cannot disagree.
 *
 * Three doors, one setter: tapping the toggle, dragging past the seam, and the
 * provider's own guard all go through requestWorld().
 *
 * A PURE CONSUMER NEVER GETS THE SECOND PANEL. It is not rendered, not
 * measured, and the drag gesture is not installed — there is no Farmer World to
 * peek at, only the invitation on the right of the toggle.
 */
export default function WorldCanvasScreen() {
  const insets = useSafeAreaInsets();
  const { activeWorld, isFarmer, farmName, requestWorld } = useWorldMode();

  /* ── The canvas box ──────────────────────────────────────────────────────
   * One panel is exactly this tall, and My World projects its stored world
   * coordinates onto exactly this — so getting it wrong puts every life
   * somewhere it was not stored.
   *
   * It is SEEDED from the window rather than waiting for onLayout, because
   * onLayout is not guaranteed to fire when a view mounts at a size it never
   * changes from — on react-native-web it reliably does not, and the screen
   * renders an empty world forever while `lives` sits loaded in memory.
   *
   * The seed subtracts the tab bar (a shared constant) and the bottom inset, so
   * it already equals what onLayout will report. onLayout then refines it and
   * stays authoritative for rotation and any future inset change. */
  const windowSize = useWindowDimensions();
  const [measured, setMeasured] = useState<{ width: number; height: number } | null>(null);

  const viewport = measured ?? {
    width: windowSize.width,
    height: Math.max(0, windowSize.height - TAB_BAR_HEIGHT - insets.bottom),
  };

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) setMeasured({ width, height });
  }, []);

  const panelHeight = viewport.height;

  /** Where the canvas sits for a given world. My World is one panel down. */
  const offsetFor = useCallback(
    (world: WorldMode) => (world === 'farmer-world' ? 0 : -panelHeight),
    [panelHeight],
  );

  /* ── The pan ─────────────────────────────────────────────────────────────
   * `offset` is the canvas's translateY. It is never a second source of truth:
   * it always settles to offsetFor(activeWorld). `offsetRef` mirrors it so the
   * gesture can read the current position without querying an Animated value.
   *
   * JS-driven on purpose (useNativeDriver: false). The drag already runs on the
   * JS thread through PanResponder, and keeping the value readable in JS is
   * what lets a grab mid-settle pick up exactly where the animation was rather
   * than snapping. */
  const offset = useRef(new Animated.Value(0)).current;
  const offsetRef = useRef(0);
  const draggingRef = useRef(false);
  const settledRef = useRef(false);

  useEffect(() => {
    const id = offset.addListener(({ value }) => {
      offsetRef.current = value;
    });
    return () => offset.removeListener(id);
  }, [offset]);

  /** Settle to whatever world is active. The pan follows state, never leads it. */
  const settle = useCallback(
    (world: WorldMode) => {
      Animated.spring(offset, {
        toValue: offsetFor(world),
        ...WORLD_SETTLE_SPRING,
        useNativeDriver: false,
      }).start();
    },
    [offset, offsetFor],
  );

  useEffect(() => {
    if (panelHeight <= 0) return;
    // Mid-drag the finger owns the canvas; the toggle still snaps, but the
    // spring would fight the drag.
    if (draggingRef.current) return;

    // The very first placement — and any resize — is a jump, not an animation.
    // Springing here would play a slide from Farmer World down to My World
    // every time the screen mounts.
    if (!settledRef.current) {
      settledRef.current = true;
      offset.setValue(offsetFor(activeWorld));
      offsetRef.current = offsetFor(activeWorld);
      return;
    }
    settle(activeWorld);
  }, [activeWorld, panelHeight, offset, offsetFor, settle]);

  // A resize (rotation, a changed inset) moves the seam. Re-place without an
  // animation so the canvas cannot end up parked half-way between worlds.
  useEffect(() => {
    if (panelHeight <= 0 || draggingRef.current) return;
    offset.setValue(offsetFor(activeWorld));
    offsetRef.current = offsetFor(activeWorld);
    // Only when the geometry itself changes — activeWorld is handled above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelHeight]);

  /* ── The gesture ─────────────────────────────────────────────────────────
   * Installed ONLY for a farmer. It claims a touch after PAN_CAPTURE_SLOP of
   * mostly-vertical movement, which is what leaves taps on the dunes — a life,
   * the starter box, an onboarding button — working normally.
   *
   * Direction comes from ONE flag, SWIPE_UP_ENTERS_FARMER_WORLD (see the note
   * in config/farmerWorld.ts about the two readings of the spec). */
  const activeWorldRef = useRef(activeWorld);
  activeWorldRef.current = activeWorld;

  /** Canvas offset the finger started from, captured on grant. */
  const startRef = useRef(0);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          isFarmer &&
          panelHeight > 0 &&
          Math.abs(gesture.dy) > PAN_CAPTURE_SLOP &&
          Math.abs(gesture.dy) > Math.abs(gesture.dx),

        onPanResponderGrant: () => {
          draggingRef.current = true;
          offset.stopAnimation((value) => {
            offsetRef.current = value;
          });
          startRef.current = offsetRef.current;
        },

        onPanResponderMove: (_event, gesture) => {
          // Toward Farmer World is positive travel, whichever way the flag says
          // the finger goes.
          const travel = SWIPE_UP_ENTERS_FARMER_WORLD ? -gesture.dy : gesture.dy;
          const next = clamp(startRef.current + travel, -panelHeight, 0);
          offset.setValue(next);
          offsetRef.current = next;

          /* SNAP THE TOGGLE ON CROSSING. The spec's "when the user swipes past
           * the seam, snap the toggle to match" — the toggle is not a separate
           * control that catches up later, it renders activeWorld, so crossing
           * the threshold IS the switch. The tab bar swaps in the same frame. */
          const progress = (next + panelHeight) / panelHeight; // 0 = My World, 1 = Farmer
          if (activeWorldRef.current === 'my-world' && progress > SEAM_CROSS_FRACTION) {
            requestWorld('farmer-world');
          } else if (
            activeWorldRef.current === 'farmer-world' &&
            progress < 1 - SEAM_CROSS_FRACTION
          ) {
            requestWorld('my-world');
          }
        },

        onPanResponderRelease: (_event, gesture) => {
          draggingRef.current = false;

          // A quick flick is a clear intention even when the finger barely
          // moved, so it overrides the distance threshold.
          const flick = SWIPE_UP_ENTERS_FARMER_WORLD ? -gesture.vy : gesture.vy;
          let target = activeWorldRef.current;
          if (flick > SWIPE_FLICK_VELOCITY) target = 'farmer-world';
          else if (flick < -SWIPE_FLICK_VELOCITY) target = 'my-world';

          if (target !== activeWorldRef.current) requestWorld(target);
          // Settle explicitly: when the target is already active, no state
          // changes and the effect above would never run.
          settle(target);
        },

        onPanResponderTerminate: () => {
          draggingRef.current = false;
          settle(activeWorldRef.current);
        },
      }),
    [isFarmer, panelHeight, offset, requestWorld, settle],
  );

  return (
    <View style={styles.root} onLayout={onLayout} {...(isFarmer ? panResponder.panHandlers : null)}>
      {isFarmer ? (
        <Animated.View
          style={[
            styles.canvas,
            { width: viewport.width, height: panelHeight * 2, transform: [{ translateY: offset }] },
          ]}
        >
          <FarmerWorldPanel
            height={panelHeight}
            farmName={farmName}
            topInset={insets.top}
          />
          <MyWorldPanel
            width={viewport.width}
            height={panelHeight}
            topInset={insets.top}
          />
        </Animated.View>
      ) : (
        // No second panel exists for a consumer — not hidden, not offscreen,
        // not mounted.
        <MyWorldPanel width={viewport.width} height={panelHeight} topInset={insets.top} />
      )}

      {/* Fixed above the canvas, in both worlds. The single visible statement
          of which world you are in. */}
      <View style={[styles.toggle, { top: insets.top + brandSpacing.sm }]}>
        <WorldToggle
          activeWorld={activeWorld}
          isFarmer={isFarmer}
          onRequestWorld={requestWorld}
        />
      </View>
    </View>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  canvas: { position: 'absolute', top: 0, left: 0 },
  toggle: { position: 'absolute', left: brandSpacing.lg },
});
