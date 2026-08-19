# 2026-08-19 — `photo-adoptable-world-asset` skill overhaul

Reworked the Codex skill and its canonical specification so that generated
adoptable assets land on the intended aesthetic. Driven by a visual gap
analysis against two reference images Sissi supplied, then validated against
a ginger lily test render.

---

## 1. What was done

### BUILT

**Specification repair** — `revise/skills/photo-adoptable-world-asset.md`

- Removed a duplicated block: sections 14–20 appeared twice (an older, shorter
  draft had been left in below the current one), and section numbers 14–17
  pointed at two entirely different sets of topics. Renumbered to a clean
  1–28. The skill declares this file its non-negotiable source and reads it
  before every generation, so the contradictory numbering was affecting every
  run.
- Fixed the guide reference to name a real path
  (`revise/FARM-FROM-HERE-Illustration-Style-v1.md`); it was previously
  referred to by title only and was unfindable.

**Specification: rules that were producing the wrong result**

Several sections were actively pushing output toward the failure mode rather
than away from it. Rewritten:

| Section | Was | Now |
|---|---|---|
| §3 | one "how much to simplify" axis | **two axes** — density stays high, finish goes flat; explicitly forbids averaging them |
| §4 | `visible color characteristics` as identity anchor | anchors **hue family only**; new rule discarding the source photo's exposure/key/shadows |
| §9 | line rules stated only as prohibitions | new section defining the line as a **second drawing printed off-register**; names floating arcs as the predicted failure of the old wording |
| §11 | `red → coral → orange → peach` bloom examples | cross-hue examples; new **three-layer colour-freedom table** |
| §12 | `directional brush marks` in the internal-colour list | removed — it belonged to the rejected model; replaced with flat overlapping patches |
| §13 | *Directional Hand Marks* — marks follow curvature, veins, growth | *Surface Texture — Material Grain*; grain ignores anatomy. New **mark budget** (petal 2–5, leaf 1, stem 1) |
| §14 | rectangles forbidden outright | soft hand-made blocks/slabs permitted; the ban narrowed to mechanical precision |
| §22 | asked "are colours layered rather than **flat**?" and rejected "flat-colour clip art" | rewritten — those two lines contradicted the new flat mandate. Now defers to the eight gates and explains the earlier error |
| §28 | old visual-DNA line | **DENSE, FLAT, OFF-REGISTER, LIGHT** |

**Skill rewrite** — `revise/skills/photo-adoptable-world-asset/` (mirrored
from `~/.codex/skills/photo-adoptable-world-asset/`)

- `SKILL.md`: 36 acceptance checks plus a ~430-word single-paragraph rejection
  list → **8 acceptance gates**, preceded by a positive "four load-bearing
  rules" section. The old structure was almost entirely negative, which is
  unverifiable in practice and pushes a generator toward timid output.
- `references/deep-qa.md` (new): the long rejection list, reorganised by gate
  with symptom / cause / remedy, read only when a gate fails.
- `references/render-prompt.md` (new): the missing executable half — a
  fill-in-the-blank generation prompt, plus the transparent-background
  procedure. The skill previously described what a correct asset looks like
  but never how one is produced.
- `references/asset-contract.md`: `image.transparentBackground` was the
  literal type `true`, making a failed extraction unrepresentable while
  `qa.transparentBackground` recorded the same fact separately. Now `boolean`;
  QA block replaced with `gatesPassed: number[]`.

**Skill mirrored into the repo.** It previously lived only in
`~/.codex/skills/` and was therefore unversioned. Now tracked at
`revise/skills/photo-adoptable-world-asset/`, matching the
`photo-my-world-dreamscape` layout. **The two copies are not linked** — see
the to-do list.

### REMAINING

The visual language is not fully landing yet. See section 3.

---

## 2. Notes by audience

### For Sissi — decisions taken, and the two you made

Two product conflicts surfaced during the gap analysis and were resolved by
you:

**Conflict A — abundance vs. iconic.** The specification's
"preserve density / representative cluster" apparatus is what was producing
the crowded, dark, heavily rendered result, but it exists to stop assets
becoming generic icons. Resolved as **high density + fully flat treatment**:
element count and arrangement stay close to the photo (identity lives there),
while each element drops to a couple of flat marks (aesthetics live there).
The midpoint reading — moderate on both — was rejected because a half-flat
form reads as unresolved modeling and any degree-word slides back toward
rendered realism.

