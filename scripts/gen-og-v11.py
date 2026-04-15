#!/usr/bin/env python3
"""
Generate og-v11.webp — Wrench Club animated OG image (900x900).
Concept: Wrench arm oscillates loosening two hex bolts labeled G and R.
Bolts spin free and fly up, then fall back as "COMING SOON" assembles.
"""

import math
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ── Paths ──────────────────────────────────────────────────────────────────────
ASSETS = "/data/data/com.termux/files/home/git/wrench/assets"
STATIC = "/data/data/com.termux/files/home/git/wrench/static"
FONT_BOLD = "/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans-Bold.ttf"
FONT_REG  = "/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans.ttf"

LOGO_PATH = os.path.join(ASSETS, "logo.png")
OUT_WEBP  = os.path.join(STATIC, "og-v11.webp")
OUT_PNG   = os.path.join(STATIC, "og-v11.png")

# ── Constants ──────────────────────────────────────────────────────────────────
W, H      = 900, 900
BG        = (10, 10, 10, 255)
PINK      = (237, 12, 133)
PINK_A    = (237, 12, 133, 255)
WHITE     = (255, 255, 255, 255)
GREY      = (136, 136, 136, 255)
BOLT_FILL = (26, 26, 26, 255)

TOTAL_FRAMES = 60
P1_END = 20   # frames 0-19
P2_END = 35   # frames 20-34
# frames 35-59 = phase 3

DURATIONS = (
    [60] * P1_END +
    [55] * (P2_END - P1_END) +
    [70] * (TOTAL_FRAMES - P2_END)
)


# ── Font helpers ───────────────────────────────────────────────────────────────
def get_font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
    path = FONT_BOLD if bold else FONT_REG
    return ImageFont.truetype(path, size)


# ── Radial glow background ─────────────────────────────────────────────────────
def make_bg() -> Image.Image:
    """Dark canvas with a subtle pink radial glow at centre."""
    img = Image.new("RGBA", (W, H), BG)
    # Build glow as a separate layer
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    cx, cy = W // 2, H // 2
    # Multiple concentric ellipses fading outward
    for r in range(300, 0, -10):
        alpha = int(40 * (1 - r / 300) ** 2)
        color = (*PINK, alpha)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)
    glow = glow.filter(ImageFilter.GaussianBlur(radius=30))
    img = Image.alpha_composite(img, glow)
    return img


BG_LAYER = make_bg()


