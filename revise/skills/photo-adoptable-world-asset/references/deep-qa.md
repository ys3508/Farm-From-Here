# Deep QA — failure catalogue

Read this **only when an acceptance gate in `SKILL.md` has failed.** It is
organised by gate so you can jump to the one that failed rather than reading
the whole list.

Each entry gives the symptom, the underlying cause, and the correct remedy.
The remedy matters as much as the diagnosis: most of these failures get
worse when treated by adding more of something.

---

## Gate 1 — Identity

**Reject when:**

- Invented anatomy: a full canopy, hidden body, unseen limbs, fruit,
  flowers, or roots that the photograph never showed.
- A partial photograph completed into the species' expected ideal form.
- Stylisation drifted the species — the output reads as a different plant or
  animal than the source.
- Separately intended adoptable units silently merged into one asset.
- Photographic clutter, unrelated organisms, or a neighbouring plant pulled
  into the subject.
- A crop that cuts off an extremity the identity actually depended on.

**Remedy:** return to the identity locks in the render brief and re-render.
Do not paint the missing structure in. A partial subject finished with
negative space is a correct result; an invented whole is not.

---

## Gate 2 — Triage honoured

**Reject when:**

- Generated from an AMBIGUOUS source by picking a subject unilaterally.
- Generated from an INSUFFICIENT source by reconstructing identity that the
  photo could not supply.
- A watermark, copyright mark, or stock-agency branding survived into the
  output, or the source carried one and was used for a real asset anyway.

**Remedy:** stop and ask. For AMBIGUOUS, request a subject selection. For
INSUFFICIENT, request a new photograph. Neither is a rendering problem.

---

## Gate 3 — Density preserved

This gate and Gate 4 fail in opposite directions. Check which one you have.

**Reject when:**

- The source's abundance was thinned into a sparse decorative sprig — five
  isolated fruits standing in for a densely fruiting branch.
- Clustering, overlap, crowding, or the flower-to-foliage ratio were
  discarded.
- Principal growth directions were straightened or regularised into a tidy
  arrangement.
- The dominant silhouette of the source no longer reads.

**Remedy:** restore the count and arrangement from the density record. Add
the elements back **flat** — as one or two marks each. Do not restore them
by rendering them.

**Do not confuse this gate with hierarchy.** Uneven emphasis is welcome:
some forms may be quieter, paler, or partly overlapped. What is not welcome
is deleting them.

---

## Gate 4 — Flat

The most common failure, and the one that recurs most stubbornly, because
painterly realism is the deepest available result.

**Reject when:**

- Highlight → midtone → shadow construction on any form.
- Spherical or volumetric rendering; a fruit or bud that reads as a 3D ball.
- Photographic white speculars.
- One continuous blended surface proving a form's volume.
- Dense uniform brushwork: dozens of similar-sized strokes per petal.
- Digital-oil-painting or thick-impasto texture.
- Marks that follow curvature, veins, or growth direction across the whole
  subject.
- Petal-by-petal or leaf-by-leaf descriptive rendering.
- Fine pencil or hatch texture distributed over every surface.

**Remedy — this is the important part:** fix flatness by **removing marks
and simplifying silhouettes.** Never by adding texture, saturation, or
outline. If a form will not read at 2–5 marks, its shape is wrong, not its
detail level.

The reading-order test: at thumbnail size the asset must read first as an
arrangement of flat colour shapes that happens to identify a real living
thing. If it reads first as a carefully observed study with art texture
added afterward, regenerate.

---

## Gate 5 — High key

**Reject when:**

- The asset is dark, moody, or low-key because the source photograph was.
- Deep shadow cores sit inside flowers, foliage, or bodies.
- The photograph's exposure, contrast, or backlighting survived into the
  colour choices.
- Foliage resolved to near-black green.

**Remedy:** re-key the whole palette upward. Hue families are kept; values
are reassigned from scratch. This is not a brightness adjustment applied at
the end — the light key has to be chosen before the colour masses are laid.

---

## Gate 6 — Off-register line

**Reject when:**

- A uniform outline of consistent weight traces the whole subject.
- Clean vector-like contours, mathematically smooth curves, or exact
  edge-following everywhere.
- Sterile black or dark-brown outlines used as the default material.
- Colored rim-lighting: a thin smooth glow evenly surrounding every fruit
  and leaf.
