#!/usr/bin/env python3
"""
Generate og-v14.webp — Wrench sweeps left→right, bolting text letters into place.
900x900, 70 frames, loop=0, quality=82, method=4.
"""

import math
import os
from PIL import Image, ImageDraw, ImageFont

# ── Constants ──────────────────────────────────────────────────────────────────
W, H = 900, 900
PINK = (237, 12, 133)
BG   = (10, 10, 10)
WHITE = (255, 255, 255)
GRAY  = (136, 136, 136)

FONT_BOLD_PATH   = "/system/fonts/DroidSans-Bold.ttf"
FONT_NORMAL_PATH = "/system/fonts/DroidSans.ttf"

LOGO_PATH   = "/data/data/com.termux/files/home/git/wrench/assets/logo.png"
OUT_WEBP    = "/data/data/com.termux/files/home/git/wrench/static/og-v14.webp"
OUT_PNG     = "/data/data/com.termux/files/home/git/wrench/static/og-v14.png"

# Text definitions: (text, y_center, font_size, color, bold)
TEXT_LINES = [
    ("GRAND OPENING", 500, 64, WHITE,  True),
    ("WRENCH CLUB",   590, 48, PINK,   True),
    ("522 Stocking Ave · 2026", 660, 24, GRAY, False),
]

TOTAL_FRAMES = 70
PHASE1_END   = 10   # frames 0-9:  logo fade + glow
PHASE2_END   = 55   # frames 10-54: wrench sweep
PHASE3_END   = 70   # frames 55-69: hold / shimmer

# Wrench travels from x=-60 to x=960 over 45 frames (phase 2)
WRENCH_X_START = -60
WRENCH_X_END   = 960
PHASE2_FRAMES  = PHASE2_END - PHASE1_END  # 45

# ── Font loader ────────────────────────────────────────────────────────────────
def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    path = FONT_BOLD_PATH if bold else FONT_NORMAL_PATH
    return ImageFont.truetype(path, size)

# ── Pre-render each letter for every text line ────────────────────────────────
def build_letter_sprites(
    text: str, font: ImageFont.FreeTypeFont, color: tuple
) -> list[dict]:
    """
    Return a list of dicts per character:
      { 'char', 'x', 'y_offset', 'img': RGBA crop of the rendered char, 'w', 'h' }
    x is the absolute left edge on a 900-wide canvas.
    """
    # Measure total text width to centre it
    dummy = Image.new("RGBA", (W * 2, 200), (0, 0, 0, 0))
    dd = ImageDraw.Draw(dummy)
    bbox = dd.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    tx_start = (W - tw) // 2 - bbox[0]

    sprites = []
    cursor = tx_start
    for ch in text:
        if ch == " ":
            # Measure space width
            sb = dd.textbbox((0, 0), "A A", font=font)
            ab = dd.textbbox((0, 0), "AA", font=font)
            space_w = (sb[2] - sb[0]) - (ab[2] - ab[0])
            cursor += space_w
            continue
        cb = dd.textbbox((0, 0), ch, font=font)
        cw = cb[2] - cb[0]
        ch_h = cb[3] - cb[1]

        # Render char onto small RGBA canvas
        char_img = Image.new("RGBA", (cw + 4, ch_h + 4), (0, 0, 0, 0))
        cid = ImageDraw.Draw(char_img)
        cid.text((-cb[0] + 2, -cb[1] + 2), ch, font=font, fill=color)

        sprites.append({
            "char": ch,
            "x": cursor + cb[0],
            "y_offset": cb[1],
            "img": char_img,
            "w": cw,
            "h": ch_h,
        })
        cursor += cw
    return sprites

# ── Glow helper ───────────────────────────────────────────────────────────────
def draw_glow(draw: ImageDraw.ImageDraw, cx: int, cy: int, r: int, alpha: int):
    """Draw a soft radial pink glow by layering translucent ellipses."""
    steps = 8
    for i in range(steps, 0, -1):
        ratio = i / steps
        a = int(alpha * ratio * 0.35)
        rx = int(r * ratio)
        ry = int(r * ratio * 0.5)
        draw.ellipse(
            (cx - rx, cy - ry, cx + rx, cy + ry),
            fill=(PINK[0], PINK[1], PINK[2], a),
        )

