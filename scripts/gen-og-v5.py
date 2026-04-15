"""
Generate og-v5.webp — Speed Lines animated WebP for Wrench Club OG image.

Design: 900x900 dark bg, centered logo, pink speed lines shooting left→right
in 3 burst groups (8-12 lines each, 4 frames per burst) with 8-frame holds between.
Total: ~44 frames. Burst frames: 45ms. Hold frames: 85ms.
"""

import random
import math
import os
from PIL import Image, ImageDraw, ImageFont

# ── Constants ─────────────────────────────────────────────────────────────────
CANVAS_W, CANVAS_H = 900, 900
PINK = (237, 12, 133)
DARK_BG = (10, 10, 14)
GREY = (140, 140, 150)
SEED = 42
LOGO_PATH = "/data/data/com.termux/files/home/git/wrench/assets/logo.png"
OUT_WEBP = "/data/data/com.termux/files/home/git/wrench/static/og-v5.webp"
OUT_PNG  = "/data/data/com.termux/files/home/git/wrench/static/og-v5.png"

LOGO_W = 580           # target rendered width of logo
BURST_FRAME_MS = 45
HOLD_FRAME_MS  = 85
FRAMES_PER_BURST = 4
HOLD_FRAMES = 8
BURST_SHIFT = 60       # px rightward per burst frame

# ── Helpers ────────────────────────────────────────────────────────────────────

def make_base_image() -> Image.Image:
    """Render the static base: dark bg + subtle grid vignette + logo + text."""
    img = Image.new("RGBA", (CANVAS_W, CANVAS_H), DARK_BG + (255,))
    draw = ImageDraw.Draw(img)

    # Subtle radial vignette (dark corners)
    for r in range(min(CANVAS_W, CANVAS_H) // 2, 0, -4):
        alpha = int(max(0, (1 - r / (CANVAS_H * 0.65)) * 80))
        draw.ellipse(
            [CANVAS_W // 2 - r, CANVAS_H // 2 - r,
             CANVAS_W // 2 + r, CANVAS_H // 2 + r],
            outline=(0, 0, 0, alpha)
        )

    # Thin horizontal grid lines for racing feel
    for y in range(0, CANVAS_H, 40):
        draw.line([(0, y), (CANVAS_W, y)], fill=(255, 255, 255, 8), width=1)

    # ── Logo ──────────────────────────────────────────────────────────────────
    logo_src = Image.open(LOGO_PATH).convert("RGBA")
    aspect = logo_src.height / logo_src.width
    logo_h = int(LOGO_W * aspect)
    logo = logo_src.resize((LOGO_W, logo_h), Image.LANCZOS)
    lx = (CANVAS_W - LOGO_W) // 2
    ly = (CANVAS_H - logo_h) // 2 - 60   # shifted slightly above centre
    img.alpha_composite(logo, (lx, ly))

    # ── Pink rule beneath logo ─────────────────────────────────────────────
    rule_y = ly + logo_h + 28
    rule_x0 = (CANVAS_W - LOGO_W) // 2 + 20
    rule_x1 = rule_x0 + LOGO_W - 40
    draw.line([(rule_x0, rule_y), (rule_x1, rule_y)], fill=PINK + (220,), width=2)

    # ── Tagline ────────────────────────────────────────────────────────────
    tagline = "YOUR SHOP. YOUR TOOLS. YOUR BUILD."
    try:
        font_tag = ImageFont.truetype("/system/fonts/Roboto-Regular.ttf", 22)
    except Exception:
        font_tag = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), tagline, font=font_tag)
    tw = bbox[2] - bbox[0]
    tx = (CANVAS_W - tw) // 2
    ty = rule_y + 14
    draw.text((tx, ty), tagline, font=font_tag, fill=GREY + (210,))

    # ── Pink badge ────────────────────────────────────────────────────────
    badge_text = "522 STOCKING AVE NW · GRAND RAPIDS, MI"
    for _badge_font_path in [
        "/system/fonts/DroidSans-Bold.ttf",
        "/system/fonts/Roboto-Regular.ttf",
        "/system/fonts/DroidSans.ttf",
    ]:
        try:
            font_badge = ImageFont.truetype(_badge_font_path, 18)
            break
        except Exception:
            pass
    else:
        font_badge = ImageFont.load_default()

    bbox2 = draw.textbbox((0, 0), badge_text, font=font_badge)
    bw = bbox2[2] - bbox2[0]
    bh = bbox2[3] - bbox2[1]
    bx = (CANVAS_W - bw - 24) // 2
    by = ty + 38
    # pill background — solid pink fill with white text for legibility
    draw.rounded_rectangle(
        [bx - 2, by - 6, bx + bw + 26, by + bh + 6],
        radius=8, fill=PINK + (200,), outline=PINK + (255,)
    )
    draw.text((bx + 10, by), badge_text, font=font_badge, fill=(255, 255, 255, 245))

    return img


