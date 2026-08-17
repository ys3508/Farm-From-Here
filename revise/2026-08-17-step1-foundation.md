# FARM FROM HERE — Step 1: Foundation (Native App)

## Goal
Bootstrap the foundation for FARM FROM HERE — a location-based mobile game where users build
relationships with real farms, real trees/crops/animals, and real-world impact. This is a
**greenfield repo; nothing exists yet.** Step 1 delivers: a native mobile app skeleton, the
database schema, authentication, the two point economies, and a **designed, presentable
frontend** (not a bare backend). Everything later builds on this, so schema relationships must
be correct and extensible — without prematurely modeling systems that are not live in V1.0.

## Stack
- **React Native + Expo** — one codebase for **iOS + Android** (and web where trivial). This is
  a **native mobile app**, NOT a web/PWA. The product owner has a Mac and will preview on real
  devices via **Expo Go** and/or the iOS simulator — set the project up so `expo start` gives a
  working device preview.
- **Supabase** (Auth + Postgres + Storage) — backend, unchanged by the native form factor.
- **Resend** for email (return-to-app engine), wired at a basic level or stubbed with clear TODO.
- App-store submission (Apple $99/yr, Google $25) is a LATER, offline step — do NOT block Step 1
  on it. Step 1 must run in Expo Go on a real device.

---

## Two economies (core product model)

The product has TWO distinct, intentionally separate systems. Keep them separate everywhere.

### Growth (progression — NOT spendable)
- Growth is progression/participation. It only rises; spending Seeds never reduces Growth.
- Powers levels, quests, collection, and (future) feeding Companion Creatures.
- User-facing language says **"Growth"**, not "XP". DB field may be `growth_xp` where a numeric
  column is required. Source of truth = `growth_ledger`; `profiles.growth_xp` is a cached balance.

### Seeds (spendable currency)
- **CORE PRINCIPLE — pin this down:** Seeds **cannot be bought with money directly.** Seeds are
  only earned by **doing real-world good** (e.g. spending money that genuinely helps a farm,
  healthy-lifestyle actions). Money never converts straight to Seeds; money spent on the right
  real-world things can *reward* Seeds. Seeds = proof of real-world participation, not proof of wallet.
- **V1.0 actually-activated earning:** healthy-lifestyle user actions (walking / biking /
  movement-type actions), plus signup bonus and referral. Do NOT onboard any local merchants in
  V1.0. (Movement verification can be basic or left as a clear interface — do not fully solve
  anti-cheat now; ask the owner before inventing specific movement rules/values.)
- **V1.0 actually-activated spending:** adopting an adoptable (tree/crop/animal) costs Seeds.
- Source of truth = `seeds_ledger`; `profiles.seeds_balance` is a cached balance.
- Everything else (merchant rewards catalog, real-money donations, farm produce/experience/coupon
  redemption) is **reserved in schema but NOT activated** in V1.0 — build the tables/relationships,
  leave the logic for later.

---

## Database schema (Supabase migration)
UUID primary keys and `created_at` / `updated_at` on every applicable table.

### profiles (extends Supabase Auth)
- `id` -> `auth.users.id`
- `growth_xp` int (cached; truth = growth_ledger)
- `seeds_balance` int (cached; truth = seeds_ledger)
- `referral_code` unique
- Do **NOT** persist user's latitude/longitude here — user location is dynamic, fetched when
  needed. (Farm coordinates ARE persisted; farms are real places.)
- One real person can be both player and farmer — one profile serves both roles.

### farms
- `id`, `name`, `slug` (unique, for URLs), `description`, `created_by` -> profiles.id
- `latitude`, `longitude` (real farm coordinates)
- V1.0 = only real, contracted farms. Never populate with third-party farm data.

### farm_media
- `id`, `farm_id`, `media_type` (image/video), `storage_path`, `mime_type`, `sort_order`
- Use Supabase Storage. Do NOT reduce farm media to a single `photos` field.

### farm_members
- `id`, `farm_id`, `profile_id`, `role` (owner / farmer / staff)
- Lets one farm have multiple farmers/staff; basis for the Step 2 farmer backend.

