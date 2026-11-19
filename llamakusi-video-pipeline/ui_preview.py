"""Aperçu « interface réseau social » : superpose une maquette (boutons, légende, barres) sur une image ou une vidéo.

    python ui_preview.py build/short-03/out.mp4                       # YouTube Shorts
    python ui_preview.py build/short-03/out.mp4 --platform all --zones # + TikTok, Reels, zones à éviter en rouge
    python ui_preview.py preview.png --platform tiktok -o apercu.png

Maquette APPROXIMATIVE (formes génériques, positions typiques) : les interfaces changent selon l'appareil et la version.
Vérifier le rendu final dans YouTube Studio (aperçu mobile).
"""
from __future__ import annotations

import argparse
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
PLATFORMS = ("youtube", "tiktok", "instagram")
WHITE = (255, 255, 255)


def _font(size: int) -> ImageFont.ImageFont:
    try:
        f = ImageFont.truetype(str(ROOT / "assets" / "fonts" / "Montserrat.ttf"), size)
        f.set_variation_by_axes([700])
        return f
    except Exception:                                   # police absente : police par défaut de Pillow
        return ImageFont.load_default()


def _gradient(img: Image.Image, y0: int, y1: int, a0: int, a1: int) -> None:
    d = ImageDraw.Draw(img)
    for y in range(min(y0, y1), max(y0, y1)):
        k = (y - y0) / (y1 - y0)
        d.line((0, y, img.width, y), fill=(0, 0, 0, round(a0 + (a1 - a0) * k)))


def _btn(d: ImageDraw.ImageDraw, cx: int, cy: int, label: str = "", r: int = 46) -> None:
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(25, 25, 25, 120), outline=WHITE + (200,), width=3)
    if label:
        d.text((cx, cy + r + 26), label, font=_font(26), fill=WHITE + (235,), anchor="mm")


def _text(d: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, size: int = 30, alpha: int = 235) -> None:
    d.text(xy, text, font=_font(size), fill=WHITE + (alpha,), anchor="lm")


def _pill(d: ImageDraw.ImageDraw, x: int, cy: int, text: str, size: int = 26) -> None:
    w = int(_font(size).getlength(text)) + 40
    d.rounded_rectangle((x, cy - 28, x + w, cy + 28), radius=28, fill=(255, 255, 255, 215))
    d.text((x + w / 2, cy), text, font=_font(size), fill=(20, 20, 20, 255), anchor="mm")


def _short(platform: str) -> Image.Image:
    img = Image.new("RGBA", (1080, 1920), (0, 0, 0, 0))
    if platform == "youtube":
        _gradient(img, 0, 220, 150, 0)
        _gradient(img, 1560, 1920, 0, 190)
    elif platform == "tiktok":
        _gradient(img, 0, 220, 130, 0)
        _gradient(img, 1560, 1790, 0, 150)
    else:
        _gradient(img, 0, 220, 130, 0)
        _gradient(img, 1560, 1920, 0, 170)
    d = ImageDraw.Draw(img)
    if platform == "youtube":
        _btn(d, 900, 100, r=34)
        _btn(d, 990, 100, r=34)
        for y, lab in zip((1010, 1170, 1330, 1490, 1650), ("12 k", "Non", "340", "Partager", "Remix")):
            _btn(d, 985, y, lab)
        d.ellipse((56, 1686, 124, 1754), fill=(60, 60, 60, 200), outline=WHITE + (220,), width=3)
        _text(d, (146, 1720), "@llamakusi", 32)
        _pill(d, 430, 1720, "S'abonner")
        _text(d, (50, 1790), "Titre de la vidéo #TEFIRN", 30)
        _text(d, (50, 1840), "…plus", 28, 170)
        d.rounded_rectangle((945, 1770, 1025, 1850), radius=16, fill=(25, 25, 25, 140), outline=WHITE + (200,), width=3)
        d.rectangle((0, 1912, 1080, 1920), fill=WHITE + (70,))
        d.rectangle((0, 1912, 330, 1920), fill=WHITE + (230,))
    elif platform == "tiktok":
        _text(d, (330, 110), "Abonnements   |   Pour toi", 34)
        _btn(d, 1000, 110, r=30)
        _btn(d, 990, 870, r=52)
        for y, lab in zip((1040, 1200, 1360, 1520), ("12 k", "340", "88", "Partager")):
            _btn(d, 990, y, lab)
        d.ellipse((940, 1650, 1040, 1750), fill=(25, 25, 25, 160), outline=WHITE + (200,), width=3)
        _text(d, (50, 1690), "@llamakusi", 34)
        _text(d, (50, 1745), "Titre de la vidéo #TEFIRN", 30)
        _text(d, (50, 1795), "Son original · llamakusi", 26, 200)
        d.rectangle((0, 1790, 1080, 1920), fill=(0, 0, 0, 200))
        for i, lab in enumerate(("Accueil", "Amis", "+", "Messages", "Profil")):
            _text(d, (108 + i * 216 - int(_font(26).getlength(lab) / 2), 1855), lab, 26, 200)
    else:                                               # instagram
        _text(d, (50, 110), "Reels", 44)
        _btn(d, 1000, 110, r=30)
        for y, lab in zip((1090, 1250, 1410), ("12 k", "340", "Partager")):
            _btn(d, 995, y, lab)
        _btn(d, 995, 1560, r=30)
        d.rounded_rectangle((955, 1680, 1035, 1760), radius=16, fill=(25, 25, 25, 140), outline=WHITE + (200,), width=3)
        d.ellipse((50, 1676, 118, 1744), fill=(60, 60, 60, 200), outline=WHITE + (220,), width=3)
        _text(d, (140, 1710), "llamakusi", 32)
        _pill(d, 360, 1710, "Suivre")
        _text(d, (50, 1775), "Titre de la vidéo #TEFIRN", 30)
        _text(d, (50, 1830), "Son original · llamakusi", 26, 200)
    return img


