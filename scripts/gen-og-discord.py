#!/usr/bin/env python3
"""
Generate animated WebP OG image optimised for Discord embeds.
Output: static/og-discord.webp  (1200×630, ~2.5s loop, <3MB)

Design:
  • Left 55%: Dark bg with Wrench Club logo + tagline + location badge
  • Right 45%: team-cars.jpg with dark vignette overlay
  • Animation: hot-pink shimmer beam sweeps L→R over logo (3 repeats)
    then holds for 0.5 s before looping
"""
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import math, os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SCRIPT_DIR)

LOGO_PATH  = os.path.join(ROOT, 'assets', 'logo.png')
CARS_PATH  = os.path.join(ROOT, 'assets', 'team-cars.jpg')
OUT_PATH   = os.path.join(ROOT, 'static', 'og-discord.webp')

W, H = 1200, 630

# ── Brand palette ──────────────────────────────────────────────────────────────
BG     = (10,  10,  10 )
ACCENT = (237, 12,  133)
TEXT   = (240, 240, 240)
MUTED  = (140, 140, 140)
WHITE  = (255, 255, 255)

# ── Build static base layer ────────────────────────────────────────────────────
print('  Building base frame...')

base = Image.new('RGB', (W, H), BG)

# Right panel: team-cars photo, cropped & darkened
cars_raw = Image.open(CARS_PATH).convert('RGB')
panel_w = int(W * 0.52)
panel_x = W - panel_w
aspect = cars_raw.height / cars_raw.width
new_w = max(panel_w, int(H / aspect))
new_h = max(H, int(panel_w * aspect))
cars_resized = cars_raw.resize((new_w, new_h), Image.LANCZOS)
# Centre-crop to panel_w × H
cx = (new_w - panel_w) // 2
cy = (new_h - H) // 2
cars_crop = cars_resized.crop((cx, cy, cx + panel_w, cy + H))

# Darken the cars photo to ~30% brightness
darkened = Image.new('RGB', (panel_w, H), BG)
darkened = Image.blend(darkened, cars_crop, 0.30)
base.paste(darkened, (panel_x, 0))

