# FARM FROM HERE — design.md

Visual design system, My World structure, and Companion Creature positioning.
(This file holds the "what it looks like" layer. Product/strategy lives in README.md;
build specs for CC live in revise/*.md.)

---

## 1. Visual design system

### Feel
The app should feel like **a living hand-drawn community food map** — warm, tactile, real —
NOT a cold tech product. Reference: hand-painted farmers-market illustrations (tomatoes on the
vine, strawberries in a berry basket, herbs tied with string, citrus, sardine tins), paper-sticker
textures, playful hand-lettered accents.

### Direction keywords (for implementation)
hand-drawn / watercolor illustration · warm earthy farmers-market palette · textured & tactile
(paper-sticker feel) · playful hand-lettered accents · real-produce imagery.

### Design tokens (define once, reuse in every step)
- **Color palette** — warm earth tones + produce accents (greens, tomato red, citrus orange,
  cream/paper background). Define as named tokens, not hard-coded hex scattered in components.
- **Typography** — a warm/rounded or lightly hand-lettered display face for headings; a clean,
  legible face for body. Define a type scale.
- **Buttons / cards / radius / spacing** — one set of shared components with consistent corner
  radius and a spacing scale.
- **Logo placement** — consistent across screens.
- **Illustration slots** — code establishes palette/type/texture direction and leaves
  **clearly-marked slots** where hand-painted illustration assets will go later. Code cannot
  generate the paintings themselves; do not fake them — leave the slot and note it.

### Constraint
Every later step reuses this system. Do not let each step invent its own look — one design
language, applied everywhere.

---

## 2. My World — the home dashboard

My World is the app's home and its biggest differentiator. It is a **personal real-world
relationship map / dashboard**, not a generic feed. It shows the things the user has a real
relationship with.

### V1.0 priority

The home experience must make the user's **real relationship** visually obvious.

The first question My World should answer is:

> **“What is happening in my real world right now?”**

Therefore the visual hierarchy should be:

1. **New real update / My Tree** — the most prominent element.
2. **My Farms / real places** — the surrounding real-world context.
3. **Growth / Seeds** — secondary progress indicators.
4. **Future systems** — visible as narrative previews, not competing with the real relationship.

A real photo/update should always outrank a generic XP card or decorative game mechanic.

### Modules (V1.0)
- 🌳 **My Tree / Adoptable** — the adopted tree (hero experience), its growth timeline.
- 📸 **Latest Real Update** — the newest genuine farmer update; deep-links to My Tree.
- 🧑‍🌾 **My Farms** — farms the user is connected to.
- 🌱 **My Seeds** — spendable currency balance (live).
- ✨ **My Growth** — progression balance (live).
- 🐣 **My Creatures** — reserved; "coming soon" in V1.0.
- 🏆 **My Quests** — reserved; "coming soon" in V1.0.
- 🤝 **My Volunteer Hours / My Impact** — reserved; "coming soon" in V1.0.

### Rule
Only live modules are interactive. Locked modules are **narrative** ("coming soon"), not broken.
The lock is storytelling — it lets a user see the whole world on day one and anticipate it
unlocking.

Do not let the “complete world skeleton” principle flatten the hierarchy. V1 may show the whole
world, but **the real update remains the visual and emotional center**.

### Real update states

The design must support at least these states:

- **Waiting** — user has connected/adopted but no new update exists yet.
- **New** — an unseen genuine update has arrived.
- **Seen** — the user has opened the update.
- **Milestone** — a farmer marks a meaningful real-world event.
- **Empty / no new update** — honest state; do not invent activity.

The waiting state must communicate honest timing. Example:

> Your tree is at Lin’s Farm. The next farm check is usually in 5–7 days.
> We’ll let you know when there’s something new.

Do not use fake “growth” animations, fake photos, or artificial progress to cover real-world
waiting.

### Map
Stylized world-view map (not precise GPS). Real farm coordinates → real distance shown as text
("3.2 km away"). "Open in Google Maps" for navigation. Only real, contracted farms appear.

The map should support discovery, but it must not visually overpower the real update / tree
relationship.

---

## 3. Companion Creature — positioning

Creatures are the **emotional layer** of the product. The hierarchy must stay:

> **Real world = core. Game = motivation. Creature = emotional attachment.**

The creature is NOT the main character and must not steal the spotlight from real farms/trees.
It is the soft daily-return hook that still points the user outward to reality:
- Fed with **Growth** (never Seeds, never money).
- Obtained only through **real-world action** (visiting a real farm) or completing
  collection/quests — never purchased.
- Conversational + desktop presence are **V2+** (AI layer / form-factor). V1.0 reserves the
  schema only, builds no creature interactivity.

Design implication: when creatures do arrive, they should feel hand-drawn and alive in the same
farmers-market illustration language — a companion in the food-map world, not a separate game.
