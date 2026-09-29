"""Rendu des calques (PNG RGBA plein cadre 1080×1920) avec Pillow.

Choix : Pillow plutôt que Playwright pour le MVP (0 dépendance navigateur, rendu
déterministe, testable). Les tokens (couleurs, polices, rayons) sont ceux du design
system. Si une carte devient trop complexe pour Pillow, on passera ce module en
HTML/Playwright sans changer le contrat (timeline.json ne référence que des PNG).
"""
from __future__ import annotations

from functools import lru_cache

from PIL import Image, ImageDraw, ImageFont

from . import config
from .config import COLORS, LAYOUT, W, H
from .textutil import NBSP


# --- outils -------------------------------------------------------------------
def rgb(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    h = hex_color.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), alpha


@lru_cache(maxsize=64)
def font(family: str, size: int, weight: int) -> ImageFont.FreeTypeFont:
    path = config.FONTS_DIR / config.FONT_FILES[family]
    if not path.exists():
        raise FileNotFoundError(f"police absente : {path} → lancer `python cli.py fetch-assets`")
    f = ImageFont.truetype(str(path), size)
    values = []
    for axis in f.get_variation_axes():
        name = axis["name"]
        name = name.decode() if isinstance(name, bytes) else str(name)
        low = name.lower()
        if "weight" in low:
            values.append(min(max(weight, axis["minimum"]), axis["maximum"]))
        elif "optical" in low:
            values.append(min(max(size, axis["minimum"]), axis["maximum"]))
        else:
            values.append(axis["default"])
    f.set_variation_by_axes(values)
    return f


def canvas() -> Image.Image:
    return Image.new("RGBA", (W, H), (0, 0, 0, 0))


def _tracked(draw: ImageDraw.ImageDraw, xy, text: str, fnt, fill, tracking: float) -> float:
    """Texte avec espacement des lettres (équivalent `tracking-widest`). Retourne la largeur."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill, anchor="ls")
        x += fnt.getlength(ch) + tracking
    return x - xy[0] - tracking


def _wrap(text: str, fnt, max_w: float) -> list[str]:
    lines, cur = [], ""
    for word in text.split():
        trial = (cur + " " + word).strip()
        if fnt.getlength(trial) <= max_w or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


# --- marque -------------------------------------------------------------------
def render_brand(accent: str) -> Image.Image:
    """Logo texte centré, gros et lisible : pastille d'accent + LLAMAKUSI en blanc."""
    img = canvas()
    d = ImageDraw.Draw(img)
    fnt = font("montserrat", 50, 900)
    text, tracking, dot, gap = "LLAMAKUSI", 9, 26, 22
    text_w = sum(fnt.getlength(c) for c in text) + tracking * (len(text) - 1)
    x = config.CONTENT_CX - (dot + gap + text_w) / 2
    y = LAYOUT["brand_y"]
    cy = y - 18
    d.ellipse((x, cy - dot / 2, x + dot, cy + dot / 2), fill=rgb(config.ACCENTS[accent]))
    _tracked(d, (x + dot + gap, y), text, fnt, rgb(COLORS["white"], 235), tracking)
    return img


