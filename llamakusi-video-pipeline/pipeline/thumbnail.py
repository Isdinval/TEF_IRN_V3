"""Miniatures : un seul gabarit (fond sombre « constellation », mascotte en contre-jour, titre en gros) décliné
en 16:9 (long, 1280×720, celle que `publish` envoie à YouTube) et en 9:16 (short, 1080×1920 : couverture Reels/Facebook).
Aucun appel réseau, aucun rendu vidéo requis : `python cli.py thumbnail <id>`.
"""
from __future__ import annotations

import math
import random
import re
import zlib
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

from . import config
from .config import COLORS, GEO
from .layers import _mascot_fx, _tracked, font, rgb
from .schema import VideoScript

KICKERS = {"tef_irn": "TEF IRN", "examen_civique": "EXAMEN CIVIQUE", "both": "TEF IRN · EXAMEN CIVIQUE",
           "fle_bridge": "FRANÇAIS ADMINISTRATIF"}
FRAME = config.env("THUMB_FRAME", "1") != "0"      # cadre or → rose ; THUMB_FRAME=0 pour le couper (test A/B)
SAFE = 34                                   # marge mini (px) entre la mascotte et le bord de la miniature (cadre : ~22 px)
MAX_BYTES = 2_000_000                       # limite YouTube d'une miniature
# Mise en page par format. Short : tout dans la zone centrale 3:4 (y 240-1680), seule visible dans la grille Instagram.
LAYOUTS = {
    "long": {"size": (1280, 720), "k": 1.0, "align": "left", "x": 76, "text_w": 740, "title": (112, 64), "lines": 3,
             "brand_y": 92, "mascot_cx": 1015, "mascot_h": 600, "mascot_bottom": 700, "stack_cy": 415},
    "short": {"size": (1080, 1920), "k": 1.0, "align": "center", "x": 540, "text_w": 900, "title": (112, 72), "lines": 4,
              "brand_y": 300, "mascot_cx": 540, "mascot_h": 560, "mascot_bottom": 1650, "stack_cy": 740},
}


# Test A/B (long) : 3 styles de miniature. 0 = A (contrôle, rendu historique) ; 1 = B ; 2 = C.
STYLE_NAMES = ["classique", "gros plan expressif", "mascotte à gauche"]
STYLE_LAYOUTS = [
    {},
    {"mascot_cx": 985, "mascot_h": 640, "mascot_bottom": 690, "text_w": 640, "title": (128, 72)},
    {"x": 560, "text_w": 660, "mascot_cx": 290, "mascot_h": 640, "mascot_bottom": 690},
]


def _pool() -> list[tuple[str, int]]:
    """Toutes les mascottes (humeur, pose), entrelacées par humeur : deux voisines n'ont jamais la même humeur."""
    return [(m, p) for p in range(1, max(config.MASCOT_COUNTS.values()) + 1) for m in config.MASCOT_COUNTS
            if p <= config.MASCOT_COUNTS[m]]


def rotation_mascot(script: VideoScript, variant: int) -> tuple[str, int]:
    """Mascotte des styles B (1) et C (2) : change à chaque vidéo (n° de l'id : long-03 → 3 ; sinon empreinte de l'id),
    jamais celle de A ni celle de l'autre style. Stable d'un rendu à l'autre."""
    pool = _pool()
    m = re.search(r"(\d+)$", script.id)
    n = int(m.group(1)) if m else zlib.crc32(script.id.encode("utf-8"))
    b0 = script.blocks[0]
    taken, i = {(config.MASCOT_MOOD[script.thumbnail.mascot or b0.mascot], script.thumbnail.pose or b0.pose)}, 2 * n
    for _ in range(variant):
        while pool[i % len(pool)] in taken:
            i += 1
        pick = pool[i % len(pool)]
        taken.add(pick)
        i += 1
    return pick


def thumbnail_path(bdir: Path, variant: int = 0) -> Path:
    return bdir / ("thumbnail.jpg" if variant == 0 else f"thumbnail_{'BC'[variant - 1]}.jpg")


def variant_count(script: VideoScript) -> int:
    return len(STYLE_NAMES) if script.format == "long" else 1


# --- texte -------------------------------------------------------------------------------------
def _words(text: str) -> list[tuple[str, bool]]:
    """« Ce qui *bloque 9 candidats* » → [(mot, en_or)…] ; les segments impairs entre * sont en or."""
    out = []
    for i, seg in enumerate(text.split("*")):
        out += [(w, i % 2 == 1) for w in seg.split()]
    return out


def _line_w(line, fnt, space) -> float:
    return sum(fnt.getlength(w) for w, _ in line) + space * (len(line) - 1)


