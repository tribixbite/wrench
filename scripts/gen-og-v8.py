#!/usr/bin/env python3
"""
Generate og-v8.webp — Hex Grid shimmer animation for Wrench Club OG image.

Design:
- 900x900 dark background
- Pointy-top hex grid (radius 38px), outlines only, no fill
  - Radial opacity: <200px from centre → 15%, <300px → 10%, rest → 5%  (pink #ED0C85)
- Logo centred (580px wide), pink rule, grey tagline, pink badge
- Shimmer beam L→R, 3 passes × 22 frames + 8 hold frames = 74 total
"""

import math
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
W, H = 900, 900
BG_COLOR = (10, 10, 12)
PINK = (237, 12, 133)
PINK_DARK = (140, 6, 78)

LOGO_PATH = "/data/data/com.termux/files/home/git/wrench/assets/logo.png"
OUT_WEBP  = "/data/data/com.termux/files/home/git/wrench/static/og-v8.webp"
OUT_PNG   = "/data/data/com.termux/files/home/git/wrench/static/og-v8.png"

HEX_R     = 38          # pointy-top hex circumradius
LOGO_W    = 580
LOGO_CY   = 390         # logo vertical centre (px from top)

# Centre for radial glow reference
GRID_CX   = 450
GRID_CY   = 430

# Shimmer
SHIMMER_PASSES = 3
FRAMES_PER_PASS = 22
HOLD_FRAMES = 8
SHIMMER_MS  = 50
HOLD_MS     = 90

# ---------------------------------------------------------------------------
# Hex grid helpers — pointy-top orientation
# ---------------------------------------------------------------------------
def hex_corners_pointy(cx: float, cy: float, r: float) -> list[tuple[float, float]]:
    """
    Return the 6 corner points of a pointy-top hexagon.
    Pointy-top means the first vertex is at the top (90° or -30° offset depending on convention).
    Using 30° offset so the first corner is at top-right, giving pointy-top shape.
    """
    pts = []
    for i in range(6):
        # pointy-top: vertex at 30°, 90°, 150°, 210°, 270°, 330°
        # i.e. start at 30 + 60*i degrees
        angle_deg = 30 + 60 * i
        angle_rad = math.radians(angle_deg)
        pts.append((cx + r * math.cos(angle_rad), cy + r * math.sin(angle_rad)))
    return pts


def generate_hex_centres(w: int, h: int, r: float) -> list[tuple[float, float]]:
    """
    Generate hex centre coordinates tiling the full canvas using pointy-top layout.

    Pointy-top grid geometry:
      - horizontal spacing between column centres: col_step = sqrt(3) * r
      - vertical spacing between row centres: row_step = 1.5 * r
      - every odd column is offset DOWN by row_step / 2 = 0.75 * r
    """
    col_step = math.sqrt(3) * r    # ~65.8px for r=38
    row_step = 1.5 * r             # 57px for r=38

    centres = []
    col = 0
    x = -col_step
    while x < w + col_step:
        # Odd columns shift down by half a row step
        y_offset = (row_step / 2) if (col % 2 == 1) else 0
        y = -r + y_offset
        while y < h + r:
            centres.append((x, y))
            y += row_step
        x += col_step
        col += 1
    return centres


