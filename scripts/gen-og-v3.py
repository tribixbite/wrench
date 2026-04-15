"""
Generate og-v3.webp — Wrench Club glitch-effect animated OG image.
900x900px, 40 frames, animated WebP + static PNG fallback.
"""

import random
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

# ── Paths ──────────────────────────────────────────────────────────────────────
REPO = Path("/data/data/com.termux/files/home/git/wrench")
LOGO_SRC = REPO / "assets/logo.png"
OUT_WEBP  = REPO / "static/og-v3.webp"
OUT_PNG   = REPO / "static/og-v3.png"

# ── Constants ──────────────────────────────────────────────────────────────────
W, H = 900, 900
PINK   = (237, 12, 133)        # #ED0C85
CYAN   = (0, 255, 255)         # glitch cyan
MAGENTA = (255, 0, 200)        # glitch magenta
BG     = (10, 10, 14)          # near-black background
GREY   = (160, 160, 170)       # tagline grey
LOGO_W = 580                   # rendered logo width

random.seed(42)                # reproducible glitch positions


# ── Radial glow helper ─────────────────────────────────────────────────────────
def make_glow_layer(w: int, h: int, cx: int, cy: int,
                    radius: int, color: tuple, max_alpha: int) -> Image.Image:
    """Return an RGBA layer with a soft radial glow."""
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    pixels = glow.load()
    r, g, b = color
    for y in range(max(0, cy - radius), min(h, cy + radius)):
        for x in range(max(0, cx - radius), min(w, cx + radius)):
            dist = math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
            if dist < radius:
                alpha = int(max_alpha * (1.0 - dist / radius) ** 2)
                pixels[x, y] = (r, g, b, alpha)
    return glow


