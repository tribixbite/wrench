"""
Generate og-v2.webp: Scanlines + Diagonal Shimmer animated WebP (900x900).

Design:
- Very dark background (#0a0a0a)
- Horizontal scanlines every 4px at 8% opacity dark grey
- Wrench Club logo centered with pink glow behind it
- Pink rule below logo, grey tagline, pink badge at bottom centre
- Diagonal shimmer beam (~150px wide, 30-degree angle) sweeps left-to-right
  3 passes at brightness 1.0, 0.5, 0.25 then 8 hold frames
  50ms sweep frames, 90ms hold frames
"""

import math
import os
import struct
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
W, H = 900, 900
BG_COLOR = (10, 10, 10, 255)
PINK = (237, 12, 133)
PINK_ALPHA = (237, 12, 133, 255)
WHITE = (255, 255, 255)
GREY_TAG = (160, 160, 160)
LOGO_PATH = "/data/data/com.termux/files/home/git/wrench/assets/logo.png"
OUT_WEBP = "/data/data/com.termux/files/home/git/wrench/static/og-v2.webp"
OUT_PNG = "/data/data/com.termux/files/home/git/wrench/static/og-v2.png"

LOGO_TARGET_W = 580
BEAM_ANGLE_DEG = 30          # degrees from vertical (beam travels roughly left-to-right)
BEAM_WIDTH_PERP = 150        # full width perpendicular to travel direction (px)
BEAM_SIGMA = BEAM_WIDTH_PERP / 4.0  # gaussian sigma in perpendicular units

SWEEP_FRAMES = 24
HOLD_FRAMES = 8
SWEEP_DURATION = 50   # ms per frame
HOLD_DURATION = 90    # ms per frame

PASS_BRIGHTNESSES = [1.0, 0.5, 0.25]

# ---------------------------------------------------------------------------
# Build static base layer (background + scanlines + logo + text decorations)
# ---------------------------------------------------------------------------

