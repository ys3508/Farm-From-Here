# FARM FROM HERE --- `photo-adoptable-world-asset`

## Purpose

Build a reusable Codex skill that turns a **real farmer-uploaded photo**
into a **dedicated visual asset for an adoptable real-world object in
FARM FROM HERE**.

Core pipeline:

> **Real photo → identify the real adoptable → preserve its identity →
> reinterpret it through FARM FROM HERE's visual language → output a
> transparent world asset.**

This is a **visual transformation capability**, not a Farmer UI feature.
Build and test it independently now so it can later plug into the Farmer
workflow.

------------------------------------------------------------------------

## 1. Product Context

FARM FROM HERE is centered on real-world relationships. The user is not
adopting a fictional game object; they are connecting to something that
actually exists.

Possible adoptables include:

-   crops
-   vegetables
-   fruits
-   fruit trees
-   trees
-   flowers
-   herbs
-   farm animals
-   insects
-   birds
-   other real living things that may later become adoptable

The generated asset represents a **specific real object**, not a generic
illustration.

Desired user reaction:

1.  **"Wow, this is beautiful / collectible."**
2.  **"This is MY real thing."**

Both matter.

------------------------------------------------------------------------

## 2. Skill Name

Use exactly:

`photo-adoptable-world-asset`

Do not rename it to `botanical-illustrator`, `plant-sticker`, or another
narrower name.

The skill must be able to expand beyond plants.

------------------------------------------------------------------------

## 3. Core Principle

### One visual language × subject-specific expression

Do **not** create a completely different art style for tomatoes, trees,
flowers, and animals.

Also do **not** force every object into the same visual template.

Use:

> **Unified visual language + subject-specific expression**

The same illustrator/world should be recognizable across adoptable
assets, while the way each subject is expressed can change.

Examples:

-   **Crops:** juicy, colorful, compact, energetic, playful.
-   **Trees:** expansive, organic, asymmetrical, gestural, layered.
-   **Flowers:** more graphic, abstract, expressive, color-driven.
-   **Animals/creatures:** stronger gesture, organic forms, personality,
    restrained stylization.

The medium and visual language remain related.

### The two axes — density and finish move in opposite directions

This is the single most important rule in this document, and the one most
often collapsed by mistake.

"How much do we simplify?" is not one question. It is two independent axes:

| Axis | Meaning | Target |
|---|---|---|
| **Density** | how many flowers/fruit/leaves, and how they are arranged | **keep high — close to the photo** |
| **Finish** | how many marks are spent on each one | **push low — flat** |

Do **not** average these into "moderately simplified." A midpoint on the
finish axis has no value: flatness reads as nearly binary, so a half-flat
form simply reads as unresolved modeling, and any degree-word ("restrained",
"moderate", "somewhere between") slides back toward rendered realism, which
is the deepest and most easily reached result.

The correct target is:

> **high density + fully flat treatment**

A dense fruiting branch keeps all fifteen fruits, their crowding, their
ratio to the foliage, and their growth directions — and paints each one as
two to five flat marks.

The division of labour:

- **Identity lives in the density axis** — count, arrangement, silhouette,
  growth direction. This is what makes it *this* plant and not a stock one.
- **Aesthetics live in the finish axis** — flat colour, offset line,
  high key, breathing room.

Breathing room is therefore achieved by painting each element **thinly**,
never by deleting elements.

------------------------------------------------------------------------

## 4. Identity Preservation

This is critical.

The generated image must not become a generic "pretty version" of the
species. It should represent the **specific real object in the farmer's
photograph**.

Where visible, preserve:

-   species/type
-   approximate shape
-   silhouette
-   growth stage
-   fruit/flower count
-   fruit arrangement
-   branch structure
-   leaf arrangement
-   trunk structure
-   unusual growth patterns
-   distinctive proportions
-   hue family of the visible colour (see the limit below)
-   other recognizable features

Ask:

> **What makes this particular object recognizable?**

not only:

> **What species is this?**

