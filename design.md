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

### Modules (V1.0)
- 🌳 **My Tree / Adoptable** — the adopted tree (hero experience), its growth timeline.
- 🧑‍🌾 **My Farms** — farms the user is connected to.
- 🌱 **My Seeds** — spendable currency balance (live).
- ✨ **My Growth** — progression balance (live).
- 🐣 **My Creatures** — companion creatures (reserved; "coming soon" in V1.0).
- 🏆 **My Quests** — quests (reserved; "coming soon" in V1.0).
- 🤝 **My Volunteer Hours / My Impact** — real-world outcomes (reserved; "coming soon").

### Rule
Only live modules are interactive. Locked modules are **narrative** ("coming soon"), not broken.
The lock is storytelling — it lets a user see the whole world on day one and anticipate it
unlocking. This is the "complete world skeleton, blood grows from the heart first" principle.

### Map
Stylized world-view map (not precise GPS). Real farm coordinates → real distance shown as text
("3.2 km away"). "Open in Google Maps" for navigation. Only real, contracted farms appear.

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
