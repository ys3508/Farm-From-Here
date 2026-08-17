# FARM FROM HERE — Step 2: Farmer Portal (Application → Farm → Plot → Adoptable → First Update)

## Context you need (you have no prior conversation context)
FARM FROM HERE is a location-based mobile game (React Native + Expo, iOS + Android, Supabase
backend) where users adopt **real** trees/crops/animals on **real** local farms, and **real
farmers** post real growth updates that pull users back to the app.

Step 1 (Foundation) is already built or in flight: Expo app scaffold, design system, auth
(7 entry points), and the full schema — `profiles`, `farms`, `farm_media`, `farm_members`,
`plots`, `adoptables`, `adoptions`, `plot_updates`, `plot_update_media`, `growth_ledger`,
`seeds_ledger`, `referrals`, plus reserved-but-inactive tables.

Key model facts Step 2 depends on:
- **One profile can be both a player and a farmer.** Do NOT create a separate farmer account
  type or a second app. Farmer capability is granted by a row in `farm_members`.
- **Updates attach to a `plot`, not to an individual adoptable.** One plot update fans out to
  every user who has an adoption on an adoptable in that plot. This is the whole point — the
  farmer's workload scales with plots, not with trees.
- `adoptables.identifier` (e.g. `#1048`) is the real-world identity; `adoptions.display_name`
  is the private pet name a user gives it. Never conflate them.
- Two economies: **Growth** (progression, never spendable) and **Seeds** (currency, earned only
  through real-world good, never purchasable with money).

## Goal
Let a real farmer, with **no developer assistance**, go from "I heard about this app" to
"my farm is live and I posted my first real update" — and make posting an ongoing update
**easier than posting to social media**.

Success criterion: from approval, a real farmer completes **Plot → Adoptable → First Update in
10–15 minutes**, and a consumer can immediately discover the farm, see the adoptable, and see
that first update.

---

## 1. Farmer mode lives inside the same app

Not a separate web admin. Same Expo app, same design system, gated by `farm_members`.

- On login, check whether this profile has a `farm_members` row.
- If yes → a **🧑‍🌾 My Farm** module appears on the My World home dashboard, and farmer screens
  become reachable.
- If no → the user sees exactly the consumer experience as before. No farmer UI, no hints.

Why native and not web: farmers post from the field, holding a phone, with the camera. Direct
camera/photo-library/upload access matters more than typing comfort.

**Do NOT build a multi-farm switcher UI.** V1.0 has one farm. `farm_members` already supports
many-to-many; the UI does not need to.

---

## 2. Farmer application + review (NEW — this is the entry door)

A farmer must be able to apply from inside the app, unprompted. Owner reviews **manually in the
Supabase dashboard** in V1.0 — build the applicant side only.

### New tables

**`farm_applications`**
- `id` (uuid), `profile_id` → profiles.id, `created_at`, `updated_at`
- Proposed farm fields (these become the `farms` row on approval — do not make the farmer type
  them twice later): `farm_name`, `description`, `address`, `latitude`, `longitude`
- Contact: `contact_name`, `contact_phone`, `contact_email`
- `about_text` — open-ended "Tell us about your farm" free text. **This is the real filter.**
- `links` — optional (website, Instagram, farmers-market listing). A jsonb array or a small
  child table, your call.
- `status` — `pending` / `approved` / `rejected` / `withdrawn`
- `review_note` — owner-written rejection reason, shown to the applicant
- `reviewed_at`, `reviewed_by` (nullable)

**`farm_application_documents`**
- `id`, `application_id`, `storage_path`, `mime_type`, `original_filename`, `sort_order`,
  `created_at`
- Arbitrary supporting material: **multiple files, images or PDFs.** Do NOT model specific
  document types (no "business license" enum). US small farms have wildly inconsistent
  paperwork; a fixed dropdown would block the very first real farmer.
- UI helper text should suggest without gating, e.g.: *"Land deed or lease, state/county
  agricultural registration, organic or other certification, photos of the farm — anything that
  shows this is a real working farm."*

**`farm_application_media`** (or reuse a photo path) — a few photos of the farm itself, shown in
the application. These may be carried over to `farm_media` on approval.

### Storage & security — important
Application documents are **sensitive identity/ownership documents**. They must NOT go in the
same public bucket as farm photos or plot-update photos.
- Create a **separate private Supabase Storage bucket**.
- RLS: only the applicant (own rows) and a service-role/admin can read. No public URLs, no
  signed URLs handed to other users.
