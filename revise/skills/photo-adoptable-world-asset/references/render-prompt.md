# Render prompt and transparency procedure

This is the executable half of the skill. `SKILL.md` says what a correct
asset is; this file says how to produce one.

> **Open item:** the image-generation backend is not yet fixed for this
> project. The prompt below is backend-agnostic. The alpha procedure branches
> on whether the chosen backend can emit an alpha channel — resolve that
> before the first production asset.

---

## 1. Prompt template

Fill every `{{...}}` from the render brief. Do not send the template with
placeholders unresolved, and do not soften the wording — the negative clauses
are load-bearing and were each added in response to an observed failure.

```text
A flat, printed illustration of {{subject}}, in the style of a risograph or
screenprint on lightly textured paper.

SUBJECT AND ARRANGEMENT
Show {{approximate counts: e.g. "four open blooms, eight closed buds, dense
surrounding foliage"}}, arranged as {{arrangement: crowding, overlap,
flower-to-foliage ratio, principal growth directions}}. Keep this density —
the arrangement is crowded and abundant, not a sparse decorative sprig.
Overall silhouette: {{dominant silhouette}}.

TREATMENT — FLAT
Each petal or fruit is two to five flat marks of solid colour. Each leaf is
a single flat mark. Each stem is one continuous mark. No shading, no
highlight-to-shadow modeling, no spherical volume, no glossy speculars, no
blended surfaces, no visible brushstroke buildup. Form is described by the
shape of the colour area and nothing else. This is a print, not a painting.

KEY — LIGHT
High key throughout. Light, airy, generous bare ground. Never dark, moody, or
low-contrast-dark. Ignore the lighting of any source photograph completely.

COLOUR
Subject's main masses: {{layer-1 hue families, e.g. "warm reds and pinks for
the blooms, mid-greens for the foliage"}} — light and unshaded.
Inside those masses, place flat patches of {{layer-2 hues, e.g. "lavender,
powder blue, turquoise"}} — not as shading, as separate flat colour areas
overlapping the main colour. **At least {{n}} petals and {{n}} leaves must
carry a patch from a cool, unrelated hue.** Colour crosses petal and leaf
boundaries freely and ignores botanical logic.
Line and background shapes: {{layer-3 hues}} — chosen for contrast, clearly
outside the subject's own colour family.
No smooth gradients. No single-family colour ramps. No colour used as shading.

LINE — OFF-REGISTER
The flat colour fills are printed slightly out of register with the line
drawing. Each colour area is shifted {{direction}} by a few millimetres from
its outline, so bare paper shows as a thin sliver along one side of every
shape and the colour spills past the line on the opposite side.
The line itself is a loose hand drawing, not a clean contour: it varies in
weight, breaks and resumes, occasionally doubles, and changes colour between
{{layer-3 line hues — at least two, and not a single dark navy or black}}.
Some edges carry no line at all.
The line is never a uniform outline closing every shape, never a glow or rim
light, and never a set of loose floating arcs detached from the forms.

TEXTURE
Even material grain across the whole image — paper tooth, riso stipple,
uneven ink density, soft crayon rub. The grain is a property of the paper and
ink and ignores the anatomy beneath it. It does not follow curvature, veins,
or growth direction.

BACKGROUND SHAPES
{{one primary field: colour, and which one or two sides of the subject it
sits against}}{{, plus one secondary counterweight if the brief calls for
it}}. Broad, soft-edged, hand-made blocks or swipes — a torn slab of colour
is right; a crisp geometric rectangle is not. They sit beside and behind the
subject, never wrapping or tracing its silhouette. Leave most of the ground
bare.

GROUND
{{see section 2 — either "transparent background" or the chroma key clause}}

EXCLUDE
No text, no signature, no palette swatches, no watermark, no frame, no white
die-cut sticker border, no drop shadow, no sparkles or magic effects, no
photorealism, no oil painting, no generic watercolour botanical illustration,
no 3D render, no vector clip art, no mobile-game item icon.
```

### Notes on filling it in

- **Counts belong in the prompt.** "Dense" alone is not enough; generators
  reliably thin an unquantified arrangement. Name approximate numbers.
- **Say the medium early and say it twice.** "Risograph / screenprint" in the
  first line and "This is a print, not a painting" in the treatment block do
  more work than any single negative clause.
- **Never write a degree-word for finish.** "Somewhat simplified",
  "moderately flat", and "painterly but restrained" all resolve toward
  rendered realism. State the mark counts instead.
- **Give layer-2 colour a countable minimum.** "Unrelated hues" as an
  abstract instruction gets skipped and the subject resolves into one warm
  family walking a value ramp. Naming the hues *and* a minimum number of
  forms that must carry one is what makes it land — the same reason the
  density block carries numbers.
