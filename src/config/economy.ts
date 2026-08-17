/**
 * ════════════════════════════════════════════════════════════════════════════
 * THE ECONOMY CONFIG — every tunable number in the product lives here.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * THREE QUANTITIES. NEVER MIXED. (CLAUDE.md invariant 1)
 *
 *   ✨ GROWTH  progression. Only ever rises. Never spent in V1.0. Source of truth
 *              is `growth_ledger`; `profiles.growth_xp` is a cache. Say "Growth",
 *              never "XP", in anything a user reads.
 *
 *   🌱 SEEDS   spendable currency. CANNOT BE BOUGHT WITH MONEY, EVER. Earned only
 *              by real-world good. Source of truth is `seeds_ledger`;
 *              `profiles.seeds_balance` is a cache.
 *
 *   💚 IMPACT  the real-world RESULT (a tree supported, lbs of produce, volunteer
 *              hours). NOT a currency, never derived from or displayed as Seeds.
 *              Reserved in `impact_events`; no logic in V1.0.
 */

/* ────────────────────────────────────────────────────────────────────────────
 * ⚠️  PENDING OWNER DECISION — PLACEHOLDER VALUES ⚠️
 *
 * Sissi chose "leave as flagged placeholders" for the grants and adoption costs
 * on 2026-08-17. The numbers below are STAND-INS so the app runs end-to-end.
 * They are not product decisions and must be confirmed before Step 3 activates
 * Seeds spending.
 *
 * These same numbers are duplicated ONCE more, in
 * supabase/migrations/20260817000300_signup_and_economy.sql (function
 * `public.handle_new_user`), because signup grants are written server-side by a
 * trigger and Postgres cannot read this file. IF YOU CHANGE ONE, CHANGE BOTH.
 * `PENDING_OWNER_DECISIONS` below is asserted against by that migration's
 * comment block so the pair stays findable.
 * ──────────────────────────────────────────────────────────────────────────── */

/** ⚠️ PLACEHOLDER — Growth granted on completing signup. */
export const SIGNUP_GROWTH_GRANT = 100;

/** ⚠️ PLACEHOLDER — Seeds granted on completing signup. */
export const SIGNUP_SEEDS_BONUS = 500;

/** ⚠️ PLACEHOLDER — Seeds cost to adopt, by adoptable type. Spending is NOT
 *  activated in V1.0 Step 1; these drive display only until Step 3. */
export const ADOPTION_COST_SEEDS = {
  tree: 500,
  crop: 750,
  animal: 1000,
} as const;

/* ────────────────────────────────────────────────────────────────────────────
 * DECIDED — confirmed by the owner. Not placeholders.
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Referral reward: 500 Seeds to the referrer AND 500 to the referred, granted
 * only AFTER the new user completes signup. Entering a code alone rewards
 * nothing. Both sides must go through `seeds_ledger` — never mutate a balance
 * directly (CLAUDE.md invariant 2). Spec-confirmed value.
 */
export const REFERRAL_REWARD_SEEDS = 500;

/**
 * Healthy-lifestyle movement earning, decided 2026-08-17:
 * a 5,000-step day pays 25 Seeds + 25 Growth, claimable once per calendar day.
 *
 * NOT WIRED IN STEP 1. The ledger path exists and the values are final, but no
 * step source is connected — there is no pedometer integration and no anti-cheat
 * yet (the spec explicitly defers anti-cheat). Step 1 activates exactly two earn
 * sources: `signup_bonus` and `referral`.
 */
export const DAILY_MOVEMENT_REWARD = {
  stepThreshold: 5_000,
  seeds: 25,
  growth: 25,
  /** Once per calendar day, in the user's local timezone. */
  cadence: 'once_daily',
} as const;

/* ────────────────────────────────────────────────────────────────────────────
 * LEDGER SOURCES — the `source` column vocabulary. Kept in sync with the CHECK
 * constraints in the migration. Adding one here means adding it there too.
 * ──────────────────────────────────────────────────────────────────────────── */

export const GROWTH_SOURCES = [
  'signup', // ✅ active in V1.0
  'daily_movement', // reserved — values decided, not wired
  'quest_completion', // reserved
  'adoption', // reserved
  'farm_visit', // reserved
  'admin_adjustment', // manual correction
] as const;
export type GrowthSource = (typeof GROWTH_SOURCES)[number];

export const SEEDS_SOURCES = [
  'signup_bonus', // ✅ active in V1.0
  'referral', // ✅ active in V1.0
  'daily_movement', // reserved — values decided, not wired
  'quest_completion', // reserved
  'adoption', // reserved (spend) — activates in Step 3
  'redemption', // reserved (spend) — V2 rewards catalog
  'admin_adjustment', // manual correction
] as const;
export type SeedsSource = (typeof SEEDS_SOURCES)[number];

/* ────────────────────────────────────────────────────────────────────────────
 * DOMAIN ENUMS — owner-decided 2026-08-17. These mirror the DB CHECK constraints
 * exactly; changing one requires a migration.
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * `adoptables.status` — owner-specified values, implemented verbatim.
 *
 * ⚑ NOTE FOR THE OWNER: this set mixes two different axes — availability
 * (available / adopted / inactive) and health-or-life-stage (growing / thriving).
 * A single column can only hold one at a time, so an adopted tree that is
 * thriving must be recorded as one or the other. If both need to be true at
 * once, that is a second column (e.g. `health`) and a small migration. Flagged,
 * not silently redesigned.
 */
export const ADOPTABLE_STATUSES = [
  'available',
  'adopted',
  'growing',
  'thriving',
  'inactive',
] as const;
export type AdoptableStatus = (typeof ADOPTABLE_STATUSES)[number];

/** `adoptables.type` — one funnel for all three (CLAUDE.md invariant 4). */
export const ADOPTABLE_TYPES = ['tree', 'crop', 'animal'] as const;
export type AdoptableType = (typeof ADOPTABLE_TYPES)[number];

/** `adoptions.type` — owner-decided. Same table, same funnel; do NOT split. */
export const ADOPTION_TYPES = ['adoption', 'donation'] as const;
export type AdoptionType = (typeof ADOPTION_TYPES)[number];

/**
 * `adoptions.status` — owner-decided.
 *   pending = clicked adopt, not yet confirmed
 *   active  = live relationship; ONLY these receive the plot-update fan-out
 *   ended   = relationship over (cancelled, season finished, adoptable retired)
 */
export const ADOPTION_STATUSES = ['pending', 'active', 'ended'] as const;
export type AdoptionStatus = (typeof ADOPTION_STATUSES)[number];

/* ──────────────────────────────────────────────────────────────────────────── */

/**
 * Machine-readable list of what is still guessed. Rendered in the app's dev
 * banner and printed by `scripts/check-pending.mjs` so a placeholder cannot
 * quietly ship as if it were a decision.
 */
export const PENDING_OWNER_DECISIONS = [
  'SIGNUP_GROWTH_GRANT',
  'SIGNUP_SEEDS_BONUS',
  'ADOPTION_COST_SEEDS.tree / .crop / .animal',
] as const;