# ---------------------------------------------------------------------------
# Build the static hex grid layer (RGBA)
# ---------------------------------------------------------------------------
def build_hex_grid() -> Image.Image:
    """Render hex outlines onto a transparent RGBA layer."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw  = ImageDraw.Draw(layer)

    centres = generate_hex_centres(W, H, HEX_R)
    pr, pg, pb = PINK  # 237, 12, 133

    for (cx, cy) in centres:
        # Distance from canvas radial-glow centre
        dist = math.hypot(cx - GRID_CX, cy - GRID_CY)

        if dist < 200:
            alpha = int(255 * 0.15)   # 15%
        elif dist < 300:
            alpha = int(255 * 0.10)   # 10%
        else:
            alpha = int(255 * 0.05)   # 5%

        pts = hex_corners_pointy(cx, cy, HEX_R)
        # Close the polygon by repeating first point
        poly = pts + [pts[0]]
        draw.line(poly, fill=(pr, pg, pb, alpha), width=1)

    return layer


# ---------------------------------------------------------------------------
# Build base composite: BG + hex grid + logo + text elements
# ---------------------------------------------------------------------------
def build_base() -> Image.Image:
    base = Image.new("RGB", (W, H), BG_COLOR)
    draw = ImageDraw.Draw(base)

    # --- Subtle radial glow behind logo ---
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd   = ImageDraw.Draw(glow)
    for radius, alpha in [(320, 20), (240, 35), (160, 50)]:
        gd.ellipse(
            [GRID_CX - radius, GRID_CY - radius, GRID_CX + radius, GRID_CY + radius],
            fill=(80, 0, 50, alpha)
        )
    glow = glow.filter(ImageFilter.GaussianBlur(60))
    base.paste(glow.convert("RGB"), (0, 0), mask=glow.split()[3])

    # --- Hex grid overlay ---
    hex_layer = build_hex_grid()
    base.paste(hex_layer, (0, 0), mask=hex_layer.split()[3])

    # --- Logo ---
    logo_src = Image.open(LOGO_PATH).convert("RGBA")
    aspect   = logo_src.height / logo_src.width
    logo_h   = int(LOGO_W * aspect)
    logo     = logo_src.resize((LOGO_W, logo_h), Image.LANCZOS)
    logo_x   = (W - LOGO_W) // 2
    logo_y   = LOGO_CY - logo_h // 2
    base.paste(logo, (logo_x, logo_y), mask=logo.split()[3])

    # --- Pink rule ---
    rule_y = logo_y + logo_h + 28
    rule_x0 = (W - 400) // 2
    rule_x1 = (W + 400) // 2
    draw.line([(rule_x0, rule_y), (rule_x1, rule_y)], fill=PINK, width=2)

    # --- Tagline ---
    tag_y = rule_y + 22
    tagline = "Member-Only DIY Auto Shop · Grand Rapids, MI"
    try:
        font_tag = ImageFont.truetype(
            "/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans.ttf", 26
        )
    except OSError:
        font_tag = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), tagline, font=font_tag)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, tag_y), tagline, font=font_tag, fill=(160, 160, 170))

    # --- Pink pill badge ---
    badge_text = "wrenchclub.com"
    badge_y_centre = H - 95
    try:
        font_badge = ImageFont.truetype(
            "/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans-Bold.ttf", 28
        )
    except OSError:
        font_badge = font_tag

    bb = draw.textbbox((0, 0), badge_text, font=font_badge)
    bw = bb[2] - bb[0]
    bh = bb[3] - bb[1]
    pad_x, pad_y = 32, 14
    pill_w = bw + pad_x * 2
    pill_h = bh + pad_y * 2
    pill_x = (W - pill_w) // 2
    pill_y = badge_y_centre - pill_h // 2

    draw.rounded_rectangle(
        [pill_x, pill_y, pill_x + pill_w, pill_y + pill_h],
        radius=pill_h // 2,
        fill=PINK
    )
    draw.text(
        (pill_x + pad_x, pill_y + pad_y - bb[1]),
        badge_text,
        font=font_badge,
        fill=(10, 10, 12)
    )

    return base


# ---------------------------------------------------------------------------
# Shimmer beam
# ---------------------------------------------------------------------------
def apply_shimmer(base: Image.Image, progress: float) -> Image.Image:
    """
    Overlay a translucent shimmer beam sweeping L→R.
    progress ∈ [0, 1]: beam position across the canvas width.
    """
    frame = base.copy().convert("RGBA")
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)

    # Beam centre x — sweep from slightly off left to slightly off right
    beam_cx = int(-80 + (W + 160) * progress)
    beam_half = 20    # half-width of the bright core band (narrow)
    feather   = 55    # soft falloff on each side

    tilt_dx = 30      # horizontal offset of beam centre: top vs bottom
    overlay_tilt = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    # Build the tilted beam scanline by scanline for a smooth gradient
    for y in range(H):
        t_y = y / (H - 1)
        # bx: beam centre at this scanline — shifts linearly with y to create tilt
        bx = beam_cx + int(tilt_dx * (2 * t_y - 1))
        half_plus_feather = beam_half + feather
        x_start = max(0, bx - half_plus_feather)
        x_end   = min(W - 1, bx + half_plus_feather)
        for x in range(x_start, x_end + 1):
            abs_off = abs(x - bx)
            if abs_off <= beam_half:
                t = 1.0
            else:
                t = 1.0 - (abs_off - beam_half) / feather
            t = max(0.0, t)
            # Ease in/out with smoothstep for softer edges
            t = t * t * (3 - 2 * t)
            alpha = int(48 * t)   # max ≈19% opacity — subtle highlight
            overlay_tilt.putpixel((x, y), (255, 255, 255, alpha))

    frame = Image.alpha_composite(frame, overlay_tilt)
    return frame.convert("RGB")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("Building base frame …")
    base = build_base()

    frames: list[Image.Image] = []
    durations: list[int] = []

    total_anim_frames = SHIMMER_PASSES * FRAMES_PER_PASS
    total_frames = total_anim_frames + HOLD_FRAMES
    print(f"Generating {total_frames} frames ({SHIMMER_PASSES} passes × {FRAMES_PER_PASS} + {HOLD_FRAMES} hold) …")

    for pass_idx in range(SHIMMER_PASSES):
        for f in range(FRAMES_PER_PASS):
            progress = f / (FRAMES_PER_PASS - 1)
            frame = apply_shimmer(base, progress)
            frames.append(frame)
            durations.append(SHIMMER_MS)

    # Hold frames — no shimmer (beam fully off-canvas)
    for _ in range(HOLD_FRAMES):
        frames.append(base.copy())
        durations.append(HOLD_MS)

    print(f"Total frames: {len(frames)}")
    print("Saving WebP …")

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
    print(f"WebP size: {webp_size / 1024:.1f} KB  ({OUT_WEBP})")

    # Static PNG (first hold frame = clean no-shimmer)
    print("Saving PNG …")
    base.save(OUT_PNG, format="PNG", optimize=True)
    png_size = os.path.getsize(OUT_PNG)
    print(f"PNG size:  {png_size / 1024:.1f} KB  ({OUT_PNG})")


if __name__ == "__main__":
    main()
