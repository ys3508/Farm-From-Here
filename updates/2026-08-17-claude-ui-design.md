# FARM FROM HERE — Chat Session Record — 2026-08-17

**Session type: ADVISORY (consultant lane). No code was written in this chat.** The only
artifact produced is a spec file for CC (`2026-08-17-onboarding-redesign.md`). Everything below
is reasoning + decisions that live in this record and, unless noted, nowhere else — do not lose
them between agents.

---

## Headline outcome
Produced one self-contained spec, `2026-08-17-onboarding-redesign.md`, that re-skins the three
onboarding screens (Splash → Login → Sign up) on top of the ALREADY-BUILT Step 1 foundation.
Routed to CC. Owner will place the file in the repo's `revise/` dir and paste a short "read the
file, reconcile with existing code, ask before guessing, commit + push" prompt to CC.

---

## Critical context correction made mid-session
Early in the conversation both sides were operating as if we were building onboarding UI from
scratch as a **web/PWA**. Two facts surfaced later that overturned that framing:
1. **Step 1 is already built and merged.** CC completed the full foundation last night — schema,
   Supabase auth (all providers), the two economies, referral accounting, My World home. The app
   runs. The owner's complaint is purely that the **UI is ugly**. So this round is a **re-skin of
   existing screens**, NOT new construction. The spec is written accordingly (read existing code,
   reuse backend/auth, don't rebuild).
2. **Stack is React Native + Expo native (iOS + Android), NOT Next.js/PWA.** The project
   instructions name a Next.js/PWA stack, but the actual Step 1 spec (`2026-08-17-step1-foundation.md`,
   which the owner uploaded) explicitly says "native mobile app, NOT a web/PWA." The Step 1 spec is
   the newer, authoritative decision and wins. **This contradicts the standing project instructions
   — flag for reconciliation.** All onboarding screens are RN.

Why this matters: had we packaged the prompt before these surfaced, CC would have been told to
"build" things that already exist, in the wrong stack. The whole point of catching it was to make
the CC prompt say "reconcile with existing code," not "create."

---

## Decisions made this session (with reasoning)

### Product priority (opening advisory)
- **The single most important thing for this app is that the FIRST REAL UPDATE arrives fast and
  reliably** — the farmer's real photo of the adopted tree. Reasoning: adoption is just a promise;
  the real photo is the only *proof* that "everything on the map is real," which is the entire
  moat. It's also the most fragile link (depends on a real human) and where churn happens (promise
  given, payoff absent). Corollary: the real bottleneck is the FARMER side — "posting an update
  must be easier than posting to social media" is not a farmer-side nicety, it's the implementation
  path of the user's core need. And the adopt→first-photo gap needs an honest bridge ("your tree is
  at X farm, farmer Lin, next walk-through ~N days"), not fake XP filler. This is advisory only —
  not yet routed anywhere, not in any spec.

### On UI timing / tooling (advisory)
- **Define the design language NOW, not "polish everything at the end."** Reasoning: end-stage
  "make it pretty" means re-touching every built screen — the most expensive path. Lock tokens +
  core components once; everything built after inherits and is non-ugly by default; CC touches each
  file once. But: do NOT polish all 8 systems now — 7 are locked teasers in V1; polishing them is
  "gilding a door that's about to be locked." Deep-polish only the heart later (world map / GROVE
  adopt flow / first-photo-arrival moment).
