#!/usr/bin/env python3
"""
Generate a 900x900 animated WebP OG image for "Wrench Club".

- No external images.
- All geometry is drawn with PIL primitives and math.
- Subtle animation: rotating gear, sweeping sheen band, pulsing glow.
- Outputs:
  - /data/data/com.termux/files/home/git/wrench/static/og-discord.webp (animated)
  - /data/data/com.termux/files/home/git/wrench/static/og-discord.png (static first frame)
"""

from __future__ import annotations

import math
import os
from dataclasses import dataclass
from typing import List, Sequence, Tuple

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont

# --------------------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------------------

W = 900
H = 900

BG = (0x0A, 0x0A, 0x0A, 255)         # near black
PINK = (0xED, 0x0C, 0x85, 255)       # hot pink
PINK_DIM = (0xED, 0x0C, 0x85, 140)
WHITE = (245, 245, 245, 255)
OFFWHITE = (220, 220, 220, 255)
STEEL = (170, 170, 175, 255)
STEEL_DARK = (95, 95, 100, 255)
CHARCOAL = (28, 28, 30, 255)
SHADOW = (0, 0, 0, 200)

FONT_BOLD = "/data/data/com.termux/files/home/git/wrench/assets/fonts/BarlowCondensed-Bold.ttf"
FONT_XBOLD = "/data/data/com.termux/files/home/git/wrench/assets/fonts/BarlowCondensed-ExtraBold.ttf"
FONT_BLACK = "/data/data/com.termux/files/home/git/wrench/assets/fonts/BarlowCondensed-Black.ttf"

OUT_WEBP = "/data/data/com.termux/files/home/git/wrench/static/og-discord.webp"
OUT_PNG = "/data/data/com.termux/files/home/git/wrench/static/og-discord.png"

# Animation tuning (keep modest for filesize)
FRAMES = 16
DURATION_MS = 70  # ~14 fps
LOOP = 0

# WebP encoding tuning (try to keep under 500KB)
WEBP_METHOD = 4        # 0..6, higher = smaller but slower
WEBP_QUALITY = 72      # 0..100
WEBP_LOSSLESS = False  # lossy smaller
WEBP_MINIMIZE_SIZE = True

# Effects toggles
SHEEN_ENABLED = True
GLOW_ENABLED = True

# Subtlety controls
GEAR_ROT_DEG_PER_FRAME = 6.5
GLOW_MAX_ALPHA = 155
SHEEN_ALPHA = 70

# --------------------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------------------

Point = Tuple[float, float]


def clamp(x: float, a: float, b: float) -> float:
    return max(a, min(b, x))


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def lerp_color(
    c1: Tuple[int, int, int, int], c2: Tuple[int, int, int, int], t: float
) -> Tuple[int, int, int, int]:
    t = clamp(t, 0.0, 1.0)
    return (
        int(lerp(c1[0], c2[0], t)),
        int(lerp(c1[1], c2[1], t)),
        int(lerp(c1[2], c2[2], t)),
        int(lerp(c1[3], c2[3], t)),
    )


def rotate_point(p: Point, center: Point, ang_rad: float) -> Point:
    x, y = p
    cx, cy = center
    s = math.sin(ang_rad)
    c = math.cos(ang_rad)
    x -= cx
    y -= cy
    xr = x * c - y * s
    yr = x * s + y * c
    return (xr + cx, yr + cy)


def rotate_points(points: Sequence[Point], center: Point, ang_rad: float) -> List[Point]:
    return [rotate_point(p, center, ang_rad) for p in points]


def polygon_bbox(points: Sequence[Point]) -> Tuple[float, float, float, float]:
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    return (min(xs), min(ys), max(xs), max(ys))