**Conflict B — local colour vs. assigned palette.** Resolved as a
three-layer allocation: subject masses stay in their real hue family, colour
inside a form is free, line and fields are fully art-directed and must leave
the subject's family. Plus: **hue is anchored, value is not** — the source
photo's lighting is discarded entirely and every asset is re-keyed high.

Also confirmed: the die-cut sticker border, palette swatches, and signature
visible in the reference images are artefacts of those references, not part of
the target look. They remain excluded.

### For other agents — how to work on this

- The specification governs identity and product rules; `SKILL.md` governs
  execution order and acceptance. This precedence is stated at the top of
  `SKILL.md` and was previously undefined while the two files overlapped by
  roughly 80%.
- Do not add rules to `SKILL.md` by appending prohibitions. It was already
  over-weighted toward negatives and that is a large part of why it was not
  working. New constraints belong in `references/deep-qa.md` under the gate
  they serve, unless they change what a correct asset *is*.
- The skill reads its spec by the relative path
  `revise/skills/photo-adoptable-world-asset.md`, so **Codex must be started
  from the repository root** or the skill falls through to its "ask for it"
  branch.
- Nothing in this work touched app code, schema, Farmer UI, or My World
  rendering, and it should not.

---

## 3. Test results — ginger lily, 2026-08-19

Three generations from one source photo. Compared against the eight gates:

**Passing (5 of 8):** identity, density, flat, high key, clean output. All
five were failing before this rework — the earlier peony render was a dark,
fully modelled digital oil painting with floating decorative arcs. Flatness
and the discarded photographic key are now landing reliably.

**Gate 6 (off-register line) — failed on all three.** Identical failure each
time: an even-weight navy contour closing every petal, leaf, and filament,
perfectly registered with the colour. Negative phrasing does not move this;
a closed even contour is what "line drawing" means to a generator.

**Gate 7 (cross-hue colour) — partially failed.** Layer 3 landed (blue and
violet fields, correctly outside the subject's family). Layer 2 was almost
absent: cream petals resolved to `cream → peach → orange`, one warm family
walking a saturation ramp, with no cool patch in any flower.

Both failures are now recorded in `deep-qa.md` under their gates, with
remedies:

- **Gate 6** — do the offset in **post** rather than in the prompt. If the
  backend can emit line and colour as separate layers, translating the line
  layer 4–8 px at 1024 px wide makes displacement a parameter instead of a
  hope. Fallback wording describes the *fills* as off-register rather than the
  line, which matches how real misprinting is described.
- **Gate 7** — name the layer-2 hues explicitly and give a **countable
  minimum** ("at least three petals and two leaves must carry a cool patch").
  Abstract instructions to use "unrelated hues" get skipped, for the same
  reason the density block needs numbers.

Also noted: of the three generations, the first had the best material grain
and the third the smoothest — the third had begun reintroducing soft radial
shading inside petals, a mild Gate 4 regression. The third also bled off the
bottom of the canvas.

---

## 4. To-do

**Blocking the first production asset**

1. **Decide the image-generation backend, and whether it can emit layers.**
   This is the real blocker. It determines both the alpha route (branch A vs.
   the chroma-key branch B in `render-prompt.md`) and whether the Gate 6
   post-process offset is available. Flagged as an open item at the top of
   `render-prompt.md`.
2. **Re-run the ginger lily test** with the two new remedies applied, and
   record the Gate 6 hit rate. If a prompt-only route stays low, layer
   separation becomes a hard requirement on the backend choice.

**Housekeeping**

3. **The two skill copies are a manual mirror.** `~/.codex/skills/…` and
   `revise/skills/photo-adoptable-world-asset/` were synced by hand and will
   drift. Either symlink one to the other or add a sync step; whoever edits
   next should check both.
4. **No test fixture is committed.** The ginger lily and peony sources live
   only in chat. Putting one in
   `revise/skills/photo-adoptable-world-asset/assets/` would make the first
   visual test reproducible by anyone.
5. **Nothing here is wired to the product.** `asset-contract.md` is a
   prototype-stage type only; verify the live schema before connecting it to
   `adoptables`, and keep generated assets out of production storage until
   permissions, review, and My World rendering are designed.

---

## Not included in this commit

The working tree carries substantial unrelated in-progress work (My World
screens, farm/quest/community routes, the `my_world_lives` migration, preview
mode changes, `revise/2026-08-17-my-world.md`, and other doc edits). None of
it was touched or committed — this commit is scoped to the skill and its
specification only.
