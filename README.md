# FARM FROM HERE

A location-based game where **everything on the map is real.** Open the app and your real
neighborhood is rendered as a living, growing map — real local farms, real farmers, real trees
you can adopt and watch grow. Every action in the game maps to something happening in the real
world.

**The moat:** in other life-sim games you raise something virtual. Here it's real — a real tree,
a real farm, a real farmer on the other end sending you photos of it growing. It isn't software;
it's a relationship with the real world. That can't be copied.

**Positioning:** Pokémon GO (real geography + exploration + collection) × Duolingo (quests +
progression + rewards) × local farmers × real environmental impact.

---

## Core loop (母循环)
Every feature serves this:

> **Discover → Act → Earn → Support → See Impact → Return**

Discover a nearby farm → volunteer / walk / bike → earn **Seeds + Growth** → spend Seeds to
adopt a real tree → the farmer posts growth photos → you see your real-world impact → you come
back to keep participating.

---

## The two economies (intentionally separate)

- **✨ Growth** — progression. Only rises; never spent. Powers levels, quests, collection, and
  feeding companion creatures. (The game's motivation layer.)
- **🌱 Seeds** — spendable currency. **Cannot be bought with money.** Earned only by doing
  real-world good (healthy-lifestyle actions; money spent in ways that genuinely help a farm can
  reward Seeds — money never converts straight to Seeds). Spent on real-world impact (adopt a
  tree/crop/animal). **Seeds = proof of real-world participation, not proof of wallet.**

And distinct from both:

- **💚 Impact** — the real-world *result* of your actions (a tree supported, $ to local farms,
  volunteer hours, lbs of local produce). Seeds is the in-game currency; Impact is the real
  outcome. They are never mixed.

---

## The four layers
Use this to judge every new feature — if it doesn't fit a layer, it may not be core.

1. **🌎 Real world** — farms, trees, crops, animals, farmers, volunteering, food.
2. **🎮 Game layer** — Growth, Seeds, quests, collection, companion creatures.
3. **💚 Impact layer** — money, volunteer hours, trees supported, local food, environmental actions.
4. **🧠 AI layer (V2+)** — personalized recommendations, nature companion, local discovery,
   impact explanation, environmental intelligence.

---

## Data model
**Farm → Plot → Adoptable → Adoption → User.** Farmers post updates at the **Plot** level; each
update fans out to every user who adopted an item in that plot. So a farmer's workload grows with
the number of *plots*, not the number of adopters — this is what lets the "real" experience scale.
`adoptables` is generalized to **tree / crop / animal** (Apple Tree is the V1.0 hero; crop/animal
are reserved). A user names their own adoptable (`display_name`) without changing the real
item's identity (`#1048`).

---

## Two-sided platform (strategy)
FARM FROM HERE is ultimately a two-sided platform. The consumer side is Discover → Play → Support
→ Volunteer → Buy → Impact. The **farmer side** is the reverse product: create profile → post
needs → receive funding → recruit volunteers → sell products → build community. A farmer must get
at least four kinds of value — **💰 Money** (funding/sales), **👥 People** (customers),
**🤝 Labor** (volunteers), **📣 Visibility** (community reach). "The app is fun for users, but why
would a farmer use it?" is answered here — and that answer is part of the moat.

---

## 🧚 Companion Creatures (V2+ feature)
Collectible companions that live alongside the player. **The emotional layer of the product** —
hierarchy stays: **Real world = core, Game = motivation, Creature = emotional attachment.**
- Fed with **Growth** (never Seeds, never money).
- Obtained only through **real-world action** (visiting a real farm) or completing
  collection/quests — never purchased. Aligned with the North Star: pull the user toward reality.
- **Conversational** (requires the V2+ AI layer) and can be placed on the desktop as a companion.
- **Why V2+:** dialogue needs an LLM integration (persona, cost, safety); a true "desktop pet"
  needs a native/desktop shell beyond the mobile app. V1.0 reserves the schema
  (`creatures`, `user_creatures`), builds no creature interactivity.

---

## North Star
Does it make the person's relationship with the real world deeper and more like a world worth
returning to? Build mechanics that push users toward reality; cut mechanics that only add screen
time or substitute for reality.

---

## Stack
React Native + Expo (native iOS + Android) · Supabase (Auth / Postgres / Storage) · Resend
(email = return engine) · stylized map. Real-money payments deferred to V2 (Stripe).

## Repo docs
- **README.md** — what this is / why (this file).
- **design.md** — visual design system, My World structure, creature positioning.
- **plan.md** — the V1.0 build plan and 7 steps.
- **revise/*.md** — implementation specs handed to Claude Code.