def generate_burst_lines(rng: random.Random, count: int) -> list[dict]:
    """
    Generate `count` line descriptors for one burst group.
    Each line: y (origin), length, thickness, alpha (peak opacity).
    Lines originate from the left edge at random Y positions.
    """
    lines = []
    for _ in range(count):
        y      = rng.randint(20, CANVAS_H - 20)
        length = rng.randint(100, 400)
        thick  = rng.randint(1, 3)
        # slight vertical spread (±2px) so thick lines feel natural
        y_spread = rng.uniform(-2.0, 2.0)
        alpha  = rng.randint(77, 230)   # 30-90% opacity
        # starting x: begin off-canvas left so lines sweep in
        x_start = rng.randint(-length, 100)
        lines.append({
            "y": y,
            "y_spread": y_spread,
            "length": length,
            "thick": thick,
            "alpha": alpha,
            "x_start": x_start,
        })
    return lines


def draw_lines_on(base: Image.Image, lines: list[dict], frame_idx: int, shift: int) -> Image.Image:
    """
    Composite speed lines onto a copy of `base`.
    frame_idx 0-3: lines shift right by `shift`*frame_idx, fade toward end.
    """
    overlay = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Fade factor: brightest on frame 0, dimming to 25% by frame 3
    fade = 1.0 - frame_idx * 0.25

    for line in lines:
        x0 = line["x_start"] + frame_idx * shift
        x1 = x0 + line["length"]
        y  = line["y"] + line["y_spread"]
        a  = int(line["alpha"] * fade)
        if a <= 0:
            continue
        # Draw 1-3px wide line using small y offsets for thickness
        for dy in range(line["thick"]):
            draw.line(
                [(x0, y + dy), (x1, y + dy)],
                fill=PINK + (a,),
                width=1,
            )

    result = base.copy()
    result.alpha_composite(overlay)
    return result


def draw_persistent_lines(base: Image.Image, lines: list[dict]) -> Image.Image:
    """
    Draw faint persistent (hold) lines — a subset at low opacity.
    Used during hold frames so the canvas isn't completely bare.
    """
    overlay = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Use only first 4 lines at very low alpha
    for line in lines[:4]:
        x0 = line["x_start"] + BURST_SHIFT * 4   # where they ended up
        x1 = x0 + line["length"]
        y  = line["y"] + line["y_spread"]
        a  = max(0, int(line["alpha"] * 0.12))    # ~12% of peak
        if a <= 0:
            continue
        for dy in range(line["thick"]):
            draw.line(
                [(x0, y + dy), (x1, y + dy)],
                fill=PINK + (a,),
                width=1,
            )

    result = base.copy()
    result.alpha_composite(overlay)
    return result


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    rng = random.Random(SEED)

    print("Rendering base image...")
    base_rgba = make_base_image()

    # Generate 3 burst groups
    burst_counts = [rng.randint(8, 12) for _ in range(3)]
    bursts = [generate_burst_lines(rng, c) for c in burst_counts]

    # Build frame list: (Image_RGBA, duration_ms)
    frames: list[tuple[Image.Image, int]] = []

    for burst_idx, burst_lines in enumerate(bursts):
        # 4 burst frames
        for fi in range(FRAMES_PER_BURST):
            frame = draw_lines_on(base_rgba, burst_lines, fi, BURST_SHIFT)
            frames.append((frame, BURST_FRAME_MS))

        # 8 hold frames with faint persistent echo from this burst
        for _ in range(HOLD_FRAMES):
            frame = draw_persistent_lines(base_rgba, burst_lines)
            frames.append((frame, HOLD_FRAME_MS))

    total_frames = len(frames)
    print(f"Total frames: {total_frames}")
    assert total_frames == 3 * (FRAMES_PER_BURST + HOLD_FRAMES), f"Unexpected frame count: {total_frames}"

    # Convert to RGB (WebP encoder handles RGB better; alpha not needed for OG)
    rgb_frames = [f.convert("RGB") for f, _ in frames]
    durations  = [d for _, d in frames]

    print("Saving animated WebP...")
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
    webp_size = os.path.getsize(OUT_WEBP)
    print(f"WebP saved: {OUT_WEBP}  ({webp_size / 1024:.1f} KB)")

    # Static PNG — first hold frame (most composed look)
    first_hold = frames[FRAMES_PER_BURST][0]
    first_hold.convert("RGB").save(OUT_PNG, format="PNG", optimize=True)
    png_size = os.path.getsize(OUT_PNG)
    print(f"PNG  saved: {OUT_PNG}  ({png_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
