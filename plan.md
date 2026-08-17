# FARM FROM HERE — plan.md

The V1.0 build plan: what we're proving, the 7 steps in dependency order, and what's deferred.
(Strategy/vision → README.md. Look/feel → design.md. Build specs for CC → revise/*.md.)

---

## The one thing V1.0 must prove
> Will a young person keep participating in real-world activities for the sake of a real
> farm / tree they care about?

If yes, then AI, marketplace, sensors, and creatures become worth building. If no, none of it
matters. Everything in V1.0 serves this single question.

## V1.0 definition
One real farm + real adoptables + real user actions + two economies (Growth + Seeds) +
a beautiful My World + real farm updates.

---

## The 7 steps (dependency order)

1. **Foundation** — Native app scaffold (React Native + Expo, iOS+Android), full schema
   (Farm→Plot→Adoptable→Adoption, plot_updates fan-out, dual ledgers, referrals), auth (7 entry
   points), design system, stylized map, seed data. Reserved-but-inactive tables: transactions,
   quests/collection, farm sub-tables, impact_events, companion creatures.
   **Status: packaged & handed to CC. Awaiting landing + owner verification in Expo Go.**
2. **Farmer backend (minimal)** — create farm / plots / adoptables; post plot updates
   (photos+video+text+optional milestone). Posting an update must be easier than a social post.
3. **Consumer: Discover → Farm Profile → adopt an adoptable with Seeds.**
4. **My Tree growth timeline** — the soul of V1.0; the adopted item's real growth history.
5. **Return engine** — plot update → Resend email → pulls user back to My Tree.
6. **My World home + eight-system skeleton** — GROVE live, others "coming soon" (narrative locks).
7. **Onboarding quest "Plant Your Roots" + Collection/Growth base pages.**

## Core loop (every feature serves this)
> Discover → Act → Earn → Support → See Impact → Return

Discover a nearby farm → volunteer/walk/bike → earn Seeds + Growth → spend Seeds to adopt a real
tree → farmer posts growth photos → user sees their impact → returns to keep participating.

## Hero experience
**Apple Tree = the hero.** Crop/animal exist in schema (the generalized `adoptables.type`) but
are only a schema exercise in V1.0 — do NOT build all three as complex experiences at once.

---

## Deferred (V2/V3 — do not build now)
Real-money payments / Stripe settlement · merchant rewards catalog · movement/volunteer/farm-
support Seeds earning with real verification · AI plant diagnosis · drones · cameras · smart
irrigation · complex environmental calculations · creature dialogue (AI) + desktop pet · precise
GPS/AR · community feed · local food marketplace.

Reserved in schema now (relationships locked, logic later): donations, payments, rewards,
redemptions, quests, quest_completions, collection, impact_events, farm_events,
farm_volunteer_opportunities, farm_produce, creatures, user_creatures.

---

## Active blockers (in order)
1. Step 1 not yet landed/verified by CC — if the schema is wrong, the remaining 6 steps rework.
   Do not advance to Step 2 until owner verifies the data structure runs in Expo Go.
2. Offline: no real farm/farmer signed yet. The whole "real" experience depends on a farmer
   posting ongoing updates — owner's offline task, does not block the chat/advisory lane.

## Open decisions parked for CC to ask on
Exact values for `adoptables.status`, `adoptions.type`, `adoptions.status`; V1 Seeds earning
actions/values; initial Growth/Seeds amounts. (Advisor's recommended starting values exist and
can be adopted as configurable constants.)