### Colour is an anchor of hue only — never of value

The source photograph's **lighting is not identity**. Sample the subject's
hue family from it; discard its exposure, key, contrast, and shadows
entirely.

- A dark, backlit, moody photograph must **not** produce a dark, moody
  asset.
- Every asset is re-keyed to a **high, light register** regardless of the
  source.
- Local value relationships from the photo (deep shadow cores, bright
  speculars) are not preserved and not approximated.

Without this rule, a dim source photo drags the whole result back into
photographic modeling no matter how flat the paint instructions are.

For example, for a tomato cluster, preserve its cluster structure,
approximate fruit count, relative fruit sizes, vine/branch arrangement,
calyx structure, and distinctive leaf pattern where visible.

Stylization may be strong, but identity must remain anchored to the real
source.

------------------------------------------------------------------------

## 5. Photo Understanding

A farmer photo may contain multiple living things.

Conceptually support:

1.  detect candidate living/adoptable objects;
2.  separate them from irrelevant background;
3.  identify which object(s) are intended to be adoptable;
4.  generate one dedicated asset per approved adoptable.

Do not invent adoption eligibility.

Keep these concepts separate:

-   **real object identity**
-   **photo/background**
-   **adoptable status**

------------------------------------------------------------------------

# 6. Specialized Visual Language

The existing FARM FROM HERE Illustration & Visual Aesthetic Guide
(`revise/FARM-FROM-HERE-Illustration-Style-v1.md`) defines
the broader brand/world language. This skill introduces a specialized
**adoptable-object visual language** for real things that enter MY WORLD.

The game visual system is still evolving. Do **not** force every game
screen or every future asset to use this exact treatment.

The current adoptable target is:

## Dreamy Botanical / Living Collectible Language

> **Real living identity + designed-and-painted form + dreamy color bloom +
> bold irregular gesture lines + expressive painted fields + tactile hand
> marks + controlled imperfection.**

The key idea is:

> **The subject is not simply illustrated. It is redesigned and painted
> into a collectible visual portrait while remaining recognizably itself.**

Reference images communicate abstract visual principles only. Never copy,
trace, reproduce, or closely imitate a reference artwork.

------------------------------------------------------------------------

## 7. Material / Medium

The visual language sits between:

- watercolor
- gouache
- colored pencil
- soft crayon
- marker
- loose ink wash
- dry brush
- tactile paper

It is **not** "watercolor botanical illustration" as a narrow style.

The material feeling should be:

- wet pigment blooming into neighboring colors;
- translucent layers;
- uneven pigment density;
- dry-brush edges;
- crayon/pencil marks sitting over paint;
- occasional marker-like graphic strokes;
- visible hand pressure;
- imperfect overlaps;
- small areas of pigment accumulation;
- tactile paper/physical-medium feeling.

Texture must look like **intentional physical marks made by a person**,
not random digital grain or generic "watercolor noise."

------------------------------------------------------------------------

## 8. Designed + Painted, Not Merely Rendered

This distinction is fundamental.

Avoid the mental model:

> photograph → realistic watercolor rendering

Use:

> photograph → identity extraction → visual reinterpretation → designed
> painted collectible

The object should feel **designed and painted**, not mechanically traced.

Realism provides the identity anchor.

Imagination controls:

- color relationships;
- contour gestures;
- painted fields;
- internal mark-making;
- composition;
- selective exaggeration.

The final image should feel like:

> **an artist playing with color and form while remembering the real
> object.**

Not:

> **an AI rendering a realistic plant in watercolor.**

------------------------------------------------------------------------

## 9. Contour / Line Language — Gesture, Not Outline

This is one of the highest-priority rules.

### Avoid

- clean AI/vector outlines
- perfectly uniform outlines
- perfectly continuous contour lines
- identical line weight everywhere
- sterile black outlines
- sterile dark-brown outlines
- precise sticker-cut outlines
- mechanically traced edges
- mathematically smooth curves
- contour lines that perfectly follow every pixel of the photo

