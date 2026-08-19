# 2026-08-19 — Farmer World toggle + consumer tab reorder

Spec built from: `revise/2026-08-19-farmer-world-and-tabs.md` (committed alongside the code).

## What was done

### Task 1 — consumer tab reorder (own commit)
`My World | Quest | Farm | Community | Me` → **`My World | Farm | Quest | Community | Me`**.
Only Quest and Farm swapped. Labels, kickers, icons, routes and screens are untouched. There is
no index-based tab logic anywhere in the app — declaration order in `app/(app)/_layout.tsx` *is*
the bar order — so nothing else needed changing. Verified in Expo web: new order renders, My World
is still the default tab, `/quest` and `/farm` deep links still land on their own screens.

### Task 2 — Farmer World
- **`activeWorld` is the single source of truth.** It lives in `WorldModeProvider`, above the tab
  navigator. The canvas derives its pan position from it and the tab bar derives slots 1–2 from it.
  Nothing else stores "which world am I in".
- **Two panels, one canvas.** `app/(app)/world.tsx` stacks Farmer World (sky plate) above My World
  (dunes) and pans between them. My World's old screen body moved verbatim into
  `src/features/world/MyWorldPanel.tsx` — no logic changed, it just takes its size from the parent.
- **Toggle + swipe are the same action.** Crossing the seam mid-drag snaps the toggle *and* the tab
  bar in the same frame, because both render `activeWorld`.
- **Farmer bar: `My Farm | Post | Quest | Community | Me`.** One navigator, every screen declared
  once. Only slots 1 and 2 change. Slot 1 does not even change route — My World and My Farm are two
  panels of the same canvas screen, so only the label and glyph move. Slot 2 flips `href` between
  `farm` and `post`. **Verified in the browser that the Quest screen's DOM node survives a world
  switch** — same instance, not remounted, not forked.
- **The gate is one `farm_members` row** (`useFarmerMembership`), and it fails closed: a failed read
  or an unconfigured backend is "not a farmer". A pure consumer never mounts the Farmer World panel
  at all, has no pan gesture installed, and is redirected home from any farmer route reached by URL.
- **Non-farmer right toggle → the application entry** (`app/(app)/apply.tsx`).

## Notes by audience

### Sissi — decisions to look at
1. **Swipe direction.** The spec said both "pans up from My World into Farmer World" (which means
   dragging *down*, like a map) and "swiping up". Those are opposite. You chose **swipe up enters
   Farmer World**. It is one flag — `SWIPE_UP_ENTERS_FARMER_WORLD` in `src/config/farmerWorld.ts` —
   flip it if it feels inverted on a real phone. Nothing else encodes the direction.
2. **Tagline copy is a placeholder**, in one constant: `FARMER_APPLICATION_COPY` in
   `src/config/farmerWorld.ts`. Title / subtitle / button are the spec's words. I added a fourth,
   `toggle: 'Bring yours'` — the right-hand pill label a non-farmer sees, because the pill is too
   narrow for the full tagline and it must not say "Farmer World" at someone who does not have one.
   All four are yours to replace in one edit.
3. **The balances pill rides with My World** rather than staying pinned to the screen. Growth and
   Seeds are the player's economy; panning up to your farm leaves the scoreboard behind. Easy to
   change if you want it fixed in both worlds.
4. **Preview mode now defaults to being a farmer**, so the whole Farmer World is reviewable. Put
   `EXPO_PUBLIC_PREVIEW_FARMER=false` in `.env.local` (and restart with `-c`) to review the
   consumer side. Both were checked; the application entry is in the `/dev` index either way.
5. **The waiting count shows a dash, not a number.** "— people are waiting for your photos" is
   deliberate: there is no adoption data yet and a plausible fake number shown to a real farmer
   would be a lie.

### Other agents — build notes
- **The Step-2 farmer screens did NOT exist and were STUBBED.** `post`, `plot-new`,
  `adoptable-new`, `farm-profile` and `apply` are navigable placeholders that name the section of
  `revise/skills/2026-08-17-step2-farmer-portal.md` that will build them. Do not treat them as
  built. Nothing from Step 2 was rebuilt here — this round is the world-switching shell only.
- `FarmerStub` is deliberately NOT `ComingSoon`. `ComingSoon` is narrative ("Farm" is *meant* to
  say not-yet, invariant 8). `FarmerStub` is an honest "not built yet" shown only to a farmer.
- Management actions (create plot / add adoptable / edit farm profile) live INSIDE My Farm and must
  never get bottom tabs. Slot 2 stays the post-an-update hero action and nothing else.
- `farm_members` embeds do not type-check through the shared `ReadOnly<>` helper in
  `lib/supabase/types.ts` (empty `Relationships`), so the farm name is a second query, not a join.

## To do
- [ ] Replace the tagline placeholders once the copy is final (one constant).
- [ ] Check the swipe direction on a real phone; flip the flag if it reads inverted.
- [ ] Owner: align the two art plates at the seam — the code stacks them and does not blend them.
- [ ] Step 2 proper: the application form, My Farm's real plot list and waiting count, and the
      30-second post flow. Every one of them has a stub route waiting.
- [ ] `plan.md` was not touched this round (its Step status lines were left alone rather than
      swept into a commit alongside your in-progress doc edits).

## Honest BUILT vs REMAINING
- **BUILT:** tab reorder; two-panel canvas + pan + snap; toggle; `farm_members` gate with a
  fail-closed default and route-level enforcement; the farmer tab bar with shared slots 3–5;
  application entry; navigable stubs.
- **REMAINING:** every screen behind those stubs, the real waiting count, the plot list, the
  application form and its tables, and the art seam.