def draw_soft_glow(
    base: Image.Image,
    mask: Image.Image,
    color_rgba: Tuple[int, int, int, int],
    blur: float,
) -> None:
    """
    Applies a colored glow behind content using a mask:
    glow = blur(mask) colored with color_rgba (alpha scaled by mask intensity)
    """
    blurred = mask.filter(ImageFilter.GaussianBlur(radius=blur))
    glow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    r, g, b, a = color_rgba
    # Scale alpha by blurred/255
    alpha = blurred.point(lambda v: int(v * (a / 255.0)))
    glow.paste((r, g, b, 255), (0, 0), alpha)
    base.alpha_composite(glow)


def ensure_dir_for(path: str) -> None:
    d = os.path.dirname(path)
    if d:
        os.makedirs(d, exist_ok=True)


def load_font(path: str, size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(path, size=size)
    except Exception as e:
        raise RuntimeError(f"Failed to load font: {path} ({e})") from e


# --------------------------------------------------------------------------------------
# Procedural shapes
# --------------------------------------------------------------------------------------


@dataclass(frozen=True)
class GearSpec:
    teeth: int
    r_outer: float
    r_root: float
    hole_r: float
    tooth_tip_frac: float = 0.45   # fraction of tooth pitch for tip width
    tooth_root_frac: float = 0.60  # fraction for root width
    spoke_count: int = 5
    spoke_width: float = 18.0


def gear_points(center: Point, spec: GearSpec, rot_rad: float) -> List[Point]:
    """
    Return polygon points for a crisp gear silhouette.
    Uses alternating outer/root radii with angular widths per tooth.
    """
    cx, cy = center
    n = spec.teeth
    pts: List[Point] = []
    pitch = (2 * math.pi) / n

    tip_half = (spec.tooth_tip_frac * pitch) / 2.0
    root_half = (spec.tooth_root_frac * pitch) / 2.0

    for i in range(n):
        a = i * pitch + rot_rad
        # Tooth: root -> tip -> tip -> root (4 corners)
        a1 = a - root_half
        a2 = a - tip_half
        a3 = a + tip_half
        a4 = a + root_half

        pts.append((cx + spec.r_root * math.cos(a1), cy + spec.r_root * math.sin(a1)))
        pts.append((cx + spec.r_outer * math.cos(a2), cy + spec.r_outer * math.sin(a2)))
        pts.append((cx + spec.r_outer * math.cos(a3), cy + spec.r_outer * math.sin(a3)))
        pts.append((cx + spec.r_root * math.cos(a4), cy + spec.r_root * math.sin(a4)))

    return pts


def draw_gear(img: Image.Image, center: Point, spec: GearSpec, rot_rad: float) -> None:
    d = ImageDraw.Draw(img, "RGBA")

    # Base gear body
    pts = gear_points(center, spec, rot_rad)
    d.polygon(pts, fill=STEEL_DARK)

    # Subtle highlight ring
    cx, cy = center
    ring_outer = spec.r_root * 0.98
    ring_inner = spec.r_root * 0.78
    ring = Image.new("RGBA", img.size, (0, 0, 0, 0))
    rd = ImageDraw.Draw(ring, "RGBA")
    rd.ellipse(
        (cx - ring_outer, cy - ring_outer, cx + ring_outer, cy + ring_outer),
        fill=(255, 255, 255, 20),
    )
    rd.ellipse(
        (cx - ring_inner, cy - ring_inner, cx + ring_inner, cy + ring_inner),
        fill=(0, 0, 0, 0),
    )
    img.alpha_composite(ring)

    # Spokes (cut-outs)
    cut = Image.new("L", img.size, 0)
    cd = ImageDraw.Draw(cut)
    spoke_len = spec.r_root * 0.72
    for i in range(spec.spoke_count):
        a = rot_rad + i * (2 * math.pi / spec.spoke_count)
        w = spec.spoke_width
        rect = [
            (cx - w / 2, cy - spec.hole_r - 8),
            (cx + w / 2, cy - spec.hole_r - 8),
            (cx + w / 2, cy - spec.hole_r - 8 - spoke_len),
            (cx - w / 2, cy - spec.hole_r - 8 - spoke_len),
        ]
        rectr = rotate_points(rect, (cx, cy), a)
        cd.polygon(rectr, fill=255)

    # Center hole cut-out
    cd.ellipse(
        (cx - spec.hole_r, cy - spec.hole_r, cx + spec.hole_r, cy + spec.hole_r),
        fill=255,
    )

    # Apply cut-outs by compositing transparency
    alpha = img.getchannel("A")
    alpha = ImageChops.subtract(alpha, cut)
    img.putalpha(alpha)


def wrench_polygon(
    length: float, handle_w: float, neck_w: float, head_r: float, jaw_open: float
) -> List[Point]:
    """
    Build a single open-end wrench silhouette oriented along +Y (upwards) around origin.
    """
    y0 = 0.0
    y1 = length * 0.78
    y2 = length

    hw = handle_w / 2
    nw = neck_w / 2

    # Basic handle and neck
    pts: List[Point] = [
        (-hw, y0),
        (hw, y0),
        (nw, y1),
        (nw, y2 - head_r * 1.10),
        (nw * 0.6, y2 - head_r * 0.55),
    ]

    # Head: arc polygon with jaw opening
    cx, cy = 0.0, y2 - head_r * 0.35
    outer_r = head_r
    inner_r = head_r * 0.62

    open_ang = jaw_open
    open_center = -math.pi / 10
    a_start = open_center + open_ang / 2
    a_end = open_center - open_ang / 2 + 2 * math.pi

    def arc_points(r: float, a0: float, a1: float, steps: int) -> List[Point]:
        out = []
        for i in range(steps + 1):
            t = i / steps
            a = a0 + (a1 - a0) * t
            out.append((cx + r * math.cos(a), cy + r * math.sin(a)))
        return out

    outer = arc_points(outer_r, a_start, a_end, steps=30)
    inner = arc_points(inner_r, a_end, a_start, steps=26)

    pts.extend(outer)
    pts.extend(inner)

    # Close back to neck
    pts.extend([
        (-nw * 0.6, y2 - head_r * 0.55),
        (-nw, y2 - head_r * 1.10),
        (-nw, y1),
    ])
    return pts


def draw_wrench(img: Image.Image, center: Point, rot_rad: float, scale: float = 1.0) -> None:
    """Draw a single wrench with subtle bevel highlights."""
    cx, cy = center
    base = Image.new("RGBA", img.size, (0, 0, 0, 0))

    poly = wrench_polygon(
        length=310 * scale,
        handle_w=58 * scale,
        neck_w=44 * scale,
        head_r=72 * scale,
        jaw_open=0.75,
    )
    # Center the wrench around its mid
    poly = [(x, y - 160 * scale) for (x, y) in poly]
    poly = rotate_points(poly, (0.0, 0.0), rot_rad)
    poly = [(x + cx, y + cy) for (x, y) in poly]

    d = ImageDraw.Draw(base, "RGBA")
    d.polygon(poly, fill=STEEL)

    # Inner shadow to give depth
    shade = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shade, "RGBA")
    sd.polygon(poly, fill=(0, 0, 0, 90))
    shade = shade.filter(ImageFilter.GaussianBlur(2.2))
    base = Image.alpha_composite(base, shade)

    # Edge highlight
    hi = Image.new("RGBA", img.size, (0, 0, 0, 0))
    hid = ImageDraw.Draw(hi, "RGBA")
    poly_hi = [(x - 1.0, y - 1.3) for (x, y) in poly]
    hid.polygon(poly_hi, fill=(255, 255, 255, 34))
    hi = hi.filter(ImageFilter.GaussianBlur(1.4))
    base = Image.alpha_composite(base, hi)

    # Outline for crispness
    d2 = ImageDraw.Draw(base, "RGBA")
    d2.line(poly + [poly[0]], fill=(20, 20, 22, 220), width=3, joint="curve")

    img.alpha_composite(base)