### Desired

**Bold, loose, irregular, expressive hand-drawn gesture lines.**

The line should feel slightly alive and occasionally slightly "wrong."

Line weight should visibly change:

- thick → thin;
- thin → thick;
- heavy → broken;
- dark → colorful;
- continuous → interrupted.

Lines may:

- break;
- overlap;
- disappear and reappear;
- overshoot the subject slightly;
- sit slightly inside the form;
- sit slightly outside the form;
- cross a painted region;
- become part of the painted form;
- change color midway through a gesture.

The contour is **not merely an edge**.

> **The contour itself is a drawing gesture.**

A useful test:

> If the outline could be recreated by tracing the photo with a vector
> pen, it is too regular.

### The line is a separate pass, offset from the paint

The rules above say what the line must *not* do. This says what it **is**,
and it is the load-bearing mechanism of the whole visual language.

Do not think of the line as an edge belonging to a painted shape. Think of
it as **a second, independent drawing of the same subject, printed slightly
out of register with the first.**

The model is misaligned print plates:

```text
plate 1 — flat colour masses
plate 2 — the drawn line
        ↑ deliberately offset by a small amount
```

Consequences that must be visible in the output:

- the line runs **beside** an edge rather than on it, by a small and
  roughly consistent displacement;
- it crosses freely into the painted mass and out into empty space;
- it keeps describing the subject the whole time — it is a drawing of the
  flower, not a mark near the flower;
- a colour mass may sit slightly outside its own line, exposing a sliver of
  bare ground on one side and a doubled edge on the other.

**The most common failure this rule exists to prevent:** told only "do not
trace the edge," a generator satisfies it by detaching the line from the
structure altogether and producing floating decorative arcs and swooshes
laid over a finished painting. Those are a defect, not a stylisation. The
line must never be an ornament applied after the paint; it is a full second
pass over the same forms.

### Stating it as offset fills rather than an offset line

In practice this rule is the hardest of the specification to obtain from an
image generator, because a closed, evenly weighted contour sitting exactly on
the edge is what "line drawing" means to one. Asking for a displaced *line*
tends to return a clean registered outline regardless of how the request is
phrased.

Describing the same effect from the other side works better, because it
matches how real misprinting is talked about:

> The flat colour fills are printed slightly out of register with the line
> drawing — each colour area shifted a few millimetres from its outline, so
> bare paper shows as a thin sliver along one side of a shape and the colour
> spills past the line on the opposite side.

Where the production pipeline can emit the line and the colour as separate
layers, do not rely on wording at all: offset the line layer during
compositing. That makes displacement a controllable parameter instead of a
property that has to be argued out of a generator.

------------------------------------------------------------------------

## 10. Multicolor Contours

Do not default to black or dark-brown outlines.

Contour colors should participate in the palette.

Examples:

- pink around green;
- yellow around red;
- blue/purple around coral;
- turquoise around orange;
- green around pink;
- occasional darker grounding marks.

A single object can contain several contour colors.

A contour may also have a slightly offset secondary color mark.

The purpose is **graphic personality**, not decorative rainbow outlining.

------------------------------------------------------------------------

## 11. Rich Color Bloom — Not Digital Gradient

This is another highest-priority rule.

Do not treat each anatomical region as one flat color.

Do not use conventional smooth digital gradients as the main color behavior.

Instead use:

> **painted color transition / color bloom / pigment mixing**

These transitions must cross **hue**, not walk along a value ramp inside one
family. A list such as `red → coral → orange → peach → pink` is a single
warm family getting lighter; painted out, it reads as blended modeling, not
as colour bloom.

Use unrelated hues meeting inside one form instead:

A tomato may carry:

**red · lavender · turquoise · butter yellow**

A leaf may carry:

**sage · powder blue · coral · warm pink**

The test: if the colours inside a form could be produced by lightening and
darkening one pigment, it is a gradient, not a bloom.

### Colour freedom by layer

