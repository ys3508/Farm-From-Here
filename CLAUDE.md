# FARM FROM HERE — working notes for Claude Code

A location-based mobile game where **everything on the map is real** — real local farms, real
farmers, real trees you adopt and watch grow. This file is the orientation layer; the substance
lives in the docs below.

## Doc map (read the one you need, not all of them)
- **README.md** — what this is / why. Strategy, the two economies, the four layers, North Star.
- **plan.md** — V1.0 build plan, the 7 steps in dependency order, deferred list, active blockers.
- **design.md** — visual design system, My World structure, creature positioning.
- **revise/*.md** — implementation specs, dated `YYYY-MM-DD-<slug>.md`. These are the build orders.
- **Proposal.docx** — the original source document the above was distilled from.

## Where the project actually stands (2026-08-17)
- **Docs-only repo. No app code exists yet.** Nothing has been scaffolded.
- **Step 1 (Foundation)** is specced in `revise/2026-08-17-step1-foundation.md` and is the next
  build. Steps 2–7 must not start until Step 1's schema is verified by the owner in Expo Go —
  a wrong schema reworks the remaining six steps.
- Open product decisions are still **unanswered** (see "Ask, don't guess" below).
- Offline blocker: **no real farm/farmer signed yet.** The "real" experience depends on a farmer
  posting ongoing updates. Owner's task; does not block building.
- **This Mac has no Node/npm.** Check `node -v` before planning any Expo work.

## Working model
- Specs are written into `revise/` (dated). **Claude Code implements from them** — per
  `README.md`'s repo-docs note and plan.md Step 1 status.
- At the end of a meaningful work session, write a handoff note to
  `updates/YYYY-MM-DD_CC_<slug>.md`: (1) what was done, (2) notes by audience — Sissi
  (decisions), other agents (build), (3) to-do list. Be honest about BUILT vs REMAINING.
- Keep **plan.md**'s Step status lines and "Active blockers" current as work lands.
- Offer to commit; don't assume.

## Product invariants — violating these produces wrong code
1. **Three separate quantities. Never mix them.**
   - **Growth** — progression. Only rises; never spent (V1). Powers levels/quests/collection, and
     later feeds creatures. User-facing word is "Growth", never "XP".
   - **Seeds** — spendable currency. **Cannot be bought with money, ever.** Earned only by
     real-world good. Spent on real-world impact (adopting).
   - **Impact** — the real-world *result* (a tree supported, $ to a farm, volunteer hours, lbs of
     produce). Not a currency. Never derived from or displayed as Seeds.
2. **Ledgers are the source of truth.** `growth_ledger` / `seeds_ledger`. `profiles.growth_xp`
   and `profiles.seeds_balance` are caches. Never mutate a balance without a ledger row.
3. **Farmer updates attach to the PLOT, not the adoptable.** One update fans out to every user
   who adopted an item in that plot. This is what lets "real" scale — farmer workload grows with
   plots, not adopters.
4. **`adoptables` is generalized:** tree / crop / animal, one funnel. Apple tree is the V1.0 hero;
   crop/animal are a schema exercise only — do not build three complex experiences at once.
5. **Identity vs pet name.** The real item's identity (`#1048`) lives on `adoptables` and never
   changes. The user's chosen name lives on `adoptions.display_name` (per-user).
6. **Only real, contracted farms.** Never seed or import third-party farm data as if it were real.
7. **Native app, not a web/PWA** — React Native + Expo, iOS + Android, previewed in Expo Go.
8. **Locked modules are narrative, not broken.** "Coming soon" is deliberate storytelling — the
   user sees the whole world on day one. Don't ship dead buttons or hide the modules.
9. **Reserved tables get relationships, not behavior.** Build the FKs; implement no logic.
10. **Don't fake the art.** The look is a hand-drawn farmers-market food map. Code sets palette,
    type and texture and leaves **clearly-marked illustration slots** for real painted assets.
11. **North Star test for any new feature:** does it deepen the person's relationship with the
    real world? Cut mechanics that only add screen time or substitute for reality.

## Ask, don't guess
The spec deliberately leaves these to the product owner. Ask before choosing — do not invent
product rules to unblock a schema:
- `adoptables.status` exact values
- `adoptions.type` and `adoptions.status` exact values
- V1 Seeds earning actions and their values; initial Growth/Seeds grants; adoption costs
- any additional referral-eligibility rule (reward is 500 Seeds each side, after signup completes)

If a placeholder is unavoidable, make it a single named constant and flag it loudly.

## Stack
React Native + Expo (iOS + Android) · Supabase (Auth / Postgres / Storage) · Resend (email =
return engine) · stylized map (not precise GPS). Real-money payments deferred to V2 (Stripe).