def draw_crossed_wrenches(
    img: Image.Image, center: Point, rot1: float, rot2: float, scale: float = 1.0
) -> None:
    draw_wrench(img, center, rot1, scale)
    draw_wrench(img, center, rot2, scale)


def draw_checkered_band(img: Image.Image, y: int, height: int, tile: int = 26) -> None:
    """Draw a checkered/racing accent band across the canvas."""
    band = Image.new("RGBA", (W, height), (0, 0, 0, 0))
    d = ImageDraw.Draw(band, "RGBA")
    cols = math.ceil(W / tile) + 1
    rows = math.ceil(height / tile) + 1

    c1 = (255, 255, 255, 24)
    c2 = (0, 0, 0, 0)

    for r in range(rows):
        for c in range(cols):
            x0 = c * tile
            y0 = r * tile
            x1 = x0 + tile
            y1 = y0 + tile
            if (r + c) % 2 == 0:
                d.rectangle((x0, y0, x1, y1), fill=c1)
            else:
                d.rectangle((x0, y0, x1, y1), fill=c2)

    # Pink racing stripe on the bottom edge
    d.rectangle((0, height - 5, W, height), fill=(PINK[0], PINK[1], PINK[2], 160))
    img.alpha_composite(band, (0, y))


def draw_diagonal_stripes(
    img: Image.Image, alpha: int = 22, spacing: int = 34, width: int = 10
) -> None:
    """Subtle diagonal 'racing' stripes in the background."""
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay, "RGBA")
    col = (255, 255, 255, alpha)

    for k in range(-H, W + H, spacing):
        d.line([(k, H), (k + H, 0)], fill=col, width=width)

    overlay = overlay.filter(ImageFilter.GaussianBlur(0.4))
    img.alpha_composite(overlay)