Colour liberty is allocated by layer, not applied evenly:

| Layer | Freedom | Rule |
|---|---|---|
| **1. Subject's dominant masses** | anchored | stay in the real hue family; may shift into an adjacent family, never out of it. A peony reads red/pink; foliage reads green. |
| **2. Secondary colour inside the subject** | free | this is where unrelated hues enter a single petal or leaf. Botanical logic does not apply. |
| **3. Line and supporting fields** | fully art-directed | chosen purely for composition, and **required** to leave layer 1's hue family. |

Layer 1 keeps the thing recognisable as itself. Layer 3 carries the
aesthetic. Layer 2 is the bridge and should be used generously.

Note that layer 1 is anchored by **hue only** — see the value rule in
section 4. Anchoring to the photo's hue must never re-import the photo's
darkness.

These colors should appear as:

- layered paint;
- overlapping washes;
- irregular patches;
- translucent pigment;
- brush deposits;
- crayon/pencil marks;
- visible color collisions.

### Important:

**Color is allowed to cross anatomical boundaries.**

A pink mark may enter a green leaf.

A blue wash may overlap a red tomato.

A yellow pigment patch may sit partly outside the expected form.

The color does not have to obey botanical realism perfectly.

This creates the desired **slight loss of control**.

The goal is:

> **living color**

not:

> **smooth gradient**

------------------------------------------------------------------------

## 12. Internal Color Structure

A single leaf should not automatically be:

> one green fill + darker green shadow

A single fruit should not automatically be:

> one red fill + realistic highlight

Instead, treat each form as a small color world.

Use:

- several **unrelated** hues meeting inside the one form;
- flat overlapping patches with visible boundaries;
- irregular colour fields;
- unexpected but harmonious accents;
- pigment blooms that stay flat rather than blending;
- one or two selective pencil/crayon marks, on hero forms only.

Note what is **not** on that list: directional brush marks describing the
form. Those belong to section 13's rejected model — they build roundness.
Internal colour here is a set of flat areas sitting next to and over each
other, not a modelled surface.

The internal colour should feel **layered and discovered**, not
algorithmically shaded — and "layered" means stacked flat patches, not
blended glazes.

------------------------------------------------------------------------

## 13. Surface Texture — Material Grain, Not Modeling Strokes

Texture comes from the **material**, not from describing the form.

The wrong model is a painter laying strokes that follow curvature, veins, or
growth direction. Marks that follow anatomy are precisely how oil painting
builds roundness — and roundness is not wanted here. Following this instinct
produces digital impasto every time.

Use instead:

> **a flat colour area with an even material grain sitting across it**

The grain belongs to the medium and largely ignores the anatomy beneath it:

- watercolour paper tooth;
- soft crayon / pastel rub with visible paper texture;
- risograph or screenprint stipple and ink mottling;
- dry-pigment granulation;
- uneven ink density across an otherwise flat area.

The grain should read broadly the same across a petal, a leaf, and a stem.
It is a property of the paper and the ink, not a description of the object.

### Mark budget

Finish is not a matter of degree, so it is set by count rather than by
adjective:

| Form | Marks |
|---|---|
| one petal / one fruit | **2–5 total** |
| one leaf | **1**, occasionally 2 |
| one stem or branch | **1 continuous mark** |

If a form seems to need more marks than this to read correctly, **simplify
its shape** — do not add marks.

Directional marks survive only as **sparse accents on a small number of hero
forms**: a few short pencil drags, one crayon scribble, one scratched vein.
They must never become the surface treatment of every form.

The viewer should feel:

> **"This was printed and pressed."**

Not:

> **"This was rendered."**

------------------------------------------------------------------------

## 14. Painted Color Fields Around the Subject

The transparent asset may contain **independent painted color fields**
behind and around the subject.

These are not conventional backgrounds.

They are part of the illustration's composition.

Think:

> **artist paints a loose wash behind the object**

not:

> **designer places a rectangle behind the object.**

Possible forms:

