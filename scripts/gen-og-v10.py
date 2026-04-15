"""
Generate og-v10.webp — Double Sweep Cascade animated OG image.
900x900, 72 frames.

Animation sequence:
  Frames  0-21 : Two horizontal beams sweep L→R (pink lead + white trailing 150px behind). 50ms ea.
  Frames 22-43 : Second pass of the same double sweep at 60% brightness. 50ms ea.
  Frames 44-63 : Vertical sweep beam top→bottom, pink, 200px wide gaussian. 45ms ea.
  Frames 64-71 : Hold. 90ms ea.
"""

import math
import os
import struct
import zlib

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(SCRIPT_DIR, "..")
LOGO_PATH = os.path.join(ROOT, "assets", "logo.png")
OUT_WEBP  = os.path.join(ROOT, "static", "og-v10.webp")
OUT_PNG   = os.path.join(ROOT, "static", "og-v10.png")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
W, H = 900, 900
LOGO_BASE_W = 580
LOGO_ANCHOR_Y = 370   # vertical midpoint of logo

PINK = (237, 12, 133)
WHITE = (255, 255, 255)
BG = (10, 10, 10)

TAGLINE = "West Michigan's Premier DIY Auto Shop"
BADGE   = "OPENING 2026  ·  GRAND RAPIDS, MI"

# Beam geometry
BEAM_WIDTH = 120        # half-gaussian sigma for horizontal beam (pixels)
VERT_BEAM_WIDTH = 200   # full gaussian sigma for vertical beam

# Phase boundaries
PHASE1_START, PHASE1_END = 0, 22       # frames 0-21
PHASE2_START, PHASE2_END = 22, 44      # frames 22-43
PHASE3_START, PHASE3_END = 44, 64      # frames 44-63
PHASE4_START, PHASE4_END = 64, 72      # frames 64-71 (hold)

TOTAL_FRAMES = 72

# Per-phase durations (ms)
DURATIONS = (
    [50] * (PHASE1_END - PHASE1_START) +
    [50] * (PHASE2_END - PHASE2_START) +
    [45] * (PHASE3_END - PHASE3_START) +
    [90] * (PHASE4_END - PHASE4_START)
)