def _wrap(words, fnt, max_w) -> list[list[tuple[str, bool]]]:
    space = fnt.getlength(" ")
    lines, cur = [], []
    for w in words:
        if cur and _line_w(cur + [w], fnt, space) > max_w:
            lines.append(cur)
            cur = []
        cur.append(w)
    return lines + [cur] if cur else lines


def fit_title(text: str, max_w: int, max_lines: int, size_max: int, size_min: int):
    """Plus grande taille (pas de 4) qui tient en `max_lines` lignes ; sinon taille mini + « … » (titre trop long)."""
    words = _words(text.upper())
    for size in range(size_max, size_min - 1, -4):
        fnt = font("montserrat", size, 900)
        lines = _wrap(words, fnt, max_w)
        if len(lines) <= max_lines and all(_line_w(ln, fnt, fnt.getlength(" ")) <= max_w for ln in lines):
            return size, lines
    fnt = font("montserrat", size_min, 900)
    lines = _wrap(words, fnt, max_w)[:max_lines]
    lines[-1] = lines[-1][:-1] + [(lines[-1][-1][0].rstrip(".,;:") + "…", lines[-1][-1][1])]
    return size_min, lines


# --- fond ------------------------------------------------------------------------------------------
def _video_background(w: int, h: int, script: VideoScript) -> Image.Image:
    """Même fond que la vidéo : une image de la scène « constellation » (seed = id du script → même disposition), un peu assombrie."""
    from .background import GeoScene
    scene = GeoScene(script.id, w, h)
    scene.scene_starts = [0.0]
    img = scene.render(2.0, 24.0, 0.5).convert("RGB")
    return Image.blend(img, Image.new("RGB", (w, h), "#050605"), 0.35)


def _background(w: int, h: int, script: VideoScript, lay: dict) -> Image.Image:
    if config.BG_STYLE == "geo":
        return _video_background(w, h, script)
    """Noir chaud + lueur or en haut à gauche + lueur rose derrière la mascotte (émeraude pour l'Examen Civique)
    + constellation (polygones fins, orbes reliés, poussière) dont la disposition dépend de l'id du script."""
    img = Image.new("RGB", (w, h), GEO["base"])
    second = "#1F7A52" if script.product == "examen_civique" else GEO["glow_rose"]
    glows = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    g = ImageDraw.Draw(glows)
    for (cx, cy, r, col, a) in ((0.12 * w, 0.14 * h, 0.42 * max(w, h), GEO["glow_gold"], 55),
                                (lay["mascot_cx"], lay["mascot_bottom"] - lay["mascot_h"] * 0.5, 0.40 * max(w, h), second, 62)):
        g.ellipse((cx - r, cy - r, cx + r, cy + r), fill=rgb(col, a))
    img.paste(glows.filter(ImageFilter.GaussianBlur(0.12 * max(w, h))), (0, 0), glows.filter(ImageFilter.GaussianBlur(0.12 * max(w, h))))

    rnd = random.Random(zlib.crc32(script.id.encode("utf-8")))
    u = w / 1080
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for _ in range(5):                                           # grands polygones, traits fins
        cx, cy, r, n = rnd.uniform(0, w), rnd.uniform(0, h), rnd.uniform(0.18, 0.4) * max(w, h), rnd.choice((3, 4, 5))
        rot = rnd.uniform(0, math.tau)
        pts = [(cx + r * math.cos(rot + i * math.tau / n), cy + r * math.sin(rot + i * math.tau / n)) for i in range(n)]
        d.line(pts + pts[:1], fill=rgb(GEO["gold"], 52), width=max(2, round(3 * u)))
    pts = [(rnd.uniform(0, w), rnd.uniform(0, h)) for _ in range(24)]
    for i, a in enumerate(pts):                                  # orbes reliés à leurs voisins proches
        for b in pts[i + 1:]:
            if math.dist(a, b) < 0.2 * max(w, h):
                d.line((a, b), fill=rgb(GEO["rose"] if rnd.random() < 0.3 else GEO["gold"], 46), width=max(1, round(2 * u)))
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for x, y in pts:
        r = rnd.uniform(3, 7) * u
        gd.ellipse((x - 3 * r, y - 3 * r, x + 3 * r, y + 3 * r), fill=rgb(GEO["gold"], 60))
        d.ellipse((x - r, y - r, x + r, y + r), fill=rgb(GEO["core"], 235))
    for _ in range(70):
        x, y, r = rnd.uniform(0, w), rnd.uniform(0, h), rnd.uniform(1.2, 2.6) * u
        d.ellipse((x - r, y - r, x + r, y + r), fill=rgb(GEO["core"], rnd.randint(90, 200)))
    glow = glow.filter(ImageFilter.GaussianBlur(10 * u))
    img.paste(glow, (0, 0), glow)
    img.paste(layer, (0, 0), layer)
    vig = Image.new("L", (w, h), 0)                              # vignette : bords plus sombres
    ImageDraw.Draw(vig).ellipse((-0.15 * w, -0.1 * h, 1.15 * w, 1.1 * h), fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(0.12 * max(w, h)))
    return Image.composite(img, Image.new("RGB", (w, h), "#050605"), vig)


