# FARM FROM HERE — Onboarding Redesign (Splash → Login → Sign up)

## Context (read this first)
Step 1 (foundation) is **already built and merged** — schema, Supabase auth (Email / phone /
Google / Facebook / Twitter/X / Apple / Guest), the two economies (Growth + Seeds), referral
accounting, and the My World home screen all exist. This task does **NOT** rebuild any of that.

The product owner is unhappy with the **visual design** of the current onboarding screens. This
task establishes ONE reusable **design system** and re-skins the **three onboarding screens only**
(splash, login, sign up) on top of the existing backend and auth logic.

**Before writing anything, read the existing repo** and locate: the current login/signup screen
components, any existing design-system / theme / shared-UI files, and the auth logic (Supabase
sign-in / sign-up / OAuth). **Reconcile with what exists — reuse and extend, do not duplicate or
re-wire working backend/auth.** The current onboarding already uses a warm cream background and a
dark-green button; treat that as a starting point to formalize, not throw away.

Stack is **React Native + Expo (iOS + Android native)** — NOT web/PWA. All screens are RN.
Owner previews via Expo Go / iOS simulator.

## Scope this round
- Establish/solidify ONE reusable design system (tokens + shared components) usable by all later screens.
- Re-skin THREE screens: **Splash (new)**, **Login (redesign)**, **Sign up (redesign)**.
- Wire to the **existing** backend/auth. Do NOT touch My World or any other screen this round.
- Username login: build the UI + real Email/Phone routing; leave **Username** as a clearly-marked stub.

---

## Assets (owner-provided illustrations)
Three hand-illustrated images live on the owner's machine at:
`/Users/sissi/Desktop/Farm-From-Here/ui_design/onboarding/`
- `splash.png` — splash background
- `login-bg.png` — login screen background
- `signup-bg.png` — sign-up screen background

They are the same illustration style, different scenes (grassy hills, a door opening onto a farm,
windmill, running dog, big soft clouds — warm colored-pencil / storybook texture).

**Copy these into the Expo project's assets folder** and reference them from there (Expo can't load
from an arbitrary Desktop path at runtime). Images are near portrait; use `resizeMode="cover"` so
full-screen phones don't crop the door or clouds. If any file is missing at build time, leave a
clearly-marked placeholder slot and tell the owner — do not block.

---

## Design system (tokens — make these the source of truth)
If a theme file already exists, fold these in / align it. Palette (owner-approved):

- `bg`           `#F7F4EC`  warm off-white, global background
- `surface`      `#FFFFFF`  cards / scrims
- `ink`          `#2C3A2E`  primary text (deep forest, not pure black)
- `inkSoft`      `#5A6B58`  secondary text
- `primary`      `#4C8C4A`  main green — buttons / emphasis
- `primaryDeep`  `#2F5E3A`  deep green — hover/pressed, headings
- `accentSky`    `#8FB4C4`  sparing sky accent
- `accentWarm`   `#E8B04B`  warm gold — milestones / celebration moments
- `line`         `#E3DECF`  hairlines / input underlines

**Hard rule: the brand color is GREEN, not blue.** Any default blue (links, focus rings) → `primary`.

**Typography**
- Display (headings, "FARM FROM HERE"): an **elegant thin serif with wide letter-spacing**
  (~0.08–0.16em). Suggested Google Font: `Cormorant` or `Playfair Display` — swappable, confirm
  with owner if unsure. Load via Expo font loading.
- Body: a clean humanist sans (e.g. `Inter`).
- **"Your journey begins here"**: an elegant **handwritten / script** font (e.g. `Dancing Script`
  or similar), rendered in **white**.

**Shape / space**
- Radius `14px` (soft, hand-drawn feel); primary buttons may be pill-shaped.
- Generous spacing, breathing room over density. Shadows very light or none — separate with
  whitespace and color, not heavy shadows.
- Keep clearly-marked slots for future hand-painted illustration assets.

---

## Screen 0 — Splash (NEW — does not exist yet)
Full-screen `splash.png`. Layered fade-in sequence, total ~3.5s, then a soft fade into Login.
**Tappable to skip** at any point (returning users must not be forced to wait).

Text, placed over the upper cloud/sky region (the clean area — do NOT overlap the door or grass):
1. `FARM FROM HERE` — display serif, wide letter-spacing. **Prefer one line; wrap to
   `FARM FROM` / `HERE` only if it would otherwise shrink too small.** Fades in first.
2. `Real world. Real growth.` — subtitle, smaller. Fades in second.
3. `Your journey begins here` — bottom of screen, smallest, **handwritten script, white**.
   Fades in last.

Suggested timing (tunable): image in 0–0.4s, title ~0.5s, subtitle ~1.2s, script line ~2.2s,
whole screen fades out ~3.5s → Login.

---

## Screen 1 — Login (redesign existing)
Background: full-screen `login-bg.png`.

A **white scrim CARD wraps ONLY the input area** (not the whole lower half) — a translucent
white rounded card (~90% opaque white, tunable) floating over the illustration, so fields read
clearly while the grass/clouds/door stay visible around it.

Inside the card:
- **One identifier field** accepting **Email / Username / Phone** (single input, placeholder makes
  the three-in-one clear).
- **Password field.**
- One **green primary button** (Log in).
- **"More options"** — **collapsed by default**; on tap expands to third-party buttons:
  **Google / Facebook / X / Apple.**
- **"Look around as a guest"** — guest mode, **browse-only**.
- Footer: "No account? **Sign up**" → Screen 2.

Backend routing this round:
- Detect whether the identifier is an email or phone and route to the correct existing Supabase
  method (reuse Step 1's auth — do not re-implement).
- **Username login: leave a clearly-marked stub** (Supabase doesn't do username natively; it needs
  a username→email/phone lookup that is out of scope this round). UI present, wired later.

---

## Screen 2 — Sign up (redesign existing)
Background: full-screen `signup-bg.png` + the same white scrim card treatment as Login.

- **Top of the card: a collapsible "Have a referral code?" row** — collapsed by default, expands to
  a code input on tap. (Placed at top so users with a code find it immediately, collapsed so users
  WITHOUT a code aren't scared into thinking a code is required.)
- Below: identifier field (Email/Username/Phone) + password + confirm → **Create account** button.
- **"More options"** third-party row, same as Login.
- **Referral reward (reuse existing Step 1 logic — do NOT rebuild):** 500 Seeds to referrer +
  500 Seeds to the new user, granted **only AFTER the new user completes signup**, recorded via
  `seeds_ledger`. Entering a code alone does not trigger it.

---

## Ask the owner before guessing
Where this spec conflicts with, or is under-specified against, the ACTUAL existing code, **ask
before choosing** — do not silently invent. In particular:
- Exact display / script font choices, if the suggested ones don't load cleanly in Expo.
- Whether an existing theme/design-system file should be extended vs. the token values above
  taking precedence (default: the token values above are the source of truth).
- Anything about auth wiring that would require changing working Step 1 backend logic.

## When done
- All three screens run in Expo Go with the new design system, using the real illustrations.
- Existing backend/auth still works (login, signup, OAuth, guest, referral accounting) — unchanged.
- My World and other screens untouched (they get re-skinned in later rounds using this same system).
- **Commit and push**, including this spec file at `revise/2026-08-17-onboarding-redesign.md`.