# ── Build base composite (no glitch) ──────────────────────────────────────────
def build_base() -> tuple[Image.Image, dict]:
    """
    Compose the static base frame.
    Returns (Image, layout_info) where layout_info holds logo bounds for glitch.
    """
    base = Image.new("RGBA", (W, H), (*BG, 255))

    # --- pink radial glow behind logo area ------------------------------------
    glow = make_glow_layer(W, H, W // 2, H // 2 - 30, 340, PINK, 55)
    base = Image.alpha_composite(base, glow)

    # --- logo -----------------------------------------------------------------
    logo_raw = Image.open(LOGO_SRC).convert("RGBA")
    logo_h = int(logo_raw.height * LOGO_W / logo_raw.width)
    logo = logo_raw.resize((LOGO_W, logo_h), Image.LANCZOS)

    logo_x = (W - LOGO_W) // 2
    logo_y = (H - logo_h) // 2 - 60   # slightly above centre

    base.paste(logo, (logo_x, logo_y), logo)

    layout = {
        "logo_x": logo_x,
        "logo_y": logo_y,
        "logo_w": LOGO_W,
        "logo_h": logo_h,
    }

    # --- pink rule below logo -------------------------------------------------
    rule_y = logo_y + logo_h + 28
    draw = ImageDraw.Draw(base)
    rule_x0 = (W - 420) // 2
    rule_x1 = rule_x0 + 420
    draw.rectangle([rule_x0, rule_y, rule_x1, rule_y + 3], fill=(*PINK, 255))

    # --- tagline --------------------------------------------------------------
    tag_y = rule_y + 22
    tagline = "Member-Only DIY Auto Shop · Grand Rapids, MI"
    # Use default font at size ~18 via truetype if available, else bitmap
    try:
        from PIL import ImageFont
        font_tag = ImageFont.truetype(
            "/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans.ttf", 18)
        font_badge = ImageFont.truetype(
            "/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans-Bold.ttf", 16)
    except Exception:
        font_tag = None
        font_badge = None

    draw.text((W // 2, tag_y), tagline, fill=(*GREY, 255),
              font=font_tag, anchor="mt" if font_tag else None)

    # --- pink badge at bottom -------------------------------------------------
    badge_text = "wrenchclub.com"
    badge_w, badge_h_box = 200, 36
    badge_x = (W - badge_w) // 2
    badge_y = H - 80
    # pill shape via two rounded rectangles approach (two rects + two circles)
    r_badge = 18
    draw.rounded_rectangle(
        [badge_x, badge_y, badge_x + badge_w, badge_y + badge_h_box],
        radius=r_badge, fill=(*PINK, 255)
    )
    draw.text((W // 2, badge_y + badge_h_box // 2), badge_text,
              fill=(255, 255, 255, 255), font=font_badge,
              anchor="mm" if font_badge else None)

    return base, layout


# ── Glitch frame generator ─────────────────────────────────────────────────────
def make_glitch_frame(
    base: Image.Image,
    layout: dict,
    n_strips: int,
    max_shift: int,
    fringe_color: tuple | None,
    fringe_both: bool = False,
) -> Image.Image:
    """
    Clone base and apply horizontal-strip glitch in the logo region.

    :param n_strips:     number of horizontal slices to displace
    :param max_shift:    maximum pixel shift (positive or negative)
    :param fringe_color: (R,G,B) for the colour-fringe line, or None
    :param fringe_both:  if True, add both cyan and magenta fringes
    """
    frame = base.copy()
    lx = layout["logo_x"]
    ly = layout["logo_y"]
    lw = layout["logo_w"]
    lh = layout["logo_h"]

    # Pick random non-overlapping strips within logo height
    strip_heights = random.choices(range(4, 18), k=n_strips)
    positions = sorted(random.sample(range(0, lh - max(strip_heights)), n_strips))

    for i, strip_top in enumerate(positions):
        sh = strip_heights[i]
        shift = random.choice([-1, 1]) * random.randint(10, max_shift)

        # Crop the strip from the base
        crop_region = (0, ly + strip_top, W, ly + strip_top + sh)
        strip_img = base.crop(crop_region)

        # Paste shifted (fill exposed edge with BG)
        dest_x = shift
        dest_y = ly + strip_top
        frame.paste(strip_img, (dest_x, dest_y))

        # Fill exposed gap at edge
        draw = ImageDraw.Draw(frame)
        if shift > 0:
            draw.rectangle([0, dest_y, shift - 1, dest_y + sh - 1], fill=(*BG, 255))
        else:
            draw.rectangle([W + shift, dest_y, W - 1, dest_y + sh - 1], fill=(*BG, 255))

        # Colour fringe — thin 1-2px line on leading edge of shift
        if fringe_color or fringe_both:
            colors_to_apply = []
            if fringe_both:
                colors_to_apply = [CYAN, MAGENTA]
            elif fringe_color:
                colors_to_apply = [fringe_color]

            for ci, fc in enumerate(colors_to_apply):
                fringe_alpha = random.randint(100, 180)
                fringe_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
                fd = ImageDraw.Draw(fringe_layer)
                edge_x = shift if shift > 0 else W + shift
                offset = ci  # slight offset for double fringe
                fd.rectangle(
                    [edge_x + offset, dest_y, edge_x + offset + 1, dest_y + sh - 1],
                    fill=(*fc, fringe_alpha)
                )
                frame = Image.alpha_composite(frame, fringe_layer)

    return frame


# ── Frame schedule ─────────────────────────────────────────────────────────────
# Returns list of (glitch_params_or_None, duration_ms)
FRAME_SCHEDULE = []

def sched_static(count: int):
    for _ in range(count):
        FRAME_SCHEDULE.append(("static", 80))

def sched_glitch(count: int, n_strips: int, max_shift: int,
                 fringe_color, fringe_both: bool = False):
    for _ in range(count):
        FRAME_SCHEDULE.append((
            ("glitch", n_strips, max_shift, fringe_color, fringe_both), 40
        ))

# Frames 0–7: static
sched_static(8)
# Frames 8–9: glitch (cyan, moderate)
sched_glitch(2, n_strips=4, max_shift=20, fringe_color=CYAN)
# Frames 10–19: static
sched_static(10)
# Frames 20–21: glitch (magenta, lighter)
sched_glitch(2, n_strips=3, max_shift=15, fringe_color=MAGENTA)
# Frames 22–31: static
sched_static(10)
# Frames 32–33: heavy glitch (both fringes)
sched_glitch(2, n_strips=7, max_shift=30, fringe_color=CYAN, fringe_both=True)
# Frames 34–39: static
sched_static(6)

assert len(FRAME_SCHEDULE) == 40, f"Expected 40 frames, got {len(FRAME_SCHEDULE)}"


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    print("Building base frame…")
    base, layout = build_base()

    frames: list[Image.Image] = []
    durations: list[int] = []

    for i, (spec, dur) in enumerate(FRAME_SCHEDULE):
        if spec == "static":
            frames.append(base.copy())
        else:
            _, n_strips, max_shift, fringe_color, fringe_both = spec
            frames.append(
                make_glitch_frame(base, layout, n_strips, max_shift,
                                  fringe_color, fringe_both)
            )
        durations.append(dur)
        print(f"  frame {i:02d}: {spec if spec == 'static' else 'GLITCH'} @ {dur}ms")

    # Convert all frames to RGB for WebP (no alpha in animated WebP via PIL)
    rgb_frames = []
    bg_fill = Image.new("RGB", (W, H), BG)
    for f in frames:
        merged = bg_fill.copy()
        merged.paste(f.convert("RGB"), (0, 0))  # simple flatten
        # proper alpha composite onto solid bg
        bg_rgba = Image.new("RGBA", (W, H), (*BG, 255))
        composited = Image.alpha_composite(bg_rgba, f)
        rgb_frames.append(composited.convert("RGB"))

    print(f"\nSaving animated WebP → {OUT_WEBP}")
    rgb_frames[0].save(
        OUT_WEBP,
        format="WEBP",
        save_all=True,
        append_images=rgb_frames[1:],
        duration=durations,
        loop=0,
        quality=82,
        method=4,
    )

    # Static PNG — use the base frame
    print(f"Saving static PNG → {OUT_PNG}")
    bg_rgba = Image.new("RGBA", (W, H), (*BG, 255))
    static_rgb = Image.alpha_composite(bg_rgba, base).convert("RGB")
    static_rgb.save(OUT_PNG, format="PNG", optimize=True)

    webp_size = OUT_WEBP.stat().st_size
    png_size  = OUT_PNG.stat().st_size
    print(f"\nFile sizes:")
    print(f"  og-v3.webp : {webp_size:,} bytes ({webp_size / 1024:.1f} KB)")
    print(f"  og-v3.png  : {png_size:,} bytes  ({png_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
