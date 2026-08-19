# FARM FROM HERE — Step 2A: Farmer application + review + approval trigger

## Context (you have zero conversation history)
FARM FROM HERE is a **React Native + Expo** mobile app (iOS + Android, Supabase backend). Users
adopt **real** trees/crops/animals on real local farms; real farmers/growers post real growth
updates. **One profile can be both player and farmer** — farmer capability = a row in
`farm_members`. There is NO separate farmer app and NO forked signup.

**Where 2A sits.** The world-switching shell already exists (top `Homestead | Grow` toggle,
vertical swipe, two tab bars, `farm_members` gate) and it currently routes to **placeholder stubs**
that print "Not built yet" for post / plot-new / adoptable-new / farm-profile / **apply**. Step 2
(the real farmer portal) has NOT been built — no `farm_applications` tables exist yet. This is
**phase 2A of 3**: build the **application → review → approval** path only. Phases 2B
(farm→plot→adoptable setup) and 2C (post-update hero flow) come after and depend on what 2A creates.

**Read for full context:** `revise/2026-08-17-step2-farmer-portal.md` (the original portal spec)
and `revise/2026-08-19-farmer-gating-addendum.md` (overrides). **This file is self-contained for 2A
and already folds in the addendum's overrides — where they differ from the original §2, THIS FILE
WINS.** Additive only; do not touch Step-1 relationships or the reserved real-money tables.

---

## Owner decisions already locked (do NOT re-ask, do NOT deviate)
- `farm_applications.status` values: **`pending` / `approved` / `rejected` / `withdrawn`**.
- `farm_type` values: **`individual` / `verified_farm`** (self-selected first step of applying).
- **`size` = coarse buckets** (not free text): **`<0.25 acre` / `0.25–2 acre` / `2–10 acre` /
  `10–50 acre` / `50+ acre`**. Store the bucket, not a number.
- **Anti-abuse = one farm per person:** an account may have **at most 1 active farm** (once it owns
  a `farm_members` owner row it cannot apply to create a second) **and at most 1 in-flight
  (`pending`) application**. Rejected applications **can be edited and resubmitted** (that does not
  count as a new one). Enforce both limits at apply time with a clear message.
- **Location may be coarse (override of original §2c):** a location is **required**, but
  street-level precision is **never forced** — city/state is a complete answer. Store a
  `location_precision` field (`city` / `exact`); the enforced public floor is **city/state**; exact
  coordinates are optional. Maps/places API is used **only** to help the applicant enter/pin an
  accurate address — NOT to pull data from any third-party farm directory.

---

## 1. Two tiers, self-selected
The applicant picks their tier first. It drives materials + review path (and a future paid tier —
not built now).
- **`individual` (Community grower)** — backyard / small-scale. Lowest barrier. **Auto-approved.**
  Consumer label = "Community grower", NOT "verified".
- **`verified_farm` (Verified farm)** — a real working farm. Uploads supporting materials. **Manual
  owner review.** Consumer label = "Verified farm" after approval.

Honest trust model (settled): V1 has **no** technical way to prove an individual's plants are
theirs, so do NOT pretend to verify. Surface the tier honestly to consumers later; "can use it
immediately" ≠ "verified".

## 2. New tables

**`farm_applications`**
- `id` uuid, `profile_id` → profiles.id, `created_at`, `updated_at`
- `farm_type` — `individual` / `verified_farm`
- Proposed farm fields (become the `farms` row on approval — do not make the farmer type them twice
  later): `farm_name`, `description`, `address`, `latitude` (nullable), `longitude` (nullable),
  `location_precision` (`city` / `exact`)
- `size` — the coarse bucket enum above
- Contact: `contact_name`, `contact_phone`, `contact_email`
- `about_text` — open-ended "tell us about your farm" (the real human filter)
- `links` — optional (website / Instagram / market listing); jsonb array or small child table
- `status` — `pending` / `approved` / `rejected` / `withdrawn`
- `review_note` — owner-written rejection reason, shown to applicant
- `reviewed_at`, `reviewed_by` (nullable)

**`farm_application_documents`** (verified_farm ONLY; individuals do NOT upload these)
- `id`, `application_id`, `storage_path`, `mime_type`, `original_filename`, `sort_order`,
  `created_at`
- Arbitrary supporting material, multiple files, images or PDFs. Do NOT model specific document
  types / no "business license" enum — US small-farm paperwork is wildly inconsistent and a fixed
  dropdown would block the first real farmer. Helper copy guides without gating.

**`farm_application_media`** (BOTH tiers)
- A few photos of the plants / animals / land the applicant wants on the app. Shown in the
  application. **These are auto-copied into `farm_media` on approval** (see §5) — that seeds the
  public album and is what the unlock gate checks.

