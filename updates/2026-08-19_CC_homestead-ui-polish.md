# 2026-08-19 — Homestead / day-1 UI polish (5 items)

Spec built from: `revise/2026-08-19-homestead-ui-polish.md` (committed alongside the code).

⚠️ **`revise/2026-08-19-farmer-gating-addendum.md` is still not in the repo.** The polish spec says
to read it first; it does not exist in the working tree or anywhere in git history. None of the 5
items depend on its rules, so all 5 are built — but see "Where the addendum will land" below for
the one spot it collides with.

## What was done

### 1. Consumer home fonts — fixed at the root, not per screen
The home wasn't hand-setting fonts; every screen already went through `<BrandText>`. It drifted
because **each screen picked its own `variant` + `family` pair**, and the home happened to pick
body sans for everything while onboarding and the farmer card reached for the serif.

So the fix is a **role layer**: `src/design/brand/textRoles.ts` names the JOB (`title`, `lead`,
`whisper`, `detail`, `kicker`, `hint`, `amount`, `label`) and `<BrandText textRole="lead">` resolves
the type from it. Pick the job, the type comes with it, identically, everywhere. Every world screen
now goes through roles — `grep 'variant="…" family='` across the home, the farmer world and the
app screens returns nothing.

Also added one token: `brandType.lead` (20/29 serif). `title` (26) breaks two-line prose badly on a
375pt phone and `body` (15) in a serif reads like a mistake.

Visible result: "This is your world." is now the same serif voice as the farm name on the Grow card.

### 2. Toggle: top row, centred, both worlds — and renamed
- `Homestead` (left) | `Grow` (right). **"Farmer World" no longer appears as a visible label
  anywhere** (only the two remaining uses were the toggle constant and one sentence in a stub
  screen; both changed).
- The toggle now sits in a **fixed two-row head above the canvas**: row 1 the centred toggle, row 2
  the balance. Identical on both worlds because it is one overlay, not per-panel.
- Internal `WorldMode` keys stay `'my-world'` / `'farmer-world'` — the rename is visible copy only.

### 3. Balance on both worlds
The pill moved out of `MyWorldPanel` into the fixed head. It used to ride with the consumer panel
and slide away when you panned up, which said "this is the consumer's balance" — wrong: one person,
one balance.

The onboarding tour still owns its "look at your balances" step, so the panel now reports that step
upward (`onBalancesHighlighted`) and the canvas does the glowing.

### 4. Balance opens a read-only Seeds/Growth detail
New screen `app/(app)/balance.tsx`, reached by tapping the pill from either world.
- **Your call:** a pushed screen with a back button (hardware back works, deep-linkable), **not** a
  6th bottom tab — the bar stays at 5.
- **Your call:** balances + recent entries from both ledgers.
- It sources from `useLedgers` + `describeSource` in `src/features/economy/useEconomy.ts`, which
  already existed and had **no callers** — the comment there literally says "for the My Growth /
  My Seeds lists". No columns were invented and no schema changed.
- Read-only is enforced three deep: no actions on the screen, SELECT-only RLS, and the ledgers are
  typed `ReadOnly<>` so a write wouldn't compile.

### 5. Day-1 empty state → `Day1CreatureSlot`
`src/features/world/Day1CreatureSlot.tsx` now owns the day-1 protagonist's position and size, and
renders the **existing box art unchanged** as a temporary stand-in. No new empty-state art was
invented — no seeds, no plots, no "claim your land", no distant farm.

The file's header says in as many words: the creature is NOT built here, swap `<StarterBox>` for it
and keep the props, because `onPress` is already wired to the first-life grant and `highlighted` to
the onboarding tour's pointing step. The creature inherits both for free.

## Notes by audience

### Sissi — decisions to look at
1. **You overrode the spec on tab labels.** The spec said leave bottom slot 1 as "My World" /
   "My Farm"; you chose to rename it to **Homestead / Grow** so the toggle and the tab always say
   the same two words. Done, and recorded in the commit. The onboarding card still says "This is
   your world" — that copy was not part of the rename.
2. **The non-farmer's right toggle still says "Bring yours"**, not "Grow". That is the one place
   the rename does not apply, because today's in-force rule (from the farmer-world spec) is that a
   non-farmer has no Grow world to name. The missing gating addendum changes exactly this — see
   below. One constant to flip when it lands: `FARMER_APPLICATION_COPY.toggle`.
3. **The balance sits right-aligned under the centred toggle**, not centred under it. Centred would
   stack two pills down the middle of the Grow plate and bury the sapling; right-aligned keeps the
   top-right corner it has always had. Easy to change.
4. **The box still reads as "you have nothing."** That is a known, deliberate cost of the stand-in
   and it is what the creature round fixes. It is written into the slot file so nobody "improves"
   it with different placeholder art in the meantime.

### Where the addendum will land
The gating addendum's three-state preview lock (anyone can swipe into Grow and see a greyed/locked
farmer tab bar; the apply entry IS that lock state) collides with exactly two things built here:
- `FARMER_APPLICATION_COPY.toggle` — a non-farmer's right label becomes "Grow", not an invitation.
- `WorldModeProvider.requestWorld()` — it currently REFUSES 'farmer-world' for a non-farmer and
  routes to `/apply` instead. Under the addendum it should allow the pan and show the lock.
Both are one edit each. Nothing else in this round is in the addendum's way.

### Other agents — build notes
- **Do not write `variant=` and `family=` together.** Use a role, or add one to
  `src/design/brand/textRoles.ts`. That file is the whole reason the home stopped drifting.
- The prop is `textRole`, not `role` — React Native's own `role` prop is the ACCESSIBILITY role and
  intersecting the two silently reduces both to `never`.
- `Day1CreatureSlot` is the only place that knows where the day-1 protagonist stands. Do not
  re-derive that position anywhere else.
- Still true from last round: Step 2 itself is NOT built. `post` / `plot-new` / `adoptable-new` /
  `farm-profile` / `apply` remain navigable placeholders.

## To do
- [ ] Save `revise/2026-08-19-farmer-gating-addendum.md` into the repo so the gating round can run.
- [ ] Swap the box for the real starter creature in `Day1CreatureSlot` when that round lands.
- [ ] Consider migrating `profile.tsx` and `map.tsx` off the old `src/design/tokens.ts` — they are
      the last two screens on the pre-brand palette, and they are now the only remaining font drift
      in the app. Out of scope for this spec; not touched.

## Honest BUILT vs REMAINING
- **BUILT:** all 5 items, verified in Expo web on both worlds and as a non-farmer — role layer and
  the home's serif voice; centred Homestead | Grow toggle; balance on both worlds; the read-only
  detail screen reading real ledger rows; the creature slot.
- **REMAINING:** the creature itself, the gating addendum, and everything behind the Step-2 stubs.
