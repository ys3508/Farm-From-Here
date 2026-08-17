# Illustration slots — the art order

Code sets the palette, type and texture. It **cannot** paint the pictures, and faking them with
gradients and emoji would undercut the one thing this product is selling: that it feels real and
hand-made (design.md, CLAUDE.md invariant 10).

So every place the design wants real artwork renders an `<IllustrationSlot>` — a visible dashed
placeholder naming the brief and the filename it is waiting for. Find them all with:

```bash
grep -rn "IllustrationSlot" app src
```

## Currently open slots

| File | Where it appears | Brief |
| --- | --- | --- |
| `signin-hero-map.png` | Sign-in screen, above the headline | A neighbourhood as a farmers-market food map — orchard rows, a red barn, tomatoes on the vine, hand-lettered street names. The first thing anyone sees. |
| `my-tree-hero.png` | My World → My Tree | A single apple tree portrait, seasonal. This is the emotional centre of V1.0 — the thing the user comes back for. |
| `world-map-base.png` | Map screen | A painted bird's-eye food map to sit under the farm pins, replacing the drawn geometry currently there. |

## Style

Hand-drawn / watercolour. Warm earthy farmers-market palette — the tokens in
`src/design/tokens.ts` are the reference. Textured and tactile, paper-sticker feel. Playful
hand-lettered accents. Real produce, not icons.

The app should read as *a living hand-drawn community food map*, never as a tech product.

## Dropping art in

1. Save the file here, at the exact `assetName` the slot names.
2. Replace the `<IllustrationSlot .../>` with `<Image source={require('...')} />`.
3. Delete the row from the table above.

Keep the slot component itself — later steps will open new ones.
