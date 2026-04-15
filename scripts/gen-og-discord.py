#!/usr/bin/env python3
"""
Generate animated WebP OG image optimised for Discord embeds.
Output: static/og-discord.webp  (1200×630, ~2.5s loop, <3MB)

Design:
  • Full-bleed team-cars.jpg background at ~22% brightness
  • Dark vignette overlay (edges darker, centre lighter)
  • Hot-pink radial glow behind logo
  • Wrench Club logo centred, tagline below, location badge bottom-left
  • Animation: hot-pink shimmer beam sweeps L→R (3 passes)
  No dividing lines — unified cinematic look
"""
from PIL import Image, ImageDraw, ImageFilter
import math, os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SCRIPT_DIR)

LOGO_PATH = os.path.join(ROOT, 'assets', 'logo.png')
CARS_PATH = os.path.join(ROOT, 'assets', 'team-cars.jpg')
OUT_PATH  = os.path.join(ROOT, 'static', 'og-discord.webp')

W, H = 1200, 630

BG     = (10,  10,  10 )
ACCENT = (237, 12,  133)
TEXT   = (240, 240, 240)
MUTED  = (160, 160, 160)
WHITE  = (255, 255, 255)

print('  Building base frame...')

# ── Full-bleed background ────────────────────────────────────────────────────
cars_raw = Image.open(CARS_PATH).convert('RGB')
# Resize to fill 1200×630, centre-crop
aspect = cars_raw.height / cars_raw.width
if W / H > cars_raw.width / cars_raw.height:
    new_w = W
    new_h = int(W * aspect)
else:
    new_h = H
    new_w = int(H / aspect)
cars_resized = cars_raw.resize((new_w, new_h), Image.LANCZOS)
cx = (new_w - W) // 2
cy = (new_h - H) // 2
cars_crop = cars_resized.crop((cx, cy, cx + W, cy + H))

# Darken to ~22% brightness
base = Image.new('RGB', (W, H), BG)
base = Image.blend(base, cars_crop, 0.22)

