#!/usr/bin/env python3
"""
Generate og-v7.webp — Typewriter Reveal animated OG image for Wrench Club.

Sequence:
  Phase 1  Frames  0-7   (80ms): Logo + glow fade in
  Phase 2  Frames  8-47  (55ms): Pink rule visible; tagline types out 1 char/frame; cursor blinks
  Phase 3  Frames 48-55  (60ms): Badge slides up from y+30 while fading in
  Phase 4  Frames 56-70  (90ms): Hold; cursor blinks every 2 frames
"""

import math
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
REPO = "/data/data/com.termux/files/home/git/wrench"
LOGO_PATH = os.path.join(REPO, "assets/logo.png")
OUT_WEBP  = os.path.join(REPO, "static/og-v7.webp")
OUT_PNG   = os.path.join(REPO, "static/og-v7.png")

# ---------------------------------------------------------------------------
# Dimensions & palette
# ---------------------------------------------------------------------------
W, H       = 900, 900
BG_COLOR   = (10, 10, 10, 255)
PINK       = (237, 12, 133)       # #ED0C85
GREY_TEXT  = (160, 160, 160)
WHITE      = (255, 255, 255)

LOGO_W     = 580                   # scaled logo width
LOGO_Y     = 310                   # centre-y of logo (shifted up to leave text room)

RULE_Y     = 390                   # pink horizontal rule below logo
RULE_W     = 560
RULE_H     = 2

TAGLINE        = "West Michigan's Premier DIY Auto Shop"
TAGLINE_FONT_SZ = 21
TAGLINE_Y      = 420               # top of tagline text

BADGE_TEXT     = "OPENING 2026  ·  GRAND RAPIDS, MI"
BADGE_FONT_SZ  = 14
BADGE_Y_FINAL  = 480               # final top-y of badge
BADGE_SLIDE_PX = 30                # slides up from BADGE_Y_FINAL + 30

CURSOR_W   = 2
CURSOR_H   = 18

# ---------------------------------------------------------------------------
# Font loading helpers
# ---------------------------------------------------------------------------
FONT_PATHS = [
    "/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
    "/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans.ttf",
    "/system/fonts/Roboto-Regular.ttf",
]
MONO_FONT_PATHS = [
    "/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSansMono-Bold.ttf",
    "/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSansMono.ttf",
]


def load_font(size: int, prefer_mono: bool = False) -> ImageFont.FreeTypeFont:
    candidates = MONO_FONT_PATHS + FONT_PATHS if prefer_mono else FONT_PATHS
    for p in candidates:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


font_tagline = load_font(TAGLINE_FONT_SZ)
font_badge   = load_font(BADGE_FONT_SZ)

# ---------------------------------------------------------------------------
# Pre-scale logo
# ---------------------------------------------------------------------------
logo_src = Image.open(LOGO_PATH).convert("RGBA")
aspect   = logo_src.height / logo_src.width
logo_h   = int(LOGO_W * aspect)
logo_scaled = logo_src.resize((LOGO_W, logo_h), Image.LANCZOS)

logo_x = (W - LOGO_W) // 2        # left edge for centred logo
logo_y_top = LOGO_Y - logo_h // 2 # top-left y so centre is at LOGO_Y

# ---------------------------------------------------------------------------
# Pre-render pink radial glow (static layer, composited with alpha)
# ---------------------------------------------------------------------------
def make_glow() -> Image.Image:
    """Return an RGBA image with a soft pink radial gradient centred on the logo."""
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    cx, cy = W // 2, LOGO_Y
    # Draw concentric ellipses from large→small with decreasing alpha
    layers = 60
    for i in range(layers, 0, -1):
        r   = int(320 * i / layers)
        ry  = int(200 * i / layers)
        alpha = int(55 * (1 - i / layers) ** 1.4)
        bbox = [cx - r, cy - ry, cx + r, cy + ry]
        draw.ellipse(bbox, fill=(*PINK, alpha))
    # Soften
    return glow.filter(ImageFilter.GaussianBlur(radius=18))

GLOW_LAYER = make_glow()

# ---------------------------------------------------------------------------
# Helper: measure text width
# ---------------------------------------------------------------------------
def text_width(text: str, font: ImageFont.FreeTypeFont) -> int:
    bbox = font.getbbox(text)
    return bbox[2] - bbox[0]


# ---------------------------------------------------------------------------
# Composite helpers
# ---------------------------------------------------------------------------
def alpha_composite_at(base: Image.Image, overlay: Image.Image, pos: tuple[int, int]) -> None:
    """Paste RGBA overlay onto base at pos using alpha composite."""
    tmp = Image.new("RGBA", base.size, (0, 0, 0, 0))
    tmp.paste(overlay, pos)
    result = Image.alpha_composite(base, tmp)
    base.paste(result)