# ── Wrench cursor drawing ─────────────────────────────────────────────────────
def draw_wrench_cursor(canvas: Image.Image, wx: int, wy: int, frame_in_phase2: int):
    """
    Draw a simplified wrench silhouette centred at (wx, wy).
    Pink circle (r=12) + angled line (3px, 40px, 45°).
    """
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    # Pulsing alpha based on frame
    pulse = 180 + int(40 * math.sin(frame_in_phase2 * 0.4))

    # Handle: angled rectangle approximated as two thick lines
    angle_rad = math.radians(45)
    hlen = 22
    dx = int(math.cos(angle_rad) * hlen)
    dy = int(math.sin(angle_rad) * hlen)
    d.line(
        [(wx - dx, wy + dy), (wx + dx, wy - dy)],
        fill=(PINK[0], PINK[1], PINK[2], pulse),
        width=5,
    )
    d.line(
        [(wx - dx + 2, wy + dy + 2), (wx + dx + 2, wy - dy + 2)],
        fill=(PINK[0], PINK[1], PINK[2], pulse // 2),
        width=3,
    )

    # Head: open circle
    r = 13
    d.ellipse(
        (wx - r, wy - r, wx + r, wy + r),
        outline=(PINK[0], PINK[1], PINK[2], pulse),
        width=3,
    )
    # Inner gap (erase) to make it "open end"
    d.ellipse(
        (wx - 6, wy - 6, wx + 6, wy + 6),
        fill=(0, 0, 0, 0),
    )

    # Bright centre dot
    d.ellipse(
        (wx - 3, wy - 3, wx + 3, wy + 3),
        fill=(PINK[0], PINK[1], PINK[2], min(255, pulse + 40)),
    )

    canvas.alpha_composite(overlay)

# ── Tightening arc ────────────────────────────────────────────────────────────
def draw_tighten_arc(canvas: Image.Image, lx: int, ly: int, alpha: int):
    """Draw a small 90° pink arc near letter to suggest tightening."""
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    r = 18
    d.arc(
        (lx - r, ly - r, lx + r, ly + r),
        start=0, end=90,
        fill=(PINK[0], PINK[1], PINK[2], alpha),
        width=2,
    )
    canvas.alpha_composite(overlay)

# ── Background ────────────────────────────────────────────────────────────────
def make_base_bg(glow_alpha: int) -> Image.Image:
    """Dark background with subtle pink centre glow."""
    img = Image.new("RGBA", (W, H), (*BG, 255))
    d = ImageDraw.Draw(img, "RGBA")
    if glow_alpha > 0:
        draw_glow(d, W // 2, 160, 380, glow_alpha)
    return img

# ── Logo compositing ──────────────────────────────────────────────────────────
def paste_logo(canvas: Image.Image, logo: Image.Image, alpha_scale: float):
    """Paste logo (460px wide, centred) at y=60 with given alpha."""
    lw = 460
    ratio = lw / logo.width
    lh = int(logo.height * ratio)
    logo_small = logo.resize((lw, lh), Image.LANCZOS)

    if alpha_scale < 1.0:
        r, g, b, a = logo_small.split()
        a = a.point(lambda x: int(x * alpha_scale))
        logo_small = Image.merge("RGBA", (r, g, b, a))

    lx = (W - lw) // 2
    ly = 60
    canvas.alpha_composite(logo_small, (lx, ly))

# ── Pre-build all letter sprites ──────────────────────────────────────────────
def precompute_sprites():
    """Return list of (line_y, sprites_list) for all text lines."""
    result = []
    for text, line_y, font_size, color, bold in TEXT_LINES:
        font = load_font(font_size, bold)
        sprites = build_letter_sprites(text, font, color)
        # Annotate each sprite with absolute y position for baseline
        for sp in sprites:
            sp["line_y"] = line_y
        result.append((line_y, sprites))
    return result

# ── Compose one frame ─────────────────────────────────────────────────────────
def compose_frame(
    frame_idx: int,
    logo: Image.Image,
    all_sprites: list,
    # Per-letter reveal state: dict[sprite_id] -> reveal_progress (0.0 to 1.0)
    letter_state: dict,
    # Per-letter flash state: dict[sprite_id] -> flash_alpha (0-120)
    flash_state: dict,
    # Per-letter arc state: dict[sprite_id] -> arc_alpha (0-200)
    arc_state: dict,
    wrench_x: int,   # -1 means no wrench this frame
    wrench_y: int,
    phase2_frame: int,
    shimmer_frame: int,  # -1 means no shimmer
) -> Image.Image:

    # ---- Background + glow ----
    if frame_idx < PHASE1_END:
        t = frame_idx / (PHASE1_END - 1)
        glow_a = int(200 * t)
    else:
        glow_a = 200

    canvas = make_base_bg(glow_a)

    # ---- Logo ----
    if frame_idx < PHASE1_END:
        t = frame_idx / (PHASE1_END - 1)
        logo_alpha = t
    else:
        logo_alpha = 1.0
    paste_logo(canvas, logo, logo_alpha)

    # ---- Letters ----
    for line_y, sprites in all_sprites:
        for sp_id, sp in enumerate(sprites):
            progress = letter_state.get((line_y, sp_id), 0.0)
            if progress <= 0.0:
                continue

            char_img = sp["img"]
            dest_x = sp["x"]
            dest_y = sp["line_y"] + sp["y_offset"]

            if progress < 1.0:
                # X-scale trick: compress width to simulate spin-in
                full_w = sp["w"] + 4
                scaled_w = max(2, int(full_w * progress))
                squeezed = char_img.resize((scaled_w, char_img.height), Image.BILINEAR)
                # Centre the squeezed glyph at same x position
                paste_x = dest_x + (full_w - scaled_w) // 2
                canvas.alpha_composite(squeezed, (paste_x, dest_y))
            else:
                # Flash highlight behind letter
                flash_a = flash_state.get((line_y, sp_id), 0)
                if flash_a > 0:
                    ov = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
                    fd = ImageDraw.Draw(ov)
                    fd.rectangle(
                        (dest_x - 2, dest_y - 2,
                         dest_x + sp["w"] + 6, dest_y + sp["h"] + 6),
                        fill=(PINK[0], PINK[1], PINK[2], flash_a),
                    )
                    canvas.alpha_composite(ov)

                canvas.alpha_composite(char_img, (dest_x, dest_y))

                # Tightening arc
                arc_a = arc_state.get((line_y, sp_id), 0)
                if arc_a > 0:
                    draw_tighten_arc(
                        canvas,
                        dest_x + sp["w"] // 2,
                        sp["line_y"] + sp["y_offset"] - 20,
                        arc_a,
                    )

    # ---- Shimmer (phase 3) ----
    if shimmer_frame >= 0:
        # Subtle horizontal scan line
        scan_y = (H // 2) + int(100 * math.sin(shimmer_frame * 0.3))
        ov = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        sd = ImageDraw.Draw(ov)
        sd.line(
            [(0, scan_y), (W, scan_y)],
            fill=(PINK[0], PINK[1], PINK[2], 18),
            width=2,
        )
        canvas.alpha_composite(ov)

    # ---- Wrench cursor ----
    if wrench_x >= -60:
        draw_wrench_cursor(canvas, wrench_x, wrench_y, phase2_frame)

    return canvas.convert("RGB")

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    logo = Image.open(LOGO_PATH).convert("RGBA")
    all_sprites = precompute_sprites()

    # Flatten sprites list for easier lookup
    flat_sprites = []  # list of (line_y, sp_id, sprite_dict)
    for line_y, sprites in all_sprites:
        for sp_id, sp in enumerate(sprites):
            flat_sprites.append((line_y, sp_id, sp))

    # Determine wrench x position when it passes each letter centre
    # sprite x_centre mapped to phase2 frame number
    letter_trigger_frame: dict = {}  # (line_y, sp_id) -> phase2_frame_number
    for line_y, sp_id, sp in flat_sprites:
        letter_cx = sp["x"] + sp["w"] // 2
        # Linear interp: phase2 frame when wrench_x == letter_cx
        t = (letter_cx - WRENCH_X_START) / (WRENCH_X_END - WRENCH_X_START)
        trigger = int(t * (PHASE2_FRAMES - 1))
        letter_trigger_frame[(line_y, sp_id)] = trigger

    # Per-frame state
    letter_state: dict = {}   # (line_y, sp_id) -> progress 0..1
    flash_state: dict  = {}   # (line_y, sp_id) -> alpha 0..120
    arc_state: dict    = {}   # (line_y, sp_id) -> alpha 0..200

    frames = []
    durations = []

    for f in range(TOTAL_FRAMES):
        # ---- Determine phase ----
        if f < PHASE1_END:
            phase = 1
            phase2_frame = 0
            wrench_x = -999  # off canvas, don't draw
            wrench_y = H // 2
            shimmer_frame = -1
        elif f < PHASE2_END:
            phase = 2
            phase2_frame = f - PHASE1_END
            t = phase2_frame / (PHASE2_FRAMES - 1)
            wrench_x = int(WRENCH_X_START + t * (WRENCH_X_END - WRENCH_X_START))
            # Wrench y oscillates slightly between text lines for visual interest
            wrench_y = 530 + int(20 * math.sin(phase2_frame * 0.3))
            shimmer_frame = -1
        else:
            phase = 3
            phase2_frame = PHASE2_FRAMES - 1
            wrench_x = -999
            wrench_y = H // 2
            shimmer_frame = f - PHASE2_END

        # ---- Update letter states (phase 2) ----
        if phase == 2:
            for (line_y, sp_id), trigger in letter_trigger_frame.items():
                frames_since = phase2_frame - trigger
                if frames_since < 0:
                    continue
                # Spin-in over 4 frames
                progress = min(1.0, (frames_since + 1) / 4.0)
                letter_state[(line_y, sp_id)] = progress

                if progress >= 1.0:
                    # Flash: bright on lock (frames_since==3), fade over 2 frames
                    if frames_since == 3:
                        flash_state[(line_y, sp_id)] = 120
                    elif frames_since == 4:
                        flash_state[(line_y, sp_id)] = 40
                    else:
                        flash_state.pop((line_y, sp_id), None)

                    # Arc: visible for 3 frames after lock
                    if 3 <= frames_since <= 5:
                        arc_alpha = 200 - (frames_since - 3) * 70
                        arc_state[(line_y, sp_id)] = max(0, arc_alpha)
                    else:
                        arc_state.pop((line_y, sp_id), None)

        elif phase == 3:
            # Ensure all letters fully revealed in phase 3
            for (line_y, sp_id) in list(letter_trigger_frame.keys()):
                letter_state[(line_y, sp_id)] = 1.0
            # Clear flash/arc in phase 3
            flash_state.clear()
            arc_state.clear()

        # ---- Frame duration ----
        if phase == 1:
            dur = 50
        elif phase == 2:
            dur = 55
        else:
            dur = 85

        frame_img = compose_frame(
            f, logo, all_sprites,
            dict(letter_state),
            dict(flash_state),
            dict(arc_state),
            wrench_x if wrench_x > -999 else -999,
            wrench_y,
            phase2_frame,
            shimmer_frame,
        )
        frames.append(frame_img)
        durations.append(dur)

    # ---- Save WebP ----
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
    size_webp = os.path.getsize(OUT_WEBP)
    print(f"WebP saved: {OUT_WEBP}  ({size_webp:,} bytes)")

    # ---- Save PNG (first frame) ----
    frames[0].save(OUT_PNG, format="PNG")
    size_png = os.path.getsize(OUT_PNG)
    print(f"PNG saved:  {OUT_PNG}  ({size_png:,} bytes)")


if __name__ == "__main__":
    main()
