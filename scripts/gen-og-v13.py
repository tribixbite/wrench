"""
Generate og-v13.webp — Impact wrench animation for Wrench Club OG image.
900x900, 64 frames, loop=0.

Phases:
  Phase 1 (0-7,   40ms): Impact vibration — logo shakes, sparks + stars
  Phase 2 (8-15,  40ms): Settling — less vibration, fewer sparks
  Phase 3 (16-55, 65ms): Letter bolt-in — "OPENING" then "2026"
  Phase 4 (56-63, 90ms): Hold, clean
"""

import math
import os
import random
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
LOGO_PATH  = "/data/data/com.termux/files/home/git/wrench/assets/logo.png"
OUT_WEBP   = "/data/data/com.termux/files/home/git/wrench/static/og-v13.webp"
OUT_PNG    = "/data/data/com.termux/files/home/git/wrench/static/og-v13.png"

# Bold font — DejaVu Sans Bold (available on Termux)
FONT_BOLD  = "/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans-Bold.ttf"
# Fallback to system DroidSans-Bold
if not os.path.exists(FONT_BOLD):
    FONT_BOLD = "/system/fonts/DroidSans-Bold.ttf"

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
W, H        = 900, 900
BG_COLOR    = (10, 10, 10, 255)
PINK        = (237, 12, 133)
ORANGE      = (255, 107, 0)
WHITE       = (255, 255, 255)

LOGO_W_TARGET = 520   # rendered logo width

# Glow parameters
GLOW_RADIUS = 80
GLOW_COLOR  = (237, 12, 133, 40)  # translucent pink

# ---------------------------------------------------------------------------
# Helper: build a background with subtle radial-ish pink glow
# ---------------------------------------------------------------------------
def make_background() -> Image.Image:
    bg = Image.new("RGBA", (W, H), BG_COLOR)
    glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow_layer)
    # Several overlapping translucent ellipses to fake a soft radial glow
    for r, a in [(220, 35), (160, 25), (100, 18)]:
        cx, cy = W // 2, H // 2
        gd.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            fill=(237, 12, 133, a),
        )
    glow_blur = glow_layer.filter(ImageFilter.GaussianBlur(radius=GLOW_RADIUS))
    bg = Image.alpha_composite(bg, glow_blur)
    return bg


# Pre-render background once
BG_BASE = make_background()


# ---------------------------------------------------------------------------
# Helper: prepare logo at target width
# ---------------------------------------------------------------------------
def load_logo(width: int = LOGO_W_TARGET) -> Image.Image:
    raw = Image.open(LOGO_PATH).convert("RGBA")
    aspect = raw.height / raw.width
    new_h  = int(width * aspect)
    return raw.resize((width, new_h), Image.LANCZOS)


LOGO = load_logo()
LOGO_NATURAL_Y = (H - LOGO.height) // 2   # centred y when no shift


# ---------------------------------------------------------------------------
# Helper: draw_impact_star
# ---------------------------------------------------------------------------
def draw_impact_star(
    draw: ImageDraw.ImageDraw,
    cx: float, cy: float,
    n_points: int,
    r_outer: float, r_inner: float,
    color: tuple,
    alpha: int,
) -> None:
    """Draw an n-pointed star polygon."""
    pts = []
    for i in range(n_points * 2):
        angle = math.pi * i / n_points - math.pi / 2
        r = r_outer if i % 2 == 0 else r_inner
        pts.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    r, g, b = color[:3]
    draw.polygon(pts, fill=(r, g, b, alpha))