- **Describe misregistration as the fill being off, not the line.** Asking
  for an offset *line* reliably produces clean registered lineart, because
  that is what "line drawing" means to a generator. Asking for offset *fills*
  matches how real misprinting is described and lands far more often.

---

## 2. Transparent background

### Branch A — backend emits alpha

Preferred. Request a transparent background directly, then run the checks in
section 3. Nothing else is needed.

### Branch B — backend emits opaque images only

Generate against a **flat chroma key**, then extract.

**Choosing the key colour.** It must not appear anywhere in the asset's
palette, including layers 2 and 3 and the material grain. Because these
assets are high-key pastels with pink, green, and blue all in play, there is
no single safe key — **pick it per asset and record it in the render brief.**

Practical starting points, in order of preference for a given palette:

| Subject palette | Reasonable key |
|---|---|
| pinks / reds / warm | saturated green `#00FF00` |
| greens / cool foliage-dominant | saturated magenta `#FF00FF` |
| mixed or unclear | saturated orange `#FF6A00` or a colour hand-picked outside the used hues |

Add to the prompt's GROUND block:

```text
Flat, even {{key colour name}} background, a single uniform colour with no
texture, no gradient, and no shadow. This colour appears nowhere else in the
image.
```

**Extraction.** Two things go wrong here and both are avoidable:

1. **Do not threshold to binary alpha.** The material grain, soft field
   edges, and any ink mottling are legitimately semi-transparent. A hard
   cutoff turns grain into ragged holes and gives every field a chewed edge.
   Keep continuous alpha.
2. **Despill after keying.** A saturated key bleeds into soft edges during
   generation; without a despill pass every soft edge carries a green or
   magenta rim that is very visible once the asset is composited onto My
   World's warm background.

**Verify against a mid-warm background, not a checkerboard.** Fringing that
is invisible on a checkerboard is obvious against the actual My World ground.

### Either branch — what alpha must preserve

- Painted marks that intentionally extend past the subject stay in the asset.
- Supporting fields stay in the asset; they are composition, not background.
- Bare ground between branches and leaves stays transparent — do not fill
  negative space to make extraction easier.

---

## 2b. Misregistration in post — the reliable route

Prompting for misregistration has a low success rate. Generators trained on
illustration default to a clean, closed, evenly weighted contour sitting
exactly on the edge, and no amount of negative phrasing dislodges it. If the
backend can emit layers, **do not rely on the prompt for this.**

**If the backend can output a line layer and a colour layer separately:**

1. Generate the colour masses and the line drawing as two images.
2. Composite with the line layer translated by **4–8 px at 1024 px wide**
   (scale proportionally), in a consistent direction.
3. Keep the offset direction constant across one asset, and vary it between
   assets so a set does not look mechanically produced.

This is a few lines of compositing and it is fully controllable — offset
amount and direction become parameters rather than hopes. It is the single
highest-leverage change available to this pipeline.

**If the backend cannot emit layers,** use the fill-offset wording in the
LINE block above, and expect to reject a majority of outputs on gate 6.
Record the hit rate; if it stays low, layer separation becomes a hard
requirement on the backend choice.

Whichever route: the offset must stay small. Displacement large enough to
read as a doubled image is a different, worse effect.

---

## 3. Post-render checks

Run before handing the asset to the acceptance gates in `SKILL.md`:

- Alpha is continuous, not binarised.
- No key-colour fringing when composited on a warm mid-tone.
- No key colour survives anywhere in the visible pixels.
- Output is PNG with a real alpha channel.
- Marks intended to extend past the subject survived extraction.

Then run the eight gates. A pipeline-clean asset can still fail on
aesthetics, and usually does on gates 4, 5, and 6.

---

## 4. Iteration

When a gate fails, change **one** thing in the prompt and re-render. These
are the highest-leverage single changes, in the order worth trying:

| Failing gate | First thing to change |
|---|---|
| 4 — not flat | lower the mark counts; add "This is a print, not a painting" if absent |
| 5 — too dark | state the key explicitly in the COLOUR block, not just the KEY block |
| 6 — line wrong | stop prompting for it — do the offset in post (section 2b). If layers are unavailable, describe the **fills** as off-register, not the line |
| 3 — too sparse | put explicit numbers into SUBJECT AND ARRANGEMENT |
| 7 — muddy colour | name the layer-2 hues individually rather than describing them |

Do not stack corrections. Adding three clauses at once makes it impossible to
learn which one worked, and the prompt drifts toward an unusable pile of
prohibitions — the failure mode this file was split out to avoid.