def draw_badge(
    img: Image.Image,
    box: Tuple[int, int, int, int],
    text: str,
    font: ImageFont.FreeTypeFont,
) -> None:
    """Hot pink badge with inner cut and tiny bolt dots."""
    x0, y0, x1, y1 = box
    badge = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(badge, "RGBA")

    r = 22
    d.rounded_rectangle(box, radius=r, fill=(PINK[0], PINK[1], PINK[2], 255))
    d.rounded_rectangle(
        (x0 + 5, y0 + 5, x1 - 5, y1 - 5), radius=r - 6, outline=(0, 0, 0, 70), width=3
    )

    # Bolt dots at corners
    bolt_r = 4
    bolts = [
        (x0 + 16, y0 + 16),
        (x1 - 16, y0 + 16),
        (x0 + 16, y1 - 16),
        (x1 - 16, y1 - 16),
    ]
    for bx, by in bolts:
        d.ellipse(
            (bx - bolt_r, by - bolt_r, bx + bolt_r, by + bolt_r),
            fill=(15, 15, 15, 220),
        )
        d.ellipse(
            (bx - bolt_r + 1, by - bolt_r + 1, bx + bolt_r - 1, by + bolt_r - 1),
            fill=(255, 255, 255, 60),
        )

    # Text with slight shadow
    td = ImageDraw.Draw(badge, "RGBA")
    tw, th = td.textbbox((0, 0), text, font=font)[2:]
    tx = (x0 + x1 - tw) // 2
    ty = (y0 + y1 - th) // 2 - 2
    td.text((tx + 2, ty + 2), text, font=font, fill=(0, 0, 0, 140))
    td.text((tx, ty), text, font=font, fill=WHITE)

    img.alpha_composite(badge)