# ---------------------------------------------------------------------------
# Font helper (same as v6)
# ---------------------------------------------------------------------------
def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates_bold = [
        "/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
        "/system/fonts/Roboto-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    candidates_reg = [
        "/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans.ttf",
        "/system/fonts/Roboto-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in (candidates_bold if bold else candidates_reg):
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()

# ---------------------------------------------------------------------------
# Build static base canvas (bg + glow + logo + text) — shared across all frames
# ---------------------------------------------------------------------------
logo_src = Image.open(LOGO_PATH).convert("RGBA")

def build_radial_glow(cx: int, cy: int, radius: int, alpha: float) -> Image.Image:
    """Pink radial glow centred at (cx, cy)."""
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    steps = 80
    for i in range(steps, 0, -1):
        frac = i / steps
        r = int(radius * frac)
        a = int(alpha * 255 * (frac ** 2))
        a = max(0, min(255, a))
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(*PINK, a))
    return glow.filter(ImageFilter.GaussianBlur(radius=max(1, radius // 10)))


def draw_text_layer(img: Image.Image) -> None:
    draw = ImageDraw.Draw(img)

    # Pink horizontal rule
    rule_y = 600
    draw.rectangle([160, rule_y, 740, rule_y + 2], fill=(*PINK, 230))

    # Grey tagline
    tf = font(22)
    bb = draw.textbbox((0, 0), TAGLINE, font=tf)
    tw = bb[2] - bb[0]
    draw.text(((W - tw) // 2, rule_y + 16), TAGLINE, font=tf, fill=(180, 180, 190, 220))

    # Pink badge pill
    bf = font(18, bold=True)
    bb2 = draw.textbbox((0, 0), BADGE, font=bf)
    bw = bb2[2] - bb2[0]
    bh = bb2[3] - bb2[1]
    pad_x, pad_y = 22, 10
    pill_w = bw + pad_x * 2
    pill_h = bh + pad_y * 2
    pill_x = (W - pill_w) // 2
    pill_y = rule_y + 60
    pill_img = Image.new("RGBA", (pill_w, pill_h), (0, 0, 0, 0))
    pdraw = ImageDraw.Draw(pill_img)
    pdraw.rounded_rectangle(
        [0, 0, pill_w - 1, pill_h - 1],
        radius=pill_h // 2,
        fill=(237, 12, 133, 30),
        outline=(*PINK, 200),
        width=2,
    )
    img.alpha_composite(pill_img, dest=(pill_x, pill_y))
    draw.text(
        (pill_x + pad_x - bb2[0], pill_y + pad_y - bb2[1]),
        BADGE,
        font=bf,
        fill=(*PINK, 240),
    )


def build_base_canvas() -> Image.Image:
    """Dark background + pink radial glow + logo + static text."""
    img = Image.new("RGBA", (W, H), (*BG, 255))

    # Radial glow centred on logo
    glow = build_radial_glow(W // 2, LOGO_ANCHOR_Y, 320, 0.22)
    img = Image.alpha_composite(img, glow)

    # Logo (580px wide, centred)
    aspect = logo_src.height / logo_src.width
    lw = LOGO_BASE_W
    lh = int(lw * aspect)
    logo_r = logo_src.resize((lw, lh), Image.LANCZOS)
    lx = (W - lw) // 2
    ly = LOGO_ANCHOR_Y - lh // 2
    img.alpha_composite(logo_r, dest=(lx, ly))

    # Text / rule / badge
    draw_text_layer(img)

    return img


# ---------------------------------------------------------------------------
# Beam compositing helpers (numpy-based for speed)
# ---------------------------------------------------------------------------
# Pre-build coordinate grids once
_X = np.arange(W, dtype=np.float32)   # shape (W,)
_Y = np.arange(H, dtype=np.float32)   # shape (H,)


def horizontal_beam_layer(
    centre_x: float,
    color: tuple[int, int, int],
    sigma: float,
    peak_alpha: float,
) -> Image.Image:
    """
    Soft vertical-strip beam centred at centre_x.
    Gaussian falloff along the horizontal axis; uniform vertically.
    peak_alpha: maximum opacity at beam centre (0..1).
    """
    # Gaussian along X axis: shape (W,)
    g = np.exp(-0.5 * ((_X - centre_x) / sigma) ** 2)
    alpha = (g * peak_alpha * 255).clip(0, 255).astype(np.uint8)  # (W,)

    # Broadcast to (H, W)
    alpha_2d = np.broadcast_to(alpha[np.newaxis, :], (H, W))

    # Build RGBA array (H, W, 4)
    rgba = np.zeros((H, W, 4), dtype=np.uint8)
    rgba[:, :, 0] = color[0]
    rgba[:, :, 1] = color[1]
    rgba[:, :, 2] = color[2]
    rgba[:, :, 3] = alpha_2d

    return Image.fromarray(rgba, "RGBA")


def vertical_beam_layer(
    centre_y: float,
    color: tuple[int, int, int],
    sigma: float,
    peak_alpha: float,
) -> Image.Image:
    """
    Soft horizontal-strip beam centred at centre_y.
    Gaussian falloff along the vertical axis; uniform horizontally.
    """
    # Gaussian along Y axis: shape (H,)
    g = np.exp(-0.5 * ((_Y - centre_y) / sigma) ** 2)
    alpha = (g * peak_alpha * 255).clip(0, 255).astype(np.uint8)  # (H,)

    # Broadcast to (H, W)
    alpha_2d = np.broadcast_to(alpha[:, np.newaxis], (H, W))

    rgba = np.zeros((H, W, 4), dtype=np.uint8)
    rgba[:, :, 0] = color[0]
    rgba[:, :, 1] = color[1]
    rgba[:, :, 2] = color[2]
    rgba[:, :, 3] = np.ascontiguousarray(alpha_2d)

    return Image.fromarray(rgba, "RGBA")


# ---------------------------------------------------------------------------
# Sweep position helpers
# ---------------------------------------------------------------------------
SWEEP_MARGIN = 120   # extra travel beyond edges (so beam fully enters/exits)

def sweep_pos(t: float, lo: float = -SWEEP_MARGIN, hi: float = W + SWEEP_MARGIN) -> float:
    """Linear t ∈ [0,1] → x position from lo to hi."""
    return lo + t * (hi - lo)


def vertical_sweep_pos(t: float, lo: float = -SWEEP_MARGIN, hi: float = H + SWEEP_MARGIN) -> float:
    return lo + t * (hi - lo)


# ---------------------------------------------------------------------------
# Build all frames
# ---------------------------------------------------------------------------
print(f"Building base canvas…")
base = build_base_canvas()

frames: list[Image.Image] = []

print(f"Generating {TOTAL_FRAMES} frames…")

for fi in range(TOTAL_FRAMES):

    frame = base.copy()

    # ------------------------------------------------------------------
    # Phase 1 & 2: double horizontal sweep
    # ------------------------------------------------------------------
    if PHASE1_START <= fi < PHASE1_END or PHASE2_START <= fi < PHASE2_END:
        if fi < PHASE1_END:
            phase_t = (fi - PHASE1_START) / (PHASE1_END - PHASE1_START)
            brightness = 1.0
        else:
            phase_t = (fi - PHASE2_START) / (PHASE2_END - PHASE2_START)
            brightness = 0.6

        # Pink lead beam
        lead_x = sweep_pos(phase_t)
        beam_pink = horizontal_beam_layer(
            centre_x=lead_x,
            color=PINK,
            sigma=BEAM_WIDTH,
            peak_alpha=0.72 * brightness,
        )
        frame = Image.alpha_composite(frame, beam_pink)

        # White trailing beam — 150px behind (to the left), 40% as bright
        trail_x = lead_x - 150
        beam_white = horizontal_beam_layer(
            centre_x=trail_x,
            color=WHITE,
            sigma=BEAM_WIDTH * 0.85,
            peak_alpha=0.72 * brightness * 0.40,
        )
        frame = Image.alpha_composite(frame, beam_white)

    # ------------------------------------------------------------------
    # Phase 3: vertical sweep (top → bottom)
    # ------------------------------------------------------------------
    elif PHASE3_START <= fi < PHASE3_END:
        phase_t = (fi - PHASE3_START) / (PHASE3_END - PHASE3_START)
        centre_y = vertical_sweep_pos(phase_t)
        beam_v = vertical_beam_layer(
            centre_y=centre_y,
            color=PINK,
            sigma=VERT_BEAM_WIDTH * 0.5,   # sigma = half of the stated "width"
            peak_alpha=0.65,
        )
        frame = Image.alpha_composite(frame, beam_v)

    # Phase 4: hold — no overlay, base canvas only
    # (frame already copied from base)

    frames.append(frame.convert("RGB"))

    if (fi + 1) % 16 == 0:
        print(f"  {fi + 1}/{TOTAL_FRAMES} frames done")

# ---------------------------------------------------------------------------
# Save animated WebP
# ---------------------------------------------------------------------------
print("Saving animated WebP…")
frames[0].save(
    OUT_WEBP,
    format="WEBP",
    save_all=True,
    append_images=frames[1:],
    duration=DURATIONS,
    loop=0,
    quality=82,
    method=4,
)

webp_size = os.path.getsize(OUT_WEBP)
print(f"og-v10.webp : {webp_size / 1024:.1f} KB  ({webp_size:,} bytes)")

# ---------------------------------------------------------------------------
# Save PNG — use the hold frame (frame 64) as a clean static preview
# ---------------------------------------------------------------------------
print("Saving PNG (hold frame)…")
frames[PHASE4_START].save(OUT_PNG, format="PNG")
png_size = os.path.getsize(OUT_PNG)
print(f"og-v10.png  : {png_size / 1024:.1f} KB  ({png_size:,} bytes)")

print("Done.")