- **Floating decorative arcs and swooshes** laid over an otherwise finished
  painting, attached to no structure.
- Line applied as a post-process ornament rather than as a pass over the
  forms.
- The line perfectly registered with the colour — no displacement at all.

**Remedy:** redraw the line as a complete second drawing of the subject and
displace it. The two failure poles are *welded to the edge* and *detached
from everything*; the target is between them — describing the subject
throughout, but landing beside it.

A useful check: hide the colour layer mentally. The line alone should still
read as a drawing of that plant. If it reads as a handful of abstract arcs,
it is decoration.

**Observed in practice (2026-08-19, ginger lily test):** this gate failed on
three consecutive generations while every other gate passed. The failure was
identical each time — an even-weight navy contour closing every petal, leaf,
and filament, perfectly registered. Negative phrasing in the prompt did not
move it, because a closed, evenly weighted contour is simply what "line
drawing" means to an image generator.

Two remedies, in order of reliability:

1. **Do the offset in post.** If the backend can emit line and colour as
   separate layers, translate the line layer 4-8 px (at 1024 px wide). This
   makes offset a parameter rather than a hope. See `render-prompt.md` section 2b.
2. **Describe the fills as off-register, not the line.** Saying the colour
   areas are printed a few millimetres off from their outlines, showing bare
   paper on one side, matches how real misprinting is described and lands
   more often than asking for a displaced line.

A single dark line colour used everywhere is a related failure: navy is not
black, but a uniform navy contour on every form is still a default outline
material. Require at least two line hues.

---

## Gate 7 — Cross-hue colour

**Reject when:**

- Smooth digital gradients used as the main colour behaviour.
- Every anatomical region rendered as one flat local colour with a darker
  version of itself for shadow.
- All colours left inside one pastel family; the whole image resolves to a
  uniformly soft same-hue blend.
- Colour transitions that walk a value ramp inside a single family
  (`red → coral → orange → peach`) rather than crossing hue.
- Supporting fields coloured by extending the subject's local colour,
  producing a same-hue halo.
- Layer 1 abandoned entirely — the subject recoloured out of its real hue
  family so it no longer reads as itself.

**Remedy:** re-assign by layer. Layer 1 back into its hue family, layer 2
given genuinely unrelated hues meeting inside single forms, layer 3 pushed
clearly outside layer 1's family.

**Observed in practice (2026-08-19, ginger lily test):** layer 3 landed
correctly — blue and violet fields, clearly outside the subject's family —
while layer 2 was almost entirely absent. Cream petals resolved to
`cream -> peach -> orange`, one warm family walking a saturation ramp, with
no cool patch anywhere in the flowers. An abstract instruction to use
"unrelated hues" gets skipped. Name the specific hues **and** a countable
minimum, e.g. at least three petals and two leaves must carry a cool
patch.

Test for a bloom: if the colours inside a form could be produced by
lightening and darkening one pigment, it is a gradient.

---

## Gate 8 — Clean output

**Reject when:**

- Background is not transparent, or alpha is ragged with matte fringing.
- Baked-in app background, UI card, title, label, farmer name, or
  explanatory text.
- A decorative frame, white sticker die-cut border, or drop shadow.
- Palette swatches or an artist signature carried over from a reference.
- More than two supporting fields, or fields fragmented into scattered
  patches.
- A field that wraps around or traces the subject's full silhouette instead
  of sitting against one or two chosen sides.
- A field louder than the subject.
- Negative space filled in — every gap between branches and leaves painted.

**Remedy:** most of these are composition decisions made before rendering;
regenerate from a corrected field plan. Alpha problems are a pipeline issue
— see the extraction procedure in `render-prompt.md`.

---

## Cross-cutting rejections

These are not tied to one gate:

- **Reference reproduction** — a copied composition, a traced reference, or
  a recognisable imitation of a living artist's work.
- **Fantasy decoration** — sparkles, stars, magic dust, glowing particles,
  fairy effects, halos, or fantasy anatomy used to manufacture dreaminess.
  Dreaminess comes from colour, flatness, and misregistration.
- **Generic game art** — mobile-game item icon, 3D asset, flat vector
  sticker, or an identical template applied across subjects.
- **Random digital noise** standing in for material grain.
- **Black or grey scratch fields** carrying the image's contrast. Dark marks
  are a small optional grounding accent; colour carries the energy.