def _long() -> Image.Image:
    img = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
    _gradient(img, 0, 140, 150, 0)
    _gradient(img, 900, 1080, 0, 190)
    d = ImageDraw.Draw(img)
    _text(d, (60, 50), "Titre de la vidéo", 34)
    _btn(d, 1800, 50, r=24)
    d.rectangle((60, 1000, 1860, 1006), fill=WHITE + (80,))
    d.rectangle((60, 1000, 700, 1006), fill=(255, 0, 0, 240))
    d.ellipse((692, 993, 708, 1013), fill=(255, 0, 0, 255))
    d.polygon([(66, 1028), (66, 1068), (100, 1048)], fill=WHITE + (235,))
    _text(d, (140, 1048), "0:12 / 8:40", 28)
    for x in (1740, 1800):
        d.rounded_rectangle((x, 1030, x + 40, 1066), radius=8, outline=WHITE + (220,), width=3)
    return img


def _zones(size: tuple[int, int]) -> Image.Image:
    """Zones à éviter pour le contenu important (rouge) : mêmes valeurs que SAFE_BOTTOM de config.py."""
    w, h = size
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    red = (255, 40, 40, 70)
    if h > w:                                           # Short
        d.rectangle((0, 0, w, 170), fill=red)
        d.rectangle((0, h - 250, w, h), fill=red)
        d.rectangle((920, 880, w, h - 250), fill=red)
    else:                                               # long
        d.rectangle((0, 0, w, 100), fill=red)
        d.rectangle((0, 960, w, h), fill=red)
    return img


def overlay_for(size: tuple[int, int], platform: str, zones: bool = False) -> Image.Image:
    """Calque RGBA (taille `size`) : maquette de l'interface + zones à éviter si demandé."""
    short = size[1] > size[0]
    ui = _short(platform) if short else _long()
    if zones:                                           # zones dessinées à la taille de référence, puis tout est redimensionné
        ui = Image.alpha_composite(_zones(ui.size), ui)
    return ui if ui.size == size else ui.resize(size, Image.LANCZOS)


def _video_size(path: Path) -> tuple[int, int]:
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                          "-of", "csv=p=0:s=x", str(path)], capture_output=True, text=True, check=True).stdout.strip()
    w, h = out.split("x")
    return int(w), int(h)


def render(src: Path, platform: str, zones: bool, out: Path, width: int | None = None) -> Path:
    """`width` : redimensionne la vidéo de sortie (aperçu plus rapide à encoder) ; None = taille d'origine."""
    if src.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp"):
        base = Image.open(src).convert("RGBA")
        Image.alpha_composite(base, overlay_for(base.size, platform, zones)).convert("RGB").save(out)
        return out
    with tempfile.TemporaryDirectory() as tmp:
        png = Path(tmp) / "ui.png"
        overlay_for(_video_size(src), platform, zones).save(png)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-i", str(png), "-filter_complex",
                        (f"[0:v]scale={width}:-2[a];[1:v]scale={width}:-2[b];[a][b]overlay=0:0:format=auto" if width
                         else "[0:v][1:v]overlay=0:0:format=auto"), "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p",
                        "-c:a", "copy", "-movflags", "+faststart", str(out)], check=True)
    return out


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Aperçu avec l'interface d'un réseau social (maquette approximative)")
    ap.add_argument("input", type=Path, help="vidéo (.mp4) ou image (.png/.jpg) à prévisualiser")
    ap.add_argument("--platform", choices=(*PLATFORMS, "all"), default="youtube",
                    help="format 16:9 : seule la maquette YouTube existe (défaut : youtube)")
    ap.add_argument("--zones", action="store_true", help="colore en rouge les zones à éviter pour le contenu important")
    ap.add_argument("-o", "--output", type=Path, help="fichier de sortie (ignoré avec --platform all)")
    args = ap.parse_args(argv)
    if not args.input.exists():
        print(f"✗ fichier introuvable : {args.input}")
        return 1
    plats = PLATFORMS if args.platform == "all" else (args.platform,)
    for p in plats:
        out = args.output if (args.output and len(plats) == 1) else args.input.with_name(f"{args.input.stem}.ui-{p}{args.input.suffix}")
        print(f"✓ {render(args.input, p, args.zones, out)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