### plots
- `id`, `farm_id`, `plot_id` (human-readable), `name` (optional)
- Farmer's operational unit. Farmers post updates & milestones at the plot level. Do NOT move
  updates to the tree/adoptable level.

### adoptables  (generalized from "trees")
- `id` (UUID), `identifier` (product-world identity e.g. `#1048`; NOT the primary key)
- `plot_id` -> plots.id
- `type` — tree / crop / animal (a user adopts any of these; same funnel, same fan-out)
- `species`
- `status` — lifecycle/availability, distinct from identity.
  **Ask the owner for exact status values before choosing them.**
- Crops/animals may cost more Seeds than trees — costs are configurable constants (see below).

### adoptions
- `id`, `user_id` -> profiles.id, `adoptable_id` -> adoptables.id
- `type` — adoption / donation (same table, same backend funnel; do NOT split)
- `status` — distinguishes "clicked adopt" from "adoption active"
- `display_name` — the personal name THIS user gives their adoptable. Keep it here, NOT on
  `adoptables` (the same real adoptable's identity `#1048` never changes; the pet name is per-user).
  **Ask the owner for exact `type` and `status` values before choosing them.**

### plot_updates
- `id`, `plot_id` -> plots.id, `author_id` -> profiles.id (who posted — basis of farmer backend)
- `text`, `milestone` (optional), `created_at`
- Attaches to the PLOT, not the adoptable. One update fans out to every user with an adopted
  item in that plot. (Ensure the query path adoption->adoptable->plot is efficient/indexed.)

### plot_update_media
- `id`, `plot_update_id`, `media_type` (image/video), `storage_path`, `mime_type`, `sort_order`
- A plot update can have multiple photos/videos. Do NOT store as a single `photo` field.

### growth_ledger
- `id`, `profile_id`, `amount` (signed), `source`, `reference_id` (optional), `metadata` (optional)
- Growth audit trail / source of truth. Growth is NOT spendable.

### seeds_ledger
- `id`, `profile_id`, `amount` (signed), `type` (earn/spend), `source`, `reference_id` (optional),
  `metadata` (optional)
- Single accounting trail for both earn (+) and spend (-). Do NOT make separate earnings/spending
  tables.

### referrals
- `id`, `referrer_id`, `referred_id`, `code`, `status` (pending/completed), `rewarded_at`
- Reward: **500 Seeds to referrer + 500 Seeds to referred**, granted AFTER the new user completes
  signup (entering a code alone does NOT trigger it). 500 = a single configurable constant.
- New user may enter a referral code before signup, then proceed via any supported method.
- Rewards must go through `seeds_ledger`, never by mutating balance without a ledger row.

---

## Reserved relationships — create tables, do NOT activate logic in V1.0
These systems are now coupled to the economy/progression, so reserve their relationships now to
avoid a later relationship migration. Build the tables + foreign keys; implement no behavior.

- **Transactions / real money (deferred until owner has contracted farms + payment set up):**
  `donations`, `payments`, `rewards` (redeemable catalog items), `redemptions` (Seeds spent on a
  reward). Stripe/settlement logic is NOT wired in V1.0.
- **Progression systems:** `quests`, `quest_completions`, `collection` (achievements). Quests are
  intended to be a primary Seeds-earning entry point and to unlock collection — reserve the links.
- **Impact (real-world outcomes ledger — reserve now):** `impact_events` — records what a
  user's actions actually accomplished in the real world (e.g. tree supported, $ contributed to
  a farm, volunteer hours, lbs of local produce). Fields: `id`, `profile_id`, `impact_type`,
  `amount`, `unit`, `reference_id` (the action that produced it), `metadata`, `created_at`.
  **Impact is NOT Seeds.** Seeds = in-game currency; Impact = the real-world result. Keep them
  separate — do not derive one from the other's display. Reserve the table now (coupled to every
  earn action); activate logic later.
- **Farm profile sub-tables (V1.0 = read-only display only, no transactions):**
  `farm_events`, `farm_volunteer_opportunities`, `farm_produce` (with availability:
  online-purchase / u-pick / in-season), and farm/staff contact info (either `farm_contacts` or
  contact fields on `farm_members`).