- `farm_applications` RLS: an applicant can read/update **only their own** row, and only while
  `status` is `pending` or `rejected`.

### Approval path (manual in V1.0)
Owner flips `status` to `approved` in the Supabase dashboard. That must automatically:
1. Create a `farms` row from the application's farm fields (name, slug, description, lat/lng,
   `created_by` = applicant).
2. Insert a `farm_members` row: `profile_id` = applicant, `farm_id` = new farm, `role` = `owner`.
3. Optionally copy application photos into `farm_media`.

Implement this as a **Postgres trigger / DB function** on `farm_applications` status change, so
the owner truly only has to change one field. Make it idempotent — flipping the status twice
must not create a second farm.

**Do NOT build an admin review UI in Step 2.** It is deliberately deferred (see §9).

### Applicant-side states
- **No application yet** → an entry point somewhere discoverable ("Are you a farmer? Apply to
  bring your farm here"). Placement is your call; keep it out of the way of the consumer flow.
- **Pending** → "Application under review" status screen. Can view what they submitted, can
  withdraw. **No farm management functions are visible.** They can still use the app as a normal
  player.
- **Rejected** → shows `review_note`, and allows editing and resubmitting.
- **Approved** → farmer mode unlocks; go to §3.

---

## 3. Farm → Plot → Adoptable setup

The `farms` row already exists (created on approval). The farmer's setup work is:

**Farm** — editable only: description, photos (`farm_media`), contact info. Name/location edits
are fine but keep it minimal. Do NOT build employee management or a permissions system.

**Create Plot** — `plot_id` (human-readable), `name`, optional description, optional cover photo.
Explain in one line what a plot is *for*: the unit the farmer posts updates about.

**Create Adoptable** — `type` (tree / crop / animal), `identifier`, `species`, `status`, photo,
availability.
- **The farmer cannot set the Seeds cost.** Adoption cost is a centrally configured constant.
  The farmer sees the cost displayed read-only. This is non-negotiable: farmers freely pricing
  adoptions would break the Seeds economy.
- Support bulk-ish creation if cheap (a farmer with 40 apple trees should not tap through 40
  identical forms) — but do not over-engineer; a "duplicate last" or "add N with sequential
  identifiers" affordance is enough.

**Hero = Tree.** Crop and animal must work through the same generalized funnel, but do not build
three separate elaborate experiences.

---

## 4. Post an update — the hero action

This is the single most important screen in Step 2. The product's heart is a real farmer posting
real photos, month after month. If this is even slightly annoying, the product dies quietly.

### Flow
Camera first → optional text → optional milestone → notify toggle → (preview) → post.

- **Open on the camera/photo picker, not on a text field.** Farmers photograph first.
- **Photos are NOT required.** Text-only updates are valid (rainy day, quick note). Multiple
  photos and video are supported via `plot_update_media`.
- **If the farm has only one plot, pre-select it.** Do not make them choose from a list of one.
- Target: a routine update posted in **under 30 seconds**.

### Preview
- **First update: preview is mandatory** (it teaches them what supporters see).
- After that: preview is skippable.

### Milestone — per-species, configurable
`plot_updates.milestone` is optional and marks "this wasn't a routine photo, something happened":
first flower, first fruit, harvest. Milestones become **nodes on the adoptable's growth
timeline**, and will later feed collection unlocks and push notifications — so they must be
**structured values, not free text**, or the timeline can't recognize them.

**Milestone sets are per type + species, not one global list.** An apple tree, a strawberry crop,
and a laying hen do not share a lifecycle.

Implementation:
- Store milestone sets as a **configurable constant/config table keyed by `type` + `species`**,
  with a **generic fallback set** for any species without a defined set.
- Generate the initial sets for the species present in seed data (apple tree at minimum, plus
  whichever crop/animal species exist) — reasonable, real horticultural/husbandry stages.
- The farmer picks from the set matching that plot's adoptables; free-text milestones are not
  allowed.
- Structure it so sets can be added/edited later without a schema migration.

### Notify supporters — farmer's choice
Add to `plot_updates`: `notify_supporters` boolean (default true) and a nullable
`notified_at` timestamp.

- The farmer sees a toggle at publish: *"Notify the N people who adopted here."*
- **Step 2 only records the flag and creates the pending-notification record / hook. It does NOT
  send email.** Email templates, unsubscribe handling, and the AI text-polish assistant are
  Step 5. Leave a clearly-marked, well-named integration point.
- Farmers must never see supporters' email addresses. Notification is a system fan-out using a
  template; the farmer only decides whether it goes out.

### Offline & unreliable signal — required, not optional
Farms usually have bad signal. This must be handled, not hand-waved:
- Upload failure shows a **clear, plain-language failure state** (not a silent spinner).
- The update is saved to a **local draft queue** on the device, with its photos.
- **One-tap retry**, and automatic retry when connectivity returns.
- Drafts survive app restart. The farmer must never lose a photo they already walked out to take.

### Update history
- List of this plot's past updates, newest first.
- Edit text / fix typos, and delete. Keep it simple.

---

## 5. "N people are waiting for your photos"

On each plot (and on the farmer home), show the **count of active adopters** for that plot.

This is the only farmer-retention mechanism in Step 2 and it is deliberate. A farmer has no
intrinsic reason to keep photographing a tree in month six. Seeing that 14 real people adopted
plants in this plot and are waiting is the reward loop. Keep it warm and human, not a dashboard
metric.

Do NOT expose adopters' personal data — a count, and at most anonymized/first-name-only
presence. No emails, no full profiles.

---

## 6. View as a supporter

After publishing the first update, offer **"View as a supporter"** — open the consumer-facing
farm/adoptable screen so the farmer immediately sees what users see.

This is the cheapest possible way to teach a farmer to post good updates. Keep the entry point
available afterwards too, not just once.

---

## 7. Completion state

After the first real update, show a celebratory "your farm is alive" moment, in the app's
hand-drawn farmers-market visual language:

> **Your farm is live.**
> Farm 1 · Plots 1 · Adoptables X · Updates 1

A farm should feel alive after its first real update — not merely after a database row exists.

---

## 8. Reuse Step 1's design system

Do not invent a separate "admin/tool" look for the farmer side. Same palette, typography,
components, radius, spacing, illustration slots. The farmer is inside the same warm hand-drawn
world as the player, because the farmer often *is* a player.

---

## 9. Do NOT build in Step 2

- Admin / review UI for applications (deliberately deferred — see below)
- Employee management, complex roles or permission systems
- Payments, payouts, Stripe, any real money
- Analytics dashboards, inventory, produce management, volunteer management
- In-app messaging between farmer and supporters
- AI farm assistant, crop planning, full farm-operations management
- Multi-farm switching UI
- Actual email sending / templates / unsubscribe (Step 5)
- AI text polishing of update copy (Step 5)

**Why no admin UI yet:** V1.0 has one owner reviewing perhaps five applications, and the real
decision is made offline (phone call, site visit), not from form fields. Building the review
queue now would encode an imagined process. Trigger to build it later: more than ~3 applications
per week, or the owner losing track of who's been reviewed.

---

## 10. Ask the owner — do NOT guess

Stop and ask before inventing any of these:
- Exact `farm_applications.status` values if you'd deviate from the proposed set.
- The **Seeds cost constants** for adopting a tree / crop / animal, if Step 1 left them as
  placeholders — the farmer UI displays these read-only, so they must be real.
- Whether application photos should auto-copy into `farm_media` on approval.
- Any new product rule needed to make a screen work that isn't specified above.

Use clearly-labeled placeholder constants if you must proceed, but flag every one of them.

---

## Affected paths
New farmer-side screens in the Expo app; `supabase/migrations/` (new tables
`farm_applications`, `farm_application_documents`, `farm_application_media`, milestone config,
plus additive columns on `plot_updates`); the approval trigger/function; a new **private**
Supabase Storage bucket + RLS policies; local draft-queue persistence; shared UI components
reused from the Step 1 design system.

**Additive only.** Do not alter Step 1's existing relationships — especially not
`plot_updates` attaching to `plots`, or `adoptions.display_name` living on `adoptions`.

## When done
1. Verify end-to-end: apply → (flip status in Supabase) → farm + farm_members auto-created →
   create plot → create adoptable → post first update with photos → preview → completion state →
   view as supporter → consumer side shows the farm, the adoptable, and the update.
2. Verify the fan-out query path (adoption → adoptable → plot → plot_updates) is indexed.
3. Verify application documents are NOT publicly readable.
4. Verify the offline draft queue survives airplane mode and an app restart.
5. Commit and push, including this spec file (`revise/2026-08-17-step2-farmer-portal.md`).