# ---------------------------------------------------------------------------
# Helper: draw_spark  (tapered line on an RGBA layer)
# ---------------------------------------------------------------------------
def draw_spark(
    img: Image.Image,
    x: float, y: float,
    angle: float,       # radians
    length: float,
    color: tuple,       # RGB or RGBA
) -> None:
    """Draw a tapered spark trail directly onto an RGBA image."""
    r, g, b = color[:3]
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    steps = max(int(length), 4)
    for i in range(steps):
        t = i / steps
        px = x + math.cos(angle) * length * t
        py = y + math.sin(angle) * length * t
        # Taper: bright at base, fades to tip
        alpha = int(230 * (1 - t))
        width = max(1, int(2.5 * (1 - t)))
        if i > 0:
            prev_x = x + math.cos(angle) * length * ((i - 1) / steps)
            prev_y = y + math.sin(angle) * length * ((i - 1) / steps)
            d.line([(prev_x, prev_y), (px, py)], fill=(r, g, b, alpha), width=width)
    # Composite onto img
    img.paste(Image.alpha_composite(img, layer), (0, 0))


# ---------------------------------------------------------------------------
# Helper: composite logo onto frame with optional offset
# ---------------------------------------------------------------------------
def paste_logo(
    frame: Image.Image,
    offset: tuple = (0, 0),
    alpha_mult: float = 1.0,
) -> None:
    lx = (W - LOGO.width) // 2 + offset[0]
    ly = LOGO_NATURAL_Y + offset[1]
    logo = LOGO
    if alpha_mult < 1.0:
        # Multiply alpha channel
        r, g, b, a = logo.split()
        a = a.point(lambda v: int(v * alpha_mult))
        logo = Image.merge("RGBA", (r, g, b, a))
    frame.alpha_composite(logo, (lx, ly))