- irregular paint washes;
- loose brush dabs;
- translucent blooms;
- offset color fields;
- broken pigment patches;
- organic blobs;
- small accidental-looking paint marks.

They should have:

- irregular edges;
- variable opacity;
- visible brush behavior;
- pigment overlap;
- areas that fade away;
- occasional overlap with the subject.

### Crucial:

The color field may **slightly escape the subject's boundaries**.

This creates the reference images' sense of playful visual looseness.

### Blocky is allowed; mechanical is not

A field may legitimately read as a **broad rectangular swipe or slab** —
a torn block of colour set off to one side of the subject. What disqualifies
a shape is mechanical precision, not straightness.

Acceptable: a wide brush swipe with soft, uneven, hand-made ends; a pressed
block of gouache; a torn-paper rectangle.

### Avoid

- crisp geometric shapes with mathematically exact edges;
- perfect circles;
- UI cards;
- smooth digital gradients;
- generic drop shadows;
- conventional sticker borders;
- a field that traces or encircles the subject's silhouette.

Placement matters more than shape: put fields **beside or behind one or two
chosen sides** of the subject, not wrapped around it.

------------------------------------------------------------------------

## 15. Controlled Imperfection / Slight Loss of Control

This is a defining characteristic.

The artwork should not look perfectly obedient to geometry.

Allow:

- a contour that slightly misses the edge;
- a color wash that goes beyond the form;
- a second line that is slightly offset;
- pigment that overlaps another color;
- a brush mark that fades unexpectedly;
- small asymmetries;
- uneven line pressure;
- imperfect shapes;
- tiny incidental marks.

This should be **controlled imperfection**, not messiness.

The result should feel:

> **alive, playful, handmade, and slightly unpredictable.**

------------------------------------------------------------------------

## 16. Dreamy Does Not Mean Fantasy

Do not manufacture dreaminess with:

- excessive sparkles;
- stars;
- magical dust;
- glowing particles;
- fairy effects;
- fantasy anatomy;
- excessive halos.

Dreaminess should primarily come from:

- unexpected but harmonious color relationships;
- color blooming;
- multicolor contours;
- painted fields;
- expressive composition;
- visible hand marks;
- slight visual misregistration;
- controlled imperfection.

A dreamy asset can contain **zero sparkles** and still feel magical.

The core principle is:

> **Dreamy through color and mark-making, not fantasy decoration.**

------------------------------------------------------------------------

## 17. Playful Details

Small marks can be used sparingly:

- tiny color dots;
- short expressive strokes;
- small pigment flecks;
- tiny irregular accent marks;
- occasional hand-drawn graphic gestures.

They should feel like natural marks from the artist's process.

Do not turn them into a decorative sticker system.

Do not add visual noise just to make the asset "cute."

------------------------------------------------------------------------

## 18. Collectible Quality

The asset should feel like a **personal visual portrait / collectible**,
not an icon.

Desired feeling:

> **"This is my real plant, but someone turned it into a beautiful little
> piece of art for my world."**

Avoid:

- generic mobile-game item icons;
- 3D game assets;
- flat vector stickers;
- overly polished commercial illustration;
- identical templates;
- generic botanical clip art.

Each asset should have personality because it comes from a **specific real
source**.

------------------------------------------------------------------------

## 19. Subject-Specific Expression

Use one shared visual language but adapt the expression to the living
subject.

The art style stays unified.

The **composition, gesture, density, and emphasis** can change.

### Crops

Prioritize:

- fruit/vegetable silhouette;
- abundance;
- juicy color;
- recognizable leaves/stems;
- compact energetic composition.

### Trees

Prioritize:

- canopy silhouette;
- trunk/branch gesture;
- asymmetry;
- scale;
- character;
- growth structure.

Do not compress every tree into a small generic icon.

### Fruit Trees

Prioritize:

- canopy;
- branches;
- fruit placement;
- seasonality;
- relationship between tree structure and fruit.

### Flowers

Prioritize:

- petal silhouette;
- color relationships;
- expressive contour;
- graphic shape;
- organic asymmetry.

Flowers may lean slightly more graphic/color-driven while remaining within
the same painted language.

### Farm Animals / Creatures

Prioritize:

- silhouette;
- posture and gesture;
- recognizable anatomy;
- personality;
- natural proportions.

Use restrained stylization.

Do not turn every animal into a cartoon mascot.

------------------------------------------------------------------------

## 20. Transparency / Output

Default output:

**transparent background**

The asset must be usable directly inside MY WORLD and future collection
surfaces.

Do not bake in:

- app background;
- UI card;
- title;
- label;
- farmer name;
- decorative frame;
- palette swatches;
- explanatory text.

If painted supporting fields are used, they remain part of the transparent
asset.


## 21. Conceptual Workflow

``` text
Farmer Photo
    ↓
Photo Understanding
    ↓
Candidate Adoptable Detection
    ↓
Photo Sufficiency Gate          (GOOD / PARTIAL / AMBIGUOUS / INSUFFICIENT)
    ↓                            ambiguous or insufficient → stop and ask
Identity Anchor Extraction
    ↓
Density Record                  (counts, ratios, crowding, growth directions)
    ↓
Flat Colour Masses              (mark budget; hue anchored, value re-keyed high)
    ↓
Offset Line Pass                (second drawing, printed out of register)
    ↓
Material Grain
    ↓
Supporting Fields
    ↓
Transparent Background Extraction
    ↓
Eight Acceptance Gates
    ↓
Final Adoptable World Asset
```

------------------------------------------------------------------------

## 22. Quality Control

Acceptance is defined operationally by the **eight gates** in the skill's
`SKILL.md`, with the failure catalogue in its `references/deep-qa.md`. Do not
maintain a second competing checklist here; this section states only what the
gates are testing for and why.

The eight gates, in order:

1. **Identity** — the real subject is recognisable; nothing absent from the
   photo was invented.
2. **Triage honoured** — only GOOD or PARTIAL_BUT_USABLE sources were used.
3. **Density preserved** — counts, arrangement, crowding, ratio, and growth
   directions read close to the source.
4. **Flat** — within the mark budget; no modeling, volume, or speculars.
5. **High key** — light; the source photograph's darkness was not inherited.
6. **Off-register line** — a displaced second drawing, not an outline and not
   floating arcs.
7. **Cross-hue colour** — the three colour layers behave as specified in
   section 11.
8. **Clean output** — transparent, uncluttered, no text or frame.

### A note on wording, because earlier drafts got this backwards

Flatness is **wanted**. Earlier versions of this document asked whether
colours were "layered rather than flat" and rejected "flat-colour clip art";
both pushed toward the digital-impasto result this specification now exists
to prevent.

The distinction that actually matters:

| Wanted | Not wanted |
|---|---|
| flat colour **areas** | flat, dead colour **relationships** |
| unshaded masses whose shape carries the form | one local colour per region plus a darker version for shadow |
| several unrelated hues meeting inside one form | a single hue family walking a value ramp |

So: **flat surfaces, rich colour.** Clip art fails not because it is flat but
because its colour is inert and its shapes are generic.

### Restraint

-   Dreamy without becoming fantasy.
-   Colorful without becoming neon.
-   Stylized without becoming generic.
-   Collectible without becoming a generic game sticker.

------------------------------------------------------------------------

## 23. Copyright / Reference Boundary

Reference images communicate **visual principles only**.

Do not:

-   reproduce a reference composition;
-   reproduce a specific illustration;
-   trace a reference;
-   imitate a living artist;
-   reproduce recognizable decorative elements from a reference;
-   treat a reference as a template.

Extract only abstract principles such as:

-   bold variable contours
-   multicolor outlines
-   painted color blooms
-   loose watercolor/ink behavior
-   unexpected color relationships
-   tactile mixed-media marks
-   irregular painted shapes
-   collectible composition

Create an original FARM FROM HERE visual language.