# --- mascotte -------------------------------------------------------------------
def render_mascot(expression: str, pose: int) -> Image.Image:
    mood = config.MASCOT_MOOD[expression]
    path = config.MASCOT_DIR / f"{mood}_{pose}_transparent.webp"
    if not path.exists():
        raise FileNotFoundError(f"mascotte absente : {path} → `python cli.py fetch-assets` "
                                "(ou `--placeholder-mascots` pour tester sans assets)")
    src = Image.open(path).convert("RGBA")
    bbox = src.getchannel("A").getbbox()
    if bbox:
        src = src.crop(bbox)
    scale = LAYOUT["mascot_h"] / src.height
    src = src.resize((max(1, int(src.width * scale)), LAYOUT["mascot_h"]), Image.LANCZOS)
    img = canvas()
    img.alpha_composite(src, ((W - src.width) // 2, LAYOUT["mascot_bottom"] - src.height))
    return img


# --- overlays -------------------------------------------------------------------
def _pill(img: Image.Image, cx: int, cy: int, text: str, fnt_family: str, size: int, weight: int,
          fill: str, ink: str, pad_x: int, pad_y: int, max_w: int, upper: bool = True) -> None:
    text = text.upper() if upper else text
    while True:
        fnt = font(fnt_family, size, weight)
        w = fnt.getlength(text)
        if w + 2 * pad_x <= max_w or size <= 24:
            break
        size -= 4
    S = 3
    tw, th = int(w + 2 * pad_x), int(size * 1.0 + 2 * pad_y)
    tile = Image.new("RGBA", (tw * S, th * S), (0, 0, 0, 0))
    td = ImageDraw.Draw(tile)
    td.rounded_rectangle((0, 0, tw * S - 1, th * S - 1), radius=th * S // 2, fill=rgb(fill))
    td.text((tw * S / 2, th * S / 2), text, font=font(fnt_family, size * S, weight),
            fill=rgb(ink), anchor="mm")
    tile = tile.resize((tw, th), Image.LANCZOS)
    img.alpha_composite(tile, (int(cx - tw / 2), int(cy - th / 2)))


def render_overlay(text: str) -> Image.Image:
    """Gros badge d'accroche (fond doré, texte sombre)."""
    img = canvas()
    _pill(img, config.CONTENT_CX, LAYOUT["overlay_cy"], text, "montserrat", 84, 900,
          COLORS["gold"], COLORS["ink"], 48, 26, config.CONTENT_W)
    return img


def render_cta(text: str) -> Image.Image:
    """Petit CTA discret centré sous la mascotte (jamais parlé en Short)."""
    img = canvas()
    _pill(img, config.CONTENT_CX, LAYOUT["cta_cy"], text, "montserrat", 32, 900,
          "#27272A", COLORS["white"], 30, 18, config.CONTENT_W, upper=True)
    return img


# --- sous-titres karaoké ---------------------------------------------------------
def render_subs(texts: list[str], active: int) -> Image.Image:
    img = canvas()
    d = ImageDraw.Draw(img)
    size = 70
    while True:
        fnt = font("montserrat", size, 800)
        space = fnt.getlength(" ")
        widths = [fnt.getlength(t) for t in texts]
        total = sum(widths) + space * (len(texts) - 1)
        if total <= config.SUBS_MAX_W or size <= 46:
            break
        size -= 4
    x = config.CONTENT_CX - total / 2
    y = LAYOUT["subs_cy"]
    spans = []
    for t, wd in zip(texts, widths):
        spans.append((t, x))
        x += wd + space
    stroke = max(6, size // 9)
    for t, sx in spans:                       # 1) contours, 2) remplissages (pas de bavure)
        d.text((sx, y), t, font=fnt, fill=rgb(COLORS["black"]), anchor="lm",
               stroke_width=stroke, stroke_fill=rgb(COLORS["black"]))
    for k, (t, sx) in enumerate(spans):
        d.text((sx, y), t, font=fnt, anchor="lm",
               fill=rgb(COLORS["gold"] if k == active else COLORS["white"]))
    return img


# --- cartes ----------------------------------------------------------------------
def _card_base(w: int, h: int, accent: str, S: int) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    tile = Image.new("RGBA", (w * S, h * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(tile)
    r = 52 * S                                      # rounded-3xl (à l'échelle du 1080 px)
    d.rounded_rectangle((0, 0, w * S - 1, h * S - 1), radius=r, fill=rgb(config.ACCENT_BAR[accent]))
    d.rounded_rectangle((0, 8 * S, w * S - 1, h * S - 1), radius=r, fill=rgb(COLORS["card"]))
    return tile, d


def _paste_card(tile: Image.Image, w: int, h: int) -> Image.Image:
    img = canvas()
    tile = tile.resize((w, h), Image.LANCZOS)
    y = LAYOUT["card_y"] + max(0, (LAYOUT["card_max_h"] - h) // 2)
    img.alpha_composite(tile, (config.CONTENT_X0, y))
    return img


def render_question_card(data: dict, state: str, accent: str) -> Image.Image:
    S, pad = 2, 40
    cw = config.CONTENT_W
    question = data["question"]
    choices = list(data["choices"])
    correct = str(data.get("correct", "")).upper()
    label = data.get("label", "Examen civique · Question")
    row_h, gap = 84, 12

    for qs in (46, 42, 38, 34, 30):
        qf = font("montserrat", qs * S, 700)
        lines = _wrap(question, qf, (cw - 2 * pad) * S)
        q_h = len(lines) * qs * 1.28
        h = pad + 8 + 24 + 16 + q_h + 22 + len(choices) * row_h + (len(choices) - 1) * gap + pad
        if h <= LAYOUT["card_max_h"]:
            break
    h = int(h)
    tile, d = _card_base(cw, h, accent, S)
    y = (pad + 8) * S
    _tracked(d, (pad * S, y + 24 * S), label.upper(), font("montserrat", 24 * S, 900),
             rgb(COLORS["ink2"]), 4 * S)
    y += (24 + 16) * S
    for line in lines:
        d.text((pad * S, y), line, font=qf, fill=rgb(COLORS["ink"]), anchor="lt")
        y += int(qs * 1.28 * S)
    y += 22 * S

    for k, choice in enumerate(choices):
        letter = "ABCD"[k]
        is_correct = state == "revealed" and letter == correct
        dim = state == "revealed" and not is_correct
        x0, x1, y0, y1 = pad * S, (cw - pad) * S, y, y + row_h * S
        fill = COLORS["gold_soft"] if is_correct else COLORS["card"]
        border = COLORS["gold"] if is_correct else (COLORS["soft"] if dim else COLORS["line"])
        d.rounded_rectangle((x0, y0, x1, y1), radius=28 * S, fill=rgb(fill), outline=rgb(border),
                            width=(5 if is_correct else 2) * S)
        cx, cy = x0 + 42 * S, (y0 + y1) // 2
        d.ellipse((cx - 26 * S, cy - 26 * S, cx + 26 * S, cy + 26 * S),
                  fill=rgb(COLORS["gold"] if is_correct else COLORS["soft"]))
        d.text((cx, cy), letter, font=font("montserrat", 28 * S, 900), anchor="mm",
               fill=rgb(COLORS["ink"] if is_correct else (COLORS["muted"] if dim else COLORS["ink2"])))
        size = 32
        avail = (x1 - (x0 + 92 * S) - 20 * S)
        while font("inter", size * S, 500).getlength(choice) > avail and size > 22:
            size -= 2
        d.text((x0 + 92 * S, cy), choice, anchor="lm",
               font=font("inter", size * S, 700 if is_correct else 500),
               fill=rgb(COLORS["ink"] if is_correct else (COLORS["muted"] if dim else COLORS["ink2"])))
        y += (row_h + gap) * S
    return _paste_card(tile, cw, h)



def render_compare_card(data: dict, state: str, accent: str) -> Image.Image:
    """Deux colonnes (ex. B1 | B2, TEF | TCF), lignes label + 2 cellules.

    data = {label, left:{title,subtitle?}, right:{...}, contrast: bool,
            rows:[{label, left, right, highlight?: bool}]}
    - contrast=True : la colonne de droite est teintée (avant → après).
    - state="revealed" : seules les lignes `highlight` restent en évidence (dorées), les autres s'estompent.
    """
    S, pad, gap = 2, 40, 20
    cw = config.CONTENT_W
    col_w = (cw - 2 * pad - gap) // 2
    rows = data["rows"]
    contrast = bool(data.get("contrast", False))
    label = data.get("label", "Comparatif")

    for size in (32, 30, 28, 26, 24):
        cf = font("inter", size * S, 500)
        wrapped = [(_wrap(str(r["left"]), cf, (col_w - 40) * S), _wrap(str(r["right"]), cf, (col_w - 40) * S))
                   for r in rows]
        cell_hs = [max(len(a), len(b)) * int(size * 1.3) + 32 for a, b in wrapped]
        head_h = 118
        h = pad + 8 + 24 + 18 + head_h + 22 + sum(26 + 8 + c + 16 for c in cell_hs) + pad - 16
        if h <= LAYOUT["card_max_h"]:
            break
    h = int(h)
    tile, d = _card_base(cw, h, accent, S)
    y = (pad + 8) * S
    _tracked(d, (pad * S, y + 24 * S), label.upper(), font("montserrat", 24 * S, 900),
             rgb(COLORS["ink2"]), 4 * S)
    y += (24 + 18) * S

    def col_x(k: int) -> int:
        return (pad + k * (col_w + gap)) * S

    for k, side in enumerate(("left", "right")):
        meta = data[side]
        x0 = col_x(k)
        tinted = contrast and k == 1
        d.rounded_rectangle((x0, y, x0 + col_w * S, y + head_h * S), radius=28 * S,
                            fill=rgb(config.ACCENTS[accent] if tinted else COLORS["ink"]))
        ink = COLORS["ink"] if (tinted and accent == "gold") else COLORS["white"]
        d.text((x0 + col_w * S // 2, y + (head_h * S) // 2 - (14 * S if meta.get("subtitle") else 0)),
               str(meta["title"]), font=font("montserrat", 54 * S, 900), fill=rgb(ink), anchor="mm")
        if meta.get("subtitle"):
            d.text((x0 + col_w * S // 2, y + head_h * S - 30 * S), str(meta["subtitle"]),
                   font=font("inter", 24 * S, 500), fill=rgb(ink), anchor="mm")
    y += (head_h + 22) * S

    for r, (la, ra), ch in zip(rows, wrapped, cell_hs):
        hl = bool(r.get("highlight"))
        dim = state == "revealed" and not hl
        on = state == "revealed" and hl
        _tracked(d, (pad * S, y + 26 * S), str(r["label"]).upper(), font("montserrat", 20 * S, 900),
                 rgb(COLORS["muted"] if dim else COLORS["ink2"]), 3 * S)
        y += (26 + 8) * S
        for k, lines in enumerate((la, ra)):
            x0 = col_x(k)
            tinted = contrast and k == 1 and not dim
            fill = COLORS["gold_soft"] if (on or tinted) else COLORS["soft"]
            border = COLORS["gold"] if on else (COLORS["line"] if not dim else COLORS["soft"])
            d.rounded_rectangle((x0, y, x0 + col_w * S, y + ch * S), radius=24 * S, fill=rgb(fill),
                                outline=rgb(border), width=(5 if on else 2) * S)
            ty = y + 16 * S
            for line in lines:
                d.text((x0 + 20 * S, ty), line, font=cf, anchor="lt",
                       fill=rgb(COLORS["muted"] if dim else COLORS["ink"]))
                ty += int(size * 1.3 * S)
        y += (ch + 16) * S
    return _paste_card(tile, cw, h)


def render_placeholder_card(kind: str, note: str, accent: str) -> Image.Image:
    S, pad, cw, h = 2, 40, config.CONTENT_W, 560
    tile, d = _card_base(cw, h, accent, S)
    _tracked(d, (pad * S, (pad + 40) * S), f"CARTE « {kind.upper()} » · PLACEHOLDER",
             font("montserrat", 22 * S, 900), rgb(COLORS["ink2"]), 3 * S)
    fnt = font("inter", 32 * S, 500)
    y = (pad + 90) * S
    for line in _wrap(note or "(pas de description)", fnt, (cw - 2 * pad) * S)[:9]:
        d.text((pad * S, y), line, font=fnt, fill=rgb(COLORS["ink2"]), anchor="lt")
        y += 46 * S
    return _paste_card(tile, cw, h)


def render_card(kind: str, data: dict, state: str, accent: str, note: str = "") -> Image.Image:
    if kind == "question":
        return render_question_card(data, state, accent)
    if kind == "compare" and data.get("rows"):
        return render_compare_card(data, state, accent)
    return render_placeholder_card(kind, note, accent)
