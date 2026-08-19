/**
 * ════════════════════════════════════════════════════════════════════════════
 * FARMER WORLD CONFIG — every tunable number and every swappable string.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Spec: revise/2026-08-19-farmer-world-and-tabs.md
 *
 * Same house rule as myWorld.ts: nothing in src/features/farmer/ may inline a
 * magic number or a piece of user-facing copy. If it could be argued about, it
 * lives here with a sentence saying why it is what it is.
 */

/* ────────────────────────────────────────────────────────────────────────────
 * THE TWO WORLDS
 *
 * My World and Farmer World are two panels on ONE continuous vertical canvas,
 * not two routes. Farmer World is the panel ABOVE; My World is the panel below
 * and is always home. `activeWorld` is the single source of truth: the pan
 * position and the left half of the tab bar are both derived from it, so the
 * two can never disagree.
 * ──────────────────────────────────────────────────────────────────────────── */

export type WorldMode = 'my-world' | 'farmer-world';

/** Home. A session always starts here, farmer or not. */
export const DEFAULT_WORLD: WorldMode = 'my-world';

/* ────────────────────────────────────────────────────────────────────────────
 * THE ART
 *
 * The bottom edge of the Farmer World plate meets the top edge of the My World
 * plate at the seam. ART ALIGNMENT IS THE OWNER'S JOB — this code only stacks
 * the two panels; it does not try to match or blend the images.
 *
 * assets/my_world/farmer-world-composite-preview.png is the two plates already
 * stacked, supplied as a reference for how the pan reads. It is NOT rendered:
 * stacking the two separate plates gives the same picture and keeps each plate
 * replaceable on its own.
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Intrinsic pixel size, stated rather than measured — the same convention as
 * WORLD_PLATE in features/world/WorldBackground.tsx, and for the same reason
 * (Image.resolveAssetSource does not exist on react-native-web).
 *
 * ⚠️ REPLACING THE PLATE MEANS UPDATING THESE NUMBERS.
 */
export const FARMER_WORLD_PLATE = {
  source: require('../../assets/my_world/farmer-world-background.png'),
  width: 853,
  height: 1844,
} as const;

/* ────────────────────────────────────────────────────────────────────────────
 * THE PAN
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * WHICH WAY THE FINGER GOES. Owner's call, 2026-08-19.
 *
 * The spec says both "the user pans up from My World into Farmer World" (a
 * camera panning up = the canvas following the finger DOWN) and "swiping up"
 * is the same action as tapping the right toggle. Those two are physically
 * opposite, so the owner picked: SWIPE UP GOES UP — swipe in the direction of
 * travel, like flicking through a deck, rather than dragging the canvas.
 *
 * Flip this one flag to get the map-style reading instead; nothing else in the
 * codebase encodes the direction.
 */
export const SWIPE_UP_ENTERS_FARMER_WORLD = true;

/**
 * How far a drag must travel, as a fraction of one panel's height, before the
 * world it is heading for becomes the active one and the toggle snaps.
 *
 * Half would make the switch feel like it only happens if you drag the whole
 * way; a third lets a decisive drag commit early and still lets a hesitant one
 * fall back.
 */
export const SEAM_CROSS_FRACTION = 0.34;

/**
 * Points/ms of vertical flick that commits the switch regardless of distance.
 * A quick flick is a clear intention even when the finger barely moved.
 */
export const SWIPE_FLICK_VELOCITY = 0.55;

/**
 * Vertical movement, in points, before the canvas claims the gesture.
 *
 * This is what keeps taps on the dunes — a life, the starter box, an onboarding
 * button — working: below this the touch belongs to whatever is under it.
 */
export const PAN_CAPTURE_SLOP = 14;

/** Spring used to settle the canvas after a drag or a toggle tap. */
export const WORLD_SETTLE_SPRING = {
  /** Low tension + high friction: this world is calm; nothing here bounces. */
  tension: 46,
  friction: 11,
} as const;

/* ────────────────────────────────────────────────────────────────────────────
 * COPY — all of it swappable, none of it inlined at a call site
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * The two sides of the top toggle, for a profile that IS a farmer.
 *
 * ⚠️ RENAMED 2026-08-19 (revise/2026-08-19-homestead-ui-polish.md §2):
 * "My World / Farmer World" → **"Homestead / Grow"**. Both sides are the SAME
 * PERSON, and calling the right side "Farmer" quietly excluded the backyard and
 * community growers who are the top of the funnel. Homestead and Grow are both
 * "mine". Do not revert this to "Farmer World".
 *
 * The internal WorldMode keys stay 'my-world' / 'farmer-world' on purpose — the
 * rename is about visible copy, and renaming the keys would churn every file
 * that reasons about the two worlds for no user-visible gain.
 */
export const WORLD_TOGGLE_LABELS: Record<WorldMode, string> = {
  'my-world': 'Homestead',
  'farmer-world': 'Grow',
};

/**
 * THE APPLICATION ENTRY — placeholder copy the owner will finalise.
 *
 * ⚠️ PLACEHOLDER (spec: "final tagline copy is the owner's to finalise"). One
 * constant, read from every place that shows it, so replacing it is one edit.
 *
 * Note what it deliberately does NOT say: "farm" is never the only word.
 * Backyard growers and individuals belong on the map too — that is the whole
 * top of the funnel (Step 2, `individual` / "Community grower" tier).
 */
export const FARMER_APPLICATION_COPY = {
  title: 'Grow something real?',
  subtitle: 'A farm, an orchard, or your backyard — bring it to the map.',
  button: 'Bring it here',
  /**
   * The right-hand toggle label a NON-farmer sees. It has to be short enough
   * for a pill and must not name a Farmer World they do not have — it is an
   * invitation, not a locked door.
   */
  toggle: 'Bring yours',
} as const;