def draw_sheen(img: Image.Image, t: float, bbox: Tuple[int, int, int, int]) -> None:
    """Sweeping diagonal sheen band over a target bbox (e.g., title area)."""
    if not SHEEN_ENABLED:
        return

    x0, y0, x1, y1 = bbox
    w = x1 - x0
    h = y1 - y0

    # Sheen position moves left->right slightly beyond bbox
    pos = lerp(-0.35, 1.35, t)
    sheen = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(sheen, "RGBA")

    # Diagonal band with gaussian alpha falloff
    band_w = int(w * 0.24)
    center_x = int(pos * w)

    for i in range(-band_w, band_w):
        a = int(SHEEN_ALPHA * math.exp(-(i * i) / (2 * (band_w * 0.35) ** 2)))
        if a <= 0:
            continue
        col = (255, 255, 255, a)
        x = center_x + i
        d.line([(x - int(h * 0.4), h), (x + int(h * 0.8), 0)], fill=col, width=3)

    sheen = sheen.filter(ImageFilter.GaussianBlur(1.2))
    img.alpha_composite(sheen, (x0, y0))


# --------------------------------------------------------------------------------------
# Main render
# --------------------------------------------------------------------------------------


def render_frame(i: int, fonts: dict) -> Image.Image:
    t = i / FRAMES
    # Smooth loop for pulsing
    pulse = 0.5 - 0.5 * math.cos(2 * math.pi * t)

    base = Image.new("RGBA", (W, H), BG)

    # Background texture (subtle)
    draw_diagonal_stripes(base, alpha=18, spacing=40, width=10)

    # Top/bottom checkered accents
    draw_checkered_band(base, y=40, height=60, tile=22)
    draw_checkered_band(base, y=H - 100, height=60, tile=22)

    # Pink corner ticks
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay, "RGBA")
    tick = 54
    lw = 6
    col = (PINK[0], PINK[1], PINK[2], 190)
    # Top-left
    od.line([(60, 120), (60 + tick, 120)], fill=col, width=lw)
    od.line([(60, 120), (60, 120 + tick)], fill=col, width=lw)
    # Top-right
    od.line([(W - 60, 120), (W - 60 - tick, 120)], fill=col, width=lw)
    od.line([(W - 60, 120), (W - 60, 120 + tick)], fill=col, width=lw)
    # Bottom-left
    od.line([(60, H - 120), (60 + tick, H - 120)], fill=col, width=lw)
    od.line([(60, H - 120), (60, H - 120 - tick)], fill=col, width=lw)
    # Bottom-right
    od.line([(W - 60, H - 120), (W - 60 - tick, H - 120)], fill=col, width=lw)
    od.line([(W - 60, H - 120), (W - 60, H - 120 - tick)], fill=col, width=lw)
    base.alpha_composite(overlay)

    # Central icon group anchor
    cx, cy = W // 2, int(H * 0.46)

    # Rotating gear behind wrenches
    gear_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gear_rot = math.radians(i * GEAR_ROT_DEG_PER_FRAME)
    spec = GearSpec(
        teeth=18, r_outer=156, r_root=132, hole_r=34, spoke_count=5, spoke_width=20
    )
    draw_gear(gear_layer, (cx, cy - 6), spec, gear_rot)

    # Pink glow behind gear
    if GLOW_ENABLED:
        mask = Image.new("L", (W, H), 0)
        md = ImageDraw.Draw(mask)
        md.ellipse(
            (cx - 190, cy - 190, cx + 190, cy + 190),
            fill=int(100 + 50 * pulse),
        )
        draw_soft_glow(
            base,
            mask,
            (PINK[0], PINK[1], PINK[2], int(80 + 60 * pulse)),
            blur=20,
        )

    base.alpha_composite(gear_layer)

    # Crossed wrenches on top
    wrench_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw_crossed_wrenches(
        wrench_layer,
        (cx, cy - 8),
        rot1=math.radians(-42),
        rot2=math.radians(42),
        scale=1.0,
    )

    # Tiny pink accent bolts around icon
    bd = ImageDraw.Draw(wrench_layer, "RGBA")
    for ang in [0, math.pi / 2, math.pi, 3 * math.pi / 2]:
        r = 180
        px = cx + r * math.cos(ang + gear_rot * 0.35)
        py = cy + r * math.sin(ang + gear_rot * 0.35)
        bd.ellipse(
            (px - 6, py - 6, px + 6, py + 6),
            fill=(PINK[0], PINK[1], PINK[2], 210),
        )
        bd.ellipse((px - 3, py - 3, px + 3, py + 3), fill=(10, 10, 10, 220))
    base.alpha_composite(wrench_layer)

    # Title text
    title = "WRENCH CLUB"
    title_font = fonts["black_140"]
    city_font = fonts["bold_36"]
    micro_font = fonts["bold_26"]

    # Compute title bbox
    tmp = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    td = ImageDraw.Draw(tmp, "RGBA")
    tb = td.textbbox((0, 0), title, font=title_font)
    tw = tb[2] - tb[0]
    th = tb[3] - tb[1]
    tx = (W - tw) // 2
    ty = int(H * 0.58) - th // 2

    # Text glow (pulsing)
    if GLOW_ENABLED:
        glow_mask = Image.new("L", (W, H), 0)
        gmd = ImageDraw.Draw(glow_mask)
        gmd.text((tx, ty), title, font=title_font, fill=int(160 + 70 * pulse))
        draw_soft_glow(
            base,
            glow_mask,
            (PINK[0], PINK[1], PINK[2], int(90 + GLOW_MAX_ALPHA * pulse * 0.55)),
            blur=14,
        )
        draw_soft_glow(
            base,
            glow_mask,
            (PINK[0], PINK[1], PINK[2], int(70 + 100 * pulse)),
            blur=5,
        )

    # Title shadow + stroke-ish outline + fill
    text_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    tld = ImageDraw.Draw(text_layer, "RGBA")
    # Shadow
    tld.text((tx + 4, ty + 5), title, font=title_font, fill=(0, 0, 0, 160))
    # Faux outline by drawing multiple offsets
    outline_col = (0, 0, 0, 190)
    for ox, oy in [(-2, 0), (2, 0), (0, -2), (0, 2), (-2, -2), (2, 2), (-2, 2), (2, -2)]:
        tld.text((tx + ox, ty + oy), title, font=title_font, fill=outline_col)
    # Fill
    tld.text((tx, ty), title, font=title_font, fill=WHITE)

    base.alpha_composite(text_layer)

    # Sheen sweep across title
    draw_sheen(base, t=t, bbox=(tx - 30, ty - 12, tx + tw + 30, ty + th + 16))

    # Subline: GRAND RAPIDS, MI
    city = "GRAND RAPIDS, MI"
    cb = td.textbbox((0, 0), city, font=city_font)
    cw = cb[2] - cb[0]
    ch = cb[3] - cb[1]
    cx2 = (W - cw) // 2
    cy2 = ty + th + 28

    city_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cd = ImageDraw.Draw(city_layer, "RGBA")
    cd.text((cx2 + 2, cy2 + 2), city, font=city_font, fill=(0, 0, 0, 140))
    cd.text((cx2, cy2), city, font=city_font, fill=OFFWHITE)
    base.alpha_composite(city_layer)

    # Divider line with pink center notch
    div_y = cy2 + ch + 20
    div = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dd = ImageDraw.Draw(div, "RGBA")
    dd.line(
        [(W * 0.18, div_y), (W * 0.82, div_y)], fill=(255, 255, 255, 55), width=3
    )
    dd.line(
        [(W * 0.48, div_y), (W * 0.52, div_y)],
        fill=(PINK[0], PINK[1], PINK[2], 190),
        width=6,
    )
    base.alpha_composite(div)

    # Opening badge
    badge_text = "OPENING 2026"
    badge_font = fonts["xbold_40"]
    bb = td.textbbox((0, 0), badge_text, font=badge_font)
    bw = bb[2] - bb[0]
    bh = bb[3] - bb[1]
    pad_x, pad_y = 34, 18
    bx0 = (W - (bw + pad_x * 2)) // 2
    by0 = div_y + 22
    bx1 = bx0 + bw + pad_x * 2
    by1 = by0 + bh + pad_y * 2
    draw_badge(base, (int(bx0), int(by0), int(bx1), int(by1)), badge_text, badge_font)

    # Micro tagline
    micro = "MEMBERSHIP DIY AUTO SHOP"
    mb = td.textbbox((0, 0), micro, font=micro_font)
    mw = mb[2] - mb[0]
    mx = (W - mw) // 2
    my = by1 + 18
    md_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    md2 = ImageDraw.Draw(md_layer, "RGBA")
    md2.text((mx + 2, my + 2), micro, font=micro_font, fill=(0, 0, 0, 120))
    md2.text((mx, my), micro, font=micro_font, fill=(255, 255, 255, 120))
    base.alpha_composite(md_layer)

    # Subtle vignette
    vignette = Image.new("L", (W, H), 0)
    vd = ImageDraw.Draw(vignette)
    vd.ellipse((-120, -120, W + 120, H + 120), fill=255)
    vignette = vignette.filter(ImageFilter.GaussianBlur(55))
    vignette = ImageChops.invert(vignette)
    vig = Image.new("RGBA", (W, H), (0, 0, 0, 120))
    base.paste(vig, (0, 0), vignette)

    # Slight global contrast pop
    base = ImageEnhance.Contrast(base).enhance(1.05)

    return base


