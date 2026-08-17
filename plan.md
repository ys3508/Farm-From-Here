# FARM FROM HERE — plan.md

The V1.0 build plan: what we're proving, the dependency order, and what's deferred.
(Strategy/vision → README.md. Look/feel → design.md. Build specs for CC → revise/*.md.)

---

## The one thing V1.0 must prove

> **Can we make a user care about something real, prove that the relationship is real with a
> timely authentic update, and make them want to come back for the next one?**

The critical V1 moment is **the first real farmer update**. Adoption is the promise; the update is
the proof.

If this loop works, quests, economies, collection, AI, marketplace, sensors, and creatures become
worth building. If the first real update does not create a meaningful return behavior, none of
those layers matter yet.

### Primary V1 metric

**Time to First Real Update (TTFRU)** — time between adoption/connection and the first genuine
farm update received by the user.

Optimize for **fast + reliable + authentic**, not merely fast. Never fabricate an update to
improve the metric.

### Secondary validation question

After receiving the first real update:

> **Does the user want to come back and participate again?**

---

## V1.0 definition

One real farm + real adoptables + a frictionless farmer update workflow + a reliable first-update
delivery path + My Tree growth history + a simple My World + the minimum Growth/Seeds needed to
support the relationship.

The economies are supporting systems, not the V1 hero.

---

## Dependency order

### 1. Foundation
Native app scaffold (React Native + Expo, iOS+Android), schema, auth, design system, stylized
map, seed data.

Schema must support:
**Farm → Plot → Adoptable → Adoption → User**
and plot-level updates that fan out to all adopters of the plot.

Reserved-but-inactive tables remain reserved for future systems.

**Status:** packaged & handed to CC. Awaiting landing + owner verification in Expo Go.

**Gate:** Do not proceed based only on code existing. Verify the data structure and app boot in
Expo Go.

---

### 2. Farmer update pipeline — P0

Build the smallest possible real-world publishing workflow:

**Create Farm → Create Plot → Create Adoptable → Post Update**

The critical action is:

**Take Photo → Select Plot → Add one sentence → Post**

Requirements:
- photo first; text optional/minimal;
- plot-level publishing;
- update is timestamped and attributable to a real farm;
- one update fans out to all adopters of that plot;
- posting must be easier than posting on a social platform;
- support the “first update” use case explicitly.

**Gate:** A real farmer or realistic farmer test user can publish an authentic update in seconds,
and an adopter can receive it.

---

### 3. Consumer connection + adoption — P0

Build:

**Discover → Farm Profile → Adopt / Connect → My Tree**

The adoption experience should be emotionally clear but deliberately simple.

After adoption, immediately establish the real-world expectation:

- show the real farm;
- show the real plot/tree identity;
- show the farmer;
- show when the next update is likely, if known;
- explain that updates come from real farm activity.

Do not spend V1 effort on elaborate adoption animations.

**Gate:** A user understands what real thing they are connected to and what will happen next.

---

### 4. First Real Update + Return Engine — P0

This is the most important V1 slice.

Build the complete path:

**Farmer posts real update**
→ **update stored at Plot**
→ **fan-out to adopter**
→ **notification/email**
→ **user opens My Tree**
→ **sees real photo + real words**
→ **update becomes Seen**

Use Resend as the initial return engine.

Support honest waiting states before the first update.

**Gate:** The end-to-end loop works with a real photo and a real farmer update.

---

### 5. My Tree growth timeline — P0

Build the adopted item's real history:

- original adoption/connection;
- real update timeline;
- photos;
- farmer notes;
- optional real milestones;
- dates;
- latest/new/unseen state.

This is not a generic game profile. It is the user's window into a real ongoing relationship.

**Gate:** After receiving an update, the user has a reason to open My Tree again later.

---

### 6. My World home + world skeleton — P1

Build My World around the real relationship:

1. Latest Real Update / My Tree
2. My Farms
3. Growth / Seeds
4. future systems as narrative locks

The eight-system skeleton can remain visible, but it must not compete with the real update.

**Gate:** A returning user can immediately understand what is happening in their real world.

---

### 7. Growth / Seeds / Quests / Collection foundations — P1/P2

Only build the minimum needed to test continued participation.

Growth and Seeds should support real-world behavior; they should not become the reason users
stay inside the app.

Do not expand the quest catalog or economy until the first-update loop has been validated.

---

## Core V1 loop

### Emotional loop — highest priority

> **Discover → Connect → Receive Real Proof → Care → Return → Participate Again**

### Long-term ecosystem loop

> **Discover → Act → Earn → Support → See Impact → Return**

The second loop must grow out of the first, not replace it.

---

## What is explicitly NOT the V1 priority

Do not prioritize:
- elaborate adoption animations;
- large quest catalogs;
- XP/streak optimization;
- companion creature interactivity;
- community feed;
- marketplace;
- precise GPS/AR;
- AI features;
- fake “growth” animations used to cover real-world waiting;
- any mechanic whose main effect is increasing screen time without deepening the real relationship.

---

## Deferred (V2/V3 — do not build now)

Real-money payments / Stripe settlement · merchant rewards catalog · movement/volunteer/farm-
support Seeds earning with real verification · AI plant diagnosis · drones · cameras · smart
irrigation · complex environmental calculations · creature dialogue (AI) + desktop pet · precise
GPS/AR · community feed · local food marketplace.

Reserved in schema now: donations, payments, rewards, redemptions, quests, quest_completions,
collection, impact_events, farm_events, farm_volunteer_opportunities, farm_produce, creatures,
user_creatures.

---

## Active blockers (in order)

1. **Step 1 not yet landed/verified by CC.** If the schema is wrong, later work reworks.
   Verify the structure and app boot in Expo Go.
2. **No real farm/farmer signed yet.** This is the most important offline dependency because the
   product's core proof requires authentic ongoing updates.
3. **First-update test path.** As soon as a farm exists, test the complete:
   adoption → waiting expectation → farmer update → notification → My Tree return path.

The absence of a signed farmer is an owner/offline task and does not block advisory work, but it
does block genuine validation of the V1 promise.

---

## Open decisions

Exact values for `adoptables.status`, `adoptions.type`, `adoptions.status`; V1 Seeds earning
actions/values; initial Growth/Seeds amounts.

New product decisions to resolve only when implementation needs them:
- expected update cadence shown to users;
- notification timing/content;
- what counts as the user's “first real update”;
- minimum evidence/metadata attached to a genuine update.

Do not let these decisions delay the core data/update pipeline unnecessarily.
