"""
Generate og-v4.webp — Rotating Arc Halo animated WebP for Wrench Club OG image.

900x900px, 36 frames, 55ms each (~2s full rotation).
Arc: 270deg, 8px thick, hot-pink (#ED0C85) with gradient tail fading to transparent.
"""

import math
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# ── Constants ────────────────────────────────────────────────────────────────
W, H = 900, 900
CX, CY = W // 2, H // 2

PINK = (237, 12, 133)          # #ED0C85
DARK_BG = (10, 10, 12)         # near-black background
GREY_TEXT = (160, 160, 170)    # tagline grey
WHITE = (255, 255, 255)

ARC_RADIUS = 320               # px from centre to arc midline
ARC_THICKNESS = 8              # px
ARC_SPAN = 270                 # degrees of visible arc
HEAD_GLOW_SPAN = 30            # degrees of glow at the bright head
N_FRAMES = 36
FRAME_DURATION_MS = 55

LOGO_WIDTH = 560               # target width for logo

LOGO_PATH = "/data/data/com.termux/files/home/git/wrench/assets/logo.png"
OUT_WEBP  = "/data/data/com.termux/files/home/git/wrench/static/og-v4.webp"
OUT_PNG   = "/data/data/com.termux/files/home/git/wrench/static/og-v4.png"


# ── Helpers ──────────────────────────────────────────────────────────────────

def load_logo(width: int) -> Image.Image:
    """Load, resize, and return logo as RGBA."""
    logo = Image.open(LOGO_PATH).convert("RGBA")
    aspect = logo.height / logo.width
    new_h = int(width * aspect)
    return logo.resize((width, new_h), Image.LANCZOS)


def draw_arc_layer(
    angle_head_deg: float,
    span_deg: float = ARC_SPAN,
    radius: int = ARC_RADIUS,
    thickness: int = ARC_THICKNESS,
    head_glow: int = HEAD_GLOW_SPAN,
) -> Image.Image:
    """
    Draw one arc frame onto a transparent RGBA layer.

    The arc runs clockwise from (head - span) to head.
    Opacity fades from 0 at the tail to 255 at the head.
    A multi-pass glow brightens the leading edge.
    """
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw  = ImageDraw.Draw(layer)

    # bounding box for the arc's outer edge (we'll draw inner offsets for thickness)
    half_t = thickness / 2

    # We approximate the gradient by drawing many thin arcs of increasing alpha
    # over the full span, then add extra bright passes at the head.
    N_GRADIENT = 72   # gradient resolution (slices over the full arc span)

    for i in range(N_GRADIENT):
        # fraction along the arc from tail (0) to head (1)
        frac = i / N_GRADIENT
        alpha = int(frac * 255)

        # angular position of this slice (clockwise from tail)
        slice_start_deg = angle_head_deg - span_deg + frac * span_deg
        slice_end_deg   = slice_start_deg + (span_deg / N_GRADIENT) + 0.5  # slight overlap

        r = radius
        bbox = [
            CX - r - half_t, CY - r - half_t,
            CX + r + half_t, CY + r + half_t,
        ]
        draw.arc(
            bbox,
            start=slice_start_deg,
            end=slice_end_deg,
            fill=(*PINK, alpha),
            width=thickness,
        )

    # ── Head glow: extra bright passes over leading HEAD_GLOW_SPAN degrees ──
    N_GLOW = 20
    for j in range(N_GLOW):
        frac = j / N_GLOW
        # brightness ramps up toward the very tip
        alpha = int(180 + 75 * frac)
        glow_start = angle_head_deg - head_glow + frac * head_glow
        glow_end   = glow_start + (head_glow / N_GLOW) + 0.5

        # slightly wider stroke for bloom
        glow_w = thickness + int(4 * frac)
        bbox = [
            CX - radius - half_t, CY - radius - half_t,
            CX + radius + half_t, CY + radius + half_t,
        ]
        draw.arc(
            bbox,
            start=glow_start,
            end=glow_end,
            fill=(*PINK, alpha),
            width=glow_w,
        )

    # Soft feather: blur then re-composite to smooth the pixelated arc edges
    blurred = layer.filter(ImageFilter.GaussianBlur(radius=1.4))
    # Re-draw the crisp centre line on top of the blur for sharpness
    crisp = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cdraw = ImageDraw.Draw(crisp)

    # Crisp full arc (single pass, full opacity at head, fade at tail)
    for i in range(N_GRADIENT):
        frac = i / N_GRADIENT
        alpha = int(frac ** 1.4 * 230)  # slightly compressed curve
        slice_start_deg = angle_head_deg - span_deg + frac * span_deg
        slice_end_deg   = slice_start_deg + (span_deg / N_GRADIENT) + 0.5
        cdraw.arc(
            [CX - radius, CY - radius, CX + radius, CY + radius],
            start=slice_start_deg,
            end=slice_end_deg,
            fill=(*PINK, alpha),
            width=thickness,
        )

    # Composite: blurred glow behind, crisp line on top
    result = Image.alpha_composite(blurred, crisp)
    return result


