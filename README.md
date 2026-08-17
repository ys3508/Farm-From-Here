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

## The core product insight

**Adoption is the promise. A real-world update is the proof.**

The user does not fundamentally need the act of adopting a tree — that interaction is easy to
build and easy to fake. What makes FARM FROM HERE different is the moment a real farmer sends a
real photo from the real farm.

Until the first real update arrives, the moat is only a claim.

After it arrives, the user experiences:

> **“Oh. This is actually real.”**

Therefore the V1 product priority is not a beautiful adoption animation. It is making the
**first real update arrive quickly, reliably, and credibly** after the user connects to a real
farm/tree.

### The key V1 metric

**Time to First Real Update (TTFRU)**

> Time between a user's adoption/connection and the first genuine farm update they receive.

The product should minimize this time while preserving truth. Never manufacture a fake growth
event, fake progress, or fake “new photo” to hide a real-world delay.

A second critical question is:

> **Does receiving a real update make the user want to return and participate again?**

That is the real V1 proof.

---

## Core loop (product loop)

The previous game-style loop was:

> Discover → Act → Earn → Support → See Impact → Return

That remains the long-term ecosystem loop, but **V1 must prioritize a tighter emotional loop:**

> **Discover → Connect → Receive Real Proof → Care → Return → Participate Again**

- **Discover** — find a real farm/adoptable.
- **Connect** — adopt or otherwise establish a real relationship with it.
- **Receive Real Proof** — the farmer posts a genuine photo/update from the real plot.
- **Care** — the user checks their tree/farm, learns what changed, and sees their relationship
  deepen.
- **Return** — the update notification brings the user back.
- **Participate Again** — quests, Seeds, Growth, volunteering, visits, and other actions deepen
  the relationship over time.

The broader ecosystem loop then becomes:

> **Discover → Act → Earn → Support → See Impact → Return**

Do not let the game loop replace the real-world loop.

---

## The first real update is the V1 “aha” moment

The product should be designed around a specific emotional sequence:

**Adopt / Connect**
↓
**Set honest expectation**
↓
**Farmer checks the real plot**
↓
**Real photo + real words**
↓
**User receives notification**
↓
**User opens My Tree**
↓
**“This is real.”**
↓
**User wants to see what happens next**

### Waiting is part of the product

If an update cannot happen immediately, do not fill the gap with fake game activity.

After adoption, show an honest bridge such as:

> Your tree is at Lin’s Farm.
> Lin usually checks this plot every 5–7 days.
> We’ll let you know when there’s something new.

The waiting period should communicate that the real world is continuing to operate. It is not a
screen-time problem to be masked with artificial XP animations.

---

## The farmer side is part of the consumer product

The user's need for a fast first update is equivalent to a farmer-side requirement:

> **Posting a real update must be easier than posting a social post.**

The farmer should be able to:

**Take Photo → Select Plot → Add one sentence → Post**

One farmer action can fan out to every adopter of that plot. This preserves the scalable data model:

**Farm → Plot → Adoptable → Adoption → User**

Updates belong to the **Plot**, not individual trees. A farmer's workload therefore grows with
the number of plots, not the number of adopters.

This is not a secondary admin feature. It is the mechanism that delivers the user's most
important V1 experience.

---

## The two economies (intentionally separate)

- **✨ Growth** — progression. Only rises; never spent. Powers levels, quests, collection, and
  feeding companion creatures. (The game's motivation layer.)
- **🌱 Seeds** — spendable currency. **Cannot be bought with money.** Earned only by doing
  real-world good. Spent on real-world impact (adopt a tree/crop/animal). **Seeds = proof of
  real-world participation, not proof of wallet.**

And distinct from both:

- **💚 Impact** — the real-world *result* of your actions (a tree supported, $ to local farms,
  volunteer hours, lbs of local produce). Seeds is the in-game currency; Impact is the real
  outcome. They are never mixed.

**V1 priority rule:** Growth and Seeds support the relationship; neither is allowed to become a
substitute for the relationship. Do not optimize V1 around points, streaks, or screen time.

---

## The four layers

Use this to judge every new feature — if it doesn't fit a layer, it may not be core.

1. **🌎 Real world** — farms, trees, crops, animals, farmers, volunteering, food.
2. **🎮 Game layer** — Growth, Seeds, quests, collection, companion creatures.
3. **💚 Impact layer** — money, volunteer hours, trees supported, local food, environmental actions.
4. **🧠 AI layer (V2+)** — personalized recommendations, nature companion, local discovery,
   impact explanation, environmental intelligence.

### Feature filter

For every proposed feature ask:

1. Does it deepen a user's relationship with something real?
2. Does it help produce, deliver, understand, or return to a real-world update?
3. Does it push the user toward reality rather than replacing it with more screen time?

If the answer is no to all three, it should probably not be V1.

---

## Data model

**Farm → Plot → Adoptable → Adoption → User.** Farmers post updates at the **Plot** level; each
update fans out to every user who adopted an item in that plot. `adoptables` is generalized to
**tree / crop / animal** (Apple Tree is the V1.0 hero; crop/animal are reserved). A user names
their own adoptable (`display_name`) without changing the real item's identity (`#1048`).

---

## Two-sided platform (strategy)

FARM FROM HERE is ultimately a two-sided platform. The consumer side is Discover → Play → Support
→ Volunteer → Buy → Impact. The farmer side is the reverse product: create profile → post
needs → receive funding → recruit volunteers → sell products → build community.

A farmer must get at least four kinds of value — **💰 Money** (funding/sales), **👥 People**
(customers), **🤝 Labor** (volunteers), **📣 Visibility** (community reach).

But for V1, the first farmer-side job is simpler:

> **Can a real farmer reliably publish authentic updates with almost no friction?**

If the farmer workflow fails, the consumer experience fails.

---

## 🧚 Companion Creatures (V2+ feature)

Collectible companions that live alongside the player. **The emotional layer of the product** —
hierarchy stays:

> **Real world = core. Game = motivation. Creature = emotional attachment.**

Creatures are not the main character and must not steal the spotlight from real farms/trees.
They are a later retention layer, not a V1 substitute for real-world updates.

---

## North Star

> **Does it make the person's relationship with the real world deeper and more like a world worth
> returning to?**

### V1 North Star refinement

> **Can we make a user care about something real, prove that the relationship is real with a
> timely authentic update, and make them want to come back for the next one?**

Build mechanics that push users toward reality; cut mechanics that only add screen time or
substitute for reality.

---

## Stack

React Native + Expo (native iOS + Android) · Supabase (Auth / Postgres / Storage) · Resend
(email = return engine) · stylized map. Real-money payments deferred to V2 (Stripe).

## Repo docs

- **README.md** — what this is / why.
- **design.md** — visual design system, My World structure, and companion positioning.
- **plan.md** — the V1.0 build plan and dependency order.
- **revise/*.md** — implementation specs handed to Claude Code.
