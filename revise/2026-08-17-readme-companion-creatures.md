# README addition — Companion Creatures (未来功能 / Future Feature)

> Add this section to `README.md` under a "Future Vision" or "Roadmap" area.
> This is a **V2+ feature**. It is documented now so the product vision is complete
> and so the V1.0 schema can (optionally) reserve its relationships. The interactive
> behavior (AI dialogue, desktop presence) is NOT built in V1.0.

## 🧚 Companion Creatures (伴生精灵)

Collectible companion creatures that live alongside the player in the FARM FROM HERE world.

### What they are
- **Collectible.** There are multiple creatures to discover and collect. Creatures feed the
  COLLECTION system.
- **Fed with Growth, not Seeds.** Creatures are nurtured using **Growth** (the progression
  currency), giving Growth a concrete purpose beyond a rising number. Feeding consumes Growth
  and is recorded through the existing `growth_ledger`. Seeds are never used for creatures —
  this keeps the two economies distinct (Seeds = real-world impact currency, Growth = progression).
- **Earned through the real world, not bought.** Creatures cannot be purchased. They are
  obtained by:
  - visiting a real local farm in person, and/or
  - completing certain COLLECTION milestones or QUESTS.
  This keeps creatures aligned with the product's North Star — pulling the user toward the
  real world — and consistent with the core economic principle that value comes from
  real-world participation, not from a wallet.
- **Conversational.** A creature can talk with the user. (Requires an AI/LLM layer — part of
  the planned V2.0+ AI layer.)
- **Desktop presence.** A creature can be placed on the user's desktop as a companion.

### Why it fits the product
Companion Creatures tie together three otherwise separate systems — **Growth** (feeds them),
**Collection / Quests** (unlock them), and the **real world** (visiting real farms earns them).
The creature becomes a soft, emotional daily-return hook that still points outward to reality.

### Important build notes (为什么这是 V2+)
- **Conversation = AI layer.** Making a creature talk requires integrating a language model,
  designing its persona, and handling cost/safety. This belongs to the previously-planned
  V2.0+ AI layer.
- **"Desktop pet" conflicts with the current PWA form factor.** A creature that floats on the
  desktop (outside the browser) requires a native/desktop shell (e.g. Electron) or an OS-level
  widget — a **pure PWA cannot render a pet onto the desktop**. Delivering a true desktop
  companion is therefore a form-factor decision, not just a feature, and is deferred to V2+.

### V1.0 relationship to schema (optional reservation)
If the product owner chooses, the V1.0 schema may reserve the creature relationships so they
don't require a relationship migration later:
- `creatures` — creature species/types: name, rarity, how it's obtained
- `user_creatures` — a user's owned creature instances: feed level, state, linked profile
- Feeding spends Growth via the existing `growth_ledger`.

No creature interactivity (dialogue, desktop rendering) is implemented in V1.0.
