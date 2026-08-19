# FARM FROM HERE — Homestead / day-1 UI polish (5 items)

## Context (you have zero conversation history)
FARM FROM HERE is a **React Native + Expo** mobile app (iOS + Android, Supabase backend). The home
is a two-panel vertical canvas with a top mode toggle: a consumer world and a farmer world, both
belonging to the same person. This spec builds on two files already in the repo — read them first:
- `revise/2026-08-19-farmer-world-and-tabs.md` (the world-switching shell: top toggle, vertical
  swipe, two tab bars).
- `revise/2026-08-19-farmer-gating-addendum.md` (three-state preview lock, gating, album, location,
  permissions).

This is **UI polish only** — no schema changes, no new product logic, additive. Reuse the Step-1
design system and the onboarding screens' visual language throughout.

## Do all 5. They're independent and can ship together.

---

## 1. Fix the fonts on the consumer home ("My World") — unify with onboarding + farmer world
The consumer home currently renders in a **different type family** than the rest of the app. The
onboarding screens and the farmer-world screen are the correct reference (a serif for large titles
— e.g. the "PREVIEW — Willow Bend Orchard" style — and the app's sans for body).

- Point the consumer home at the **same shared type tokens / text styles** the onboarding and
  farmer-world screens use. Do NOT hand-set fonts per screen — route them through the shared design
  tokens so this can't drift again.
- Goal: a user cannot tell the two worlds were styled separately. Aesthetic consistency is the bar.

## 2. Move the world toggle to the very top, centered — and rename it "Homestead | Grow"
- The `Homestead | Grow` toggle sits on its **own row at the very top of the screen, horizontally
  centered**, on **both** worlds (consumer and farmer). Today it's crammed left on the same row as
  the balance pills on one world and alone on the other — make it consistent: toggle row on top,
  centered, both worlds.
- **Rename:** the toggle pair is **`Homestead` (left) | `Grow` (right)**. Replace the user-facing
  string **"Farmer World"** with **"Grow"** and the toggle's left label with **"Homestead"**
  everywhere it appears as a visible label. Internal code identifiers may keep their existing names;
  this is about visible copy.
- Rationale (so you don't revert it): both sides are the *same person* — naming the right side
  "Farmer" wrongly excluded backyard/community growers. `Homestead | Grow` keeps both as "mine."

## 3. Show the Growth / Seeds balance on BOTH worlds
The balance pills (Growth + Seeds) currently show only on the consumer world. Show the **same
balance on both worlds** — it's one person, one balance. Place them just under the centered toggle
row (or the design-system's standard spot), identical on both.

## 4. Make the balance a tappable entry that opens a Seeds / Growth detail view
The top-right Growth/Seeds pills become a **single tappable control** that opens a **detail view of
Seeds and Growth** (current balances + a simple read-only breakdown / recent ledger entries).
- Read-only display. Do not add earn/spend actions here.
- Available on both worlds.
- **Interpretation flag — confirm with owner if wrong:** "create a tab on the right that opens
  seeds/growth" is read here as *the top-right balance pills open a detail overlay/screen*, NOT a
  6th bottom tab (the bottom bar is fixed at 5). If the owner meant something else, ask.
- If `seeds_ledger` / `growth_ledger` exist, source the breakdown from them; if their exact shape is
  unclear, ask the owner rather than inventing columns.

## 5. Day-1 empty state = a clearly-named creature placeholder slot (do NOT build the creature)
The day-1 home is empty (a new user has adopted nothing yet). It currently shows a cardboard box,
which reads as "you have nothing" — wrong story. The real day-1 protagonist is a **starter
creature** (a guided-tutorial companion) that is being designed in a **separate, later round** — do
**NOT** build it here.

For this round:
- Keep the existing box art **as-is** (no new art, no redesign) BUT wrap the day-1 protagonist
  position in a **clearly-named creature mount point / slot component** (e.g. `Day1CreatureSlot`),
  so the next round can drop the real creature in without hunting for the location or refactoring
  layout. The box is a temporary stand-in occupying that slot.
- Do NOT invent alternative empty-state art, seeds/plots/"claim your land" motifs, or distant-farm
  imagery. The empty state is intentional and will be filled by the creature later.

---

## Ask the owner — do NOT guess
- **Bottom-tab slot-1 labels** ("My World" / "My Farm") and the onboarding card title
  ("This is your world"): the owner said the toggle labels changing to `Homestead | Grow` does NOT
  require renaming those. Leave them unless the owner says otherwise — do not auto-rename to match.
- Item 4's exact contents / whether it reads from existing ledger tables (see §4).
- Repo paths: locate the shared type tokens, the home screen(s), the toggle component, the balance
  pills, and the day-1 empty state. If ambiguous, ask before refactoring.

## When done
1. Consumer home fonts come from the same shared tokens as onboarding/farmer world; no per-screen
   font drift.
2. `Homestead | Grow` toggle is top-row, centered, on both worlds; "Farmer World" no longer appears
   as a visible label.
3. Growth/Seeds balance shows identically on both worlds.
4. Tapping the balance opens a read-only Seeds/Growth detail view (both worlds).
5. Day-1 empty state keeps the box but through a clearly-named creature slot component, ready for
   next round; no new empty-state art invented.
6. Commit and push this file as `revise/2026-08-19-homestead-ui-polish.md` with the changes.