## 3. Fields by tier
**Both (required):** location (address + optional lat/lng via maps autocomplete, coarse allowed),
real contact name, in-app farm name (suggest tying an individual's farm name to their own name to
reduce collisions — copy only, no hard validation), `size` bucket, `about_text`,
`farm_application_media` photos.
**`verified_farm` only:** any material showing "this is a real working farm + a real relationship to
the land" (land deed/lease, ag registration, farmers-market proof, certification (bonus), on-the-
ground photos, optional website/IG). Human-judged; no fixed checklist. These go to the **private
bucket** (§6).

## 4. Review + approval (V1 = auto + manual, NO AI)
- **`individual`** → on submit, **auto-approved**: run the approval path (§5) immediately with
  `farm_type = individual`. No human step.
- **`verified_farm`** → on submit, enters **`pending`**. Owner reviews manually in the Supabase
  dashboard (materials + offline confirmation) and flips `status` to `approved`.
- **Do NOT build an admin/review UI** (deliberately deferred — one owner, a handful of apps,
  decided offline). Build the **applicant side only**.

## 5. Approval trigger — shared, tier-aware, idempotent
Implement as a **Postgres trigger / DB function** on `farm_applications` status → `approved` (fires
automatically for individuals, on the owner's manual flip for verified farms). It must:
1. Create a `farms` row from the application fields (name, slug, description, lat/lng,
   `location_precision`, `created_by` = applicant, **`farm_type` carried over**).
2. Insert a `farm_members` row: `profile_id` = applicant, `farm_id` = new farm, `role` = `owner`.
3. **Copy `farm_application_media` into `farm_media`** (public album seed — this is the "1+" rule:
   auto-seed now, farmer can add/delete later in 2B). This is what makes the unlock gate
   (`farm_members` present AND `farm_media` ≥ 1) pass immediately for individuals.
**Idempotent:** flipping status to approved twice must NOT create a second farm / second member /
duplicate media.

## 6. Storage & security (required)
- Application **documents** are sensitive identity/ownership docs → a **separate PRIVATE Supabase
  Storage bucket**. RLS: only the applicant (own rows) and service-role/admin can read. No public
  URLs, no signed URLs handed to other users.
- `farm_applications` RLS: an applicant can read/update **only their own** row, and only while
  `status` is `pending` or `rejected`.
- Application **media** (the plant/land photos) may live in the normal (public-eligible) path since
  they're destined for `farm_media` — keep documents and media in separate buckets accordingly.

## 7. Applicant-side states (this is the UI 2A builds — replaces the `apply` stub)
The **apply entry is the shell's `Homestead | Grow` preview-lock** (a non-unlocked user tapping into
Grow). That is the single canonical entry — do NOT build a second one elsewhere. From there:
- **No application yet** → the apply form (tier select first, then §3 fields).
- **Pending** (verified_farm) → "Application under review" screen: can view what they submitted, can
  **withdraw**. No farm-management functions visible. Can still use the app as a normal player.
- **Rejected** → shows `review_note`; allows **edit + resubmit**.
- **Approved** → farmer mode unlocks (gate met via §5); the farmer world's tabs become usable.
  (Individuals reach this immediately on submit.)

## 8. Ask the owner — do NOT guess
- Whether application photos should also carry any caption/order into `farm_media` (default: copy
  as-is, no captions).
- Which maps/places API + key if env has none (address autocomplete only).
- Exact consumer-facing tier wording if you'd deviate from "Community grower" / "Verified farm".
- Seeds cost constants are NOT in 2A (they surface in 2B's adoptable screen) — ignore here.
- Anything else needed to make a screen work that isn't specified across these files.

## 9. Do NOT build in 2A
Admin/review UI · AI review · the individual→verified upgrade flow · any real-money gating · plot /
adoptable / update flows (those are 2B/2C) · actual email sending. Reserved money tables: verify FKs
are sane and report; do NOT activate or rebuild them.

## When done
1. End-to-end (individual): apply → fill location (coarse ok) / name / size bucket / plant photos →
   submit → **auto-approved** → trigger creates farm + farm_members + seeds farm_media → farmer
   world tabs unlock. One-farm-per-person + one-pending limits enforced.
2. End-to-end (verified_farm): apply → add materials (private bucket) → submit → **pending** →
   "under review" screen (withdraw works) → owner flips status in Supabase → farm created,
   farm_type=verified_farm.
3. Rejected path: `review_note` shows; edit + resubmit works.
4. Approval trigger is idempotent; documents are NOT publicly readable; application RLS correct.
5. Report the reserved real-money table FK check.
6. Commit and push this file as `revise/2026-08-19-step2a-farmer-application.md` with the changes;
   note that 2B/2C stubs remain.
