# 2026-08-19 — Step 2A: farmer application → review → approval

Spec built from: `revise/2026-08-19-step2a-farmer-application.md` (committed alongside the code).

**This is the first real piece of the Step-2 farmer portal.** Until now the portal was five
placeholder screens that printed "Not built yet". 2A replaces the `apply` placeholder with the real
path; `post` / `plot-new` / `adoptable-new` / `farm-profile` are **still stubs** and remain 2B/2C.

⚠️ `revise/2026-08-19-farmer-gating-addendum.md` is still not in the repo. 2A says it is
self-contained and folds in that addendum's overrides, so this round did not need it — but the
unlock gate it defines is now implemented (below), so when that file lands, check it against what
shipped here.

## What was built

### Schema — `supabase/migrations/20260819000200_farm_applications.sql`
Three new tables (`farm_applications`, `farm_application_documents`, `farm_application_media`),
two new buckets, the approval trigger, and RLS on all of it.

**Additions to existing tables** (additive, no relationship touched):
- `farms.farm_type` and `farms.location_precision`
- `farm_media.storage_bucket` — application photos are uploaded *before* a farm exists, so they
  cannot live in the `farm-media` bucket (its policies authorise by farm id). Approval copies the
  **row**, not the bytes — a Postgres trigger cannot move an object between buckets. **2B's album
  reader must read this column**, or every application photo 404s.

**⚠️ One Step-1 constraint relaxed, deliberately:** `farms.latitude` / `farms.longitude` are now
NULLABLE. They were `not null`, which silently assumed every farm has a pin — but coarse location
is a locked decision, and a city-precision farm has no pin until something geocodes it. A new
CHECK keeps the real invariant: a farm always has coordinates **or** a written address.
`map.tsx` was updated to degrade rather than assume (no distance, no "Open in Google Maps" when
there is no pin), and a preview fixture now exercises that path.

### The approval path (§5)
One trigger for both tiers; only the timing differs. On status → `approved` it creates the farm,
inserts the `owner` membership, and copies the application photos into `farm_media`.

**Idempotent** via a `created_farm_id` latch on the application: flipping status to approved a
second time finds it set and does nothing. No second farm, no second membership, no duplicated
photos.

**Why submit is an RPC and not a plain insert:** an individual is auto-approved *at submit*, and
approval copies the photos. Approving at insert time would seed an **empty album**, and the unlock
gate would then fail for a farm that does have photos. So the order is fixed: create row → upload
files → `submit_farm_application`.

### The unlock gate now has two halves
`useFarmerMembership` was membership-only. It now requires **a `farm_members` row AND
`farm_media` ≥ 1**, per §5. An approved individual passes both in the same instant because the
trigger seeds the album. `WorldModeProvider` gained `refreshGate()` so approval unlocks the tabs
without an app restart.

### The applicant UI (§7) — replaces the `apply` stub
Tier choice → one-screen form → the four states (pending / rejected / approved / ineligible).
Reached only from the shell's `Homestead | Grow` toggle — **still the single canonical entry**; no
second apply door was added anywhere.

### Anti-abuse
One farm per account and one in-flight application, enforced **in the database** (a partial unique
index on `status='pending'`, plus a trigger for the owns-a-farm half), with an RPC the UI calls
first so it can say why before someone fills in a long form. Rejected applications edit and
resubmit without counting as a new one.

## Notes by audience

### Sissi — decisions and things to check
1. **Your three answers are in:** Mapbox (wired, token optional — see below), `expo-document-picker`
   installed so a verified farm can attach a real PDF deed, and the tier wording kept as
   "Community grower" / "Verified farm".
2. **The Mapbox token is not set, and the form works without it.** Add
   `EXPO_PUBLIC_MAPBOX_TOKEN` (a public `pk.` token) to `.env.local` and autocomplete switches on;
   `.env.local.example` documents it. Without it the applicant types city + state, which is a
   complete answer under the coarse-location rule — not a degraded one.
3. **⚠️ THE MIGRATION HAS NEVER BEEN RUN.** There is no Postgres, no `psql`, no `supabase` CLI and
   no Docker on this Mac, so nothing in it has been executed — same standing limitation as every
   prior schema round here. It is balanced and self-consistent on inspection, but the first real
   `supabase db push` is the first real test. Expect to iterate once.
4. **I closed a hole while writing it:** the RLS insert policy only checked ownership, so a client
   could have inserted a row claiming `status='approved'`. It would not have created a farm (the
   approval trigger is on UPDATE only) — which is what made it nasty: the app would have shown an
   "approved" screen for a farm that does not exist. A before-insert trigger now forces every
   application to start `pending` and clears the review fields.
5. **Reserved money tables — checked, untouched, as §9 asks.** `payments`, `donations`, `rewards`,
   `redemptions` reference `profiles`, `farms`, `adoptables` and `seeds_ledger`; every FK is sane
   and none of them was activated, rebuilt or referenced by this migration. My changes to `farms`
   are additive columns plus the nullable relaxation, so no FK pointing at `farms(id)` is affected.

### Other agents — build notes
- **Do not add a second "apply" entry.** The `Homestead | Grow` toggle is the only door.
- **Do not build an admin/review UI.** Verified farms are reviewed by one owner in the Supabase
  dashboard, deliberately (§4).
- Documents live in a **private** bucket and are never rendered, never given a URL, never handed to
  another user. There is intentionally no `applicationDocumentUrl()` — only `applicationPhotoUrl()`.
- No document-type enum, ever. US small-farm paperwork is inconsistent and a dropdown would block
  the first real farmer.
- `size` strings are mirrored by a CHECK constraint. Change `src/config/farmerApplication.ts` and
  the migration together or submission breaks.

## To do
- [ ] Run `supabase db push` against a real project and fix whatever the first run finds.
- [ ] Add the Mapbox token if you want autocomplete.
- [ ] 2B: farm → plot → adoptable setup, and the farm album (must read `farm_media.storage_bucket`).
- [ ] 2C: the post-an-update hero flow.
- [ ] Save the gating addendum into the repo and reconcile it with the gate built here.

## Honest BUILT vs REMAINING
- **BUILT:** the schema, the approval trigger and its idempotency latch, both anti-abuse limits,
  RLS on three tables, two buckets with the documents one private, the two-half unlock gate, and
  the whole applicant UI — tier choice, form (both tiers), pending/withdraw, rejected/edit/resubmit,
  approved. Verified in Expo web: both tier forms render correctly, the individual form has no
  documents section, validation reads as a sentence, no console errors.
- **NOT VERIFIED:** anything requiring the database. No migration was executed; no row was ever
  inserted; the trigger, the RLS policies and the storage policies are unexercised.
- **REMAINING:** 2B, 2C, and the admin review UI (deliberately never).
