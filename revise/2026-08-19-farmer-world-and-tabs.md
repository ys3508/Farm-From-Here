# FARM FROM HERE — Farmer World toggle + tab reorder (world-switching shell)

## Context (you have zero conversation history)
FARM FROM HERE is a **React Native + Expo** mobile app (iOS + Android, Supabase backend) where
users adopt **real** trees/crops on **real** local farms, and **real farmers/growers** post real
growth updates. **Stack note: this is Expo/React Native — NOT Next.js and NOT a PWA.** If any
older note in the repo says PWA/Next.js, this supersedes it for this feature.

Key model facts you must respect (do not change them):
- **One profile can be both a player and a farmer.** No separate farmer account, no second app.
  Farmer capability = a row in `farm_members`. No row → the user is a pure consumer and sees
  **zero** farmer UI and no hints.
- There are two consumer-facing trust tiers surfaced elsewhere: `individual` → "Community grower",
  `verified_farm` → "Verified farm". This feature only needs to know: *does this profile have a
  `farm_members` row or not.*

This task builds the **world-switching shell + navigation only.** The inner farmer management
screens (create plot / add adoptable / post-update flow) are specified in the Step-2 farmer-portal
spec. If those screens already exist in the repo, wire to them. If they don't yet, create
navigable placeholders and say so in your commit notes — do NOT rebuild Step-2 here.

## Do these in order. Task 1 first, verify, then Task 2.

---

## Task 1 — Reorder the consumer (My World) bottom tabs
This is a standalone, independently shippable change. Do it first and verify it.

- **Current order:** `My World | Quest | Farm | Community | Me`
- **New order:** `My World | Farm | Quest | Community | Me`

Only **Quest and Farm swap positions.** Labels, icons, routes, and every screen stay identical —
this is purely the order in the bottom tab navigator. Verify deep links / default tab / any
index-based tab logic still works after the swap.

Rationale (so you don't "fix" it back): the two role-specific tabs (home + main action) are being
grouped on the **left**, and the shared social tabs (Quest, Community) on the **right**, so that
the Farmer World toggle below only ever animates the left half of the tab bar.

---

## Task 2 — Farmer World: top toggle + vertical swipe + farmer tab bar

### The two-world spatial model
My World and Farmer World are two panels on **one continuous vertical canvas**:
- **Bottom panel = My World** (consumer, the existing home).
- **Top panel = Farmer World** (farmer). Its hero art is `assets/my_world/farmers.png`.
- The **bottom edge of the Farmer World art meets the top edge of the My World art** at a seam.
  **Art alignment is the owner's responsibility — do NOT worry about matching the images.** Just
  stack the two panels so the user pans up from My World into Farmer World.
- The bottom tab bar stays **fixed** at the bottom of the screen across the pan (see tab rules).

### Top mode toggle = single source of truth
Add a small **left/right mode toggle** at the top of the home (see the reference screenshot's top
area — same visual language as the Growth/Seeds pills).
- **Left = My World, Right = Farmer World.** The toggle is the single source of truth for which
  world/mode is active.
- Tapping the right side **and** swiping up are the same action, two entry points. When the user
  swipes past the seam, **snap the toggle** to match. The toggle state then drives BOTH the pan
  animation AND the left half of the bottom tab bar. State must never be ambiguous — derive the
  pan position and the tab set from one `activeWorld` value.

### Gating by `farm_members` — this decides what the right toggle does
- **Profile HAS a `farm_members` row (is a farmer):** right toggle / swipe-up reveals the real
  **Farmer World** and swaps in the farmer tab bar.
- **Profile has NO `farm_members` row (pure consumer):** there is **no** Farmer World to pan into.
  The right toggle instead opens the **application entry** (below). No farmer tabs, no farmer
  screens, no peek of the farmer world.

### Farmer tab bar (only when in Farmer World)
`My Farm | Post | Quest | Community | Me`

- **Slots 3, 4, 5 (Quest / Community / Me) are the SAME screens as the consumer side.** Do not
  duplicate or fork them — same components, same routes. They must NOT re-render on world switch.
- **Only slots 1 and 2 change** when crossing between worlds:
  - **Slot 1 — My Farm:** the farmer's home/dashboard. This is where "N people are waiting for
    your photos", the plot list, and the **management actions live: create plot / add adoptable /
    edit farm profile.** These do NOT get their own bottom tabs — they live inside My Farm.
  - **Slot 2 — Post:** the **post-an-update hero action ONLY** (camera-first, ~30-second update,
    per Step-2 §4). Nothing else goes in this slot. Keeping it to one job is the point — it must be
    ~1 tap from anywhere in Farmer World.
- Mirror mapping (so the swap reads as one motion): consumer slot 1 `My World` ↔ farmer slot 1
  `My Farm`; consumer slot 2 `Farm (adopt · USE seeds)` ↔ farmer slot 2 `Post (produce)`.

### Non-farmer right toggle = application entry
When a pure consumer taps the right toggle, open the farmer **application entry** (the Step-2
apply flow entry point — do not build the application internals here, just route to / stub it).

Use this copy as a **placeholder constant the owner may swap** (do not hardcode inline in many
places — one string constant):
- Title: **"Grow something real?"**
- Subtitle: **"A farm, an orchard, or your backyard — bring it to the map."**
- Button: **"Bring it here"**

Do NOT use "farm" as the only word — individuals/backyard growers are included on purpose.

---

## Ask the owner — do NOT guess
- **Repo paths:** you know the repo; locate the bottom tab navigator, the My World home screen,
  and the `farm_members` gate. If the structure is ambiguous, ask before large refactors.
- **Do the Step-2 farmer screens (My Farm, Post/update flow, application entry) already exist?**
  Check. If yes → wire slots 1/2 and the application entry to them. If no → create navigable
  placeholders, wire the navigation, and flag it in commit notes. Do not rebuild Step-2.
- **Final tagline copy** is the owner's to finalize — ship the placeholder above as a single
  swappable constant.
- Any other product rule needed to make a screen work that isn't specified here → ask, don't fill
  it in.

## When done
1. Task 1 verified: consumer tabs now `My World | Farm | Quest | Community | Me`, nothing else
   changed, default tab / deep links intact.
2. Farmer (has `farm_members`): top toggle + swipe both switch worlds; snap-on-cross-seam works;
   only slots 1 & 2 change; Quest/Community/Me are the same screen instances (no re-render/fork).
3. Pure consumer (no `farm_members`): right toggle opens the application entry; NO farmer world,
   NO farmer tabs, NO hints anywhere else.
4. `activeWorld` is the single source of truth for pan position + tab set.
5. Commit and push this spec file as `revise/2026-08-19-farmer-world-and-tabs.md` together with
   the code changes. Note in the commit whether Step-2 farmer screens existed or were stubbed.