- **Figma: free (Starter) tier is enough, and likely not needed at all.** Reasoning: for a solo
  non-coder directing AI, Figma's only real value is as a mood board. The paid tiers sell exactly
  the things that DON'T help here — Figma's own AI credits (owner's AI is CC/Codex, not Figma),
  Dev Mode / MCP (the "designer hands pixel-perfect specs to a programmer" flow, which CC can't see
  and the owner can't verify), team/collab (solo). Even the mood-board step can be replaced by
  screenshotting apps the owner likes into a folder.
- **Don't add a separate UI-design AI; make CC the good UI AI.** Reasoning: v0/Lovable generate
  runnable front-end code (stack-compatible) but are a SECOND uninformed agent — style/token/naming
  seams with CC that a non-coder can't verify. Figma AI / Galileo / Uizard output images, not code —
  double the copyright/verification trap. What CC actually lacks is direction + constraints, not
  capability: give it an aesthetic direction, design tokens, and a component library
  (Tailwind + shadcn on web, or the RN equivalent) and its output jumps a tier with no seam. Only
  if CC still falls short, bring in v0 — and only for the three heart screens.

### Copyright (a recurring red line, resolved)
- Random illustrations found online (e.g. the reference greens) are **copyrighted — cannot be used
  commercially** regardless of "small app / non-commercial" framing. Using stolen art on the splash
  also contradicts the product's own "this is real / trustworthy" core. Held as a red line.
- **The owner's chosen splash art is CLEAR to use.** It was generated by the owner in ChatGPT
  (DALL·E) from their own creative direction; OpenAI's terms assign generation rights to the user
  and allow commercial use. (Minor non-legal note: AI images aren't copyright-protected, so the
  owner also can't stop others copying the style — irrelevant for a splash.)

### Design tokens (owner-approved) — source of truth, in the spec
Palette: bg `#F7F4EC`, surface `#FFFFFF`, ink `#2C3A2E`, inkSoft `#5A6B58`, primary `#4C8C4A`,
primaryDeep `#2F5E3A`, accentSky `#8FB4C4`, accentWarm `#E8B04B`, line `#E3DECF`.
**Hard rule: brand color is GREEN, not blue** — override all default blues.
Typography: display = elegant thin serif, wide letter-spacing (~0.08–0.16em), suggested
Cormorant / Playfair (swappable); body = humanist sans (Inter); "Your journey begins here" =
handwritten script, white. Shape: radius 14px, pill primary buttons ok, generous spacing, light/no
shadows, hand-drawn texture feel.

Note: CC's existing onboarding already trends warm-cream + dark-green — close to these tokens. The
spec tells CC to formalize/align an existing theme file rather than blindly replace.

### Three-screen onboarding spec (all in the CC file)
- **Splash (NEW):** full `splash.png`; `FARM FROM HERE` display serif over the upper cloud region
  (prefer one line, wrap to `FARM FROM` / `HERE` only if it'd otherwise shrink too small); subtitle
  `Real world. Real growth.`; bottom `Your journey begins here` in white handwritten script.
  ~3.5s layered fade-in → soft fade to Login. **Tappable to skip** (returning users mustn't be
  forced to wait).
- **Login (redesign):** `login-bg.png` background + a **white scrim CARD wrapping ONLY the input
  area** (not the whole lower half — grass/clouds/door stay visible around it; ~90% opaque,
  tunable). One identifier field (Email/Username/Phone) + password → green primary button.
  **"More options" collapsed by default**, expands to Google/Facebook/X/Apple. "Look around as a
  guest" = browse-only. Footer → Sign up.
- **Sign up (redesign):** `signup-bg.png` + same scrim card. **Top: collapsible "Have a referral
  code?" row** (collapsed by default so no-code users aren't scared off; at top so code-holders find
  it). Identifier + password + confirm → create account. Same "More options." Referral reward = 500
  Seeds each, granted only AFTER signup completes, via `seeds_ledger` — REUSE existing Step 1 logic.

### Login identifier decision (owner changed mind mid-session)
Superseded Step 1's flat 7-button screen. New model: **one identifier field accepting
Email / Username / Phone** + password as the primary surface; third parties tucked under "More
options"; guest = browse-only. **This round: build the one-field UI + real Email/Phone routing to
existing Supabase methods; leave USERNAME as a clearly-marked stub** (Supabase has no native
username login — needs a username→email/phone lookup, out of scope this round). Owner explicitly
chose this (option A) over building username login now (option B).

### Referral placement
Owner initially wanted the referral field "at the very top" of Sign up. Advised against a
default-expanded field there (most users have no code; a visible empty field reads as "a code is
required"). **Resolved: collapsible "Have a referral code?" at top** — visible but opt-in. Owner
agreed.

### Assets / path hygiene (in the spec)
Three images at `/Users/sissi/Desktop/Farm-From-Here/ui_design/onboarding/` as `splash.png` /
`login-bg.png` / `signup-bg.png` (owner already renamed from the risky `1`/`2`/`3`). Spec tells CC
to COPY them into the Expo assets folder (Expo can't load a runtime Desktop path) and use
`resizeMode="cover"`.

---

## Review / evidence
- Reviewed CC's existing onboarding screen (two screenshots the owner shared). Findings: it already
  contains the right INFORMATION (dual-economy hint, referral, all seven logins, "Seeds can never
  be bought with money" line) but flat-tiles all seven login buttons and lacks any of the agreed
  atmosphere (no splash sequence, no illustrated background, no script/serif treatment). Conclusion
  that shaped the spec: **keep its information + logic, replace its visual structure.**
- A layout mockup was rendered in-chat (green placeholder blocks, NOT the real art) purely to
  confirm text PLACEMENT and sequence before CC implements. Owner approved the placement and the
  "scrim only around inputs" idea came out of that review.

---

## Routing
- **→ CC (routed):** `2026-08-17-onboarding-redesign.md` (the spec). Owner will place it in
  `revise/` and paste the read-and-reconcile prompt. CC is expected to come back with clarifying
  questions (fonts in Expo, extend-vs-replace existing theme) — that is by design (the spec
  instructs it to ask, not guess), not a stall.
- **Queued / not yet routed:** re-skin of My World + all other screens using the same design system,
  one screen at a time, AFTER onboarding is signed off. Deliberately deferred to save tokens and
  keep verification easy.

---

## New forks opened
- **Stack contradiction (project instructions say Next.js/PWA; actual build is RN/Expo native).**
  Resolved in favor of RN/Expo for now (newer authoritative Step 1 spec), but the standing project
  instructions still say PWA — needs a permanent reconciliation so future prompts don't reintroduce
  the web framing.
- **The "first real update must arrive fast" priority** (opening advisory) has product implications
  not yet turned into any spec: farmer-side posting flow, and the honest adopt→first-photo waiting
  bridge. Unrouted.

---

## Raised but not routed
- Product-priority argument (first-photo-arrival as the core need; farmer posting as the true
  bottleneck; anti-fake-XP waiting bridge).
- Deep-polish plan for the three "heart" screens (world map / GROVE adopt flow / first-photo moment)
  and the "don't gild locked doors" principle for the other 7 systems.
- Possibility of bringing in v0 later ONLY for the three heart screens, only if CC's output falls
  short.

---

## Active blockers (in order)
1. **Owner must place `2026-08-17-onboarding-redesign.md` into the repo `revise/` dir** and paste
   the CC prompt. Nothing proceeds until this is done.
2. **CC's expected clarifying questions** (fonts, theme extend-vs-replace) — owner should bring CC's
   replies back to this lane to answer, rather than let CC guess.
3. **Standing stack contradiction** (PWA vs RN/Expo) — low urgency for onboarding (spec already says
   RN) but should be reconciled at the project-instruction level before it re-surfaces.

---

## Flagged: exists ONLY in this record
- All the advisory reasoning (product priority, Figma verdict, UI-AI verdict, copyright rulings) —
  none of it is in any repo file. Only the three-screen spec made it into `2026-08-17-onboarding-redesign.md`.
- The reasoning behind each onboarding decision (why scrim-only-around-inputs, why collapsible
  referral, why username-stub) — the spec states the WHAT; the WHY is here.