def apply_alpha(img: Image.Image, alpha: int) -> Image.Image:
    """Return a copy of img with all pixel alphas multiplied by alpha/255."""
    r, g, b, a = img.split()
    a = a.point(lambda x: x * alpha // 255)
    return Image.merge("RGBA", (r, g, b, a))


# ---------------------------------------------------------------------------
# Frame builder
# ---------------------------------------------------------------------------
def build_frame(
    logo_alpha: int,          # 0-255
    rule_visible: bool,
    tagline_chars: int,       # number of chars of tagline to show (0 = none)
    cursor_visible: bool,     # show cursor after typed text
    badge_alpha: int,         # 0-255
    badge_y_offset: int,      # pixels to add to BADGE_Y_FINAL (positive = lower)
) -> Image.Image:

    frame = Image.new("RGBA", (W, H), BG_COLOR)
    draw  = ImageDraw.Draw(frame)

    # --- Glow (fades with logo) ---
    if logo_alpha > 0:
        glow = apply_alpha(GLOW_LAYER, logo_alpha)
        frame = Image.alpha_composite(frame, glow)
        draw  = ImageDraw.Draw(frame)

    # --- Logo ---
    if logo_alpha > 0:
        logo = apply_alpha(logo_scaled, logo_alpha)
        alpha_composite_at(frame, logo, (logo_x, logo_y_top))
        draw = ImageDraw.Draw(frame)

    # --- Pink rule ---
    if rule_visible:
        rule_x = (W - RULE_W) // 2
        draw.rectangle(
            [rule_x, RULE_Y, rule_x + RULE_W, RULE_Y + RULE_H],
            fill=(*PINK, 255),
        )

    # --- Tagline ---
    if tagline_chars > 0:
        visible_text = TAGLINE[:tagline_chars]
        tx = (W - text_width(TAGLINE, font_tagline)) // 2  # anchor to full string width so it doesn't shift
        draw.text((tx, TAGLINE_Y), visible_text, font=font_tagline, fill=(*GREY_TEXT, 255))

        # Cursor
        if cursor_visible:
            typed_w = text_width(visible_text, font_tagline)
            cx = tx + typed_w + 2
            cy = TAGLINE_Y + (TAGLINE_FONT_SZ - CURSOR_H) // 2
            draw.rectangle([cx, cy, cx + CURSOR_W, cy + CURSOR_H], fill=(*PINK, 255))

    # --- Badge ---
    if badge_alpha > 0:
        badge_y = BADGE_Y_FINAL + badge_y_offset
        bw = text_width(BADGE_TEXT, font_badge)
        bx = (W - bw) // 2

        # Slightly spaced letter rendering for badge feel
        badge_color = (*WHITE, badge_alpha)
        draw.text((bx, badge_y), BADGE_TEXT, font=font_badge, fill=badge_color)

    return frame.convert("RGB")  # WebP encoder handles palette; keep as RGB for efficiency


# ---------------------------------------------------------------------------
# Build all frames
# ---------------------------------------------------------------------------
frames: list[Image.Image] = []
durations: list[int]      = []

# ---- Phase 1: frames 0-7 — logo + glow fade in (80ms each) ----
for i in range(8):
    alpha = int(255 * (i + 1) / 8)
    frames.append(build_frame(
        logo_alpha=alpha,
        rule_visible=False,
        tagline_chars=0,
        cursor_visible=False,
        badge_alpha=0,
        badge_y_offset=0,
    ))
    durations.append(80)

# ---- Phase 2: frames 8-47 — typewriter (55ms each) ----
# 40 frames for 38-char string → chars 0..38 (extra frames hold at full text with cursor)
for i in range(40):
    chars   = min(i + 1, len(TAGLINE))
    # Cursor blinks: on for odd sub-frames in last portion, always on while typing
    typing  = (i + 1) <= len(TAGLINE)
    cursor  = typing or (i % 2 == 0)
    frames.append(build_frame(
        logo_alpha=255,
        rule_visible=True,
        tagline_chars=chars,
        cursor_visible=cursor,
        badge_alpha=0,
        badge_y_offset=0,
    ))
    durations.append(55)

# ---- Phase 3: frames 48-55 — badge slides up (60ms each) ----
for i in range(8):
    t     = (i + 1) / 8                        # 0.125 → 1.0
    ease  = t * t * (3 - 2 * t)               # smoothstep
    alpha = int(255 * ease)
    offset= int(BADGE_SLIDE_PX * (1 - ease))
    frames.append(build_frame(
        logo_alpha=255,
        rule_visible=True,
        tagline_chars=len(TAGLINE),
        cursor_visible=(i % 2 == 0),
        badge_alpha=alpha,
        badge_y_offset=offset,
    ))
    durations.append(60)

# ---- Phase 4: frames 56-70 — hold with cursor blink (90ms each) ----
for i in range(15):
    cursor = (i % 2 == 0)
    frames.append(build_frame(
        logo_alpha=255,
        rule_visible=True,
        tagline_chars=len(TAGLINE),
        cursor_visible=cursor,
        badge_alpha=255,
        badge_y_offset=0,
    ))
    durations.append(90)

# ---------------------------------------------------------------------------
# Save
# ---------------------------------------------------------------------------
print(f"Total frames: {len(frames)}  (expected 71)")
assert len(frames) == len(durations)

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

# Static PNG = last frame (full composition)
frames[-1].save(OUT_PNG, format="PNG")

webp_size = os.path.getsize(OUT_WEBP)
png_size  = os.path.getsize(OUT_PNG)
print(f"og-v7.webp  {webp_size/1024:.1f} KB")
print(f"og-v7.png   {png_size/1024:.1f} KB")