# Gradient overlay: dark left edge on the photo to blend cleanly
grad_w = 200
for x in range(grad_w):
    alpha = (1 - x / grad_w) ** 2
    col = tuple(int(BG[c] + (darkened.getpixel((x, H // 2))[c] - BG[c]) * (1 - alpha))
                for c in range(3))
    for y in range(H):
        base.putpixel((panel_x + x, y), col)

draw = ImageDraw.Draw(base)

# Pink accent line (vertical, left divider)
draw.line([(panel_x, 0), (panel_x, H)], fill=ACCENT, width=2)

# Subtle hot-pink radial glow behind logo area (left half)
glow = Image.new('RGB', (W, H), BG)
gd = ImageDraw.Draw(glow)
logo_center = (280, 290)
for r in range(320, 0, -5):
    t = 1 - r / 320
    intensity = t ** 2 * 0.12
    col = (
        int(BG[0] + (ACCENT[0] - BG[0]) * intensity),
        int(BG[1] + (ACCENT[1] - BG[1]) * intensity),
        int(BG[2] + (ACCENT[2] - BG[2]) * intensity),
    )
    gd.ellipse([logo_center[0] - r, logo_center[1] - r,
                logo_center[0] + r, logo_center[1] + r], fill=col)
base = Image.blend(base, glow, 0.6)
draw = ImageDraw.Draw(base)

# ── Logo ───────────────────────────────────────────────────────────────────────
logo_raw = Image.open(LOGO_PATH).convert('RGBA')
logo_w = 480
logo_h = int(logo_raw.height * logo_w / logo_raw.width)
logo = logo_raw.resize((logo_w, logo_h), Image.LANCZOS)
logo_x = 60
logo_y = (H - logo_h) // 2 - 40
base.paste(logo, (logo_x, logo_y), logo)

# ── Tagline ────────────────────────────────────────────────────────────────────
tagline = "West Michigan's Premier DIY Auto Shop"
fs = 22
bb = draw.textbbox((0, 0), tagline, font_size=fs)
draw.text((logo_x, logo_y + logo_h + 20), tagline, fill=MUTED, font_size=fs)

# ── Location badge ─────────────────────────────────────────────────────────────
badge_text = "OPENING 2026  ·  GRAND RAPIDS, MI"
badge_fs = 16
bb2 = draw.textbbox((0, 0), badge_text, font_size=badge_fs)
bw = bb2[2] - bb2[0]
bh = bb2[3] - bb2[1]
pad_x, pad_y = 14, 8
bx, by = logo_x, H - 70
draw.rounded_rectangle(
    [bx, by, bx + bw + pad_x * 2, by + bh + pad_y * 2],
    radius=6, fill=ACCENT
)
draw.text((bx + pad_x, by + pad_y), badge_text, fill=WHITE, font_size=badge_fs)

# ── Pink horizontal rule under logo ────────────────────────────────────────────
rule_y = logo_y + logo_h + 10
draw.rectangle([logo_x, rule_y, logo_x + logo_w, rule_y + 2], fill=ACCENT)

# ── Shimmer beam ───────────────────────────────────────────────────────────────
# The shimmer is a soft vertical gradient stripe composited over the logo area.
# Width of beam: 180px, Gaussian soft edges.

SHIMMER_W = 180
SHIMMER_H = H

def make_shimmer_strip(brightness: float = 1.0) -> Image.Image:
    """Soft vertical gradient stripe: transparent → bright → transparent."""
    strip = Image.new('RGBA', (SHIMMER_W, SHIMMER_H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(strip)
    for x in range(SHIMMER_W):
        # Gaussian profile centred at SHIMMER_W//2
        t = (x - SHIMMER_W / 2) / (SHIMMER_W / 2)
        g = math.exp(-4 * t * t)
        alpha = int(g * 80 * brightness)
        r = int(ACCENT[0] + (WHITE[0] - ACCENT[0]) * g * 0.4)
        gv = int(ACCENT[1] + (WHITE[1] - ACCENT[1]) * g * 0.4)
        b_val = int(ACCENT[2] + (WHITE[2] - ACCENT[2]) * g * 0.4)
        for y in range(SHIMMER_H):
            strip.putpixel((x, y), (r, gv, b_val, alpha))
    return strip

shimmer_strip = make_shimmer_strip(1.0)
shimmer_strip_half = make_shimmer_strip(0.5)

# Clip region for shimmer: only over logo + rule area (left panel)
CLIP_X1 = logo_x - 20
CLIP_X2 = panel_x - 10

# ── Animation frames ────────────────────────────────────────────────────────────
# Sweep: 3 passes, 20 frames each = 60 frames total + 8 hold frames
# FPS=15 → each frame = 67ms → total ~4.5s loop

SWEEP_FRAMES = 20   # frames per sweep pass
HOLD_FRAMES  = 8    # hold at end before loop
TOTAL_FRAMES = SWEEP_FRAMES * 3 + HOLD_FRAMES

frames = []
durations = []  # ms per frame

print(f'  Generating {TOTAL_FRAMES} frames...')

for f in range(TOTAL_FRAMES):
    frame = base.copy()

    if f < SWEEP_FRAMES * 3:
        # Which pass?
        pass_num = f // SWEEP_FRAMES
        t = (f % SWEEP_FRAMES) / SWEEP_FRAMES  # 0.0 → 1.0

        # Travel: from left of logo to right of clip zone
        travel = CLIP_X2 - CLIP_X1 + SHIMMER_W
        sx = int(CLIP_X1 - SHIMMER_W // 2 + t * travel)

        # Second pass is slightly dimmer; third very faint (trailing echo)
        brightness = [1.0, 0.55, 0.28][pass_num]
        strip = make_shimmer_strip(brightness)

        # Paste with clip
        paste_x = max(sx, CLIP_X1 - SHIMMER_W)
        paste_x = min(paste_x, CLIP_X2)
        frame.paste(strip.crop((0, 0, SHIMMER_W, SHIMMER_H)),
                    (sx, 0), strip)

        duration = 55  # ~18fps during sweep for smooth motion
    else:
        duration = 90  # hold frames slower

    frames.append(frame)
    durations.append(duration)

# ── Save animated WebP ─────────────────────────────────────────────────────────
print(f'  Saving to {OUT_PATH}...')
frames[0].save(
    OUT_PATH,
    format='WEBP',
    save_all=True,
    append_images=frames[1:],
    loop=0,
    duration=durations,
    quality=80,
    method=4,
)
size_kb = os.path.getsize(OUT_PATH) // 1024
print(f'  ✓ {OUT_PATH} ({size_kb} KB, {TOTAL_FRAMES} frames)')

# Also save static fallback PNG (first frame)
png_path = os.path.join(ROOT, 'static', 'og-discord.png')
frames[0].save(png_path, 'PNG')
print(f'  ✓ {png_path} (static fallback)')
