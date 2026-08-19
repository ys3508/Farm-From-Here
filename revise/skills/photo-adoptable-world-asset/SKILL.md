---
name: photo-adoptable-world-asset
description: Transform a real FARM FROM HERE farmer photo into an identity-preserving, transparent-background adoptable-world asset. Use when creating, evaluating, or iterating a photo-to-adoptable visual asset for a crop, tree, flower, animal, insect, bird, or other real living thing; when defining the photo/identity/render/QA handoff; or when preparing a visual test. Do not use for Farmer UI, generic photo editing, or unrelated illustration work.
---

# Photo Adoptable World Asset

## Non-negotiable source

Before generating or assessing anything, read the canonical specification:

`revise/skills/photo-adoptable-world-asset.md`

If it is unavailable, ask for it. Do not substitute a generic "watercolor,"
botanical, sticker, or image-generation brief. That file governs the visual
language, identity preservation, transparency, and the copyright boundary.

Where this file and the specification appear to disagree, **the
specification wins on identity and product rules; this file wins on
execution order and acceptance.**

## The look, in one line

> **A dense real arrangement, printed flat in a light key, with the drawn
> line off-register from the colour.**

Or as four words: **DENSE, FLAT, OFF-REGISTER, LIGHT.**

The reference medium is **risograph / screenprint / gouache-on-paper**, not
oil painting and not watercolour botanical illustration. If the result could
be described as "a painting of a plant," it has failed.

## Scope

```text
real photo → selected subject → identity anchors → flat reinterpretation → transparent asset → QA
```

Keep the real subject distinct from its interpretation. Do not infer that a
detected living thing is adoptable — eligibility comes from product context.

**Observed identity outranks ideal completeness.** Preserve only identity
evidence visible in the source photo. Never invent an unobserved canopy,
body, limb, fruit, flower, or root system to make the collectible look
complete. A partial subject can be a finished portrait.

Do not build or alter Farmer UI, adoption flow, database schema, My World
layout, production Storage, moderation, or asset publication unless asked.

## The four load-bearing rules

Everything else is detail. These four are what separate a correct asset from
the failure this skill keeps producing. Each is specified in full in the
canonical spec section named.

### 1. Density stays high, finish goes flat — spec §3

Two independent axes. **Never average them.**

- **Density** (how many flowers/fruit/leaves, how arranged): keep close to
  the photo. This is where identity lives.
- **Finish** (marks per element): push all the way flat. This is where the
  aesthetic lives.

A midpoint on the finish axis is worthless — half-flat reads as unresolved
modeling, and every degree-word ("moderate", "restrained") slides back into
rendered realism. Breathing room comes from painting each element *thinly*,
never from deleting elements.

### 2. Colour anchors hue only; value is re-keyed — spec §4, §11

Sample the subject's **hue family** from the photo. Discard its exposure,
key, contrast, and shadows completely. Every asset is re-keyed **high and
light** no matter how dark the source is.

Colour freedom is allocated by layer:

| Layer | Freedom |
|---|---|
| Subject's dominant masses | stay in the real hue family (peony reads red/pink, foliage reads green) |
| Secondary colour inside the subject | free — unrelated hues meet inside one petal |
| Line and supporting fields | fully art-directed, and **required** to leave the subject's hue family |

Transitions must cross **hue**, not walk a value ramp inside one family.
`red → coral → orange → peach` is a gradient, not a bloom.

### 3. The line is a second pass, printed off-register — spec §9

The line is not an edge belonging to a shape. It is **a separate, complete
drawing of the same subject, offset from the colour plates.**

It runs beside edges rather than on them, crosses into masses and out into
empty ground, and keeps describing the subject throughout.

**The failure this prevents:** told only "do not trace the edge," a
generator detaches the line entirely and produces floating decorative arcs
over a finished painting. Those are a defect. The line is never an ornament
applied after the paint.

**This rule has the lowest prompt success rate of the four, by a wide
margin.** Generators default to a clean closed contour and negative phrasing
does not dislodge it. If the backend can emit layers, do the offset in post
instead of prompting for it — see `references/render-prompt.md` section 2b.
A prompt-only route should expect frequent rejection on gate 6.

### 4. Mark budget — spec §13

| Form | Marks |
|---|---|
| one petal / one fruit | 2–5 total |
| one leaf | 1, occasionally 2 |
| one stem or branch | 1 continuous mark |