# ── Vignette overlay ─────────────────────────────────────────────────────────
# Blend a dark-edged mask over the base to focus attention on the centre
vignette = Image.new('RGB', (W, H), BG)
vd = ImageDraw.Draw(vignette)
for r in range(min(W, H) // 2, 0, -4):
    t = r / (min(W, H) / 2)
    alpha = t ** 1.6  # edge is fully dark, centre is transparent
    col = tuple(int(BG[c] * alpha) for c in range(3))
    vd.ellipse([W//2 - r*2, H//2 - r, W//2 + r*2, H//2 + r], fill=col)
base = Image.blend(base, vignette, 0.65)

# ── Hot-pink radial glow (behind logo) ───────────────────────────────────────
glow = Image.new('RGB', (W, H), (0, 0, 0))
gd = ImageDraw.Draw(glow)
cx_g, cy_g = W // 2, H // 2 - 20
for r in range(400, 0, -5):
    t = 1 - r / 400
    intensity = t ** 2.5 * 0.18
    col = (
        int(ACCENT[0] * intensity),
        int(ACCENT[1] * intensity),
        int(ACCENT[2] * intensity),
    )
    gd.ellipse([cx_g - r, cy_g - r, cx_g + r, cy_g + r], fill=col)
base = Image.blend(base, glow, 0.8)
draw = ImageDraw.Draw(base)

# ── Logo (centred) ───────────────────────────────────────────────────────────
logo_raw = Image.open(LOGO_PATH).convert('RGBA')
logo_w = 520
logo_h = int(logo_raw.height * logo_w / logo_raw.width)
logo = logo_raw.resize((logo_w, logo_h), Image.LANCZOS)
logo_x = (W - logo_w) // 2
logo_y = (H - logo_h) // 2 - 30
base.paste(logo, (logo_x, logo_y), logo)

# ── Pink rule below logo ──────────────────────────────────────────────────────
rule_y = logo_y + logo_h + 14
draw.rectangle([logo_x, rule_y, logo_x + logo_w, rule_y + 2], fill=ACCENT)

# ── Tagline ───────────────────────────────────────────────────────────────────
tagline = "West Michigan's Premier DIY Auto Shop"
fs = 22
bb = draw.textbbox((0, 0), tagline, font_size=fs)
tw = bb[2] - bb[0]
draw.text(((W - tw) // 2, rule_y + 10), tagline, fill=MUTED, font_size=fs)

# ── Location badge (bottom-centre) ───────────────────────────────────────────
badge_text = "OPENING 2026  ·  GRAND RAPIDS, MI"
badge_fs = 15
bb2 = draw.textbbox((0, 0), badge_text, font_size=badge_fs)
bw = bb2[2] - bb2[0]
bh = bb2[3] - bb2[1]
pad_x, pad_y = 16, 8
bx = (W - bw - pad_x * 2) // 2
by = H - 62
draw.rounded_rectangle(
    [bx, by, bx + bw + pad_x * 2, by + bh + pad_y * 2],
    radius=6, fill=ACCENT
)
draw.text((bx + pad_x, by + pad_y), badge_text, fill=WHITE, font_size=badge_fs)

# ── Shimmer beam ─────────────────────────────────────────────────────────────
SHIMMER_W = 200
SHIMMER_H = H

def make_shimmer_strip(brightness: float = 1.0) -> Image.Image:
    strip = Image.new('RGBA', (SHIMMER_W, SHIMMER_H), (0, 0, 0, 0))
    for x in range(SHIMMER_W):
        t = (x - SHIMMER_W / 2) / (SHIMMER_W / 2)
        g = math.exp(-4 * t * t)
        alpha = int(g * 70 * brightness)
        r = int(ACCENT[0] + (WHITE[0] - ACCENT[0]) * g * 0.5)
        gv = int(ACCENT[1] + (WHITE[1] - ACCENT[1]) * g * 0.5)
        bv = int(ACCENT[2] + (WHITE[2] - ACCENT[2]) * g * 0.5)
        for y in range(SHIMMER_H):
            strip.putpixel((x, y), (r, gv, bv, alpha))
    return strip

# ── Animation frames ──────────────────────────────────────────────────────────
SWEEP_FRAMES = 22
HOLD_FRAMES  = 8
TOTAL_FRAMES = SWEEP_FRAMES * 3 + HOLD_FRAMES

frames = []
durations = []

print(f'  Generating {TOTAL_FRAMES} frames...')

for f in range(TOTAL_FRAMES):
    frame = base.copy()

    if f < SWEEP_FRAMES * 3:
        pass_num = f // SWEEP_FRAMES
        t = (f % SWEEP_FRAMES) / SWEEP_FRAMES

        travel = W + SHIMMER_W
        sx = int(-SHIMMER_W // 2 + t * travel)

        brightness = [1.0, 0.5, 0.25][pass_num]
        strip = make_shimmer_strip(brightness)
        frame.paste(strip.crop((0, 0, SHIMMER_W, SHIMMER_H)), (sx, 0), strip)

        duration = 50
    else:
        duration = 90

    frames.append(frame)
    durations.append(duration)

# ── Save ──────────────────────────────────────────────────────────────────────
print(f'  Saving to {OUT_PATH}...')
frames[0].save(
    OUT_PATH,
    format='WEBP',
    save_all=True,
    append_images=frames[1:],
    loop=0,
    duration=durations,
    quality=82,
    method=4,
)
size_kb = os.path.getsize(OUT_PATH) // 1024
print(f'  ✓ {OUT_PATH} ({size_kb} KB, {TOTAL_FRAMES} frames)')

png_path = os.path.join(ROOT, 'static', 'og-discord.png')
frames[0].save(png_path, 'PNG')
print(f'  ✓ {png_path} (static fallback)')