# ---------------------------------------------------------------------------
# Font loading
# ---------------------------------------------------------------------------
def load_font(size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(FONT_BOLD, size)
    except Exception:
        return ImageFont.load_default()


FONT_OPENING = load_font(72)
FONT_YEAR    = load_font(88)


# ---------------------------------------------------------------------------
# Text layout helpers
# ---------------------------------------------------------------------------
def measure_text(text: str, font: ImageFont.FreeTypeFont) -> tuple:
    """Return (width, height) of text using getbbox."""
    bbox = font.getbbox(text)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def letter_positions(
    text: str,
    font: ImageFont.FreeTypeFont,
    cx: float,
    y: float,
) -> list:
    """
    Compute (x, y, char) for each character centred at cx, baseline y.
    Returns list of dicts with keys: char, x, y, w, h.
    """
    total_w, _ = measure_text(text, font)
    start_x = cx - total_w / 2
    positions = []
    cursor = start_x
    for ch in text:
        bbox = font.getbbox(ch)
        cw = bbox[2] - bbox[0]
        positions.append({
            "char": ch,
            "x": cursor,
            "y": y,
            "w": cw,
            "h": bbox[3] - bbox[1],
        })
        cursor += cw
    return positions


# Pre-compute letter positions
LOGO_BOTTOM  = LOGO_NATURAL_Y + LOGO.height
TEXT_GAP     = 28
OPENING_Y    = LOGO_BOTTOM + TEXT_GAP
YEAR_Y       = OPENING_Y + 90   # below OPENING line

OPENING_POSITIONS = letter_positions("OPENING", FONT_OPENING, W / 2, OPENING_Y)
YEAR_POSITIONS    = letter_positions("2026",    FONT_YEAR,    W / 2, YEAR_Y)

# Each OPENING letter appears at frame 16 + letter_idx * 2.5
# Each YEAR letter appears after all OPENING letters
OPENING_START_FRAME  = 16
OPENING_LETTER_STEP  = 2.5
YEAR_START_FRAME     = OPENING_START_FRAME + len(OPENING_POSITIONS) * OPENING_LETTER_STEP + 2
YEAR_LETTER_STEP     = 3.0


def letter_land_frame(letter_idx: int, word: str) -> float:
    """Return the float frame index at which letter lands."""
    if word == "OPENING":
        return OPENING_START_FRAME + letter_idx * OPENING_LETTER_STEP
    else:  # "2026"
        return YEAR_START_FRAME + letter_idx * YEAR_LETTER_STEP


# ---------------------------------------------------------------------------
# Frame rendering
# ---------------------------------------------------------------------------

def render_phase1(frame_idx: int) -> Image.Image:
    """Frames 0-7: heavy impact vibration, sparks, stars."""
    rng = random.Random(frame_idx * 7)
    frame = BG_BASE.copy()

    # -- Sparks layer (drawn before logo so logo is on top)
    n_sparks = rng.randint(8, 12)
    logo_cx = W / 2
    logo_cy = LOGO_NATURAL_Y + LOGO.height / 2
    for _ in range(n_sparks):
        angle  = rng.uniform(0, 2 * math.pi)
        length = rng.uniform(15, 35)
        # Origin: random point near logo edge
        origin_r = rng.uniform(LOGO.height * 0.3, LOGO.height * 0.6)
        ox = logo_cx + math.cos(angle) * origin_r
        oy = logo_cy + math.sin(angle) * origin_r
        color = PINK if rng.random() < 0.6 else ORANGE
        draw_spark(frame, ox, oy, angle, length, color)

    # -- Paste logo with shake
    offset = (rng.randint(-6, 6), rng.randint(-4, 4))
    paste_logo(frame, offset=offset)

    # -- Impact stars (drawn after logo, on top)
    d = ImageDraw.Draw(frame)
    n_stars = rng.randint(2, 3)
    for _ in range(n_stars):
        angle  = rng.uniform(0, 2 * math.pi)
        dist   = rng.uniform(LOGO.height * 0.35, LOGO.height * 0.65)
        sx = logo_cx + math.cos(angle) * dist
        sy = logo_cy + math.sin(angle) * dist
        alpha = rng.randint(180, 240)
        draw_impact_star(d, sx, sy, 6, 18, 8, PINK, alpha)

    return frame


def render_phase2(frame_idx: int) -> Image.Image:
    """Frames 8-15: settling — smaller shake, fewer sparks, fading stars."""
    # Normalise to 0-7 within phase
    phase_t = (frame_idx - 8) / 7.0   # 0 = start, 1 = end
    rng = random.Random(frame_idx * 7)
    frame = BG_BASE.copy()

    logo_cx = W / 2
    logo_cy = LOGO_NATURAL_Y + LOGO.height / 2

    n_sparks = rng.randint(4, 6)
    for _ in range(n_sparks):
        angle  = rng.uniform(0, 2 * math.pi)
        length = rng.uniform(8, 20)
        origin_r = rng.uniform(LOGO.height * 0.25, LOGO.height * 0.5)
        ox = logo_cx + math.cos(angle) * origin_r
        oy = logo_cy + math.sin(angle) * origin_r
        color = PINK if rng.random() < 0.6 else ORANGE
        draw_spark(frame, ox, oy, angle, length, color)

    # Reduced shake
    max_shake = int(3 * (1 - phase_t))
    ox = rng.randint(-max_shake, max_shake) if max_shake > 0 else 0
    oy = rng.randint(-max_shake, max_shake) if max_shake > 0 else 0
    paste_logo(frame, offset=(ox, oy))

    d = ImageDraw.Draw(frame)
    if rng.random() < (1 - phase_t):
        angle = rng.uniform(0, 2 * math.pi)
        dist  = rng.uniform(LOGO.height * 0.3, LOGO.height * 0.55)
        sx = logo_cx + math.cos(angle) * dist
        sy = logo_cy + math.sin(angle) * dist
        star_alpha = int(160 * (1 - phase_t))
        draw_impact_star(d, sx, sy, 6, 14, 6, PINK, star_alpha)

    return frame


def render_phase3(frame_idx: int) -> Image.Image:
    """
    Frames 16-55: letter bolt-in.
    Logo is centred and still. Letters snap in one by one with flash + star.
    """
    frame = BG_BASE.copy()
    paste_logo(frame, offset=(0, 0))
    d = ImageDraw.Draw(frame)

    def draw_letters(positions: list, font: ImageFont.FreeTypeFont, base_color: tuple, word: str) -> None:
        for idx, pos in enumerate(positions):
            land_f = letter_land_frame(idx, word)
            if frame_idx < land_f - 0.5:
                # Not yet arrived — show incoming letter slightly offset + dimmer
                t_until = land_f - frame_idx
                if t_until < 2.5:
                    # Brief preview sliding in from right
                    x_off = int(40 * (t_until / 2.5))
                    alpha_pre = int(80 * (1 - t_until / 2.5))
                    r, g, b = base_color[:3]
                    preview_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
                    pd = ImageDraw.Draw(preview_layer)
                    pd.text(
                        (pos["x"] + x_off, pos["y"]),
                        pos["char"],
                        font=font,
                        fill=(r, g, b, alpha_pre),
                    )
                    frame.alpha_composite(preview_layer)
                continue

            # Letter has landed
            is_landing_frame = (frame_idx == int(land_f)) or (
                land_f % 1 != 0 and frame_idx == int(land_f + 0.5)
            )
            char_x = pos["x"]
            char_y = pos["y"]
            char_w = pos["w"]
            char_h = pos["h"]

            if is_landing_frame:
                # Impact flash: white rectangle behind letter
                flash_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
                fd = ImageDraw.Draw(flash_layer)
                pad = 6
                fd.rectangle(
                    [char_x - pad, char_y - pad,
                     char_x + char_w + pad, char_y + char_h + pad],
                    fill=(255, 255, 255, 204),  # 80% opacity
                )
                frame.alpha_composite(flash_layer)
                # Impact star at landing position
                draw_impact_star(
                    d,
                    char_x + char_w / 2,
                    char_y + char_h / 2,
                    6, 16, 7, PINK, 220,
                )

            # Draw settled letter
            d.text((char_x, char_y), pos["char"], font=font, fill=base_color)

    draw_letters(OPENING_POSITIONS, FONT_OPENING, WHITE,              "OPENING")
    draw_letters(YEAR_POSITIONS,    FONT_YEAR,    PINK + (255,),  "2026")

    return frame


def render_phase4(frame_idx: int) -> Image.Image:
    """Frames 56-63: hold, all text visible, clean."""
    frame = BG_BASE.copy()
    paste_logo(frame, offset=(0, 0))
    d = ImageDraw.Draw(frame)

    for pos in OPENING_POSITIONS:
        d.text((pos["x"], pos["y"]), pos["char"], font=FONT_OPENING, fill=WHITE)

    for pos in YEAR_POSITIONS:
        d.text((pos["x"], pos["y"]), pos["char"], font=FONT_YEAR, fill=PINK + (255,))

    return frame


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    print("Rendering 64 frames...")
    frames  : list[Image.Image] = []
    durations: list[int]        = []

    for i in range(64):
        if i < 8:
            frame = render_phase1(i)
            dur   = 40
        elif i < 16:
            frame = render_phase2(i)
            dur   = 40
        elif i < 56:
            frame = render_phase3(i)
            dur   = 65
        else:
            frame = render_phase4(i)
            dur   = 90

        # Convert to RGB for WebP (keeps file smaller, background is opaque anyway)
        frames.append(frame.convert("RGB"))
        durations.append(dur)

        if i % 8 == 0:
            print(f"  frame {i:02d} done")

    print("Saving WebP...")
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

    # Save first frame as static PNG
    print("Saving PNG preview...")
    frames[-1].save(OUT_PNG, format="PNG")

    webp_size = os.path.getsize(OUT_WEBP)
    png_size  = os.path.getsize(OUT_PNG)
    print(f"WebP: {webp_size:,} bytes ({webp_size / 1024:.1f} KB)")
    print(f"PNG:  {png_size:,} bytes  ({png_size / 1024:.1f} KB)")
    print("Done.")


if __name__ == "__main__":
    main()
