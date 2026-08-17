# 2026-08-17 — Claude Code — Step 1: Foundation

Built from `revise/2026-08-17-step1-foundation.md`. The repo went from docs-only to a running
Expo app with the full V1.0 schema.

---

## 1. What was done

**BUILT and verified**

- **Expo app scaffold** — React Native + Expo **SDK 57**, TypeScript, expo-router. iOS + Android.
  Verified: `tsc --noEmit` clean; `expo export` bundles **both** platforms; `expo start` serves
  the Expo Go manifest and the real device bundle (1,531 modules, no errors).
- **Design system** (`src/design/`) — one token set (colour, 7-step type scale, 4pt spacing,
  radius, warm shadows) plus shared components: `Text`, `Button`, `Card`, `Screen`, `Field`,
  `Logo`, `BalancePill`, `IllustrationSlot`. Fraunces + Nunito, deep-imported so only the 7
  weights we use ship (the package barrel would have bundled ~4 MB of unused fonts).
- **Database** — 6 migrations, 27 tables, all parsed against the real Postgres grammar.
  Live spine: profiles / farms / farm_media / farm_members / plots / adoptables / adoptions /
  plot_updates / plot_update_media / growth_ledger / seeds_ledger / referrals.
  Reserved (tables + FKs, zero logic): payments, donations, rewards, redemptions, quests,
  quest_completions, collection, impact_events, farm_events, farm_volunteer_opportunities,
  farm_produce, farm_contacts, creatures, user_creatures.
- **The two economies, enforced in the database** — not in app code, where a later step could
  forget. A direct `UPDATE` to `profiles.growth_xp` or `seeds_balance` **raises**; balances move
  only via ledger triggers. Ledgers are append-only. The client has SELECT and no INSERT on
  either ledger, so **a client cannot mint Seeds** — the "Seeds cannot be bought" principle is
  structural, not a convention. Overdraft raises, with the profile row locked against concurrent
  spends.
- **Auth, all 7 entry points** — Email, Google, Facebook, Twitter/X, Apple (native sheet on iOS),
  Guest (anonymous sign-in), Phone (**UI built, backend a deliberate stub**), plus the referral
  code field. PKCE flow, protected routes, sign-out.
- **Signup grants + referral accounting** — one `handle_new_user` trigger covers every provider:
  creates the profile, generates a referral code, grants Growth + Seeds, and settles a referral
  (500 Seeds each side) **only at signup completion**. A bad code never blocks a signup.
- **Frontend** — designed sign-in screen; **My World** as a personal real-world dashboard with
  live Growth + Seeds balances and their ledger history, and narrative "coming soon" modules for
  Creatures / Quests / Volunteer Hours / Impact; stylised SVG map with live distance text and
  "Open in Google Maps"; profile screen with the shareable referral code.
- **Seed fixture** — 1 farm → 1 plot → 4 trees + 1 crop + 1 animal, plus a plot update with 2
  media rows. Flagged `is_demo` and hidden from the app by default (see §2).

**NOT built — and why**

- **Migrations have never been executed.** This Mac has no Supabase CLI, no Docker, no `psql`.
  Every statement was parsed with the real Postgres grammar (`libpg-query`), which catches syntax
  but **not** catalog errors — a wrong column reference inside a trigger body would still pass.
  **This is the main thing that needs your eyes.** `supabase/README.md` has both ways to apply it.
- **No OAuth provider is actually connected** — that needs your keys in the Supabase dashboard.
- **Phone/SMS backend** — stub, per the spec. Costs money per message.
- **Resend** — not wired. It belongs to Step 5 (return engine); `.env.local.example` documents
  the key and the Edge Function approach.
- **Adopting** — Step 3. Seeds spending is not activated; the cost constants exist unused.
- **Movement earning** — the values you chose are recorded but nothing is wired; there is no
  pedometer and no anti-cheat (the spec defers anti-cheat).

---

## 2. Notes by audience

### For Sissi — decisions

**You answered four questions; three are settled, one needs a follow-up.**

1. **`adoptables.status` = available / adopted / growing / thriving / inactive.** Implemented
   verbatim. ⚑ **But flagging it:** this mixes two axes — *availability*
   (available/adopted/inactive) and *health/life-stage* (growing/thriving). One column holds one
   value, so an adopted tree that is thriving has to be recorded as one or the other, and you
   lose the ability to ask "is this adopted?" and "how is it doing?" separately. If you want both
   at once, that is a second `health` column and a small migration — cheapest to do **now**,
   before Step 3 writes against it. I did not redesign it on my own.
2. **`adoptions.type` = adoption/donation, `status` = pending/active/ended.** Implemented.
   Only `active` rows receive plot updates — that rule is in the database.