If a form needs more marks to read, **simplify its shape** — do not add
marks. Texture is even **material grain** (paper tooth, riso stipple, crayon
rub) that ignores the anatomy beneath it. Marks that follow curvature,
veins, or growth direction build roundness — that is oil painting, and it is
the exact failure mode to avoid. Directional marks survive only as sparse
accents on a few hero forms.

## Photo triage

Choose a scope before rendering: **single subject**, **connected group**
(one branch, cluster, spike), or **bounded living scene** (only when the
arrangement itself is the identity).

Classify the source:

- **GOOD** — one intended subject sufficiently visible. Generate.
- **PARTIAL_BUT_USABLE** — a distinctive portion visible. Generate an
  intentional partial portrait; leave unknown anatomy absent.
- **AMBIGUOUS** — several plausible subjects or an uncertain target. **Ask
  which.** Do not generate.
- **INSUFFICIENT** — too small, occluded, or blurred to carry identity.
  **Request a new photo.** Do not generate.

Treat a visible watermark or stock-agency branding as a non-publishable
source; request a farmer-owned replacement before producing a real asset.

## Render brief

Write this before generating:

- **Identity locks** — observable details that may not drift.
- **Unknowns** — structures hidden, cropped, or ambiguous. Do not infer them.
- **Subject scope and crop** — what is included, what clutter is discarded.
- **Density record** — approximate element counts, ratio of flower to
  foliage, crowding, growth directions, maturity, dominant silhouette. This
  is what gets preserved.
- **Hue anchors** — the subject's hue families only, with a note that the
  photo's key is being discarded.
- **Layer-3 palette** — the art-directed hues for line and fields, chosen to
  sit clearly outside the subject's families.
- **Line plan** — offset direction and approximate displacement.
- **Field plan** — one primary field, at most one secondary counterweight;
  which one or two sides of the subject they sit against.

## Render order

```text
identify → record density → assign flat colour masses → re-key to high →
lay the offset line pass → add material grain → place supporting fields →
extract alpha
```

Colour masses first, line second, grain third. Never finish a rendered
painting and then add line or texture over it.

For the generation prompt and the transparent-background procedure, use
`references/render-prompt.md`.

## Acceptance gates

Eight checks. **All must pass.** Any failure sends the asset back for
regeneration, not for touch-up.

1. **Identity** — the real subject is recognisable, and no biological
   structure absent from the photo has been invented.
2. **Triage honoured** — source was GOOD or PARTIAL_BUT_USABLE; ambiguous
   and insufficient photos were not silently guessed.
3. **Density preserved** — element count, arrangement, crowding, ratio, and
   growth directions read as close to the source. It has not been thinned
   into a sparse decorative sprig.
4. **Flat** — forms are within the mark budget. No highlight → midtone →
   shadow modeling, no spherical volume, no photographic speculars, no
   stroke-dense surfaces.
5. **High key** — the asset is light. The source photograph's darkness has
   not been inherited.
6. **Off-register line** — the line reads as a separate drawn pass displaced
   from the colour. It is not a uniform outline hugging every edge, and it
   is not a set of floating arcs detached from the structure.
7. **Cross-hue colour** — layer 1 holds its hue family, layer 2 crosses
   hues inside forms, layer 3 sits clearly outside the subject's family.
   Nothing reads as a single-family gradient.
8. **Clean output** — transparent background, generous transparent ground,
   and no text, UI, label, frame, die-cut border, drop shadow, or palette
   swatches.

### On rejection

If a gate fails, read `references/deep-qa.md` for the detailed failure
catalogue and the correct remedy for that specific gate.

The one heuristic worth keeping in the main loop: **fix flatness failures by
removing marks and simplifying shapes, never by adding texture, saturation,
or outline.**

## Reference-image boundary

Treat visual references as evidence of abstract treatment, never as a
template. Extract only principles: off-register line, flat colour, cross-hue
bloom, material grain, high key.

Never copy a reference's subject, composition, text, signature, palette
swatches, sticker border, or distinctive arrangement. Do not name or imitate
a living artist. Where a reference carries a die-cut border, palette dots,
or a signature, those are **production artefacts of that reference, not part
of the target look** — omit them.

## Project integration

Read `references/asset-contract.md` only when defining a handoff or
integration seam. It is intentionally small and implementation-agnostic;
verify the live repository schema before wiring it to application code.

The brand-level north star remains
`revise/FARM-FROM-HERE-Illustration-Style-v1.md`. This skill is a
specialised sub-language for adoptable assets and does not override it.