- **Companion Creatures (owner confirmed: reserve now):** `creatures` (species/type: name, rarity,
  how obtained) and `user_creatures` (owned instances: feed level, state, linked profile).
  Feeding will spend Growth via `growth_ledger`. Build NO creature interactivity — dialogue
  (AI/LLM layer) and desktop presence are V2+.

**Do NOT build tables for:** Community, standalone Milestone table, standalone Species table,
farmer payouts, inventory, notification system. Add later without touching core relationships.

---

## Auth / signup (must look like a real app)
Build UI for all entry points, styled per the design system:
- Phone Number . Email . Google . Facebook . Twitter . Apple . Guest . **Referral code field**

Backend wiring (native/Expo appropriate):
- **Connect now:** Email, Google, Facebook, Twitter, Apple, Guest. (Owner will provide OAuth keys;
  include `.env.local.example` / Expo env config with every key needed and clear comments.)
  Note: Apple requires Sign in with Apple when other third-party logins exist — include it.
- **Phone (SMS): build the UI, leave backend a clear stub** (SMS costs money). Don't block on it.
- Protected-route handling, login / logout.

On signup completion:
1. Create profile.
2. Grant configured initial **Growth**, recorded in `growth_ledger` (source = signup).
3. Grant configured signup **Seeds** bonus via `seeds_ledger` if applicable.
4. If a valid referral relationship exists, grant the configured referral reward via
   `seeds_ledger` to both parties.

---

## Frontend / design (must be presentable, not bare)
Define ONE reusable design system for all later steps: color palette, typography, button styles,
card styles, radius, spacing, logo placement, shared UI components.

Visual tone (per owner's reference images): **hand-drawn / watercolor illustration, warm earthy
farmers-market palette, textured & tactile (paper-sticker feel), playful hand-lettered accents,
real-produce imagery.** The app should feel like **"a living hand-drawn community food map,"**
not a cold tech product. Code establishes the direction and leaves **clearly-marked slots** for
future hand-painted illustration assets (code can't generate the paintings themselves).

Deliver in Step 1:
- A designed **login / signup screen** (7 entry buttons + referral code field, real-app polish).
- After signup: user lands on **My World** — the app's home. Build it as a **personal
  real-world dashboard / relationship map**, not just a homepage. It surfaces the things the user
  has a real relationship with. V1.0 modules (most in "coming soon" narrative state; only the
  live ones are interactive):
  My Tree/Adoptable . My Farms . My Seeds . My Growth . My Creatures . My Quests .
  My Volunteer Hours / My Impact.
  Show live **Growth** and **Seeds** balances. Locked modules are narrative ("coming soon"),
  not broken. This dashboard is what differentiates the product from a generic marketplace/donation app.

## Map
- Stylized "world-view" map (NOT precise GPS rendering) for V1.0.
- Store real farm coordinates; compute **real distance from the user's current location as text**
  (e.g. "3.2 km away") when location is available — do NOT store distance.
- Include an **"Open in Google Maps" / navigation** action for real farms.
- Only real contracted farms appear in V1.0.

## Seed data
Seed script: 1 Farm -> 1 Plot -> several adoptables (a few trees; optionally 1 crop / 1 animal to
exercise the `type` field), so later steps have something to render.

---

## IMPORTANT — ask before guessing
Deliberately left for the product owner. **Ask before choosing:**
- `adoptables.status` exact values
- `adoptions.type` and `adoptions.status` exact values
- exact V1 Seeds earning actions/values and initial Growth/Seeds amounts (use clearly-labeled
  placeholder configurable constants if you must, but flag them)
- any additional referral-eligibility rule
Do NOT invent product rules just to complete the schema.

## Affected paths
Whole repo (new): Expo/React Native app source, `lib/supabase/`, `supabase/migrations/`,
`supabase/seed.*`, env config / `.env.local.example`, design-system & shared-UI files, Supabase
Storage config for farm & plot-update media.

## When done
1. Verify DB relationships/constraints, auth/signup, Growth ledger, Seeds ledger, referral
   accounting, farm media gallery, multi-media plot updates, adoptable identity vs per-user
   display_name, and that the app runs in Expo Go with a presentable UI.
2. Commit and push. Include this spec file (`revise/2026-08-17-step1-foundation.md`) in the commit.
