"""
Generate og-v9.webp — Particle Drift animated WebP (900x900).
40 pink/white particles float upward with sinusoidal horizontal wobble.
"""

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

# ── Constants ──────────────────────────────────────────────────────────────────
W, H = 900, 900
FRAMES = 40
FRAME_DURATION_MS = 65
BRAND_PINK = (0xED, 0x0C, 0x85)
WHITE = (0xFF, 0xFF, 0xFF)
BG_COLOR = (0x0A, 0x0A, 0x0A, 0xFF)
SEED = 7
N_PARTICLES = 40

OUT_DIR = Path("/data/data/com.termux/files/home/git/wrench/static")
LOGO_PATH = Path("/data/data/com.termux/files/home/git/wrench/assets/logo.png")

# ── Particle definitions ───────────────────────────────────────────────────────
rng = random.Random(SEED)

particles = []
for _ in range(N_PARTICLES):
    color = BRAND_PINK if rng.random() < 0.5 else WHITE
    opacity = int(rng.uniform(0.40, 1.00) * 255)
    particles.append({
        "x": rng.uniform(0, W),
        "y": rng.uniform(0, H),
        "speed": rng.uniform(3, 8),          # px/frame upward
        "radius": rng.uniform(2, 5),
        "wobble_amp": rng.uniform(1, 4),      # horizontal amplitude px
        "wobble_freq": rng.uniform(0.05, 0.20),  # radians per frame
        "wobble_phase": rng.uniform(0, 2 * math.pi),
        "color": color,
        "opacity": opacity,
    })

# ── Helper: build static base layer ───────────────────────────────────────────
def build_base() -> Image.Image:
    """Render the non-animated background: dark bg, radial glow, logo, rule, tagline, badge."""
    base = Image.new("RGBA", (W, H), BG_COLOR)
    draw = ImageDraw.Draw(base)

    # -- Radial pink glow behind logo ------------------------------------------
    # Draw a soft ellipse on a separate RGBA layer, then Gaussian-blur it
    # so it blends naturally as a true glow without opaque fill accumulation.
    glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer)
    glow_cx, glow_cy = W // 2, 340
    glow_rw, glow_rh = 260, 120           # half-widths of the core ellipse
    glow_draw.ellipse(
        [glow_cx - glow_rw, glow_cy - glow_rh,
         glow_cx + glow_rw, glow_cy + glow_rh],
        fill=(*BRAND_PINK, 160),
    )
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=55))
    base = Image.alpha_composite(base, glow_layer)
    # Re-bind draw to updated base
    draw = ImageDraw.Draw(base)

    # -- Logo ------------------------------------------------------------------
    logo_src = Image.open(LOGO_PATH).convert("RGBA")
    logo_w = 580
    scale = logo_w / logo_src.width
    logo_h = int(logo_src.height * scale)
    logo = logo_src.resize((logo_w, logo_h), Image.LANCZOS)
    logo_x = (W - logo_w) // 2
    logo_y = 290          # centred in the upper half, above the rule
    base.paste(logo, (logo_x, logo_y), logo)

    # -- Pink horizontal rule --------------------------------------------------
    rule_y = 520
    draw.rectangle([60, rule_y, W - 60, rule_y + 2], fill=(*BRAND_PINK, 220))

    # -- Grey tagline ----------------------------------------------------------
    FONT_CANDIDATES = [
        "/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
        "/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    _font_path = next((p for p in FONT_CANDIDATES if Path(p).exists()), None)
    try:
        if _font_path:
            font_tag = ImageFont.truetype(_font_path, 22)
            font_badge = ImageFont.truetype(_font_path, 16)
        else:
            raise OSError("no font found")
    except Exception:
        font_tag = ImageFont.load_default()
        font_badge = ImageFont.load_default()

    tagline = "THE DIY AUTO SHOP FOR ENTHUSIASTS"
    bbox = draw.textbbox((0, 0), tagline, font=font_tag)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, 536), tagline, fill=(0xAA, 0xAA, 0xAA, 220), font=font_tag)

    # -- Pink badge ------------------------------------------------------------
    badge_text = "522 STOCKING AVE NW  ·  GRAND RAPIDS, MI"
    bbox2 = draw.textbbox((0, 0), badge_text, font=font_badge)
    bw = bbox2[2] - bbox2[0]
    bh = bbox2[3] - bbox2[1]
    pad_x, pad_y = 18, 8
    bx = (W - bw - pad_x * 2) // 2
    by = 575
    # pill background
    draw.rounded_rectangle(
        [bx, by, bx + bw + pad_x * 2, by + bh + pad_y * 2],
        radius=6,
        fill=(*BRAND_PINK, 230),
    )
    draw.text((bx + pad_x, by + pad_y), badge_text, fill=(255, 255, 255, 255), font=font_badge)

    return base


# ── Build frames ──────────────────────────────────────────────────────────────
print("Rendering base layer…")
base = build_base()

print("Rendering 40 frames…")
frames: list[Image.Image] = []

for f in range(FRAMES):
    # Clone base for this frame
    frame = base.copy()

    # Transparent particle overlay
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)

    for p in particles:
        # Advance particle position for frame f
        y = (p["y"] - p["speed"] * f) % H  # wrap top → bottom
        wobble = p["wobble_amp"] * math.sin(p["wobble_freq"] * f + p["wobble_phase"])
        x = (p["x"] + wobble) % W
        r = p["radius"]

        # Slight opacity pulse (±10%) for organic feel
        pulse = 0.10 * math.sin(0.3 * f + p["wobble_phase"])
        alpha = max(0, min(255, int(p["opacity"] * (1 + pulse))))

        color_rgba = (*p["color"], alpha)
        odraw.ellipse([x - r, y - r, x + r, y + r], fill=color_rgba)

    # Composite overlay onto frame
    frame = Image.alpha_composite(frame, overlay)

    # Convert to RGB for WebP (preserve palette efficiency)
    frames.append(frame.convert("RGB"))

# ── Save animated WebP ────────────────────────────────────────────────────────
webp_path = OUT_DIR / "og-v9.webp"
png_path = OUT_DIR / "og-v9.png"

print(f"Saving {webp_path} …")
frames[0].save(
    webp_path,
    format="WEBP",
    save_all=True,
    append_images=frames[1:],
    duration=FRAME_DURATION_MS,
    loop=0,
    quality=82,
    method=4,
)

# Save first frame as PNG
print(f"Saving {png_path} …")
frames[0].save(png_path, format="PNG")

webp_size = webp_path.stat().st_size
png_size = png_path.stat().st_size
print(f"og-v9.webp  {webp_size:,} bytes  ({webp_size / 1024:.1f} KB)")
print(f"og-v9.png   {png_size:,} bytes  ({png_size / 1024:.1f} KB)")
print("Done.")
