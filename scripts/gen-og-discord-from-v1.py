#!/usr/bin/env python3
"""
Generate og-discord.webp from og-v1.webp — zoomed in, slower pulse.
"""
from PIL import Image
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'static', 'og-v1.webp')
OUT = os.path.join(ROOT, 'static', 'og-discord.webp')
PNG = os.path.join(ROOT, 'static', 'og-discord.png')

# Zoom: crop center region then scale back to 900x900
# Shift crop area upward so "OPENING 2026" badge stays visible
CROP = 80  # pixels to trim from each side (~9% zoom)
SIZE = 900

src = Image.open(SRC)
n = src.n_frames
print(f'  Source: {n} frames, {src.size}')

frames = []
for i in range(n):
    src.seek(i)
    f = src.copy().convert('RGB')
    # Crop — shift upward so bottom badge stays visible
    cropped = f.crop((CROP, CROP - 50, SIZE - CROP, SIZE - CROP - 50))
    # Scale back to 900x900
    zoomed = cropped.resize((SIZE, SIZE), Image.LANCZOS)
    frames.append(zoomed)

# Slower pulsing: original was 70ms per frame → use 120ms (almost 2x slower)
duration = 120

print(f'  Saving {len(frames)} frames at {duration}ms each...')
frames[0].save(
    OUT, format='WEBP', save_all=True,
    append_images=frames[1:],
    loop=0, duration=duration,
    quality=82, method=4
)
print(f'  ✓ {os.path.getsize(OUT) // 1024} KB')

# Static PNG fallback
frames[0].save(PNG, 'PNG')
print(f'  ✓ {PNG}')