# ── Hex bolt renderer ──────────────────────────────────────────────────────────
def draw_hex_bolt(size: int, label: str, angle: float) -> Image.Image:
    """
    Returns RGBA image of a hex bolt (pointy-top hexagon), rotated by `angle` degrees.
    size = diameter (flat-to-flat approx).
    """
    pad = 20  # extra padding for rotation
    canvas_size = size + pad * 2
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx = cy = canvas_size // 2
    r = size // 2  # circumradius

    # Pointy-top hexagon: vertices at angles 90, 30, -30, -90, -150, 150 (offset by 90)
    verts = []
    for i in range(6):
        a = math.radians(90 + i * 60)  # pointy-top: first vertex at top
        verts.append((cx + r * math.cos(a), cy - r * math.sin(a)))

    # Filled hex
    draw.polygon(verts, fill=BOLT_FILL)
    # Pink outline
    draw.polygon(verts, outline=(*PINK, 255), width=3)

    # Inner ring (socket look)
    inner_r = int(r * 0.45)
    draw.ellipse([cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r],
                 outline=(*PINK, 180), width=2)

    # Label text
    font_size = int(size * 0.55)
    font = get_font(font_size, bold=True)
    bbox = draw.textbbox((0, 0), label, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((cx - tw // 2, cy - th // 2 - bbox[1]), label, font=font, fill=WHITE)

    # Rotate
    return img.rotate(-angle, resample=Image.BICUBIC, expand=False)


# ── Load and scale logo ────────────────────────────────────────────────────────
def load_logo(scale: float = 1.0) -> Image.Image:
    """Load logo.png at given scale, preserving RGBA."""
    logo = Image.open(LOGO_PATH).convert("RGBA")
    # Target width ~560px at scale 1.0
    target_w = int(560 * scale)
    ratio = target_w / logo.width
    target_h = int(logo.height * ratio)
    return logo.resize((target_w, target_h), Image.LANCZOS)


LOGO_BASE = load_logo(1.0)


def get_rotated_logo(degrees: float) -> Image.Image:
    """Return logo rotated by degrees, on transparent canvas same size as original."""
    return LOGO_BASE.rotate(degrees, resample=Image.BICUBIC, expand=False)


# ── Pink rule ─────────────────────────────────────────────────────────────────
def draw_pink_rule(draw: ImageDraw.Draw, y: int, alpha: int = 255):
    color = (*PINK, alpha)
    draw.line([(80, y), (820, y)], fill=color, width=2)


# ── Burst particles ───────────────────────────────────────────────────────────
def draw_burst(draw: ImageDraw.Draw, cx: int, cy: int, radius: int, alpha: int):
    """Draw 8 radiating lines as a burst/star."""
    color = (*PINK, alpha)
    for i in range(8):
        a = math.radians(i * 45)
        x1 = int(cx + 3 * math.cos(a))
        y1 = int(cy + 3 * math.sin(a))
        x2 = int(cx + radius * math.cos(a))
        y2 = int(cy + radius * math.sin(a))
        draw.line([(x1, y1), (x2, y2)], fill=color, width=2)


# ── Impact arcs ───────────────────────────────────────────────────────────────
def draw_impact_arcs(draw: ImageDraw.Draw, cx: int, cy: int, frame: int, alpha: int):
    """Draw short curved arc lines suggesting impact/force near bolt top."""
    color = (*PINK, alpha)
    arc_r = 75
    # Draw 3 short arcs fanning out at top of bolt
    for offset in [-25, 0, 25]:
        start_angle = 250 + offset
        end_angle = 270 + offset
        bbox = [cx - arc_r, cy - arc_r, cx + arc_r, cy + arc_r]
        draw.arc(bbox, start=start_angle, end=end_angle, fill=color, width=3)


# ── Letter drop bounce ────────────────────────────────────────────────────────
def letter_y(frame: int, start_frame: int, final_y: int) -> tuple[int, int]:
    """
    Returns (y_position, alpha) for a letter dropping from top.
    Bounce: drops from y=-20, overshoots by 10px, settles at final_y.
    Animation takes 8 frames.
    """
    t = frame - start_frame
    if t < 0:
        return -40, 0
    if t >= 8:
        return final_y, 255

    # Normalise t to [0,1]
    progress = t / 8.0
    alpha = int(min(255, progress * 2 * 255))

    # Ease-out with overshoot (simple parametric)
    if progress < 0.7:
        # Drop phase
        y = int(-40 + (final_y + 10 - (-40)) * (progress / 0.7))
    else:
        # Settle phase (overshoot back up)
        p2 = (progress - 0.7) / 0.3
        y = int((final_y + 10) - 10 * p2)

    return y, alpha


# ── Frame builder ─────────────────────────────────────────────────────────────
def build_frame(frame: int) -> Image.Image:
    # Start with background
    canvas = BG_LAYER.copy()
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # ── Phase 1: Setup + tightening ─────────────────────────────────────────
    if frame < P1_END:
        f = frame  # 0-19

        # Logo: oscillate ±8 degrees (one full cycle = 10 frames)
        logo_angle = 8.0 * math.sin(2 * math.pi * f / 10.0)
        logo = get_rotated_logo(logo_angle)
        lw, lh = logo.size
        logo_x = (W - lw) // 2
        logo_y = 300 - lh // 2
        overlay.paste(logo, (logo_x, logo_y), logo)

        # Pink rule under logo
        draw_pink_rule(draw, logo_y + lh + 10)

        # Bolt angle: slowly tighten CW
        bolt_angle = f * 12.0

        # Bolt G at x=260, y=480
        gx, gy = 260, 480
        bolt_g = draw_hex_bolt(130, "G", bolt_angle)
        bw = bolt_g.width
        overlay.paste(bolt_g, (gx - bw // 2, gy - bw // 2), bolt_g)

        # Bolt R at x=640, y=480
        rx, ry = 640, 480
        bolt_r = draw_hex_bolt(130, "R", bolt_angle)
        overlay.paste(bolt_r, (rx - bw // 2, ry - bw // 2), bolt_r)

        # Impact arcs — fade with pulse on first half
        arc_alpha = int(180 * (0.5 + 0.5 * math.sin(2 * math.pi * f / 5.0)))
        draw_impact_arcs(draw, gx, gy - 60, f, arc_alpha)
        draw_impact_arcs(draw, rx, ry - 60, f, arc_alpha)

    # ── Phase 2: Bolts spinning free ────────────────────────────────────────
    elif frame < P2_END:
        f = frame - P1_END  # 0-14

        # Logo holds at 0 degrees
        logo = get_rotated_logo(0)
        lw, lh = logo.size
        logo_x = (W - lw) // 2
        logo_y = 300 - lh // 2
        overlay.paste(logo, (logo_x, logo_y), logo)
        draw_pink_rule(draw, logo_y + lh + 10)

        # Bolt angle: fast spin
        base_angle = P1_END * 12.0
        bolt_angle = base_angle + f * 28.0

        # Translate upward + drift apart; fade out
        progress = f / 14.0
        bolt_alpha = int(255 * (1.0 - progress))

        gy_pos = int(480 - (480 - 200) * progress)
        ry_pos = gy_pos
        gx_pos = int(260 - 60 * progress)  # G drifts left
        rx_pos = int(640 + 60 * progress)  # R drifts right

        # Draw bolts with fading alpha
        bolt_g = draw_hex_bolt(130, "G", bolt_angle)
        bolt_r = draw_hex_bolt(130, "R", bolt_angle)
        bw = bolt_g.width

        # Apply alpha to bolt images
        def apply_alpha(img: Image.Image, alpha: int) -> Image.Image:
            r2, g2, b2, a2 = img.split()
            a2 = a2.point(lambda x: int(x * alpha / 255))
            return Image.merge("RGBA", (r2, g2, b2, a2))

        bolt_g = apply_alpha(bolt_g, bolt_alpha)
        bolt_r = apply_alpha(bolt_r, bolt_alpha)

        overlay.paste(bolt_g, (gx_pos - bw // 2, gy_pos - bw // 2), bolt_g)
        overlay.paste(bolt_r, (rx_pos - bw // 2, ry_pos - bw // 2), bolt_r)

        # Burst particles at bolt positions
        burst_alpha = bolt_alpha
        burst_r = 12 + int(8 * progress)
        draw_burst(draw, gx_pos, gy_pos, burst_r, burst_alpha)
        draw_burst(draw, rx_pos, ry_pos, burst_r, burst_alpha)

    # ── Phase 3: Text assembly ───────────────────────────────────────────────
    else:
        f = frame - P2_END  # 0-24

        # Logo at slight fade
        logo = get_rotated_logo(0)
        logo_alpha = 200
        r2, g2, b2, a2 = logo.split()
        a2 = a2.point(lambda x: int(x * logo_alpha / 255))
        logo_faded = Image.merge("RGBA", (r2, g2, b2, a2))
        lw, lh = logo_faded.size
        logo_x = (W - lw) // 2
        logo_y = 300 - lh // 2
        overlay.paste(logo_faded, (logo_x, logo_y), logo_faded)
        draw_pink_rule(draw, logo_y + lh + 10)

        # "COMING" — 6 letters, each staggered by 2 frames, drop to y=660
        coming_text = "COMING"
        font_big = get_font(62, bold=True)
        # Pre-measure total width for centering
        total_w = sum(
            draw.textbbox((0, 0), ch, font=font_big)[2] - draw.textbbox((0, 0), ch, font=font_big)[0] + 4
            for ch in coming_text
        )
        cx_start = (W - total_w) // 2
        x_cursor = cx_start
        for i, ch in enumerate(coming_text):
            start_f = i * 2
            ly, la = letter_y(f, start_f, 660)
            bbox = draw.textbbox((0, 0), ch, font=font_big)
            cw = bbox[2] - bbox[0]
            if la > 0 and ly > -40:
                draw.text((x_cursor, ly), ch, font=font_big, fill=(*WHITE[:3], la))
            x_cursor += cw + 4

        # "SOON" — 4 letters, starts 12 frames after "COMING", pink, y=740
        soon_text = "SOON"
        soon_offset = 12
        total_sw = sum(
            draw.textbbox((0, 0), ch, font=font_big)[2] - draw.textbbox((0, 0), ch, font=font_big)[0] + 4
            for ch in soon_text
        )
        sx_start = (W - total_sw) // 2
        x_cursor = sx_start
        for i, ch in enumerate(soon_text):
            start_f = soon_offset + i * 2
            ly, la = letter_y(f, start_f, 740)
            bbox = draw.textbbox((0, 0), ch, font=font_big)
            cw = bbox[2] - bbox[0]
            if la > 0 and ly > -40:
                draw.text((x_cursor, ly), ch, font=font_big, fill=(*PINK, la))
            x_cursor += cw + 4

        # "· 2026 ·" — fades in last 5 frames (f >= 20)
        dot_text = "· 2026 ·"
        font_sm = get_font(28, bold=False)
        dot_alpha = max(0, int(255 * (f - 20) / 4)) if f >= 20 else 0
        if dot_alpha > 0:
            dbbox = draw.textbbox((0, 0), dot_text, font=font_sm)
            dw = dbbox[2] - dbbox[0]
            draw.text(((W - dw) // 2, 800), dot_text, font=font_sm, fill=(*GREY[:3], dot_alpha))

        # "GRAND RAPIDS, MI" badge at bottom
        badge_text = "GRAND RAPIDS, MI"
        font_badge = get_font(22, bold=False)
        bbbox = draw.textbbox((0, 0), badge_text, font=font_badge)
        bw2 = bbbox[2] - bbbox[0]
        badge_alpha = max(0, int(255 * (f - 18) / 6)) if f >= 18 else 0
        if badge_alpha > 0:
            bx = (W - bw2) // 2
            # Pill background
            pill = Image.new("RGBA", (bw2 + 24, 36), (0, 0, 0, 0))
            pd = ImageDraw.Draw(pill)
            pd.rounded_rectangle([0, 0, bw2 + 23, 35], radius=8,
                                  fill=(*PINK, int(badge_alpha * 0.25)),
                                  outline=(*PINK, badge_alpha), width=1)
            overlay.paste(pill, (bx - 12, 852), pill)
            draw.text((bx, 857), badge_text, font=font_badge, fill=(*PINK, badge_alpha))

    # Composite and return
    canvas = Image.alpha_composite(canvas, overlay)
    return canvas.convert("RGB")


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    frames = []
    print(f"Generating {TOTAL_FRAMES} frames...")
    for i in range(TOTAL_FRAMES):
        f = build_frame(i)
        frames.append(f)
        if i % 10 == 0:
            print(f"  frame {i}/{TOTAL_FRAMES}")

    print("Saving WebP...")
    frames[0].save(
        OUT_WEBP,
        format="WEBP",
        save_all=True,
        append_images=frames[1:],
        duration=DURATIONS,
        loop=0,
        quality=82,
        method=4,
    )

    size_kb = os.path.getsize(OUT_WEBP) / 1024
    print(f"Saved: {OUT_WEBP}  ({size_kb:.1f} KB)")

    # Save PNG of frame 0
    frames[0].save(OUT_PNG, format="PNG")
    png_size_kb = os.path.getsize(OUT_PNG) / 1024
    print(f"Saved: {OUT_PNG}  ({png_size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