------------------------------------------------------------------------

## 24. Relationship to the Existing FARM FROM HERE Guide

The existing Illustration & Visual Aesthetic Guide
(`revise/FARM-FROM-HERE-Illustration-Style-v1.md`) remains the
**brand-level north star**.

It establishes:

-   real-world grounding + storybook imagination;
-   handmade/tactile quality;
-   organic linework;
-   natural warmth;
-   visual family resemblance;
-   **New subject ≠ new art style.**

This skill is a specialized sub-language for adoptable-world assets.

Do not overwrite the broader guide.

Do not force the exact splash/sign-in visual treatment onto every
adoptable asset.

------------------------------------------------------------------------

## 25. What This Skill Is NOT

Do not turn this into:

-   a Farmer dashboard;
-   a Farmer profile builder;
-   an adoption marketplace;
-   a database migration;
-   a My World UI implementation;
-   a generic image editor;
-   a generic "turn photo into watercolor" tool;
-   a fixed sticker generator;
-   a plant-only illustration generator.

This is a reusable **photo-to-adoptable-world-asset capability**.

------------------------------------------------------------------------

## 26. Codex Implementation Instructions

Before writing production code:

1.  Inspect the existing repository and skill structure.
2.  Read the project instructions and current visual documentation.
3.  Create the skill using the exact name: `photo-adoptable-world-asset`
4.  Keep it modular and independently testable.
5.  Do not build Farmer UI as part of this task.
6.  Do not change unrelated product architecture.
7.  Start with real photo test cases.
8.  Use the supplied tomato photo as the first visual test.
9.  Iterate on the visual transformation before product integration.

The first success criterion is **not code completeness**.

It is:

> **Given a real farmer photo, can the system produce a recognizable,
> original, transparent-background adoptable asset that feels
> collectible and belongs to the FARM FROM HERE world?**

------------------------------------------------------------------------

## 27. First Test Case

Use the supplied real tomato photo as the first test.

Expected result:

-   recognizable tomato cluster;
-   identity preserved from the source;
-   transparent background;
-   bold, irregular gesture contours rather than traced outlines;
-   clearly varied line weight, with occasional breaks/overshoot/offset;
-   multicolor contour accents integrated into the palette;
-   watercolor/ink-wash/gouache-like pigment behavior;
-   colored-pencil and soft-crayon marks layered over paint;
-   directional hand marks that follow the object's form;
-   non-linear painted color blooms rather than smooth digital gradients;
-   colors allowed to cross anatomical boundaries in controlled ways;
-   dreamy but grounded, harmonious color relationships;
-   irregular painted color fields behind/around the subject;
-   color fields with uneven opacity, brush edges, overlap, and slight
    misregistration;
-   no excessive decorative sparkle;
-   no text;
-   no UI;
-   no palette swatches;
-   no decorative frame;
-   no excessive sparkles;
-   no photorealism;
-   no generic watercolor botanical look.

The first goal is to validate the **visual language**, not to finalize
the entire production pipeline.

------------------------------------------------------------------------

# 28. North Star

The generated object should feel like:

> **A real thing from someone's farm, remembered and reimagined by an
> artist for the user's world.**

Not:

> "an AI-generated picture of a tomato."

And not:

> "a generic game sticker."

The target sits between reality and imagination:

**REAL OBJECT × PERSONAL IDENTITY × FLAT DESIGNED FORM ×
CROSS-HUE COLOR × OFFSET DRAWN LINE × COLLECTIBLE WORLD ASSET**

The visual DNA can be remembered as:

> **Dense arrangement + Flat colour + Cross-hue bloom + Off-register line +
> Material grain + High key + Generous transparent ground**

Six words if it has to be six:

> **DENSE, FLAT, OFF-REGISTER, LIGHT.**

Dreaminess comes from **colour relationships, flatness, and print
misregistration** — not from painterly rendering and not from fantasy
decoration.

That is the purpose of `photo-adoptable-world-asset`.
