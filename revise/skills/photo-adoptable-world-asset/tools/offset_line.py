#!/usr/bin/env python3
"""
offset_line.py — produce gate-6 misregistration from a flat ImageGen asset.

Codex's ImageGen returns one raster, so the line and the colour cannot be
generated as separate plates. This recovers them from the single image.

It works because gate 4 passes: a flat image has clean, unambiguous colour
boundaries, and the contour ImageGen insists on drawing is uniform and dark,
which makes it separable on lightness alone.

    flat asset  ->  extract line  ->  heal colour  ->  recolour line
                ->  break line    ->  offset       ->  composite

Everything gate 6 asks for is geometric, so it is computed rather than
argued out of a generator. Offset, hue, and breakage are parameters: retune
and re-run without another generation.

Usage:
    python3 offset_line.py in.png out.png
    python3 offset_line.py in.png out.png --offset 8,5 --break 0.18
    python3 offset_line.py in.png out.png --dump-layers   # inspect stages

Requires Pillow and numpy.
"""

from __future__ import annotations

import argparse
import os
import sys

import numpy as np
from PIL import Image

# Layer-3 hues. Deliberately outside the warm-cream / green families the
# subject occupies; see the spec's three-layer colour table.
DEFAULT_LINE_COLORS = ["#E4572E", "#3C6DF0", "#B14FD8"]

# Offsets are authored against this width and scaled to the real image.
REFERENCE_WIDTH = 1024


# ---------------------------------------------------------------- colour utils

def rgb_to_hsv(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Vectorised RGB->HSV. rgb float 0..1, returns h in degrees, s, v in 0..1."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = mx - mn
    h = np.zeros_like(mx)
    nz = d > 1e-6
    ri, gi, bi = (mx == r) & nz, (mx == g) & nz, (mx == b) & nz
    h[ri] = ((g - b)[ri] / d[ri]) % 6
    h[gi] = ((b - r)[gi] / d[gi]) + 2
    h[bi] = ((r - g)[bi] / d[bi]) + 4
    return h * 60.0, np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0.0), mx


def hex_to_rgb(s: str) -> tuple[int, int, int]:
    s = s.strip().lstrip("#")
    if len(s) != 6:
        raise ValueError("expected #RRGGBB, got %r" % s)
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def luminance(rgb: np.ndarray) -> np.ndarray:
    return 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]


# ------------------------------------------------------------------ 1. extract

def extract_line(rgb: np.ndarray, alpha: np.ndarray, lum_max: float,
                 hue_range: tuple[float, float] | None,
                 sat_min: float) -> np.ndarray:
    """Soft mask (0..1) of the drawn contour.

    The contour is dark against a high-key subject, so lightness alone nearly
    separates it. Restricting by hue as well keeps warm interior markings —
    an orange throat, a red stamen tip — out of the line layer.
    """
    h, s, _v = rgb_to_hsv(rgb)
    lum = luminance(rgb)

    # Soft ramp rather than a hard cut, so antialiased contour edges keep
    # partial coverage. Binarising here is what chews the line into gravel.
    mask = np.clip((lum_max - lum) / max(lum_max * 0.5, 1e-6), 0.0, 1.0)

    if hue_range is not None:
        lo, hi = hue_range
        in_hue = (h >= lo) & (h <= hi) if lo <= hi else (h >= lo) | (h <= hi)
        # Near-neutral darks have unstable hue; admit them regardless.
        mask = mask * np.where(in_hue | (s < sat_min), 1.0, 0.0)

    return mask * alpha


# --------------------------------------------------------------------- 2. heal

def heal(rgb: np.ndarray, line: np.ndarray, alpha: np.ndarray,
         iterations: int) -> np.ndarray:
    """Replace contour pixels with surrounding flat colour.

    The contour is only a few pixels wide, so repeatedly averaging in the
    unmasked neighbours closes it. No real inpainting is needed — and would
    be wrong here, since the neighbours are flat by construction.
    """
    out = rgb.copy()
    # Confidence that a pixel already holds true subject colour.
    known = (1.0 - line) * (alpha > 0.5)

    for _ in range(iterations):
        acc = np.zeros_like(out)
        wsum = np.zeros(out.shape[:2], dtype=np.float64)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dx == 0 and dy == 0:
                    continue
                w = np.roll(np.roll(known, dy, 0), dx, 1)
                c = np.roll(np.roll(out, dy, 0), dx, 1)
                acc += c * w[..., None]
                wsum += w
        filled = np.divide(acc, np.maximum(wsum, 1e-6)[..., None],
                           out=np.zeros_like(acc), where=wsum[..., None] > 1e-6)
        take = (known < 0.5) & (wsum > 0.5)
        out = np.where(take[..., None], filled, out)
        known = np.maximum(known, take.astype(np.float64))

    return out


# ---------------------------------------------------------- 3/4. recolour+break

def smooth_noise(shape: tuple[int, int], cells: int, seed: int) -> np.ndarray:
    """Low-frequency 0..1 noise, upscaled bilinearly — coherent blobs, not grain."""
    h, w = shape
    rng = np.random.default_rng(seed)
    small = rng.random((max(cells, 2), max(cells, 2)))
    img = Image.fromarray((small * 255).astype(np.uint8), "L")
    return np.asarray(img.resize((w, h), Image.BILINEAR), dtype=np.float64) / 255.0


