#!/usr/bin/env python3
"""
Generate product render images for Wrench Club merch store.
Outputs 800x800 WebP product cards for: tshirt, patch, trucker, sticker, decal.

Brand: #ED0C85 hot pink, #0a0a0a bg, #1a1a1a card, #f0f0f0 text
"""
from PIL import Image, ImageDraw, ImageFilter
import math, os, sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SCRIPT_DIR)
LOGO_PATH = os.path.join(ROOT, 'assets', 'logo.png')
OUT_DIR = os.path.join(ROOT, 'static', 'assets', 'merch')
SRC_DIR = os.path.join(ROOT, 'assets', 'merch')

os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(SRC_DIR, exist_ok=True)

# ── Brand colours ──────────────────────────────────────────────────────────────
BG       = (10, 10, 10)
CARD     = (22, 22, 22)
ACCENT   = (237, 12, 133)
ACCENT2  = (180, 8, 100)
TEXT     = (240, 240, 240)
MUTED    = (100, 100, 100)
BORDER   = (40, 40, 40)
WHITE    = (255, 255, 255)

W, H = 800, 800


def load_logo(width: int) -> Image.Image:
    logo = Image.open(LOGO_PATH).convert('RGBA')
    aspect = logo.height / logo.width
    height = int(width * aspect)
    return logo.resize((width, height), Image.LANCZOS)