def make_base() -> Image.Image:
    """Return a 900x900 RGBA image with all static elements painted."""
    base = Image.new("RGBA", (W, H), BG_COLOR)
    draw = ImageDraw.Draw(base, "RGBA")

    # --- scanlines: 1px line every 4px, dark grey at ~8% opacity ---
    scanline_color = (40, 40, 40, 20)   # 8% of 255 ≈ 20
    for y in range(0, H, 4):
        draw.line([(0, y), (W - 1, y)], fill=scanline_color)

    # --- pink glow behind logo (radial, centred) ---
    glow_cx, glow_cy = W // 2, H // 2 - 20
    glow_r = 300
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    # layered ellipses to build soft radial glow
    for i in range(12):
        factor = 1 - i / 12
        r = int(glow_r * factor)
        alpha = int(60 * (factor ** 2))
        gd.ellipse(
            [glow_cx - r, glow_cy - r * 2 // 3, glow_cx + r, glow_cy + r * 2 // 3],
            fill=(*PINK, alpha)
        )
    glow = glow.filter(ImageFilter.GaussianBlur(radius=40))
    base = Image.alpha_composite(base, glow)

    # --- logo (580px wide, centred vertically roughly at 44%) ---
    logo_raw = Image.open(LOGO_PATH).convert("RGBA")
    lw, lh = logo_raw.size
    target_w = LOGO_TARGET_W
    target_h = int(lh * target_w / lw)
    logo = logo_raw.resize((target_w, target_h), Image.LANCZOS)
    logo_x = (W - target_w) // 2
    logo_y = (H - target_h) // 2 - 60
    base.paste(logo, (logo_x, logo_y), logo)

    # --- pink rule below logo ---
    rule_y = logo_y + target_h + 22
    rule_x0 = (W - 320) // 2
    rule_x1 = rule_x0 + 320
    draw2 = ImageDraw.Draw(base, "RGBA")
    draw2.line([(rule_x0, rule_y), (rule_x1, rule_y)], fill=(*PINK, 255), width=2)

    # --- tagline ---
    tag_y = rule_y + 18
    try:
        font_tag = ImageFont.truetype(
            "/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans.ttf", 20
        )
    except Exception:
        font_tag = ImageFont.load_default()
    tagline = "Member-Access DIY Auto Shop · Grand Rapids, MI"
    bbox = draw2.textbbox((0, 0), tagline, font=font_tag)
    tw = bbox[2] - bbox[0]
    draw2.text(((W - tw) // 2, tag_y), tagline, fill=(*GREY_TAG, 200), font=font_tag)

    # --- pink badge at bottom centre ---
    badge_text = "WRENCH CLUB"
    badge_cy = H - 60
    try:
        font_badge = ImageFont.truetype(
            "/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans-Bold.ttf", 15
        )
    except Exception:
        font_badge = ImageFont.load_default()
    bbbox = draw2.textbbox((0, 0), badge_text, font=font_badge)
    bw = bbbox[2] - bbbox[0]
    bh = bbbox[3] - bbbox[1]
    pad_x, pad_y = 18, 8
    badge_x = (W - bw - pad_x * 2) // 2
    badge_rect = [badge_x, badge_cy - bh // 2 - pad_y,
                  badge_x + bw + pad_x * 2, badge_cy + bh // 2 + pad_y]
    draw2.rounded_rectangle(badge_rect, radius=6, fill=(*PINK, 255))
    draw2.text((badge_x + pad_x, badge_cy - bh // 2), badge_text,
               fill=(255, 255, 255, 255), font=font_badge)

    return base


# ---------------------------------------------------------------------------
# Diagonal shimmer beam generation (numpy-based for speed)
# ---------------------------------------------------------------------------

def build_shimmer_frame(base_arr: np.ndarray, cx: float, brightness: float) -> Image.Image:
    """
    Composite a diagonal shimmer beam centred at horizontal position cx
    onto a copy of base_arr.

    The beam travels horizontally. At each pixel (px, py) we compute the
    signed perpendicular distance from the beam's centre-line (a line at
    BEAM_ANGLE_DEG from vertical passing through (cx, H/2)), then apply
    a Gaussian falloff for the alpha mask.

    beam direction vector (horizontal travel → rotate 90° for perp):
      angle_rad = 30° from vertical  →  beam axis in (sin30, cos30) = (0.5, 0.866)
      perpendicular to beam axis      →  (-cos30, sin30) = (-0.866, 0.5)
    To find signed perp distance of pixel (px,py) from the line through (cx, H/2):
      d = dot((px-cx, py-H/2), perp_unit)
        = -(px-cx)*cos30 + (py-H/2)*sin30
    We want |d| for the Gaussian; beam is brightest where d≈0.
    """
    angle_rad = math.radians(BEAM_ANGLE_DEG)
    cos_a = math.cos(angle_rad)
    sin_a = math.sin(angle_rad)
    # perpendicular unit vector to beam axis
    perp_x = -cos_a
    perp_y = sin_a

    # pixel coordinate grids
    xs = np.arange(W, dtype=np.float32)
    ys = np.arange(H, dtype=np.float32)
    gx, gy = np.meshgrid(xs, ys)  # shape (H, W)

    dx = gx - cx
    dy = gy - (H / 2)
    perp_dist = dx * perp_x + dy * perp_y   # signed perpendicular distance

    # Gaussian falloff
    sigma = float(BEAM_SIGMA)
    alpha_mask = np.exp(-(perp_dist ** 2) / (2 * sigma ** 2))  # 0..1

    # colour: blend PINK → WHITE towards centre
    blend = alpha_mask  # use same gaussian for pink-to-white blend

    r = PINK[0] + (WHITE[0] - PINK[0]) * blend * 0.6
    g = PINK[1] + (WHITE[1] - PINK[1]) * blend * 0.6
    b = PINK[2] + (WHITE[2] - PINK[2]) * blend * 0.6

    # final alpha: brightness controls peak opacity (cap at ~0.72 so it's elegant)
    peak_opacity = 0.72 * brightness
    a = alpha_mask * peak_opacity

    # beam RGBA layer (H, W, 4) float 0..255
    beam_arr = np.zeros((H, W, 4), dtype=np.float32)
    beam_arr[:, :, 0] = r * 255
    beam_arr[:, :, 1] = g * 255
    beam_arr[:, :, 2] = b * 255
    beam_arr[:, :, 3] = a * 255

    # alpha-composite beam over base using standard Porter-Duff "over"
    base_f = base_arr.astype(np.float32)
    src_a = beam_arr[:, :, 3:4] / 255.0
    dst_a = base_f[:, :, 3:4] / 255.0
    out_a = src_a + dst_a * (1 - src_a)

    out = np.zeros((H, W, 4), dtype=np.float32)
    mask = out_a[:, :, 0] > 0
    for c in range(3):
        out[:, :, c] = np.where(
            mask,
            (beam_arr[:, :, c] * src_a[:, :, 0] +
             base_f[:, :, c] * dst_a[:, :, 0] * (1 - src_a[:, :, 0])) /
            out_a[:, :, 0],
            0
        )
    out[:, :, 3] = out_a[:, :, 0] * 255

    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("Building base frame …")
    base = make_base()
    base_arr = np.array(base)

    frames = []
    durations = []

    # x travel range for the beam: -200 → 1100 over SWEEP_FRAMES
    x_start = -200.0
    x_end = 1100.0

    for pass_idx, brightness in enumerate(PASS_BRIGHTNESSES):
        print(f"  Pass {pass_idx + 1}/3  brightness={brightness}")
        for i in range(SWEEP_FRAMES):
            t = i / (SWEEP_FRAMES - 1)
            cx = x_start + (x_end - x_start) * t
            frame = build_shimmer_frame(base_arr, cx, brightness)
            frames.append(frame.convert("RGB"))
            durations.append(SWEEP_DURATION)

    # hold frames (beam offscreen at x_end)
    print(f"  Hold frames ({HOLD_FRAMES})…")
    hold_frame = base.convert("RGB")
    for _ in range(HOLD_FRAMES):
        frames.append(hold_frame)
        durations.append(HOLD_DURATION)

    total_frames = len(frames)
    print(f"Total frames: {total_frames}  ({len(frames)})")

    # Save PNG of first frame
    print(f"Saving PNG → {OUT_PNG}")
    frames[0].save(OUT_PNG, format="PNG")
    png_size = os.path.getsize(OUT_PNG)
    print(f"  PNG size: {png_size / 1024:.1f} KB")

    # Save animated WebP
    print(f"Saving WebP → {OUT_WEBP}")
    frames[0].save(
        OUT_WEBP,
        format="WEBP",
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=0,
        quality=82,
        method=4,
    )
    webp_size = os.path.getsize(OUT_WEBP)
    print(f"  WebP size: {webp_size / 1024:.1f} KB  ({webp_size / 1024 / 1024:.2f} MB)")
    print("Done.")


if __name__ == "__main__":
    main()
