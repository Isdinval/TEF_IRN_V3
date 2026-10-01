"""Fond motion design en BOUCLE PARFAITE (couche A) : halos + balayage lumineux + grille en perspective
+ particules + formes line-art, pré-rendu UNE fois par (format, accent, variante) puis réutilisé.

Tout mouvement fait un nombre entier de cycles sur MOTION_LOOP_S → image(0) == image(LOOP) : la boucle
`-stream_loop` est invisible (pas de boomerang). Les éléments décoratifs peuvent aller dans les zones UI
(bas / droite) : seul le contenu important doit les éviter. Ils sont évités derrière la carte et atténués
derrière les sous-titres (lisibilité).
"""
from __future__ import annotations

import hashlib
import math
import subprocess
import zlib
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from . import background, config


def _rgb(hex_color: str) -> tuple[int, int, int]:
    h = hex_color.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def variant_for(script_id: str) -> int:
    """Variante stable par script (rotation des fonds sans réglage manuel)."""
    return zlib.crc32(script_id.encode("utf-8")) % config.MOTION_VARIANTS


def _content_rects() -> list[tuple[float, float, float, float]]:
    """Zones où ne PAS poser de forme : carte et bande des sous-titres (profil actif)."""
    L = config.LAYOUT
    card = (config.CONTENT_X0 - 30, L["card_y"] - 30,
            config.CONTENT_X0 + config.CONTENT_W + 30, L["card_y"] + L["card_max_h"] + 30)
    subs = (config.CONTENT_CX - config.SUBS_MAX_W / 2, L["subs_cy"] - 70,
            config.CONTENT_CX + config.SUBS_MAX_W / 2, L["subs_cy"] + 70)
    return [card, subs]