def make_base(label: str, sublabel: str = '') -> tuple[Image.Image, ImageDraw.ImageDraw]:
    """Create dark base card with header and label."""
    img = Image.new('RGB', (W, H), BG)
    draw = ImageDraw.Draw(img)

    # Subtle radial glow (hot pink, center)
    glow = Image.new('RGB', (W, H), BG)
    gd = ImageDraw.Draw(glow)
    for r in range(380, 0, -4):
        alpha = max(0, int(18 * (1 - r / 380)))
        col = (
            int(BG[0] + (ACCENT[0] - BG[0]) * alpha / 255),
            int(BG[1] + (ACCENT[1] - BG[1]) * alpha / 255),
            int(BG[2] + (ACCENT[2] - BG[2]) * alpha / 255),
        )
        gd.ellipse([W//2 - r, H//2 - r, W//2 + r, H//2 + r], fill=col)
    img = Image.blend(img, glow, 0.35)
    draw = ImageDraw.Draw(img)

    # Pink top accent bar
    draw.rectangle([0, 0, W, 4], fill=ACCENT)

    # Label at bottom
    font_size = 52
    # Draw label text centered
    bbox = draw.textbbox((0, 0), label.upper(), font_size=font_size)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, H - 100), label.upper(),
              fill=TEXT, font_size=font_size)

    if sublabel:
        bbox2 = draw.textbbox((0, 0), sublabel, font_size=22)
        tw2 = bbox2[2] - bbox2[0]
        draw.text(((W - tw2) // 2, H - 52), sublabel, fill=MUTED, font_size=22)

    # Bottom border line
    draw.rectangle([60, H - 116, W - 60, H - 115], fill=BORDER)

    # "COMING 2026" badge top-right
    badge = "COMING 2026"
    bx, by = W - 20, 24
    bb = draw.textbbox((0, 0), badge, font_size=18)
    bw = bb[2] - bb[0]
    bh = bb[3] - bb[1]
    pad = 10
    draw.rounded_rectangle(
        [bx - bw - pad * 2, by - pad, bx, by + bh + pad],
        radius=6, fill=ACCENT
    )
    draw.text((bx - bw - pad, by), badge, fill=WHITE, font_size=18)

    return img, draw


def add_logo_centered(img: Image.Image, logo_w: int = 360, y_center: int = 330) -> Image.Image:
    logo = load_logo(logo_w)
    x = (W - logo.width) // 2
    y = y_center - logo.height // 2
    img.paste(logo, (x, y), logo)
    return img


# ── T-SHIRT ────────────────────────────────────────────────────────────────────
def gen_tshirt():
    img, draw = make_base("Wrench Club Tee", "Heavyweight cotton · Logo front chest")

    # Shirt silhouette (simplified flat lay)
    # Body: main rectangle
    bx1, by1, bx2, by2 = 200, 140, 600, 640
    # Left sleeve
    sleeveL = [(100, 160), (200, 160), (200, 300), (130, 320), (100, 300)]
    # Right sleeve
    sleeveR = [(600, 160), (700, 160), (700, 300), (630, 320), (600, 300)]
    # Collar cutout
    neck_cx, neck_cy, neck_r = 400, 163, 60

    # Draw shirt body (dark charcoal)
    shirt_col = (28, 28, 28)
    draw.polygon(sleeveL, fill=shirt_col)
    draw.polygon(sleeveR, fill=shirt_col)
    draw.rectangle([bx1, by1, bx2, by2], fill=shirt_col)
    # Collar cutout
    draw.ellipse([neck_cx - neck_r, neck_cy - neck_r // 2,
                  neck_cx + neck_r, neck_cy + neck_r], fill=BG)

    # Seam lines
    seam_col = (40, 40, 40)
    draw.line([(200, 160), (200, 300)], fill=seam_col, width=2)
    draw.line([(600, 160), (600, 300)], fill=seam_col, width=2)
    draw.line([(bx1, by2), (bx2, by2)], fill=seam_col, width=2)

    # Logo on chest
    logo = load_logo(230)
    lx = (W - logo.width) // 2
    ly = 300
    img.paste(logo, (lx, ly), logo)

    img = img.filter(ImageFilter.SMOOTH)
    return img


# ── PATCH ──────────────────────────────────────────────────────────────────────
def gen_patch():
    img, draw = make_base("Iron-On Patch", "3.5\" woven · High-density embroidery")

    # Patch shape: stadium/rectangle with rounded ends
    px1, py1, px2, py2 = 150, 180, 650, 560
    pr = 60

    # Shadow
    draw.rounded_rectangle([px1 + 6, py1 + 6, px2 + 6, py2 + 6],
                            radius=pr, fill=(5, 5, 5))

    # Patch base (dark navy-black)
    patch_col = (18, 18, 26)
    draw.rounded_rectangle([px1, py1, px2, py2], radius=pr, fill=patch_col)

    # Stitched border (double line in hot pink)
    inset = 10
    for w, col in [(3, ACCENT2), (2, ACCENT)]:
        draw.rounded_rectangle(
            [px1 + inset, py1 + inset, px2 - inset, py2 - inset],
            radius=pr - inset, outline=col, width=w
        )
    inset2 = 18
    draw.rounded_rectangle(
        [px1 + inset2, py1 + inset2, px2 - inset2, py2 - inset2],
        radius=pr - inset2, outline=(50, 50, 50), width=1
    )

    # Logo in center
    img = add_logo_centered(img, logo_w=340, y_center=370)
    return img


# ── TRUCKER HAT ────────────────────────────────────────────────────────────────
def gen_trucker():
    img, draw = make_base("Trucker Hat", "Structured snapback · Foam front panel")

    # Hat front panel (trapezoid)
    hat_col = (20, 20, 20)
    brim_col = (30, 30, 30)

    # Front panel
    panel = [(180, 250), (620, 250), (590, 490), (210, 490)]
    draw.polygon(panel, fill=hat_col)

    # Panel stitching outline
    for offset in [(0, 0), (10, 8)]:
        points = [(p[0] + offset[0], p[1] + offset[1]) for p in
                  [(185, 258), (615, 258), (585, 482), (215, 482)]]
        draw.line(points + [points[0]], fill=(45, 45, 45), width=2)

    # Brim
    brim = [(160, 490), (640, 490), (660, 530), (140, 530)]
    draw.polygon(brim, fill=brim_col)
    draw.line([(160, 490), (640, 490)], fill=(50, 50, 50), width=2)

    # Sweatband crease
    draw.line([(210, 485), (590, 485)], fill=(15, 15, 15), width=4)

    # Button on top
    draw.ellipse([390, 235, 410, 255], fill=(35, 35, 35), outline=(60, 60, 60))

    # Snapback strap
    strap_col = (25, 25, 25)
    draw.rectangle([310, 530, 490, 555], fill=strap_col)
    draw.rectangle([390, 535, 410, 550], fill=(40, 40, 40))  # adjuster

    # Pink accent stripe along brim
    draw.line([(162, 492), (638, 492)], fill=ACCENT, width=2)

    # Logo on panel
    logo = load_logo(260)
    lx = (W - logo.width) // 2
    ly = 320
    img.paste(logo, (lx, ly), logo)

    return img


# ── STICKER ────────────────────────────────────────────────────────────────────
def gen_sticker():
    img, draw = make_base("Die-Cut Sticker", "Weatherproof vinyl · 4\" wide")

    # Die-cut follows logo shape — horizontal pill
    sw, sh = 520, 200
    sx = (W - sw) // 2
    sy = 270

    # White backing (sticker base)
    draw.rounded_rectangle([sx, sy, sx + sw, sy + sh], radius=sh // 2, fill=WHITE)

    # 3px border (hot pink)
    draw.rounded_rectangle([sx, sy, sx + sw, sy + sh], radius=sh // 2,
                            outline=ACCENT, width=3)

    # Inner shadow effect
    draw.rounded_rectangle([sx + 4, sy + 4, sx + sw - 4, sy + sh - 4],
                            radius=sh // 2 - 4, outline=(220, 220, 220), width=1)

    # Logo on white sticker background
    logo = load_logo(380)
    # Tint logo dark for white background
    logo_dark = logo.copy()
    r, g, b, a = logo_dark.split()
    # Invert: logo is white on transparent — make it dark for white bg
    from PIL import ImageChops
    r_inv = ImageChops.invert(r)
    g_inv = ImageChops.invert(g)
    b_inv = ImageChops.invert(b)
    logo_dark = Image.merge('RGBA', (r_inv, g_inv, b_inv, a))
    lx = (W - logo_dark.width) // 2
    ly = sy + (sh - logo_dark.height) // 2
    img.paste(logo_dark, (lx, ly), logo_dark)

    # Pink "W" monogram accent - tiny pill above main sticker
    tag_w, tag_h = 80, 36
    tx = (W - tag_w) // 2
    ty = sy - tag_h - 12
    draw.rounded_rectangle([tx, ty, tx + tag_w, ty + tag_h],
                            radius=tag_h // 2, fill=ACCENT)
    bb = draw.textbbox((0, 0), "WC", font_size=18)
    tw = bb[2] - bb[0]
    draw.text((tx + (tag_w - tw) // 2, ty + 8), "WC", fill=WHITE, font_size=18)

    return img


# ── DECAL ──────────────────────────────────────────────────────────────────────
def gen_decal():
    img, draw = make_base("Vinyl Decal", "Cut vinyl · 6\" × 1.5\" · Car-safe")

    # Decal rectangle (landscape, wide)
    dw, dh = 580, 148
    dx = (W - dw) // 2
    dy = 295

    # Hot pink fill (bold brand decal)
    draw.rounded_rectangle([dx, dy, dx + dw, dy + dh], radius=10, fill=ACCENT)

    # Gloss highlight top-half
    for i in range(dh // 2):
        alpha = int(60 * (1 - i / (dh // 2)))
        col = (
            min(255, ACCENT[0] + alpha),
            min(255, ACCENT[1] + alpha),
            min(255, ACCENT[2] + alpha),
        )
        draw.line([(dx + 10, dy + i), (dx + dw - 10, dy + i)], fill=col)

    # Logo (white version on pink)
    logo = load_logo(400)
    lx = (W - logo.width) // 2
    ly = dy + (dh - logo.height) // 2
    img.paste(logo, (lx, ly), logo)

    # Perforated cut line border
    for x in range(dx - 20, dx + dw + 20, 10):
        draw.ellipse([x - 2, dy + dh // 2 - 2, x + 2, dy + dh // 2 + 2],
                     fill=(40, 40, 40))

    # Application tape mockup (light grey semi-transparent top)
    # Subtle application tape outline
    draw.rounded_rectangle([dx - 10, dy - 15, dx + dw + 10, dy + dh + 15],
                            radius=14, outline=(55, 55, 55), width=1)

    return img


# ── Run all ────────────────────────────────────────────────────────────────────
products = [
    ('tshirt',  gen_tshirt),
    ('patch',   gen_patch),
    ('trucker', gen_trucker),
    ('sticker', gen_sticker),
    ('decal',   gen_decal),
]

for name, fn in products:
    print(f'  Generating {name}...')
    try:
        result = fn()
        out_path = os.path.join(OUT_DIR, f'{name}.webp')
        src_path = os.path.join(SRC_DIR, f'{name}.webp')
        result.convert('RGB').save(out_path, 'WEBP', quality=88, method=6)
        result.convert('RGB').save(src_path, 'WEBP', quality=88, method=6)
        size_kb = os.path.getsize(out_path) // 1024
        print(f'    ✓ {out_path} ({size_kb}KB)')
    except Exception as e:
        print(f'    ✗ {name}: {e}')
        import traceback; traceback.print_exc()

print('Done.')
