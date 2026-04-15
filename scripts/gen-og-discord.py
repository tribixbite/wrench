#!/usr/bin/env python3
"""
Generate animated WebP OG image — square format, logo on dark bg, pink shimmer.
Output: static/og-discord.webp  (900×900, ~2.5s loop)
"""
from PIL import Image, ImageDraw
import math, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO_PATH = os.path.join(ROOT, 'assets', 'logo.png')
OUT_PATH  = os.path.join(ROOT, 'static', 'og-discord.webp')

W = H = 900
BG     = (10,  10,  10)
ACCENT = (237, 12,  133)
MUTED  = (160, 160, 160)
WHITE  = (255, 255, 255)

print('  Building base frame...')

base = Image.new('RGB', (W, H), BG)
draw = ImageDraw.Draw(base)

# Radial pink glow behind logo
glow = Image.new('RGB', (W, H), BG)
gd = ImageDraw.Draw(glow)
cx, cy = W // 2, H // 2 - 20
for r in range(380, 0, -4):
    t = 1 - r / 380
    intensity = t ** 2.8 * 0.22
    col = (int(ACCENT[0] * intensity), int(ACCENT[1] * intensity), int(ACCENT[2] * intensity))
    gd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)
base = Image.blend(base, glow, 0.85)
draw = ImageDraw.Draw(base)

# Logo centred
logo_raw = Image.open(LOGO_PATH).convert('RGBA')
logo_w = 600
logo_h = int(logo_raw.height * logo_w / logo_raw.width)
logo = logo_raw.resize((logo_w, logo_h), Image.LANCZOS)
lx = (W - logo_w) // 2
ly = (H - logo_h) // 2 - 40
base.paste(logo, (lx, ly), logo)

# Pink rule below logo
rule_y = ly + logo_h + 16
draw.rectangle([lx, rule_y, lx + logo_w, rule_y + 2], fill=ACCENT)

# Tagline
tagline = "West Michigan's Premier DIY Auto Shop"
fs = 22
bb = draw.textbbox((0, 0), tagline, font_size=fs)
tw = bb[2] - bb[0]
draw.text(((W - tw) // 2, rule_y + 12), tagline, fill=MUTED, font_size=fs)

# Location badge
badge_text = "OPENING 2026  ·  GRAND RAPIDS, MI"
badge_fs = 15
bb2 = draw.textbbox((0, 0), badge_text, font_size=badge_fs)
bw, bh = bb2[2] - bb2[0], bb2[3] - bb2[1]
pad_x, pad_y = 16, 8
bx = (W - bw - pad_x * 2) // 2
by = H - 70
draw.rounded_rectangle([bx, by, bx + bw + pad_x * 2, by + bh + pad_y * 2], radius=6, fill=ACCENT)
draw.text((bx + pad_x, by + pad_y), badge_text, fill=WHITE, font_size=badge_fs)

# Shimmer sweep
SHIMMER_W = 220

def make_strip(brightness=1.0):
    strip = Image.new('RGBA', (SHIMMER_W, H), (0, 0, 0, 0))
    for x in range(SHIMMER_W):
        t = (x - SHIMMER_W / 2) / (SHIMMER_W / 2)
        g = math.exp(-4 * t * t)
        alpha = int(g * 75 * brightness)
        r = int(ACCENT[0] + (WHITE[0] - ACCENT[0]) * g * 0.5)
        gv = int(ACCENT[1] + (WHITE[1] - ACCENT[1]) * g * 0.5)
        bv = int(ACCENT[2] + (WHITE[2] - ACCENT[2]) * g * 0.5)
        for y in range(H):
            strip.putpixel((x, y), (r, gv, bv, alpha))
    return strip

SWEEP = 22
HOLD  = 8
TOTAL = SWEEP * 3 + HOLD
frames, durations = [], []

print(f'  Generating {TOTAL} frames...')
for f in range(TOTAL):
    frame = base.copy()
    if f < SWEEP * 3:
        pass_num = f // SWEEP
        t = (f % SWEEP) / SWEEP
        sx = int(-SHIMMER_W // 2 + t * (W + SHIMMER_W))
        strip = make_strip([1.0, 0.5, 0.25][pass_num])
        frame.paste(strip, (sx, 0), strip)
        durations.append(50)
    else:
        durations.append(90)
    frames.append(frame)

print(f'  Saving {OUT_PATH}...')
frames[0].save(OUT_PATH, format='WEBP', save_all=True, append_images=frames[1:],
               loop=0, duration=durations, quality=82, method=4)
print(f'  ✓ {os.path.getsize(OUT_PATH) // 1024} KB, {TOTAL} frames')

png_path = os.path.join(ROOT, 'static', 'og-discord.png')
frames[0].save(png_path, 'PNG')
print(f'  ✓ {png_path}')