class _Scene:
    """Éléments tirés au hasard (graine = variante) une fois ; `frame(t)` les place à l'instant t."""

    def __init__(self, accent: str, variant: int):
        self.accent, W, H = accent, config.W, config.H
        rng = np.random.default_rng(1000 + variant)
        self.line = _rgb(config.ACCENT_BAR[accent])
        self.gold = _rgb(config.COLORS["gold"])
        self.white = (255, 255, 255)
        self.horizon = H * (0.64 if W < H else 0.72)
        self.grid_cycles = int(rng.choice([3, 4]))
        # sous-titres : atténuation des éléments (masque vertical multiplié à l'alpha)
        ys = np.arange(H, dtype=np.float32)
        band = np.exp(-((ys - config.LAYOUT["subs_cy"]) ** 2) / (2 * 60.0 ** 2))
        self.subs_mask = (1.0 - 0.7 * band)[:, None]
        # fondu de la grille vers l'horizon
        self.grid_mask = np.clip((ys - self.horizon) / (H * 0.12), 0, 1)[:, None]
        # particules
        n = 70 if W < H else 80
        self.parts = [dict(x=rng.uniform(0, W), y=rng.uniform(0, H), n=int(rng.choice([1, 2])),
                           amp=rng.uniform(8, 36), sc=int(rng.choice([1, 2, 3])), ph=rng.uniform(0, 6.28),
                           r=rng.uniform(1.6, 4.2), tw=int(rng.choice([2, 3, 4])),
                           col=[self.white, self.gold, self.line][int(rng.choice(3, p=[0.45, 0.25, 0.30]))])
                      for _ in range(n)]
        # formes line-art (hors zones de contenu)
        kinds = ["ring", "square", "plus", "triangle", "doc", "bubble", "check", "star"]
        rects, self.shapes, tries = _content_rects(), [], 0
        while len(self.shapes) < config.MOTION_SHAPES and tries < 2000:
            tries += 1
            x, y, s = rng.uniform(40, W - 40), rng.uniform(220, H - 30), rng.uniform(38, 96)
            if any(x0 - s < x < x1 + s and y0 - s < y < y1 + s for x0, y0, x1, y1 in rects):
                continue
            if any(math.hypot(x - o["x"], y - o["y"]) < 170 for o in self.shapes):
                continue
            self.shapes.append(dict(kind=kinds[len(self.shapes) % len(kinds)], x=x, y=y, s=s,
                                    ax=rng.uniform(14, 40), ay=rng.uniform(14, 40), ph=rng.uniform(0, 6.28),
                                    rot=rng.uniform(12, 30), a=rng.uniform(0.32, 0.50),
                                    col=self.gold if rng.random() < 0.3 else self.line))

    # --- dessin -----------------------------------------------------------------------------------
    def _grid(self, d: ImageDraw.ImageDraw, ph: float) -> None:
        W, H, hz = config.W, config.H, self.horizon
        col = (*self.line, 120)
        dz = 0.14
        for i in range(40):                                 # lignes horizontales qui avancent vers nous
            z = (i + 1 - ph) * dz
            y = hz + (H - hz) * 0.10 / z
            if y > H + 4:
                continue
            if y < hz + 2:
                break
            d.line((0, y, W, y), fill=col, width=2)
        cx = W / 2
        for k in range(-14, 15):                            # lignes de fuite fixes
            d.line((cx + k * W * 0.012, hz, cx + k * W * 0.16, H + 400), fill=col, width=2)

    def _shape(self, d: ImageDraw.ImageDraw, sh: dict, ang: float, x: float, y: float, a: float) -> None:
        col = (*sh["col"], int(255 * a))
        s, w = sh["s"], 3
        def rot(pts):
            c, si = math.cos(ang), math.sin(ang)
            return [(x + px * c - py * si, y + px * si + py * c) for px, py in pts]
        k = sh["kind"]
        if k == "ring":
            d.ellipse((x - s / 2, y - s / 2, x + s / 2, y + s / 2), outline=col, width=w)
        elif k == "square":
            h = s / 2
            d.line(rot([(-h, -h), (h, -h), (h, h), (-h, h), (-h, -h)]), fill=col, width=w, joint="curve")
        elif k == "plus":
            h = s / 2
            d.line(rot([(-h, 0), (h, 0)]), fill=col, width=w)
            d.line(rot([(0, -h), (0, h)]), fill=col, width=w)
        elif k == "triangle":
            h = s / 2
            d.line(rot([(0, -h), (h * 0.87, h * 0.5), (-h * 0.87, h * 0.5), (0, -h)]), fill=col, width=w,
                   joint="curve")
        elif k == "doc":                                    # document (passeport / dossier)
            hw, hh = s * 0.36, s / 2
            d.line(rot([(-hw, -hh), (hw * 0.4, -hh), (hw, -hh * 0.6), (hw, hh), (-hw, hh), (-hw, -hh)]),
                   fill=col, width=w, joint="curve")
            for f in (-0.15, 0.15, 0.45):
                d.line(rot([(-hw * 0.6, hh * f), (hw * 0.6, hh * f)]), fill=col, width=w)
        elif k == "bubble":                                 # bulle de dialogue (oral)
            hw, hh = s / 2, s * 0.34
            d.line(rot([(-hw, -hh), (hw, -hh), (hw, hh), (-hw * 0.2, hh), (-hw * 0.5, hh * 1.7),
                        (-hw * 0.5, hh), (-hw, hh), (-hw, -hh)]), fill=col, width=w, joint="curve")
        elif k == "check":
            h = s / 2
            d.line(rot([(-h, 0), (-h * 0.25, h * 0.7), (h, -h * 0.6)]), fill=col, width=w + 1, joint="curve")
        else:                                               # étoile 4 branches
            h, q = s / 2, s / 8
            d.line(rot([(0, -h), (q, -q), (h, 0), (q, q), (0, h), (-q, q), (-h, 0), (-q, -q), (0, -h)]),
                   fill=col, width=w, joint="curve")

    def frame(self, t: float) -> np.ndarray:
        W, H, L = config.W, config.H, config.MOTION_LOOP_S
        u = (t % L) / L                                     # 0 → 1 sur la boucle
        tau = 2 * math.pi * u
        # 1) base : halos (périodiques sur L) + balayage lumineux diagonal, en basse résolution
        low = background.frame_at(self.accent, t, L).astype(np.float32) / 255.0
        lh, lw = low.shape[:2]
        ys, xs = np.mgrid[0:lh, 0:lw].astype(np.float32)
        p = -0.6 + 2.2 * u                                  # hors champ aux deux bouts → raccord invisible
        diag = (xs / lw * 0.8 + ys / lh * 0.6) / 1.4
        sweep = np.exp(-((diag - p) ** 2) / (2 * 0.06 ** 2)) * config.MOTION_SWEEP
        low = np.clip(low + sweep[..., None] * (np.array(self.line, np.float32) / 255 * 0.6 + 0.4), 0, 1)
        base = Image.fromarray((low * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC).convert("RGBA")

        # 2) éléments nets
        grid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        self._grid(ImageDraw.Draw(grid), (self.grid_cycles * u) % 1.0)
        fg = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(fg)
        for sh in self.shapes:
            x = sh["x"] + sh["ax"] * math.sin(tau + sh["ph"])
            y = sh["y"] + sh["ay"] * math.sin(2 * tau + sh["ph"] * 0.7)
            ang = math.radians(sh["rot"]) * math.sin(tau + sh["ph"] * 1.3)
            a = sh["a"] * (0.75 + 0.25 * math.sin(2 * tau + sh["ph"]))
            self._shape(d, sh, ang, x, y, a)
        span = H + 40
        for pt in self.parts:
            y = (pt["y"] - pt["n"] * span * u) % span - 20
            x = pt["x"] + pt["amp"] * math.sin(pt["sc"] * tau + pt["ph"])
            a = 0.35 + 0.45 * (0.5 + 0.5 * math.sin(pt["tw"] * tau + pt["ph"]))
            r = pt["r"]
            d.ellipse((x - r, y - r, x + r, y + r), fill=(*pt["col"], int(255 * a)))

        ga = np.asarray(grid, dtype=np.float32).copy()
        ga[..., 3] *= self.grid_mask * config.MOTION_GRID_ALPHA
        layer = Image.fromarray(ga.astype(np.uint8))
        layer.alpha_composite(fg)
        la = np.asarray(layer, dtype=np.float32).copy()
        la[..., 3] *= self.subs_mask
        layer = Image.fromarray(la.astype(np.uint8))

        # 3) halo lumineux des éléments (flou à demi-résolution)
        glow = layer.resize((W // 2, H // 2), Image.BILINEAR).filter(ImageFilter.GaussianBlur(6))
        glow = glow.resize((W, H), Image.BILINEAR)
        base.alpha_composite(glow)
        base.alpha_composite(layer)
        return np.asarray(base.convert("RGB"))


def _signature(accent: str, variant: int) -> str:
    src = Path(__file__).read_text(encoding="utf-8") + Path(background.__file__).read_text(encoding="utf-8")
    key = (src + repr(config.BG_PALETTES) + repr(config.ACCENT_BAR) + repr(config.LAYOUT)
           + f"{accent}|{variant}|{config.W}x{config.H}|{config.FPS}|{config.MOTION_LOOP_S}"
           + f"|{config.MOTION_SHAPES}|{config.MOTION_SWEEP}|{config.MOTION_GRID_ALPHA}")
    return hashlib.sha1(key.encode("utf-8")).hexdigest()[:10]


def loop_path(accent: str, variant: int, log=print) -> Path:
    """Boucle motion du profil actif (générée au premier appel, puis en cache dans build/_motion/)."""
    out_dir = config.BUILD_DIR / "_motion"
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / f"motion_{accent}_v{variant}_{config.W}x{config.H}_{_signature(accent, variant)}.mp4"
    if out.exists() and out.stat().st_size > 0:
        return out
    fps, n = config.FPS, round(config.MOTION_LOOP_S * config.FPS)
    log(f"  [fond] génération de la boucle motion {out.name} ({n} images, une seule fois)…")
    scene = _Scene(accent, variant)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{config.W}x{config.H}", "-r", str(fps), "-i", "-",
           "-vf", f"gradfun=strength={config.BG_DEBAND}:radius=32",
           "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", str(out)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    try:
        for k in range(n):
            proc.stdin.write(scene.frame(k / fps).tobytes())
        proc.stdin.close()
    except BrokenPipeError:
        pass
    err = proc.stderr.read().decode("utf-8", "replace")
    if proc.wait() != 0:
        out.unlink(missing_ok=True)
        raise RuntimeError(f"génération du fond motion échouée :\n{err[-1200:]}")
    return out