3. **Grants and adoption costs: left as flagged placeholders,** as you asked. They live in
   **one** file, `src/config/economy.ts`, with `⚠️ PLACEHOLDER` banners. Current stand-ins:
   signup 100 Growth + 500 Seeds; adoption tree 500 / crop 750 / animal 1000. These must be
   confirmed **before Step 3**, because that is when Seeds start being spent.
   `node scripts/check-pending.mjs` lists them and fails if the TS and SQL copies drift.
4. **Movement earning: 25 Seeds + 25 Growth for a 5,000-step day, once daily.** Recorded as final
   values in `DAILY_MOVEMENT_REWARD`; the ledger `source` exists. Not wired to any step counter.

**One new question the spec parked and I did not invent an answer to:** referral eligibility.
OAuth signups can't carry a referral code through the provider, so they claim it via an RPC right
after signing in. The only guard is the one already in the schema — referred once, never
yourself. **There is no time limit**, so an OAuth user who signed up months ago could still claim
a code today. If you want a window ("only within 24h"), it is one extra condition in
`20260817000600_referral_claim.sql`.

**Two files I was told not to edit are now slightly stale** (left untouched on purpose):
- `CLAUDE.md` says "This Mac has no Node/npm" — it does: Node v24.19.0, npm 11.17.0.
- `plan.md` Step 1 status still reads "packaged & handed to CC. Awaiting landing" and blocker #1
  still says "not yet landed". Step 1 has now landed but is **not yet verified in Expo Go**, so
  blocker #1 is still true in substance.

**The seed fixture and invariant 6.** The spec asks for seed data; CLAUDE.md forbids seeding farm
data as if it were real. Resolved three ways rather than picking one: the row is
`is_demo = true`, it is named "DEMO FARM — not a real farm", and `useFarms` filters it out unless
`EXPO_PUBLIC_SHOW_DEMO_DATA=true`. When demo data *is* visible the map says so in a banner.
Delete it all with `delete from public.farms where is_demo;`.

### For other agents — build notes

- **Never write a balance.** `profiles.growth_xp` / `seeds_balance` are caches; a guard trigger
  raises on any non-ledger write. Insert a `growth_ledger` / `seeds_ledger` row instead. The
  ledger types are read-only in TypeScript too, so a client-side mint fails to compile.
- **Step 3 (adopting) needs a `SECURITY DEFINER` function**, not a client insert. It must, in one
  transaction: insert the `seeds_ledger` spend row, insert the `adoptions` row, and set the
  adoptable's status. There is deliberately no INSERT policy on `adoptions`.
- **The fan-out is already in the database.** `receives_updates_for_plot()` backs the RLS SELECT
  policy on `plot_updates`, so a user sees exactly the updates for plots they hold an active
  adoption in. Don't re-implement it in a query.
- **Adding a ledger `source`** means editing both the CHECK constraint in the migration and the
  list in `src/config/economy.ts`.
- **Storage paths are authorisation.** Both buckets key write access off the first path segment
  being a farm id: `farm-media/<farm_id>/…`, `plot-update-media/<farm_id>/<update_id>/…`.
- **Design:** import from `@/design` only; never hard-code a hex. New artwork goes through
  `<IllustrationSlot>` — `assets/illustrations/README.md` is the live art order.
- **`src/lib/supabase/types.ts` is hand-written.** Every table entry needs `Row`, `Insert`,
  `Update` **and** `Relationships` — drop any one and supabase-js silently falls back to an
  untyped schema and every query becomes `any`. (That bug was present and is fixed; the fix was
  verified by probing that a wrong-typed field errors.) Regenerate with
  `supabase gen types typescript --linked` once the CLI is installed.

---

## 3. To-do

**Blocking Step 2 — owner**
1. Create the Supabase project; run the 6 migrations in order (`supabase/README.md`).
2. `cp .env.local.example .env.local`, paste the URL + anon key, `npx expo start -c`.
3. Turn on **Anonymous sign-ins** (the Guest button needs it) and add both redirect URLs.
4. **Open it in Expo Go and verify the schema and the signup grants.** Sign up with email, then
   check `growth_ledger` and `seeds_ledger` each have a row and the profile balances match.
   Test a referral end-to-end with two accounts.
5. Decide the `adoptables.status` question in §2.1 — before Step 3.
6. Confirm the placeholder grants and adoption costs.

**Owner, not blocking**
7. OAuth keys for Google / Facebook / Twitter / Apple.
8. Sign the first real farm (still the standing offline blocker).
9. Commission the three illustrations in `assets/illustrations/README.md`.

**Next build session**
10. Step 2 — farmer backend: create farm/plots/adoptables, post a plot update with media.
    Do not start until step 4 above passes.