def main() -> None:
    # Validate fonts exist
    for fp in (FONT_BOLD, FONT_XBOLD, FONT_BLACK):
        if not os.path.exists(fp):
            raise FileNotFoundError(f"Font not found: {fp}")

    ensure_dir_for(OUT_WEBP)
    ensure_dir_for(OUT_PNG)

    fonts = {
        "bold_26": load_font(FONT_BOLD, 26),
        "bold_36": load_font(FONT_BOLD, 36),
        "xbold_40": load_font(FONT_XBOLD, 40),
        "xbold_44": load_font(FONT_XBOLD, 44),
        "black_140": load_font(FONT_BLACK, 140),
    }

    frames: List[Image.Image] = []
    for i in range(FRAMES):
        print(f"  Rendering frame {i + 1}/{FRAMES}...")
        frames.append(render_frame(i, fonts))

    # Save static first frame
    frames[0].save(OUT_PNG, format="PNG", optimize=True)
    print(f"  Saved PNG: {OUT_PNG}")

    # Save animated WebP
    save_kwargs = dict(
        format="WEBP",
        save_all=True,
        append_images=frames[1:],
        duration=DURATION_MS,
        loop=LOOP,
        optimize=True,
        method=WEBP_METHOD,
        quality=WEBP_QUALITY,
        lossless=WEBP_LOSSLESS,
        minimize_size=WEBP_MINIMIZE_SIZE,
        disposal=2,
    )

    try:
        frames[0].save(OUT_WEBP, **save_kwargs)
    except TypeError:
        # Fallback for Pillow builds that don't support some args
        fallback = dict(
            format="WEBP",
            save_all=True,
            append_images=frames[1:],
            duration=DURATION_MS,
            loop=LOOP,
            quality=WEBP_QUALITY,
            method=WEBP_METHOD,
        )
        frames[0].save(OUT_WEBP, **fallback)

    # Report file sizes
    try:
        webp_size = os.path.getsize(OUT_WEBP)
        png_size = os.path.getsize(OUT_PNG)
        print(f"\nWrote:")
        print(f"  {OUT_WEBP} ({webp_size / 1024:.1f} KB)")
        print(f"  {OUT_PNG} ({png_size / 1024:.1f} KB)")
        if webp_size > 500 * 1024:
            print("WARNING: WebP is above 500KB. Reduce FRAMES or WEBP_QUALITY.")
    except OSError:
        pass


if __name__ == "__main__":
    main()
