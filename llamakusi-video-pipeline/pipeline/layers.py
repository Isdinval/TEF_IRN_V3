"""Rendu des calques (PNG RGBA plein cadre, taille du profil actif : 1080×1920 Short / 1920×1080 Long) avec Pillow.

Choix : Pillow plutôt que Playwright pour le MVP (0 dépendance navigateur, rendu
déterministe, testable). Les tokens (couleurs, polices, rayons) sont ceux du design
system. Si une carte devient trop complexe pour Pillow, on passera ce module en
HTML/Playwright sans changer le contrat (timeline.json ne référence que des PNG).
"""
from __future__ import annotations

from functools import lru_cache

from PIL import Image, ImageDraw, ImageFont

from . import config
from .config import COLORS, LAYOUT
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
    return Image.new("RGBA", (config.W, config.H), (0, 0, 0, 0))


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
    size = LAYOUT["brand_size"]
    k = size / 50                                   # dimensions calées sur 50 px (Short), proportionnelles
    fnt = font("montserrat", size, 900)
    text, tracking, dot, gap = "LLAMAKUSI", 9 * k, 26 * k, 22 * k
    text_w = sum(fnt.getlength(c) for c in text) + tracking * (len(text) - 1)
    total = dot + gap + text_w
    x = LAYOUT["brand_x"] - (total / 2 if LAYOUT["brand_align"] == "center" else 0)
    y = LAYOUT["brand_y"]
    cy = y - 18 * k
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
    img.alpha_composite(src, (LAYOUT["mascot_cx"] - (src.width + 1) // 2, LAYOUT["mascot_bottom"] - src.height))
    return img


# --- overlays -------------------------------------------------------------------
def _pill(img: Image.Image, cx: int, cy: int, text: str, fnt_family: str, size: int, weight: int,
          fill: str, ink: str, pad_x: int, pad_y: int, max_w: int, upper: bool = True,
          reserve_right: int = 0) -> tuple[int, int, int, float]:
    """Dessine le pill ; retourne (x gauche, y haut, largeur, largeur du texte).
    `reserve_right` = espace vide à droite du texte (ex. pour une flèche animée)."""
    text = text.upper() if upper else text
    while True:
        fnt = font(fnt_family, size, weight)
        w = fnt.getlength(text)
        if w + 2 * pad_x + reserve_right <= max_w or size <= 24:
            break
        size -= 4
    S = 3
    tw, th = int(w + 2 * pad_x + reserve_right), int(size * 1.0 + 2 * pad_y)
    tile = Image.new("RGBA", (tw * S, th * S), (0, 0, 0, 0))
    td = ImageDraw.Draw(tile)
    td.rounded_rectangle((0, 0, tw * S - 1, th * S - 1), radius=th * S // 2, fill=rgb(fill))
    td.text(((pad_x + w / 2) * S, th * S / 2), text, font=font(fnt_family, size * S, weight),
            fill=rgb(ink), anchor="mm")
    tile = tile.resize((tw, th), Image.LANCZOS)
    left, top = int(cx - tw / 2), int(cy - th / 2)
    img.alpha_composite(tile, (left, top))
    return left, top, tw, w


def render_overlay(text: str) -> Image.Image:
    """Gros badge d'accroche (fond doré, texte sombre)."""
    img = canvas()
    _pill(img, config.CONTENT_CX, LAYOUT["overlay_cy"], text, "montserrat", 84, 900,
          COLORS["gold"], COLORS["ink"], 48, 26, config.CONTENT_W)
    return img


_CTA_PAD_X = 30


def render_cta(text: str, arrow: bool = False) -> Image.Image:
    """Petit CTA discret centré sous la mascotte (jamais parlé en Short).
    `arrow=True` réserve à droite la place de la flèche animée (voir render_cta_arrow)."""
    img = canvas()
    _pill(img, LAYOUT["cta_cx"], LAYOUT["cta_cy"], text, "montserrat", 32, 900,
          "#27272A", COLORS["white"], _CTA_PAD_X, 18, LAYOUT["cta_max_w"], upper=True,
          reserve_right=config.ARROW_SLOT if arrow else 0)
    return img


def render_cta_arrow(phase: int, text: str) -> Image.Image:
    """Chevron « ⌄ » doré dans la zone réservée du pill CTA ; `phase` (0..ARROW_PHASES-1) = position dans le rebond."""
    import math
    img = canvas()
    d = ImageDraw.Draw(img)
    fnt = font("montserrat", 32, 900)
    tw = int(fnt.getlength(text.upper()) + 2 * _CTA_PAD_X + config.ARROW_SLOT)
    left = int(LAYOUT["cta_cx"] - tw / 2)
    cx = left + _CTA_PAD_X + fnt.getlength(text.upper()) + config.ARROW_SLOT / 2
    t = (phase % config.ARROW_PHASES) / config.ARROW_PHASES
    dy = config.ARROW_BOUNCE * (0.5 - 0.5 * math.cos(2 * math.pi * t)) - config.ARROW_BOUNCE / 2   # doux, centré
    cy = LAYOUT["cta_cy"] + 2 + dy
    half, drop, width = 15, 10, 7
    pts = [(cx - half, cy - drop / 2), (cx, cy + drop / 2), (cx + half, cy - drop / 2)]
    col = rgb(COLORS["gold"])
    d.line(pts, fill=col, width=width, joint="curve")
    for x, y in (pts[0], pts[2]):
        d.ellipse((x - width / 2, y - width / 2, x + width / 2, y + width / 2), fill=col)
    return img


# --- titre de chapitre (vidéo longue) ---------------------------------------------------------
def render_chapter(index: int, title: str) -> Image.Image:
    """En haut à DROITE (16:9) : « CHAPITRE n » en petit + titre ; aligné sur la marge droite = marge gauche du logo."""
    img = canvas()
    d = ImageDraw.Draw(img)
    right = config.W - LAYOUT["brand_x"]
    max_w = config.W - 2 * LAYOUT["brand_x"] - 520                   # laisse la place du logo à gauche
    size = 38
    while size > 26 and font("montserrat", size, 800).getlength(title) > max_w:
        size -= 2
    label = f"CHAPITRE {index}"
    lf = font("montserrat", 20, 900)
    lw = sum(lf.getlength(c) for c in label) + 4 * (len(label) - 1)
    _tracked(d, (right - lw, LAYOUT["brand_y"] - 44), label, lf, rgb(COLORS["gold"]), 4)
    d.text((right, LAYOUT["brand_y"]), title, font=font("montserrat", size, 800), anchor="rs",
           fill=rgb(COLORS["white"], 235))
    return img


# --- sous-titres karaoké ---------------------------------------------------------
def render_subs(texts: list[str], active: int) -> Image.Image:
    img = canvas()
    d = ImageDraw.Draw(img)
    size = LAYOUT["subs_size"]
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


def _terms_layout(data: dict) -> dict:
    """Mise en page de la carte `terms`, calculée sur TOUS les items (hauteur constante entre les étapes,
    sinon la carte « saute » à chaque apparition)."""
    S, pad, cw = 2, 40, config.CONTENT_W
    items = data["items"]
    gap, num_w = 14, 92
    for term_size, def_size in ((42, 30), (40, 28), (38, 26), (34, 24), (30, 22)):
        tf, df = font("montserrat", term_size * S, 900), font("inter", def_size * S, 500)
        avail = (cw - 2 * pad - num_w - 24) * S
        wrapped = [_wrap(str(it.get("definition", "")), df, avail) for it in items]
        lh = int(def_size * 1.3)
        row_h = 22 + int(term_size * 1.15) + 8 + max((len(w) for w in wrapped), default=0) * lh + 22
        h = pad + 8 + 24 + 18 + len(items) * row_h + (len(items) - 1) * gap + pad - 8
        if h <= LAYOUT["card_max_h"]:
            break
    return {"S": S, "pad": pad, "cw": cw, "h": int(h), "row_h": row_h, "gap": gap, "num_w": num_w,
            "term_size": term_size, "def_size": def_size, "wrapped": wrapped, "lh": lh}


def render_terms_card(data: dict, state: str, accent: str, visible: int | None = None,
                      focus: bool = True) -> Image.Image:
    """Carte « vocabulaire » : N lignes (terme + définition) qui apparaissent une à une.

    data = {label?, items:[{term, definition, at?}]}
    - `visible` = nombre d'items dévoilés (les autres restent des cases « ? »).
    - `focus` : le dernier item dévoilé est mis en évidence (bordure dorée) ;
    - state=\"revealed\" = tous en évidence.
    """
    L = _terms_layout(data)
    S, pad, cw, row_h, gap = L["S"], L["pad"], L["cw"], L["row_h"], L["gap"]
    items = data["items"]
    n_visible = len(items) if (state == "revealed" or visible is None) else max(0, min(visible, len(items)))
    label = data.get("label", "Vocabulaire")
    tile, d = _card_base(cw, L["h"], accent, S)
    y = (pad + 8) * S
    _tracked(d, (pad * S, y + 24 * S), label.upper(), font("montserrat", 24 * S, 900),
             rgb(COLORS["ink2"]), 4 * S)
    y += (24 + 18) * S
    tf = font("montserrat", L["term_size"] * S, 900)
    df = font("inter", L["def_size"] * S, 500)
    for k, item in enumerate(items):
        shown = k < n_visible
        hl = shown and (state == "revealed" or (focus and k == n_visible - 1))
        x0, x1, y0, y1 = pad * S, (cw - pad) * S, y, y + row_h * S
        fill = COLORS["gold_soft"] if hl else (COLORS["card"] if shown else COLORS["soft"])
        border = COLORS["gold"] if hl else COLORS["line"]
        d.rounded_rectangle((x0, y0, x1, y1), radius=28 * S, fill=rgb(fill), outline=rgb(border),
                            width=(5 if hl else 2) * S)
        cx, cy = x0 + 46 * S, y0 + 22 * S + int(L["term_size"] * 1.15 * S) // 2
        d.ellipse((cx - 26 * S, cy - 26 * S, cx + 26 * S, cy + 26 * S),
                  fill=rgb(COLORS["gold"] if hl else COLORS["soft"] if not shown else COLORS["ink"]))
        d.text((cx, cy), str(k + 1), font=font("montserrat", 28 * S, 900), anchor="mm",
               fill=rgb(COLORS["ink"] if hl else (COLORS["muted"] if not shown else COLORS["white"])))
        tx = x0 + L["num_w"] * S
        if shown:
            d.text((tx, cy), str(item["term"]), font=tf, fill=rgb(COLORS["ink"]), anchor="lm")
            ty = y0 + (22 + int(L["term_size"] * 1.15) + 8) * S
            for line in L["wrapped"][k]:
                d.text((tx, ty), line, font=df, fill=rgb(COLORS["ink2"]), anchor="lt")
                ty += int(L["lh"] * S)
        else:
            d.text((tx, cy), "?", font=tf, fill=rgb(COLORS["muted"]), anchor="lm")
        y += (row_h + gap) * S
    return _paste_card(tile, cw, L["h"])


def _plan_layout(data: dict) -> dict:
    """Mise en page de la carte `plan`, calculée sur TOUTES les étapes (hauteur constante entre les apparitions)."""
    S, pad, cw = 2, 40, config.CONTENT_W
    items = data["items"]
    gap, num_w = 14, 92
    has_detail = any(str(i.get("detail", "")).strip() for i in items)
    for ts, ds in ((44, 28), (40, 26), (36, 24), (32, 22), (28, 20)):
        tf, df = font("montserrat", ts * S, 900), font("inter", ds * S, 500)
        avail = (cw - 2 * pad - num_w - 24) * S
        tw = [_wrap(str(i["title"]), tf, avail) for i in items]
        dw = [_wrap(str(i.get("detail", "")), df, avail) if str(i.get("detail", "")).strip() else [] for i in items]
        tlh, dlh = int(ts * 1.2), int(ds * 1.3)
        row_h = 20 + max(len(t) for t in tw) * tlh + (6 + max(len(d) for d in dw) * dlh if has_detail else 0) + 20
        h = pad + 8 + 24 + 18 + len(items) * row_h + (len(items) - 1) * gap + pad - 8
        if h <= LAYOUT["card_max_h"]:
            break
    return {"S": S, "pad": pad, "cw": cw, "h": int(h), "row_h": row_h, "gap": gap, "num_w": num_w, "ts": ts, "ds": ds,
            "tw": tw, "dw": dw, "tlh": tlh, "dlh": dlh}


def render_plan_card(data: dict, state: str, accent: str, visible: int | None = None,
                     focus: bool = True) -> Image.Image:
    """Carte « plan » (vidéo longue) : N étapes numérotées reliées par un fil, qui apparaissent une à une.

    data = {label?, items:[{title, detail?, at?}]} — mêmes règles que `terms` (visible / focus / revealed).
    Les étapes pas encore annoncées restent des cases vides « … ».
    """
    L = _plan_layout(data)
    S, pad, cw, row_h, gap = L["S"], L["pad"], L["cw"], L["row_h"], L["gap"]
    items = data["items"]
    n_visible = len(items) if (state == "revealed" or visible is None) else max(0, min(visible, len(items)))
    tile, d = _card_base(cw, L["h"], accent, S)
    y = (pad + 8) * S
    _tracked(d, (pad * S, y + 24 * S), str(data.get("label", "Au programme")).upper(),
             font("montserrat", 24 * S, 900), rgb(COLORS["ink2"]), 4 * S)
    y += (24 + 18) * S
    tf, df = font("montserrat", L["ts"] * S, 900), font("inter", L["ds"] * S, 500)
    cx = pad * S + 46 * S
    centers = [y + (k * (row_h + gap) + 20) * S + int(L["ts"] * 0.6 * S) for k in range(len(items))]
    for k in range(len(items) - 1):                                       # fil entre les pastilles
        d.line((cx, centers[k], cx, centers[k + 1]), fill=rgb(COLORS["line"]), width=4 * S)
    for k, item in enumerate(items):
        shown = k < n_visible
        hl = shown and (state == "revealed" or (focus and k == n_visible - 1))
        x0, x1, y0, y1 = pad * S, (cw - pad) * S, y, y + row_h * S
        fill = COLORS["gold_soft"] if hl else (COLORS["card"] if shown else COLORS["soft"])
        d.rounded_rectangle((x0, y0, x1, y1), radius=28 * S, fill=rgb(fill),
                            outline=rgb(COLORS["gold"] if hl else COLORS["line"]), width=(5 if hl else 2) * S)
        cy = centers[k]
        d.ellipse((cx - 26 * S, cy - 26 * S, cx + 26 * S, cy + 26 * S),
                  fill=rgb(COLORS["gold"] if hl else COLORS["soft"] if not shown else COLORS["ink"]))
        d.text((cx, cy), str(k + 1), font=font("montserrat", 28 * S, 900), anchor="mm",
               fill=rgb(COLORS["ink"] if hl else (COLORS["muted"] if not shown else COLORS["white"])))
        tx, ty = x0 + L["num_w"] * S, y0 + 20 * S
        if shown:
            for line in L["tw"][k]:
                d.text((tx, ty), line, font=tf, fill=rgb(COLORS["ink"]), anchor="lt")
                ty += L["tlh"] * S
            ty += 6 * S
            for line in L["dw"][k]:
                d.text((tx, ty), line, font=df, fill=rgb(COLORS["ink2"]), anchor="lt")
                ty += L["dlh"] * S
        else:
            d.text((tx, ty), "…", font=tf, fill=rgb(COLORS["muted"]), anchor="lt")
        y += (row_h + gap) * S
    return _paste_card(tile, cw, L["h"])


ROLE_ACCENT = {"intro": "indigo", "argument": "blue", "conclusion": "gold"}


def _tint(hex_color: str, k: float = 0.16) -> tuple[int, int, int]:
    """Teinte très claire d'une couleur (k = part de la couleur mélangée à du blanc)."""
    return tuple(int(255 - (255 - c) * k) for c in rgb(hex_color)[:3])


def _part_tag(part: dict) -> str:
    return str(part.get("label") or part["role"]).upper()


def _text_layout(data: dict) -> dict:
    """Mise en page de `text_annotated`, calculée sur TOUTES les parties : la carte garde la même hauteur
    avant/après réorganisation (l'ordre change, pas la taille)."""
    S, pad, cw = 2, 40, config.CONTENT_W
    parts = data["parts"]
    gap, pad_top, pad_bot, overhang = 20, 26, 16, 20
    for size in (30, 28, 26, 24, 22):
        df = font("inter", size * S, 500)
        avail = (cw - 2 * pad - 2 * 28) * S
        wrapped = [_wrap(str(p["text"]), df, avail) for p in parts]
        lh = int(size * 1.32)
        rows = [pad_top + pad_bot + len(w) * lh for w in wrapped]
        h = pad + 8 + 24 + 18 + overhang + sum(rows) + gap * (len(parts) - 1) + pad - 8
        if h <= LAYOUT["card_max_h"]:
            break
    return {"S": S, "pad": pad, "cw": cw, "h": int(h), "size": size, "lh": lh, "rows": rows,
            "wrapped": wrapped, "gap": gap, "pad_top": pad_top, "overhang": overhang}


def render_text_annotated_card(data: dict, state: str, accent: str, visible: int | None = None,
                               focus: bool = True) -> Image.Image:
    """Carte « texte annoté » : les phrases d'un texte, d'abord DÉSORDONNÉES puis RÉORGANISÉES en blocs.

    data = {label?, shuffled?, parts:[{role: intro|argument|conclusion, text, label?, at?}]}
    - `parts` est dans l'ordre LOGIQUE (c'est aussi l'ordre dans lequel la voix les nomme) ;
      `shuffled` = ordre d'affichage avant réorganisation (défaut : ordre inverse).
    - `visible` = nombre de parties déjà étiquetées (étiquette-pastille qui chevauche le cadre) ;
    - state="revealed" = ordre logique, tout étiqueté et coloré.
    """
    L = _text_layout(data)
    S, pad, cw, gap = L["S"], L["pad"], L["cw"], L["gap"]
    parts = data["parts"]
    n = len(parts)
    revealed = state == "revealed"
    n_lab = n if (revealed or visible is None) else max(0, min(visible, n))
    order = list(range(n)) if revealed else list(data.get("shuffled") or reversed(range(n)))
    tile, d = _card_base(cw, L["h"], accent, S)
    y = (pad + 8) * S
    _tracked(d, (pad * S, y + 24 * S), str(data.get("label", "Exemple de réponse écrite")).upper(),
             font("montserrat", 24 * S, 900), rgb(COLORS["ink2"]), 4 * S)
    y += (24 + 18 + L["overhang"]) * S
    df = font("inter", L["size"] * S, 500)
    pf = font("montserrat", 20 * S, 900)
    for idx in order:
        part = parts[idx]
        labeled = idx < n_lab                          # `parts` est dans l'ordre de la voix
        color = config.ACCENTS[ROLE_ACCENT[part["role"]]]
        hl = labeled and focus and not revealed and idx == n_lab - 1
        x0, x1, y0, y1 = pad * S, (cw - pad) * S, y, y + L["rows"][idx] * S
        d.rounded_rectangle((x0, y0, x1, y1), radius=26 * S,
                            fill=_tint(color) if labeled else rgb(COLORS["soft"]),
                            outline=rgb(color) if labeled else rgb(COLORS["line"]),
                            width=(6 if hl else 3 if labeled else 2) * S)
        ty = y0 + L["pad_top"] * S
        for line in L["wrapped"][idx]:
            d.text((x0 + 28 * S, ty), line, font=df, fill=rgb(COLORS["ink"]), anchor="lt")
            ty += int(L["lh"] * S)
        if labeled:                                    # pastille d'étiquette, à cheval sur le bord haut
            tag, tr = _part_tag(part), 2 * S
            tw = sum(pf.getlength(c) for c in tag) + tr * (len(tag) - 1)
            pw, ph = int(tw + 40 * S), 30 * S
            px1 = x1 - 28 * S
            d.rounded_rectangle((px1 - pw, y0 - ph // 2, px1, y0 + ph // 2), radius=ph // 2,
                                fill=rgb(color))
            ink = COLORS["ink"] if part["role"] == "conclusion" else COLORS["white"]
            _tracked(d, (px1 - pw + 20 * S, y0 + int(0.36 * 20 * S)), tag, pf, rgb(ink), tr)
        y += (L["rows"][idx] + gap) * S
    return _paste_card(tile, cw, L["h"])


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


def render_card(kind: str, data: dict, state: str, accent: str, note: str = "",
                visible: int | None = None, focus: bool = True) -> Image.Image:
    if kind == "question":
        return render_question_card(data, state, accent)
    if kind == "compare" and data.get("rows"):
        return render_compare_card(data, state, accent)
    if kind == "terms" and data.get("items"):
        return render_terms_card(data, state, accent, visible, focus)
    if kind == "plan" and data.get("items"):
        return render_plan_card(data, state, accent, visible, focus)
    if kind == "text_annotated" and data.get("parts"):
        return render_text_annotated_card(data, state, accent, visible, focus)
    return render_placeholder_card(kind, note, accent)
