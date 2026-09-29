"""Assets : polices + mascotte (téléchargés une fois), et placeholders pour tests hors-ligne."""
from __future__ import annotations

from pathlib import Path

import requests
from PIL import Image, ImageDraw

from . import config


def _download(url: str, dst: Path) -> bool:
    if dst.exists() and dst.stat().st_size > 0:
        return True
    try:
        r = requests.get(url, timeout=60)
        r.raise_for_status()
        dst.write_bytes(r.content)
        return True
    except requests.RequestException as exc:
        print(f"  ✗ {dst.name} : {exc}")
        return False


def fetch_assets() -> None:
    config.FONTS_DIR.mkdir(parents=True, exist_ok=True)
    config.MASCOT_DIR.mkdir(parents=True, exist_ok=True)
    print("Polices (Google Fonts, licence OFL)…")
    for name, url in config.FONT_URLS.items():
        print(f"  {'✓' if _download(url, config.FONTS_DIR / name) else '✗'} {name}")
    print("Mascotte (Supabase Storage public)…")
    ok = total = 0
    for mood, count in config.MASCOT_COUNTS.items():
        for n in range(1, count + 1):
            fname = f"{mood}_{n}_transparent.webp"
            total += 1
            ok += _download(f"{config.MASCOT_URL_BASE}/{fname}", config.MASCOT_DIR / fname)
    print(f"  {ok}/{total} poses disponibles")


def make_placeholder_mascots() -> None:
    """Silhouettes de test (NE PAS utiliser pour publier)."""
    config.MASCOT_DIR.mkdir(parents=True, exist_ok=True)
    tint = {"perplexe": "#A78BFA", "reflechit": "#60A5FA", "victorieux": "#F2C94C", "neutre": "#34D399"}
    for mood, count in config.MASCOT_COUNTS.items():
        for n in range(1, count + 1):
            path = config.MASCOT_DIR / f"{mood}_{n}_transparent.webp"
            if path.exists():
                continue
            img = Image.new("RGBA", (341, 512), (0, 0, 0, 0))
            d = ImageDraw.Draw(img)
            d.rounded_rectangle((60, 120, 281, 490), radius=90, fill=tint[mood])
            d.ellipse((100, 20, 240, 170), fill=tint[mood])
            d.text((170, 300), mood[:4].upper(), fill="#18181B", anchor="mm")
            img.save(path, "WEBP")
