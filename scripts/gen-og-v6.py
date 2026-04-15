"""
Generate og-v6.webp — Neon Breathing Pulse animated OG image.
900x900, 32 frames, 65ms each (~2.1s loop).
"""

import math
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(SCRIPT_DIR, "..")
LOGO_PATH = os.path.join(ROOT, "assets", "logo.png")
OUT_WEBP = os.path.join(ROOT, "static", "og-v6.webp")
OUT_PNG  = os.path.join(ROOT, "static", "og-v6.png")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
W, H = 900, 900
NUM_FRAMES = 32
FRAME_DURATION_MS = 65

# Brand pink
PINK = (237, 12, 133)

# Background dark
BG = (10, 10, 14)

# Glow breath range
GLOW_ALPHA_MIN = 0.08
GLOW_ALPHA_MAX = 0.28
GLOW_RADIUS_MIN = 260
GLOW_RADIUS_MAX = 360

# Logo scale range
LOGO_SCALE_MIN = 0.97
LOGO_SCALE_MAX = 1.03
LOGO_BASE_W = 580   # base rendered width (before per-frame scale)

# Text
TAGLINE = "West Michigan's Premier DIY Auto Shop"
BADGE   = "OPENING 2026  ·  GRAND RAPIDS, MI"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """Try to load a decent system font; fall back to default."""
    candidates_bold = [
        "/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
        "/system/fonts/Roboto-Bold.ttf",
        "/system/fonts/DroidSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]
    candidates_reg = [
        "/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans.ttf",
        "/system/fonts/Roboto-Regular.ttf",
        "/system/fonts/DroidSans.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    candidates = candidates_bold if bold else candidates_reg
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def build_glow_layer(cx: int, cy: int, radius: int, alpha: float) -> Image.Image:
    """
    Build an RGBA glow image: radial gradient from PINK (centre) to transparent.
    alpha controls the peak opacity at the centre (0..1).
    Uses a sequence of concentric filled circles decreasing in opacity.
    """
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)

    steps = 80
    for i in range(steps, 0, -1):
        frac = i / steps          # 1 at centre, 1/steps at edge
        r = int(radius * frac)
        # quadratic fall-off so the centre burns brighter
        a = int(alpha * 255 * (frac ** 2))
        a = max(0, min(255, a))
        x0, y0 = cx - r, cy - r
        x1, y1 = cx + r, cy + r
        draw.ellipse([x0, y0, x1, y1], fill=(*PINK, a))

    # Soft blur to smooth the banding
    glow = glow.filter(ImageFilter.GaussianBlur(radius=max(1, radius // 10)))
    return glow


def build_base_frame() -> Image.Image:
    """Build the static background (no glow, no logo)."""
    img = Image.new("RGBA", (W, H), (*BG, 255))
    return img


def draw_text_layer(img: Image.Image) -> None:
    """Draw the pink rule, grey tagline, and pink badge onto img in-place."""
    draw = ImageDraw.Draw(img)

    # --- Pink horizontal rule ---
    rule_y = 600
    rule_x0, rule_x1 = 160, 740
    draw.rectangle([rule_x0, rule_y, rule_x1, rule_y + 2], fill=(*PINK, 230))

    # --- Grey tagline ---
    tagline_font = font(22)
    tagline_color = (180, 180, 190, 220)
    bb = draw.textbbox((0, 0), TAGLINE, font=tagline_font)
    tw = bb[2] - bb[0]
    tx = (W - tw) // 2
    draw.text((tx, rule_y + 16), TAGLINE, font=tagline_font, fill=tagline_color)

    # --- Pink badge pill ---
    badge_font = font(18, bold=True)
    bb2 = draw.textbbox((0, 0), BADGE, font=badge_font)
    bw = bb2[2] - bb2[0]
    bh = bb2[3] - bb2[1]
    pad_x, pad_y = 22, 10
    pill_w = bw + pad_x * 2
    pill_h = bh + pad_y * 2
    pill_x = (W - pill_w) // 2
    pill_y = rule_y + 60

    # Pill background (semi-transparent dark with pink border)
    pill_img = Image.new("RGBA", (pill_w, pill_h), (0, 0, 0, 0))
    pdraw = ImageDraw.Draw(pill_img)
    pdraw.rounded_rectangle([0, 0, pill_w - 1, pill_h - 1],
                             radius=pill_h // 2,
                             fill=(237, 12, 133, 30),
                             outline=(*PINK, 200),
                             width=2)
    img.alpha_composite(pill_img, dest=(pill_x, pill_y))

    # Badge text
    draw.text(
        (pill_x + pad_x - bb2[0], pill_y + pad_y - bb2[1]),
        BADGE,
        font=badge_font,
        fill=(*PINK, 240),
    )


# ---------------------------------------------------------------------------
# Pre-load logo
# ---------------------------------------------------------------------------
logo_src = Image.open(LOGO_PATH).convert("RGBA")


def make_scaled_logo(scale: float) -> tuple[Image.Image, int, int]:
    """
    Return (logo_rgba, paste_x, paste_y) for a given scale factor.
    The logo is placed in the upper-centre area, vertically around y=340.
    """
    target_w = int(LOGO_BASE_W * scale)
    # Preserve aspect ratio
    aspect = logo_src.height / logo_src.width
    target_h = int(target_w * aspect)
    logo_resized = logo_src.resize((target_w, target_h), Image.LANCZOS)
    # Centre horizontally, vertically anchor midpoint at y=370
    anchor_y = 370
    px = (W - target_w) // 2
    py = anchor_y - target_h // 2
    return logo_resized, px, py


# ---------------------------------------------------------------------------
# Build frames
# ---------------------------------------------------------------------------
frames: list[Image.Image] = []

print(f"Generating {NUM_FRAMES} frames…")
for f in range(NUM_FRAMES):
    # t: sinusoidal 0→1→0→... mapped so frame 0 starts at mid-breath
    raw_t = math.sin(f / NUM_FRAMES * 2 * math.pi)
    # raw_t is in [-1, 1]; map to [0, 1]
    t = (raw_t + 1) / 2

    glow_alpha  = lerp(GLOW_ALPHA_MIN, GLOW_ALPHA_MAX, t)
    glow_radius = int(lerp(GLOW_RADIUS_MIN, GLOW_RADIUS_MAX, t))
    logo_scale  = lerp(LOGO_SCALE_MIN, LOGO_SCALE_MAX, t)

    # 1. Dark background
    frame = build_base_frame()

    # 2. Glow layer (centred at logo position y=370)
    glow = build_glow_layer(W // 2, 370, glow_radius, glow_alpha)
    frame = Image.alpha_composite(frame, glow)

    # 3. Scaled logo
    logo_img, lx, ly = make_scaled_logo(logo_scale)
    frame.alpha_composite(logo_img, dest=(lx, ly))

    # 4. Static text elements
    draw_text_layer(frame)

    # Convert to RGB for WebP (WebP animated supports RGBA but we keep RGB for compat)
    frames.append(frame.convert("RGB"))

    if (f + 1) % 8 == 0:
        print(f"  {f + 1}/{NUM_FRAMES} frames done")

# ---------------------------------------------------------------------------
# Save animated WebP
# ---------------------------------------------------------------------------
print("Saving animated WebP…")
frames[0].save(
    OUT_WEBP,
    format="WEBP",
    save_all=True,
    append_images=frames[1:],
    duration=FRAME_DURATION_MS,
    loop=0,
    quality=82,
    method=4,
)

webp_size = os.path.getsize(OUT_WEBP)
print(f"og-v6.webp: {webp_size / 1024:.1f} KB  ({webp_size:,} bytes)")

# ---------------------------------------------------------------------------
# Save single PNG (first frame at peak glow for preview)
# ---------------------------------------------------------------------------
print("Saving PNG (peak frame)…")
peak_frame_idx = NUM_FRAMES // 4  # t=1 (peak) at quarter cycle
frames[peak_frame_idx].save(OUT_PNG, format="PNG")

png_size = os.path.getsize(OUT_PNG)
print(f"og-v6.png:  {png_size / 1024:.1f} KB  ({png_size:,} bytes)")

print("Done.")