# --- éléments ------------------------------------------------------------------------------------------
def _mascot(img: Image.Image, script: VideoScript, lay: dict) -> None:
    t, b0 = script.thumbnail, script.blocks[0]
    if lay.get("mood"):                       # styles B/C : mascotte qui tourne d'une vidéo à l'autre
        mood, pose = lay["mood"], lay["pose"]
    else:
        mood, pose = config.MASCOT_MOOD[t.mascot or b0.mascot], t.pose or b0.pose
    path = config.MASCOT_DIR / f"{mood}_{pose}_transparent.webp"
    if not path.exists():
        raise FileNotFoundError(f"mascotte absente : {path} → `python cli.py fetch-assets`")
    src = Image.open(path).convert("RGBA")
    if bbox := src.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox():   # ignore marges transparentes et halo quasi invisible
        src = src.crop(bbox)
    w, h, bottom = mascot_box(src.size, lay, img.size)
    src = src.resize((w, h), Image.LANCZOS)
    tile, pad = _mascot_fx(src)
    img.paste(tile, (lay["mascot_cx"] - w // 2 - pad, bottom - h - pad), tile)


def mascot_box(size: tuple[int, int], lay: dict, canvas: tuple[int, int]) -> tuple[int, int, int]:
    """(largeur, hauteur, bas) de la mascotte recadrée. Styles B/C (mascotte qui tourne) : jamais coupée — elle reste à
    SAFE px du bord (cadre compris), largeur plafonnée à 36 % de l'image pour les poses larges (coffre, drapeau…)."""
    sw, sh = size
    w_img, h_img = canvas
    h, bottom = lay["mascot_h"], lay["mascot_bottom"]
    if lay.get("mood"):
        bottom = min(bottom, h_img - SAFE)
        h = min(h, bottom - SAFE, round(sh * 0.36 * w_img / sw))
    return max(1, round(sw * h / sh)), h, bottom


def _pill_w(text: str, fnt, tracking: float, pad: float) -> float:
    return sum(fnt.getlength(c) for c in text) + tracking * (len(text) - 1) + 2 * pad


def _kicker(d: ImageDraw.ImageDraw, x: float, y: float, text: str, size: int, filled: bool) -> tuple[float, float]:
    """Pastille « TEF IRN » (contour or) ou badge (aplat or, texte sombre). (x, y) = coin haut-gauche ; retourne (largeur, hauteur)."""
    fnt, tr, pad = font("montserrat", size, 900), size * 0.14, size * 0.8
    w, h = _pill_w(text, fnt, tr, pad), size * 2.0
    if filled:
        d.rounded_rectangle((x, y, x + w, y + h), radius=h / 2, fill=rgb(COLORS["gold"]))
    else:
        d.rounded_rectangle((x, y, x + w, y + h), radius=h / 2, fill=rgb("#0A0D0B", 150), outline=rgb(COLORS["gold"]),
                            width=max(2, round(size / 10)))
    _tracked(d, (x + pad, y + h / 2 + size * 0.36), text, fnt, rgb("#14201A" if filled else COLORS["gold_soft"]), tr)
    return w, h


def _brand(d: ImageDraw.ImageDraw, lay: dict, script: VideoScript, size: int) -> None:
    k = size / 50
    fnt, text, tr, dot, gap = font("montserrat", size, 900), "LLAMAKUSI", 9 * k, 26 * k, 22 * k
    tw = sum(fnt.getlength(c) for c in text) + tr * (len(text) - 1)
    x = lay["x"] - ((dot + gap + tw) / 2 if lay["align"] == "center" else 0)
    y = lay["brand_y"]
    d.ellipse((x, y - 18 * k - dot / 2, x + dot, y - 18 * k + dot / 2), fill=rgb(config.ACCENT_BAR[script.accent]))
    _tracked(d, (x + dot + gap, y), text, fnt, rgb(COLORS["white"], 235), tr)


def render(script: VideoScript, variant: int = 0) -> Image.Image:
    lay = {**LAYOUTS[script.format], **(STYLE_LAYOUTS[variant] if script.format == "long" else {})}
    if variant:
        lay["mood"], lay["pose"] = rotation_mascot(script, variant)
    w, h = lay["size"]
    img = _background(w, h, script, lay)
    _mascot(img, script, lay)
    u = w / 1080 if script.format == "short" else w / 1280              # tailles des petits éléments proportionnelles
    top = ImageDraw.Draw(img, "RGBA")
    _brand(top, lay, script, round(40 * u))

    vt = script.thumbnail.variant_texts
    text = vt[variant - 1] if variant and len(vt) >= variant else script.thumbnail.text or script.title
    size, lines = fit_title(text, lay["text_w"], lay["lines"], *lay["title"])
    fnt = font("montserrat", size, 900)
    lh = round(size * 1.08)
    kick, kick_size = KICKERS[script.product], round(26 * u) if script.format == "long" else 32
    badge = script.thumbnail.badge or next((b.overlay for b in script.blocks if b.overlay), None)
    kh = kick_size * 2.0
    gap = round(30 * u)
    bar_h = round(10 * u)
    group_h = kh + gap + lh * len(lines) + gap + bar_h
    y = lay["stack_cy"] - group_h / 2
    center = lay["align"] == "center"

    kf = font("montserrat", kick_size, 900)
    kw = _pill_w(kick, kf, kick_size * 0.14, kick_size * 0.8)
    bs = round(kick_size * 1.1)
    bw = _pill_w(badge, font("montserrat", bs, 900), bs * 0.14, bs * 0.8) if badge else 0
    row_w = kw + (gap * 0.6 + bw if badge else 0)
    x0 = lay["x"] - (row_w / 2 if center else 0)                          # rangée : pastille produit + badge doré
    _kicker(top, x0, y, kick, kick_size, False)
    if badge:
        _kicker(top, x0 + kw + gap * 0.6, y - (bs * 2.0 - kh) / 2, badge, bs, True)
    y += kh + gap

    sh = Image.new("RGBA", (w, h), (0, 0, 0, 0))                          # ombre douce sous le titre (lisibilité sur les lueurs)
    sd = ImageDraw.Draw(sh)
    ty = y
    for line in lines:
        x = lay["x"] - (_line_w(line, fnt, fnt.getlength(" ")) / 2 if center else 0)
        for word, hl in line:
            sd.text((x, ty + size), word, font=fnt, fill=(0, 0, 0, 200), anchor="ls")
            x += fnt.getlength(word + " ")
        ty += lh
    sh = sh.filter(ImageFilter.GaussianBlur(size * 0.09))
    img.paste(sh, (round(size * 0.03), round(size * 0.05)), sh)
    top = ImageDraw.Draw(img, "RGBA")
    ty = y
    for line in lines:
        x = lay["x"] - (_line_w(line, fnt, fnt.getlength(" ")) / 2 if center else 0)
        for word, hl in line:
            top.text((x, ty + size), word, font=fnt, fill=rgb(COLORS["gold"] if hl else COLORS["white"]), anchor="ls")
            x += fnt.getlength(word + " ")
        ty += lh
    bar_w, bx = round(170 * u), lay["x"] - (round(170 * u) / 2 if center else 0)
    ty += gap - (lh - size)
    for i in range(bar_w):                                              # filet or → rose (comme la barre de progression)
        t = i / max(1, bar_w - 1)
        a, b = (232, 206, 138), (224, 138, 168)
        top.line((bx + i, ty, bx + i, ty + bar_h), fill=tuple(round(a[j] + (b[j] - a[j]) * t) for j in range(3)) + (255,))
    if FRAME:
        _frame(img, script)
    return img


def _frame(img: Image.Image, script: VideoScript) -> None:
    """Cadre fin or → rose qui suit la forme de l'image (coins arrondis, en retrait du bord). Anticrénelage par rendu à ×4."""
    w, h = img.size
    inset, thick, radius, k = (18, 10, 40, 4) if script.format == "short" else (14, 8, 28, 4)
    mask = Image.new("L", (w * k, h * k), 0)
    ImageDraw.Draw(mask).rounded_rectangle((inset * k, inset * k, (w - inset) * k - 1, (h - inset) * k - 1),
                                           radius=radius * k, outline=255, width=thick * k)
    mask = mask.resize((w, h), Image.LANCZOS)
    grad = Image.new("RGB", (w, h))
    gd = ImageDraw.Draw(grad)
    a, b = (232, 206, 138), (224, 138, 168)
    for x in range(w):
        t = x / max(1, w - 1)
        gd.line((x, 0, x, h), fill=tuple(round(a[j] + (b[j] - a[j]) * t) for j in range(3)))
    img.paste(grad, (0, 0), mask)


def save(script: VideoScript, bdir: Path) -> Path:
    """thumbnail.jpg (A) ; long : + thumbnail_B.jpg, thumbnail_C.jpg pour le test A/B. JPEG : un PNG avec dégradés
    dépasse vite les 2 Mo de YouTube. Retourne le chemin de A."""
    bdir.mkdir(parents=True, exist_ok=True)
    for v in range(variant_count(script)):
        img, out = render(script, v), thumbnail_path(bdir, v)
        for q in (92, 85, 75):
            img.save(out, "JPEG", quality=q, optimize=True, subsampling=0)
            if out.stat().st_size <= MAX_BYTES:
                break
    return thumbnail_path(bdir)