def make_base_frame(logo: Image.Image) -> Image.Image:
    """
    Render the static elements: background, logo, pink rule, tagline, badge.
    Returns an RGBA image.
    """
    img  = Image.new("RGBA", (W, H), (*DARK_BG, 255))
    draw = ImageDraw.Draw(img)

    # ── Logo — centred, vertically around 38% ──
    logo_x = (W - logo.width) // 2
    logo_y = int(H * 0.32) - logo.height // 2
    img.paste(logo, (logo_x, logo_y), logo)

    # ── Pink horizontal rule below logo ──
    rule_y   = logo_y + logo.height + 20
    rule_x0  = (W - LOGO_WIDTH) // 2
    rule_x1  = rule_x0 + LOGO_WIDTH
    draw.rectangle([rule_x0, rule_y, rule_x1, rule_y + 2], fill=(*PINK, 255))

    # ── Tagline ──
    tagline = "Member-Owned DIY Auto Shop  ·  Grand Rapids, MI"
    try:
        font_tag = ImageFont.truetype(
            "/data/data/com.termux/files/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            size=22,
        )
    except Exception:
        font_tag = ImageFont.load_default()

    bbox_tag = draw.textbbox((0, 0), tagline, font=font_tag)
    tw = bbox_tag[2] - bbox_tag[0]
    draw.text(
        ((W - tw) // 2, rule_y + 16),
        tagline,
        font=font_tag,
        fill=(*GREY_TEXT, 220),
    )

    # ── Pink badge at bottom ──
    badge_text = "WRENCHCLUB.COM"
    try:
        font_badge = ImageFont.truetype(
            "/data/data/com.termux/files/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            size=20,
        )
    except Exception:
        font_badge = ImageFont.load_default()

    bbox_b = draw.textbbox((0, 0), badge_text, font=font_badge)
    bw = bbox_b[2] - bbox_b[0]
    bh = bbox_b[3] - bbox_b[1]
    pad_x, pad_y = 22, 10
    badge_w = bw + pad_x * 2
    badge_h = bh + pad_y * 2
    badge_x = (W - badge_w) // 2
    badge_y = H - badge_h - 40

    # Rounded rect badge
    draw.rounded_rectangle(
        [badge_x, badge_y, badge_x + badge_w, badge_y + badge_h],
        radius=6,
        fill=(*PINK, 255),
    )
    draw.text(
        (badge_x + pad_x, badge_y + pad_y - bbox_b[1]),
        badge_text,
        font=font_badge,
        fill=(10, 10, 12, 255),
    )

    return img


def build_frame(base: Image.Image, arc_layer: Image.Image) -> Image.Image:
    """Composite arc over the base, return RGB for WebP saving."""
    frame = Image.alpha_composite(base, arc_layer)
    return frame.convert("RGB")


# ── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    print("Loading logo…")
    logo = load_logo(LOGO_WIDTH)

    print("Rendering base frame…")
    base = make_base_frame(logo)

    frames: list[Image.Image] = []

    print(f"Rendering {N_FRAMES} arc frames…")
    for i in range(N_FRAMES):
        # Head angle advances clockwise: 0 = right (3 o'clock), 90 = bottom, etc.
        # PIL angles are measured counter-clockwise from 3 o'clock for arc(),
        # but we want clockwise visual rotation, so head = i * (360/N_FRAMES)
        angle_head = (i * 360 / N_FRAMES) % 360

        arc = draw_arc_layer(angle_head)
        frame = build_frame(base, arc)
        frames.append(frame)

        if (i + 1) % 9 == 0:
            print(f"  {i + 1}/{N_FRAMES} frames done")

    print(f"Saving animated WebP → {OUT_WEBP}")
    frames[0].save(
        OUT_WEBP,
        format="WEBP",
        save_all=True,
        append_images=frames[1:],
        duration=FRAME_DURATION_MS,
        loop=0,
        quality=82,
        method=4,
    )
    size_webp = os.path.getsize(OUT_WEBP)
    print(f"  WebP size: {size_webp / 1024:.1f} KB")

    print(f"Saving static PNG → {OUT_PNG}")
    # Save the mid-rotation frame (frame 9) as the static PNG
    static_frame = base.copy()
    # Add arc at ~90-degree head position for a visually interesting still
    arc_static = draw_arc_layer(90)
    static_rgba = Image.alpha_composite(base, arc_static)
    static_rgba.convert("RGB").save(OUT_PNG, format="PNG", optimize=True)
    size_png = os.path.getsize(OUT_PNG)
    print(f"  PNG size: {size_png / 1024:.1f} KB")

    print("Done.")


if __name__ == "__main__":
    main()