def recolour(line: np.ndarray, colors: list[str], seed: int) -> np.ndarray:
    """Map the line to several layer-3 hues in long contiguous runs.

    A single dark line colour everywhere is itself a gate-6 failure: navy is
    not black, but a uniform navy contour is still a default outline material.
    """
    h, w = line.shape
    n = smooth_noise((h, w), cells=6, seed=seed)
    rgbs = [hex_to_rgb(c) for c in colors]
    out = np.zeros((h, w, 3), dtype=np.float64)
    edges = np.linspace(0.0, 1.0, len(rgbs) + 1)
    for i, c in enumerate(rgbs):
        sel = (n >= edges[i]) & (n <= edges[i + 1])
        out[sel] = np.array(c, dtype=np.float64) / 255.0
    return out


def break_line(line: np.ndarray, amount: float, seed: int) -> np.ndarray:
    """Drop short coherent runs so weight varies and the contour interrupts.

    The prompt does not deliver this either; it is the same geometric problem.
    """
    if amount <= 0:
        return line
    n = smooth_noise(line.shape, cells=42, seed=seed + 977)
    keep = np.clip((n - amount) / max(1.0 - amount, 1e-6), 0.0, 1.0)
    # Ease so surviving segments stay solid instead of uniformly translucent.
    return line * np.clip(keep * 1.6, 0.0, 1.0)


# ---------------------------------------------------------------- 5. composite

def shift(a: np.ndarray, dx: int, dy: int) -> np.ndarray:
    out = np.zeros_like(a)
    h, w = a.shape[:2]
    ys, yd = (slice(0, h - dy), slice(dy, h)) if dy >= 0 else (slice(-dy, h), slice(0, h + dy))
    xs, xd = (slice(0, w - dx), slice(dx, w)) if dx >= 0 else (slice(-dx, w), slice(0, w + dx))
    out[yd, xd] = a[ys, xs]
    return out


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("input")
    p.add_argument("output")
    p.add_argument("--offset", default="6,4",
                   help="dx,dy at %d px wide, scaled to the real image (default 6,4)"
                        % REFERENCE_WIDTH)
    p.add_argument("--line-colors", default=",".join(DEFAULT_LINE_COLORS),
                   help="comma-separated #RRGGBB for the recoloured line")
    p.add_argument("--lum-max", type=float, default=0.45,
                   help="pixels darker than this are contour candidates (0..1)")
    p.add_argument("--hue-range", default="170,290",
                   help="hue window in degrees for the contour, or 'any'")
    p.add_argument("--sat-min", type=float, default=0.18,
                   help="below this saturation, hue is ignored (near-neutral darks)")
    p.add_argument("--break", dest="brk", type=float, default=0.12,
                   help="0..1 fraction of line dropped (default 0.12)")
    p.add_argument("--heal-iters", type=int, default=6)
    p.add_argument("--keep-original-line", action="store_true",
                   help="do not heal; leave the registered contour under the offset one")
    p.add_argument("--seed", type=int, default=7)
    p.add_argument("--dump-layers", action="store_true",
                   help="also write *_line.png and *_colour.png next to the output")
    a = p.parse_args()

    img = Image.open(a.input).convert("RGBA")
    arr = np.asarray(img, dtype=np.float64) / 255.0
    rgb, alpha = arr[..., :3], arr[..., 3]
    h, w = alpha.shape

    hue_range = None
    if a.hue_range.strip().lower() != "any":
        lo, hi = (float(x) for x in a.hue_range.split(","))
        hue_range = (lo, hi)

    line = extract_line(rgb, alpha, a.lum_max, hue_range, a.sat_min)
    cover = float((line > 0.25).mean())
    print("line coverage: %.2f%% of frame" % (cover * 100))
    if cover < 0.002:
        print("  warning: almost no contour found — try raising --lum-max, or "
              "--hue-range any", file=sys.stderr)
    elif cover > 0.30:
        print("  warning: over a third of the frame matched — the contour is not "
              "separating on lightness; lower --lum-max", file=sys.stderr)

    base = rgb if a.keep_original_line else heal(rgb, line, alpha, a.heal_iters)

    line = break_line(line, a.brk, a.seed)
    line_rgb = recolour(line, [c for c in a.line_colors.split(",") if c.strip()], a.seed)

    scale = w / REFERENCE_WIDTH
    dx, dy = (int(round(float(v) * scale)) for v in a.offset.split(","))
    print("offset: %+d,%+d px" % (dx, dy))

    la = shift(line[..., None], dx, dy)[..., 0]
    lc = shift(line_rgb, dx, dy)

    # Line over healed colour. Alpha unions, so line displaced past the
    # silhouette survives into bare ground — that spill is the effect.
    out_a = np.clip(alpha + la * (1.0 - alpha), 0.0, 1.0)
    out_rgb = np.where(
        (out_a > 1e-6)[..., None],
        (lc * la[..., None] + base * alpha[..., None] * (1.0 - la[..., None]))
        / np.maximum(out_a, 1e-6)[..., None],
        0.0,
    )

    stack = np.dstack([np.clip(out_rgb, 0, 1), out_a])
    Image.fromarray((stack * 255).round().astype(np.uint8), "RGBA").save(a.output)
    print("wrote", a.output)

    if a.dump_layers:
        stem = os.path.splitext(a.output)[0]
        Image.fromarray(
            (np.dstack([line_rgb, line]) * 255).round().astype(np.uint8), "RGBA"
        ).save(stem + "_line.png")
        Image.fromarray(
            (np.dstack([base, alpha]) * 255).round().astype(np.uint8), "RGBA"
        ).save(stem + "_colour.png")
        print("wrote", stem + "_line.png", "and", stem + "_colour.png")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
