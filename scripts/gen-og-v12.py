"""
Generate og-v12.webp: 900x900 animated WebP
Concept: Two hex nuts (G + R) unscrew upward, revealing "GRAND OPENING" text.
"""

import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ── Constants ────────────────────────────────────────────────────────────────
W, H = 900, 900
PINK = (237, 12, 133)
BG   = (10, 10, 10)
WHITE = (255, 255, 255)
GREY  = (136, 136, 136)

FONT_BOLD = "/system/fonts/DroidSans-Bold.ttf"
FONT_REG  = "/system/fonts/DroidSans.ttf"

# Fallback to default if needed
def load_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

# ── Hex nut drawing ──────────────────────────────────────────────────────────
def hex_points(cx, cy, size, angle_offset=0.0):
    """Return flat-top hexagon points."""
    pts = []
    for i in range(6):
        ang = math.radians(angle_offset + i * 60)
        pts.append((cx + size * math.cos(ang), cy + size * math.sin(ang)))
    return pts

def draw_hex_nut(letter: str, angle_deg: float, scale: float = 1.0, alpha: int = 255) -> Image.Image:
    """
    Returns an RGBA image of a hex nut with the given letter.
    size=110 outer hex, size=60 inner hole.
    """
    outer = 110
    inner = 60
    pad   = 20
    sz    = int((outer + pad) * 2 * scale)
    if sz < 4:
        sz = 4
    img   = Image.new("RGBA", (sz, sz), (0, 0, 0, 0))
    draw  = ImageDraw.Draw(img)

    cx = sz / 2
    cy = sz / 2
    s_outer = outer * scale
    s_inner = inner * scale

    # Outer hex fill + stroke
    pts_outer = hex_points(cx, cy, s_outer, angle_deg)
    draw.polygon(pts_outer, fill=(34, 34, 34, alpha))
    # Stroke: draw multiple times for thick outline
    for offset in range(4):
        pts_stroke = hex_points(cx, cy, s_outer - offset * 0.5, angle_deg)
        draw.polygon(pts_stroke, outline=(PINK[0], PINK[1], PINK[2], alpha))

    # Inner hex (hole)
    pts_inner = hex_points(cx, cy, s_inner, angle_deg)
    draw.polygon(pts_inner, fill=(BG[0], BG[1], BG[2], alpha))

    # Letter
    font_sz = int(52 * scale)
    font = load_font(FONT_BOLD, max(font_sz, 8))
    bbox = draw.textbbox((0, 0), letter, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = cx - tw / 2 - bbox[0]
    ty = cy - th / 2 - bbox[1]
    draw.text((tx, ty), letter, font=font, fill=(255, 255, 255, alpha))

    return img

def paste_nut(canvas: Image.Image, nut_img: Image.Image, cx: float, cy: float):
    """Paste nut centred at (cx, cy) on canvas."""
    x = int(cx - nut_img.width / 2)
    y = int(cy - nut_img.height / 2)
    canvas.alpha_composite(nut_img, (x, y))

# ── Background with radial glow ───────────────────────────────────────────────
def make_bg() -> Image.Image:
    img  = Image.new("RGBA", (W, H), (*BG, 255))
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    # Radial glow: concentric ellipses fading out
    for r in range(350, 0, -10):
        alpha = int(55 * (1 - r / 350) ** 2)
        draw.ellipse(
            (W // 2 - r, H // 2 - r, W // 2 + r, H // 2 + r),
            fill=(*PINK, alpha),
        )
    img.alpha_composite(glow)
    return img

# ── Torque lines ──────────────────────────────────────────────────────────────
def draw_torque_lines(draw: ImageDraw.ImageDraw, cx: float, cy: float, angle_offset: float):
    """Draw 3 short arc-like torque indicator lines near nut, pink 40% opacity."""
    for i in range(3):
        ang = math.radians(angle_offset + i * 120)
        r1, r2 = 120, 145
        x1 = cx + r1 * math.cos(ang)
        y1 = cy + r1 * math.sin(ang)
        x2 = cx + r2 * math.cos(ang + math.radians(18))
        y2 = cy + r2 * math.sin(ang + math.radians(18))
        draw.line([(x1, y1), (x2, y2)], fill=(*PINK, 102), width=3)

# ── Star burst ────────────────────────────────────────────────────────────────
def draw_starburst(draw: ImageDraw.ImageDraw, cx: float, cy: float):
    """6-pointed starburst at nut's original position."""
    for i in range(6):
        ang = math.radians(i * 60)
        x2  = cx + 80 * math.cos(ang)
        y2  = cy + 80 * math.sin(ang)
        draw.line([(cx, cy), (x2, y2)], fill=(*PINK, 200), width=3)

# ── Ease helpers ──────────────────────────────────────────────────────────────
def ease_out(t: float) -> float:
    return 1 - (1 - t) ** 3

def ease_bounce(t: float) -> float:
    """Simple ease-out-bounce."""
    if t < 1 / 2.75:
        return 7.5625 * t * t
    elif t < 2 / 2.75:
        t -= 1.5 / 2.75
        return 7.5625 * t * t + 0.75
    elif t < 2.5 / 2.75:
        t -= 2.25 / 2.75
        return 7.5625 * t * t + 0.9375
    else:
        t -= 2.625 / 2.75
        return 7.5625 * t * t + 0.984375

# ── Logo load ─────────────────────────────────────────────────────────────────
logo_full = Image.open("/data/data/com.termux/files/home/git/wrench/assets/logo.png").convert("RGBA")
logo_w    = 500
logo_h    = int(logo_full.height * logo_w / logo_full.width)
logo_full = logo_full.resize((logo_w, logo_h), Image.LANCZOS)

def paste_logo(canvas: Image.Image, angle: float = 0.0, alpha_override: int = 255):
    """Paste logo centred at x=450, y=250 with optional rotation and alpha."""
    lg = logo_full.copy()
    if alpha_override < 255:
        r, g, b, a = lg.split()
        a = a.point(lambda x: int(x * alpha_override / 255))
        lg = Image.merge("RGBA", (r, g, b, a))
    if angle != 0.0:
        lg = lg.rotate(angle, resample=Image.BICUBIC, expand=False)
    x = 450 - lg.width // 2
    y = 250 - lg.height // 2
    canvas.alpha_composite(lg, (x, y))

# ── Text helpers ──────────────────────────────────────────────────────────────
def draw_letter(draw: ImageDraw.ImageDraw, ch: str, x: float, y: float,
                font: ImageFont.FreeTypeFont, color: tuple):
    bbox = draw.textbbox((0, 0), ch, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((x - tw / 2 - bbox[0], y - th / 2 - bbox[1]), ch,
              font=font, fill=color)

def text_total_width(text: str, font: ImageFont.FreeTypeFont,
                     draw_ref: ImageDraw.ImageDraw) -> float:
    widths = []
    for ch in text:
        b = draw_ref.textbbox((0, 0), ch, font=font)
        widths.append(b[2] - b[0])
    return sum(widths)

# ── Frame generator ──────────────────────────────────────────────────────────
frames       = []
frame_delays = []   # milliseconds

G_START = (270, 500)
R_START = (630, 500)

font_grand   = load_font(FONT_BOLD, 70)
font_opening = load_font(FONT_BOLD, 54)
font_sub     = load_font(FONT_REG, 26)

# Pre-compute letter positions for GRAND and OPENING using a temp draw
_tmp_img  = Image.new("RGBA", (1, 1))
_tmp_draw = ImageDraw.Draw(_tmp_img)

def letter_positions(word: str, font, centre_x: float, draw_ref=_tmp_draw):
    """Return list of (x, char) centred as a group around centre_x."""
    spacing = 6
    widths  = []
    for ch in word:
        b = draw_ref.textbbox((0, 0), ch, font=font)
        widths.append(b[2] - b[0])
    total = sum(widths) + spacing * (len(word) - 1)
    pos   = []
    x     = centre_x - total / 2
    for i, ch in enumerate(word):
        pos.append((x + widths[i] / 2, ch))
        x += widths[i] + spacing
    return pos

grand_pos   = letter_positions("GRAND",   font_grand,   450)
opening_pos = letter_positions("OPENING", font_opening, 450)

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 1: frames 0–14  (65 ms each)  — wrench working
# ─────────────────────────────────────────────────────────────────────────────
for f in range(15):
    img  = make_bg()
    draw = ImageDraw.Draw(img)

    t         = f / 14.0
    logo_ang  = 10 * math.sin(t * 1.5 * 2 * math.pi)   # ±10 deg, 1.5 cycles
    nut_angle = f * 8.0                                   # 8 deg/frame CW

    # Torque lines
    draw_torque_lines(draw, G_START[0], G_START[1], nut_angle)
    draw_torque_lines(draw, R_START[0], R_START[1], nut_angle)

    # Nuts
    g_nut = draw_hex_nut("G", nut_angle)
    r_nut = draw_hex_nut("R", nut_angle)
    paste_nut(img, g_nut, G_START[0], G_START[1])
    paste_nut(img, r_nut, R_START[0], R_START[1])

    # Logo
    paste_logo(img, angle=logo_ang)

    frames.append(img.convert("RGB"))
    frame_delays.append(65)

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 2: frames 15–34  (50 ms each)  — nuts spinning + rising
# ─────────────────────────────────────────────────────────────────────────────
phase2_len = 20   # frames 15..34
nut_angle_p2_start = 14 * 8.0   # where phase 1 left off

for i in range(phase2_len):
    f   = 15 + i
    img  = make_bg()
    draw = ImageDraw.Draw(img)

    t          = i / (phase2_len - 1)   # 0..1
    ease_t     = ease_out(t)
    nut_angle  = nut_angle_p2_start + i * 22.0

    # Position: ease from start towards target
    gx = G_START[0] + (180 - G_START[0]) * ease_t
    gy = G_START[1] + (100 - G_START[1]) * ease_t
    rx = R_START[0] + (720 - R_START[0]) * ease_t
    ry = R_START[1] + (100 - R_START[1]) * ease_t

    # Scale: 1.0 → 0.3
    scale = 1.0 - 0.7 * ease_t

    # Alpha: fades over last 10 frames (i=10..19)
    if i >= 10:
        alpha = int(255 * (1 - (i - 10) / 10))
    else:
        alpha = 255

    # Starburst on frame 15 only (i==0)
    if i == 0:
        draw_starburst(draw, G_START[0], G_START[1])
        draw_starburst(draw, R_START[0], R_START[1])

    g_nut = draw_hex_nut("G", nut_angle, scale=scale, alpha=alpha)
    r_nut = draw_hex_nut("R", nut_angle, scale=scale, alpha=alpha)
    paste_nut(img, g_nut, gx, gy)
    paste_nut(img, r_nut, rx, ry)

    paste_logo(img)

    frames.append(img.convert("RGB"))
    frame_delays.append(50)

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 3: frames 35–59  (70 ms each)  — text reveal
# ─────────────────────────────────────────────────────────────────────────────
phase3_len = 25   # frames 35..59
GRAND_FINAL_Y   = 540
OPENING_FINAL_Y = 630
SUB_FINAL_Y     = 720

for i in range(phase3_len):
    img  = make_bg()
    draw = ImageDraw.Draw(img)

    # GRAND: 5 letters, stagger 2 frames, fall from y=-60 to y=GRAND_FINAL_Y
    for li, (lx, ch) in enumerate(grand_pos):
        start_frame = li * 2          # 0,2,4,6,8
        local       = i - start_frame
        if local < 0:
            # Not yet started — draw above frame (hidden)
            pass
        else:
            t = min(local / 10.0, 1.0)
            bt = ease_bounce(t)
            ly = -60 + (GRAND_FINAL_Y - (-60)) * bt
            # Clip to frame
            if -100 < ly < H + 100:
                draw_letter(draw, ch, lx, ly, font_grand, (255, 255, 255, 255))

    # OPENING: 7 letters, stagger 2 frames (after GRAND settles ~frame 5), slide from bottom
    for li, (lx, ch) in enumerate(opening_pos):
        start_frame = 6 + li * 2
        local       = i - start_frame
        if local >= 0:
            t  = min(local / 10.0, 1.0)
            bt = ease_bounce(t)
            ly = H + 60 + (OPENING_FINAL_Y - (H + 60)) * bt
            if -100 < ly < H + 100:
                draw_letter(draw, ch, lx, ly, font_opening,
                            (*PINK, 255))

    # SUB: fade in from frame 18
    sub_start = 18
    if i >= sub_start:
        sub_alpha = min(int(255 * (i - sub_start) / 6), 255)
        sub_text  = "WRENCH CLUB · 2026"
        bbox      = draw.textbbox((0, 0), sub_text, font=font_sub)
        tw        = bbox[2] - bbox[0]
        tx        = 450 - tw // 2 - bbox[0]
        ty        = SUB_FINAL_Y - (bbox[3] - bbox[1]) // 2 - bbox[1]
        draw.text((tx, ty), sub_text, font=font_sub,
                  fill=(*GREY, sub_alpha))

    # Logo — slightly dimmed
    paste_logo(img, alpha_override=180)

    frames.append(img.convert("RGB"))
    frame_delays.append(70)

# ─────────────────────────────────────────────────────────────────────────────
# Save
# ─────────────────────────────────────────────────────────────────────────────
assert len(frames) == 60, f"Expected 60 frames, got {len(frames)}"

out_webp = "/data/data/com.termux/files/home/git/wrench/static/og-v12.webp"
out_png  = "/data/data/com.termux/files/home/git/wrench/static/og-v12.png"

# Save first frame as PNG
frames[0].save(out_png)

import os
png_size = os.path.getsize(out_png)
print(f"PNG first frame: {png_size:,} bytes ({png_size/1024:.1f} KB)")

# Save animated WebP
frames[0].save(
    out_webp,
    format="WEBP",
    save_all=True,
    append_images=frames[1:],
    duration=frame_delays,
    loop=0,
    quality=82,
    method=4,
)

webp_size = os.path.getsize(out_webp)
print(f"WebP animated ({len(frames)} frames): {webp_size:,} bytes ({webp_size/1024:.1f} KB)")
print("Done.")
