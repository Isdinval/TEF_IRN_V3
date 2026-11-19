"""Fond animé. Défaut (BG_STYLE=geo) : constellation — polygones en traits fins, orbes lumineux, poussière nette (GeoScene).
Ancien fond (BG_STYLE=halo) : halos de couleur floutés qui dérivent lentement + poussière dorée (bokeh) + vignettage + anti-banding.

Choix : calcul numpy en BASSE résolution (216×384), envoyé à ffmpeg qui agrandit en bicubique
(donc flou naturel, pas de détails qui attirent l'œil) puis applique `gradfun` (anti-banding).
Mesuré : un grain temporel `noise` pèse ~29 Mo pour 3 s ; `gradfun` ~0,4 Mo.
Le mouvement est périodique sur la durée de la vidéo (cycles entiers) : boucle sans à-coup.
"""
from __future__ import annotations

import math
import subprocess
from pathlib import Path

import numpy as np

from . import config


def _rgb(hex_color: str) -> np.ndarray:
    h = hex_color.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float32) / 255.0


def _dust(accent: str) -> list[tuple]:
    """Grains de poussière dorée (déterministes par accent) : (x, y0, vitesse, sigma, intensité, cycles, phase, couleur)."""
    import zlib
    rng = np.random.default_rng(zlib.crc32(accent.encode("utf-8")))
    colors = config.BG_DUST_COLORS
    out = []
    for i in range(config.BG_DUST_COUNT):
        sigma = float(rng.uniform(0.008, 0.030))
        amp = float(rng.uniform(0.10, 0.30)) * (0.012 / sigma) ** 0.5       # gros grain = plus doux
        out.append((float(rng.uniform(0.04, 0.96)), float(rng.uniform()), int(rng.integers(1, 4)), sigma,
                    min(amp, 0.34), int(rng.integers(4, 10)), float(rng.uniform(0, 2 * math.pi)),
                    _rgb(colors[i % len(colors)])))
    return out


def frame_at(accent: str, t: float, duration: float) -> np.ndarray:
    """Image RGB uint8 (LOW_H, LOW_W, 3) du fond à l'instant t (LOW_* = profil actif)."""
    LOW_W, LOW_H = config.BG_LOW
    pal = config.BG_PALETTES.get(accent, config.BG_PALETTES["indigo"])
    ys, xs = np.mgrid[0:LOW_H, 0:LOW_W].astype(np.float32)
    x, y = xs / (LOW_W - 1), ys / (LOW_H - 1) * (LOW_H / LOW_W)      # y corrigé du ratio → halos ronds
    img = np.ones((LOW_H, LOW_W, 3), dtype=np.float32) * _rgb(pal["base"])
    phase_t = 2 * math.pi * t / max(duration, 0.1)
    for color, strength, cx, cy, rx, ry, cycles, phase, sigma in pal["blobs"]:
        bx = cx + rx * math.sin(cycles * phase_t + phase)
        by = (cy + ry * math.cos(cycles * phase_t + phase)) * (LOW_H / LOW_W)
        g = np.exp(-(((x - bx) ** 2 + (y - by) ** 2) / (2 * sigma ** 2)))
        img += (g * strength)[..., None] * _rgb(color)
    cols, rows = np.arange(LOW_W, dtype=np.float32) / (LOW_W - 1), np.arange(LOW_H, dtype=np.float32) / (LOW_H - 1)
    for px, py0, k, sigma, amp, cycles, phase, color in _dust(accent):    # tous les mouvements : cycles ENTIERS
        cx = px + 0.015 * math.sin(phase_t + phase)
        cy = (py0 - k * t / max(duration, 0.1)) % 1.0                    # monte, puis ré-entre par le bas
        gx = np.exp(-0.5 * ((cols - cx) / sigma) ** 2)
        gy = np.exp(-0.5 * ((((rows - cy + 0.5) % 1.0) - 0.5) / (sigma * LOW_W / LOW_H)) ** 2)
        ri, ci = np.nonzero(gy > 0.02)[0], np.nonzero(gx > 0.02)[0]
        if ri.size and ci.size:
            tw = 0.65 + 0.35 * math.sin(cycles * phase_t + phase)         # scintillement
            img[np.ix_(ri, ci)] += (amp * tw * np.outer(gy[ri], gx[ci]))[..., None] * color
    r2 = ((xs / (LOW_W - 1) - 0.5) ** 2 + (ys / (LOW_H - 1) - 0.5) ** 2) / 0.5
    img *= (1.0 - 0.45 * r2)[..., None]                                # vignettage
    return (np.clip(img, 0, 1) * 255).astype(np.uint8)


def is_loop(duration: float) -> bool:
    """Vidéo longue : le fond n'est généré que sur BG_LOOP_S secondes et répété (assemble : -stream_loop)."""
    return duration > config.BG_LOOP_S * 1.05


# --- fond « constellation » ----------------------------------------------------------------------------
def _hex3(h: str) -> tuple[int, int, int]:
    return int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16)


def _sprite(sigma_core: float, sigma_halo: float, core: tuple, halo: tuple) -> tuple[np.ndarray, np.ndarray]:
    """Orbe lumineux : (alpha 0-1 de taille s×s, couleur uint8 s×s×3) ; cœur clair + halo coloré."""
    s = int(sigma_halo * 6) | 1
    ys, xs = np.mgrid[0:s, 0:s].astype(np.float32) - s // 2
    r2 = xs * xs + ys * ys
    c, h = np.exp(-r2 / (2 * sigma_core ** 2)), np.exp(-r2 / (2 * sigma_halo ** 2))
    alpha = np.clip(0.95 * c + 0.50 * h, 0, 1)
    w = (c / np.maximum(c + 0.5 * h, 1e-6))[..., None]
    rgb = w * np.array(core, np.float32) + (1 - w) * np.array(halo, np.float32)
    return alpha, rgb.astype(np.uint8)


class GeoScene:
    """Fond constellation d'UNE vidéo : disposition tirée de `seed` (id du script), image à l'instant t via `render`."""

    def __init__(self, seed: str, W: int, H: int):
        import zlib

        from PIL import Image
        g = config.GEO
        rng = np.random.default_rng(zlib.crc32(seed.encode("utf-8")))
        self.W, self.H, self.g = W, H, g
        self.u = min(W, H) / 1080                                   # échelle des traits et des rayons
        U = rng.uniform
        gold, rose, core = _hex3(g["gold"]), _hex3(g["rose"]), _hex3(g["core"])
        self.gold, self.rose, self.core = gold, rose, core
        self.polys = []
        gc, gr = (3, 5) if H > W else (5, 3)                        # grille jitterée : formes réparties
        cells = [(c, r) for r in range(gr) for c in range(gc)]
        rng.shuffle(cells)
        for i in range(g["poly"]):
            n = int(rng.choice([3, 4, 4, 5, 6, 6, 8]))
            far = i % 2 == 1                                        # 2 plans : lointain (petit, pâle, flou) / proche
            r = U(150, 340) * self.u * (0.55 if far else 1.0)
            ang = [2 * np.pi * k / n + U(-0.35, 0.35) for k in range(n)]
            rad = [r * U(0.7, 1.15) for _ in range(n)]
            self.polys.append({
                "c": ((cells[i % len(cells)][0] + U(0.1, 0.9)) / gc * W, (cells[i % len(cells)][1] + U(0.1, 0.9)) / gr * H), "far": far,
                "kind": "ring" if i % 4 == 2 else "cross" if i % 7 == 5 else "arc" if i % 7 == 6 else "poly", "ang": ang, "rad": rad, "th0": U(0, 2 * np.pi),
                "amp": np.radians(U(5, 12)), "rc": int(rng.choice([1, 2, 3])), "rp": U(0, 2 * np.pi),
                "ax": U(0.02, 0.06) * W, "ay": U(0.02, 0.05) * H, "dc": int(rng.choice([1, 2])), "dp": U(0, 2 * np.pi),
                "col": rose if i % 3 == 2 else gold, "tw": int(rng.choice([1, 1, 2, 2, 0])),  "a": int(U(*g["poly_alpha"]) * (0.5 if far else 1.0))})
        self.orbs = []
        for j in range(g["orbs"]):
            halo = rose if j % 5 == 4 else gold
            alpha, rgb = _sprite(U(2.2, 4.5) * self.u, U(9, 22) * self.u, core, halo)
            self.orbs.append({"p": (U(0.06, 0.94) * W, U(0.05, 0.95) * H), "amp": (U(0.03, 0.09) * W, U(0.02, 0.06) * H),
                                  "cx": int(rng.integers(1, 4)), "cy": int(rng.integers(1, 4)), "ph": U(0, 2 * np.pi, 3),
                                  "tc": int(rng.integers(3, 9)), "alpha": alpha, "rgb": rgb})
        self.stars = [(U(0, 1), U(0.45, 1.0) * W, U(0.0, 0.5) * H, U(0.35, 0.6) * max(W, H)) for _ in range(g["stars"])]
        self.dust = [{"x": U(0.02, 0.98) * W, "y0": U(0, 1) * H, "k": int(rng.integers(1, 3)), "r": U(0.8, 2.4) * self.u,
                          "tc": int(rng.integers(4, 11)), "ph": U(0, 2 * np.pi), "a": U(80, 170), "col": rose if i % 6 == 5 else core}
                     for i in range(g["dust"])]
        # maillage de facettes : grille jitterée dont chaque cellule est coupée en 2 triangles qui « respirent »
        mc, mr = (6, 11) if H > W else (11, 6)
        vx, vy = np.meshgrid(np.linspace(-0.05, 1.05, mc + 1), np.linspace(-0.05, 1.05, mr + 1))
        nv = vx.size
        self.vb = np.stack([vx.ravel() * W + U(-0.35, 0.35, nv) * W / mc, vy.ravel() * H + U(-0.35, 0.35, nv) * H / mr], 1)
        self.vamp = np.stack([U(0.01, 0.045, nv) * W, U(0.01, 0.04, nv) * H], 1)
        self.vph = U(0, 2 * np.pi, (nv, 2))
        self.vcy = rng.integers(1, 3, (nv, 2))
        self.tris = []
        for r_ in range(mr):
            for c_ in range(mc):
                a_, b_, c2, d2 = r_ * (mc + 1) + c_, r_ * (mc + 1) + c_ + 1, (r_ + 1) * (mc + 1) + c_, (r_ + 1) * (mc + 1) + c_ + 1
                for tri in ((a_, b_, d2), (a_, d2, c2)) if (r_ + c_) % 2 else ((a_, b_, c2), (b_, d2, c2)):
                    self.tris.append((tri, U(0, 2 * np.pi), int(rng.integers(1, 4)), bool(rng.random() < 0.2)))
        sp = max(20, round(64 * self.u))                              # grille de points (onde partant d'une origine par scène)
        gx, gy = np.meshgrid(np.arange(sp / 2, W, sp), np.arange(sp / 2, H, sp))
        self.gxy = np.stack([gx.ravel(), gy.ravel()], 1)
        self.origins = [(U(0.1, 0.9) * W, U(0.1, 0.9) * H) for _ in range(3)]
        self.scene_starts = [0.0]                                     # début de chaque scène (= bloc) : change le motif dominant
        # fond fixe : noir chaud + très léger halo or (haut gauche) et rose (bas droite) + vignettage
        lw, lh = max(2, W // 8), max(2, H // 8)
        ys, xs = np.mgrid[0:lh, 0:lw].astype(np.float32)
        x, y = xs / (lw - 1), ys / (lh - 1)
        img = np.ones((lh, lw, 3), np.float32) * np.array(_hex3(g["base"]), np.float32)
        for (cx, cy), col, k in (((0.2, 0.15), _hex3(g["glow_gold"]), 0.07), ((0.85, 0.85), _hex3(g["glow_rose"]), 0.045)):
            img += (k * np.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * 0.22 ** 2)))[..., None] * np.array(col, np.float32)
        img *= (1 - 0.35 * (((x - 0.5) ** 2 + (y - 0.5) ** 2) / 0.5))[..., None]
        self.base = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).resize((W, H), Image.BICUBIC).convert("RGBA")
        cy = H * config.LAYOUT.get("subs_cy", 0) / max(1, config.H) if config.LAYOUT.get("subs_cy") else H * 0.58
        self.calm = (1 - g["calm"] * np.exp(-0.5 * ((np.arange(H, dtype=np.float32) - cy) / (0.05 * H)) ** 2))[:, None]

    _PROFILES = ((1.0, 0.45, 0.0), (0.55, 1.0, 0.0), (0.9, 0.7, 0.6))   # (maillage, grille, teinte rose) par scène

    def _scene(self, t: float):
        """(poids maillage, poids grille, teinte rose, indice d'origine) : fondu de 0,8 s à chaque changement de scène."""
        import bisect
        k = max(0, bisect.bisect_right(self.scene_starts, t) - 1)
        cur, prev = self._PROFILES[k % 3], self._PROFILES[(k - 1) % 3] if k else self._PROFILES[0]
        f = float(np.clip((t - self.scene_starts[k]) / 0.8, 0, 1))
        f = f * f * (3 - 2 * f) if k else 1.0
        mix = [p + (c - p) * f for p, c in zip(prev, cur)]
        return mix[0], mix[1], mix[2], k % 3

    def render(self, t: float, duration: float, level: float = 0.0):
        """Image RGB (PIL) à l'instant t ; mouvements en cycles ENTIERS sur `duration` (boucle sans à-coup)."""
        from PIL import Image, ImageDraw, ImageFilter

        W, H, u, g = self.W, self.H, self.u, self.g
        pt = 2 * np.pi * t / max(duration, 0.1)
        lay = Image.new("RGBA", (W, H), self.gold + (0,))
        d = ImageDraw.Draw(lay)
        far = Image.new("RGBA", (W, H), self.gold + (0,))
        df = ImageDraw.Draw(far)
        fl = Image.new("RGBA", (W, H), self.gold + (0,))             # surfaces : polygones remplis
        dl = ImageDraw.Draw(fl)
        lv = level * g["react"]
        mw, gw, tint, oi = self._scene(t)
        lw = max(1, round(g["poly_width"] * u))
        # point focal : double hexagone + anneau, lents, derrière la carte (60° de rotation = symétrie → boucle sans à-coup)
        fx, fy, fr = W / 2, 0.40 * H, 0.40 * min(W, H)
        for sc, sgn, al in ((1.0, 1, 80), (0.72, -1, 65)):
            rot = sgn * pt / 6
            pts = [(fx + sc * fr * np.cos(rot + k * np.pi / 3), fy + sc * fr * np.sin(rot + k * np.pi / 3)) for k in range(6)]
            d.line(pts + [pts[0]], fill=self.gold + (al,), width=lw, joint="curve")
            for x, y in pts:
                d.ellipse((x - 3 * u, y - 3 * u, x + 3 * u, y + 3 * u), fill=self.core + (200,))
        d.ellipse((fx - fr * 1.12, fy - fr * 1.12, fx + fr * 1.12, fy + fr * 1.12), outline=self.rose + (55,), width=lw)
        for p in self.polys:
            th = p["th0"] + p["amp"] * np.sin(p["rc"] * pt + p["rp"])
            cx = p["c"][0] + p["ax"] * np.sin(p["dc"] * pt + p["dp"])
            cy = p["c"][1] + p["ay"] * np.cos(p["dc"] * pt + p["dp"])
            col, a = p["col"], p["a"]
            dd = df if p["far"] else d
            r0 = float(np.mean(p["rad"]))
            if p["kind"] == "ring":                                 # anneaux concentriques
                for k, f in ((1.0, 1.0), (0.78, 0.7)):
                    dd.ellipse((cx - r0 * k, cy - r0 * k, cx + r0 * k, cy + r0 * k), outline=col + (int(a * f),), width=lw)
                continue
            if p["kind"] == "cross":                                # croix fine + petit cercle
                for k in (0, 1):
                    ex, ey = r0 * 0.5 * np.cos(th + k * np.pi / 2), r0 * 0.5 * np.sin(th + k * np.pi / 2)
                    dd.line((cx - ex, cy - ey, cx + ex, cy + ey), fill=col + (int(a),), width=lw)
                dd.ellipse((cx - 5 * u, cy - 5 * u, cx + 5 * u, cy + 5 * u), outline=col + (int(a),), width=lw)
                continue
            if p["kind"] == "arc":                                  # arcs partiels doubles
                for k, f, span in ((1.0, 1.0, 200), (0.84, 0.7, 120)):
                    dd.arc((cx - r0 * k, cy - r0 * k, cx + r0 * k, cy + r0 * k), np.degrees(th) * (1 if k == 1.0 else -1),
                           np.degrees(th) * (1 if k == 1.0 else -1) + span, fill=col + (int(a * f),), width=lw)
                continue

            def poly(dx, dy, sc, rot, alpha, p=p, cx=cx, cy=cy, col=col, dd=dd):
                pts = [(cx + dx + sc * r * np.cos(an + rot), cy + dy + sc * r * np.sin(an + rot)) for an, r in zip(p["ang"], p["rad"])]
                dd.line(pts + [pts[0]], fill=col + (int(alpha),), width=lw, joint="curve")
                return pts
            pts = poly(0, 0, 1.0, th, a)
            dl.polygon(pts, fill=col + (int(a * 0.10 * (1 + 0.8 * lv)),))
            if p["tw"] == 1:                                        # jumeau intérieur, tourne en sens inverse
                poly(0, 0, 0.62, -th * 1.4, a * 0.75)
            elif p["tw"] == 2:                                      # jumeau décalé (effet « double »)
                poly(16 * u, 11 * u, 1.0, th, a * 0.55)
            for x, y in pts:                                        # sommets : petits points brillants
                dd.ellipse((x - 2.6 * u, y - 2.6 * u, x + 2.6 * u, y + 2.6 * u), fill=self.core + (190,))
        # maillage de facettes (demi-résolution) : surfaces lumineuses qui respirent + arêtes fines
        ms = Image.new("RGBA", (W // 2, H // 2), self.gold + (0,))
        dm = ImageDraw.Draw(ms)
        V = (self.vb + self.vamp * np.stack([np.sin(self.vcy[:, 0] * pt + self.vph[:, 0]),
                                             np.cos(self.vcy[:, 1] * pt + self.vph[:, 1])], 1)) * 0.5
        for (i0, i1, i2), ph, tc, is_rose in self.tris:
            b = (0.5 + 0.5 * np.sin(tc * pt + ph)) ** 4                      # peu de facettes allumées à la fois (pas de voile uniforme)
            colm = self.rose if (is_rose or tint > 0.5 and (i0 % 3 == 0)) else self.core   # blanc chaud : évite le voile olive
            tri = [tuple(V[i]) for i in (i0, i1, i2)]
            dm.polygon(tri, fill=colm + (int(np.clip((2 + 34 * b + 40 * lv * b) * g["mesh"] * mw, 0, 255)),))
            dm.line(tri + [tri[0]], fill=colm + (int(26 * g["mesh"] * mw),), width=1)
        ms = ms.resize((W, H), Image.BILINEAR)
        ma = np.asarray(ms.getchannel("A"), dtype=np.float32) * self.calm
        ms.putalpha(Image.fromarray(ma.astype(np.uint8)))
        # grille de points : une onde part d'une origine (propre à la scène) et grossit avec la voix
        gd = np.hypot(self.gxy[:, 0] - self.origins[oi][0], self.gxy[:, 1] - self.origins[oi][1])
        cyc = max(1, round(duration / 10))
        wv = 0.5 + 0.5 * np.sin(2 * np.pi * gd / (0.30 * max(W, H)) - cyc * pt)
        amp = np.clip(wv * (0.6 + 0.9 * lv), 0, 1)
        gcol = tuple(int(x + (y - x) * tint * 0.7) for x, y in zip(self.gold, self.rose))
        for (x, y), am in zip(self.gxy, amp):
            al = (22 + 135 * am) * g["grid"] * gw
            if al > 10:
                rr = (1.3 + 2.4 * am) * u
                d.ellipse((x - rr, y - rr, x + rr, y + rr), fill=gcol + (int(min(al, 255)),))
        pos = [(o["p"][0] + o["amp"][0] * np.sin(o["cx"] * pt + o["ph"][0]),
                o["p"][1] + o["amp"][1] * np.cos(o["cy"] * pt + o["ph"][1])) for o in self.orbs]
        link = 0.30 * max(W, H)
        for i in range(len(pos)):                                   # fins traits entre orbes voisins
            for j in range(i + 1, len(pos)):
                dist = np.hypot(pos[i][0] - pos[j][0], pos[i][1] - pos[j][1])
                if dist < link:
                    d.line((*pos[i], *pos[j]), fill=self.gold + (int(g["link_alpha"] * (1 - dist / link)),), width=max(1, round(1.5 * u)))
        for k in (0, 7):                                            # ondes de lumière émises par deux orbes
            if k < len(pos):
                fr_ = (3 * t / max(duration, 0.1) + k / 14) % 1
                rr = (0.03 + 0.20 * fr_) * max(W, H)
                d.ellipse((pos[k][0] - rr, pos[k][1] - rr, pos[k][0] + rr, pos[k][1] + rr), outline=self.gold + (int(60 * (1 - fr_)),), width=lw)
        T = max(duration, 0.1)
        for ph, sx, sy, ln_ in self.stars:                          # étoiles filantes : 1 passage de 0,9 s par boucle
            tt = (t - ph * T) % T
            if tt < 0.9:
                q_ = tt / 0.9
                hx, hy = sx - 0.8 * ln_ * q_, sy + 0.6 * ln_ * q_
                for m in range(14):
                    f0, f1 = m / 14, (m + 1) / 14
                    d.line((hx + 0.8 * ln_ * 0.35 * f0, hy - 0.6 * ln_ * 0.35 * f0, hx + 0.8 * ln_ * 0.35 * f1, hy - 0.6 * ln_ * 0.35 * f1),
                           fill=self.core + (int(220 * (1 - f0) * np.sin(np.pi * q_)),), width=max(1, round(2.5 * u)))
        for q in self.dust:                                         # poussière : monte, ré-entre par le bas, scintille
            y = (q["y0"] - q["k"] * H * t / max(duration, 0.1)) % H
            a = int(q["a"] * (0.65 + 0.35 * np.sin(q["tc"] * pt + q["ph"])))
            d.ellipse((q["x"] - q["r"], y - q["r"], q["x"] + q["r"], y + q["r"]), fill=q["col"] + (a,))
        far = far.filter(ImageFilter.GaussianBlur(1.6 * u + 0.4))
        fa = np.asarray(far.getchannel("A"), dtype=np.float32) * self.calm
        far.putalpha(Image.fromarray(fa.astype(np.uint8)))
        small = lay.resize((W // 4, H // 4), Image.BILINEAR).filter(ImageFilter.GaussianBlur(2.4))
        glow = small.resize((W, H), Image.BICUBIC)                  # halo lumineux autour des traits
        ga = np.clip(np.asarray(glow.getchannel("A"), dtype=np.float32) * g["glow"] * (1 + 0.7 * lv), 0, 255) * self.calm
        glow.putalpha(Image.fromarray(ga.astype(np.uint8)))
        lay = lay.filter(ImageFilter.GaussianBlur(0.6 * u + 0.2))   # anti-crénelage des traits
        a = np.asarray(lay.getchannel("A"), dtype=np.float32) * self.calm
        lay.putalpha(Image.fromarray(a.astype(np.uint8)))
        img = self.base.copy()
        # balayage de lumière : bande diagonale douce qui traverse l'écran (1 passage par boucle)
        lw_, lh_ = W // 6, H // 6
        yy, xx = np.mgrid[0:lh_, 0:lw_].astype(np.float32)
        proj = (xx / lw_ * 0.6 + yy / lh_ * 0.8)
        band = np.exp(-(((proj - (-0.4 + 1.95 * (t / max(duration, 0.1)))) / 0.07) ** 2)) * g["sweep"]
        sw = np.zeros((lh_, lw_, 4), np.uint8); sw[..., :3] = self.core; sw[..., 3] = np.clip(band * 255, 0, 255)
        band2 = np.exp(-(((proj - (-0.4 + 1.95 * ((t / T + 0.5) % 1))) / 0.05) ** 2)) * g["sweep"] * 0.7   # 2e balayage rose, décalé
        sw2 = np.zeros((lh_, lw_, 4), np.uint8); sw2[..., :3] = self.rose; sw2[..., 3] = np.clip(band2 * 255, 0, 255)
        img.alpha_composite(far)
        img.alpha_composite(ms)
        img.alpha_composite(fl)
        img.alpha_composite(glow)
        img.alpha_composite(lay)
        img.alpha_composite(Image.fromarray(sw, "RGBA").resize((W, H), Image.BICUBIC))
        img.alpha_composite(Image.fromarray(sw2, "RGBA").resize((W, H), Image.BICUBIC))
        for o, (x, y) in zip(self.orbs, pos):                       # orbes : par-dessus, avec scintillement
            tw = 0.65 + 0.35 * np.sin(o["tc"] * pt + o["ph"][2])
            spr = Image.fromarray(np.dstack([o["rgb"], (o["alpha"] * min(1.0, tw * (0.8 + 0.5 * lv)) * 255).astype(np.uint8)]), "RGBA")
            ox, oy = int(x) - spr.width // 2, int(y) - spr.height // 2
            sx, sy = max(0, -ox), max(0, -oy)
            ex, ey = min(spr.width, W - ox), min(spr.height, H - oy)
            if ex > sx and ey > sy:
                img.alpha_composite(spr.crop((sx, sy, ex, ey)), (ox + sx, oy + sy))
        img = img.convert("RGB")
        z = 1 + 0.05 * (0.5 - 0.5 * np.cos(pt))                     # zoom lent périodique : de la vie sur tout l'écran
        cw, ch = W / z, H / z
        return img.resize((W, H), Image.BILINEAR, box=((W - cw) / 2, (H - ch) / 2, (W + cw) / 2, (H + ch) / 2))


def _envelope(voice: Path | None, n: int, gfps: int) -> np.ndarray:
    """Niveau de la voix (0-1) pour chacune des n images : RMS par image, normalisé, attaque rapide / relâchement lent."""
    zeros = np.zeros(n)
    if not voice or not Path(voice).exists():
        return zeros
    try:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(voice), "-ac", "1", "-ar", "8000", "-f", "s16le", "-"],
                             capture_output=True, check=True).stdout
        x = np.frombuffer(raw, dtype=np.int16).astype(np.float32)
        hop = 8000 / gfps
        e = np.array([np.sqrt(np.mean(x[int(i * hop):int((i + 1) * hop)] ** 2)) if len(x[int(i * hop):int((i + 1) * hop)]) else 0.0
                      for i in range(n)])
        top = float(np.percentile(e, 95))
        if top < 1e-3:
            return zeros
        e = np.clip(e / top, 0, 1)
        for i in range(1, n):
            e[i] = max(e[i], e[i - 1] * 0.82)
        return e
    except (subprocess.CalledProcessError, OSError, ValueError):
        return zeros


_SCENE = None


def _init_worker(scene) -> None:
    global _SCENE
    _SCENE = scene


def _work(args) -> bytes:
    t, duration, level = args
    return _SCENE.render(t, duration, level).tobytes()


def _generate_geo(build_dir: Path, duration: float, fps: int, seed: str, voice: Path | None = None,
                  scenes: list[float] | None = None) -> Path:
    import hashlib
    from concurrent.futures import ProcessPoolExecutor
    gfps = max(1, min(fps, config.BG_GEO_FPS))
    n = max(1, round(duration * gfps))
    slug = "".join(c if c.isalnum() else "-" for c in seed)
    has_voice = bool(voice and Path(voice).exists())
    tag = hashlib.md5((repr(scenes) + (str(Path(voice).stat().st_size) if has_voice else "")).encode()).hexdigest()[:6]
    out = build_dir / f"background_geo_{config.STYLE_VERSION}_{slug}_{tag}_{config.W}x{config.H}_{n}.mp4"
    if out.exists() and out.stat().st_size > 0:
        return out
    scene = GeoScene(seed, config.W, config.H)
    scene.scene_starts = sorted(scenes) if scenes else [0.0]
    levels = _envelope(voice, n, gfps) if has_voice else np.zeros(n)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{config.W}x{config.H}",
           "-r", str(gfps), "-i", "-", "-vf", f"fps={fps},gradfun=strength={config.BG_DEBAND}:radius=32,noise=alls=4:allf=t",
           "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", str(out)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    nw = max(1, config.BG_WORKERS)
    pool = None
    if nw > 1 and n > nw:
        try:
            pool = ProcessPoolExecutor(nw, initializer=_init_worker, initargs=(scene,))
        except (OSError, ValueError):
            pool = None
    try:
        k, batch = 0, nw * 4
        while k < n:                                                # images calculées en parallèle, par lots (mémoire bornée)
            jobs = [(i / gfps, duration, float(levels[i])) for i in range(k, min(n, k + batch))]
            try:
                frames = list(pool.map(_work, jobs)) if pool else [scene.render(*j).tobytes() for j in jobs]
            except Exception:  # noqa: BLE001 - processus indisponibles (environnement restreint) : repli en série
                if pool:
                    pool.shutdown(wait=False, cancel_futures=True)
                pool = None
                frames = [scene.render(*j).tobytes() for j in jobs]
            for f in frames:
                proc.stdin.write(f)
            k += batch
        proc.stdin.close()
    except BrokenPipeError:
        pass
    finally:
        if pool:
            pool.shutdown()
    err = proc.stderr.read().decode("utf-8", "replace")
    if proc.wait() != 0:
        out.unlink(missing_ok=True)
        raise RuntimeError(f"génération du fond échouée :\n{err[-1200:]}")
    return out


def generate(build_dir: Path, accent: str, duration: float, fps: int | None = None, seed: str | None = None,
             voice: Path | None = None, scenes: list[float] | None = None) -> Path:
    """Génère (ou réutilise) le fond animé du profil actif. BG_STYLE=geo (défaut) : constellation géométrique propre à
    `seed` (id du script) ; BG_STYLE=halo : ancien fond de halos par accent.
    Au-delà de BG_LOOP_S, ne génère qu'une boucle de BG_LOOP_S s (mouvement périodique → raccord invisible)."""
    fps = fps or config.FPS
    if config.BG_STYLE == "geo":
        if is_loop(duration):                                        # vidéo longue : boucle générique (ni voix ni scènes)
            return _generate_geo(build_dir, config.BG_LOOP_S, fps, seed or accent)
        return _generate_geo(build_dir, duration, fps, seed or accent, voice=voice, scenes=scenes)
    if is_loop(duration):
        duration = config.BG_LOOP_S
    n = max(1, round(duration * fps))
    out = build_dir / f"background_{accent}_{config.W}x{config.H}_{n}.mp4"
    LOW_W, LOW_H = config.BG_LOW
    if out.exists() and out.stat().st_size > 0:
        return out
    cmd = ["ffmpeg", "-y", "-loglevel", "error",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{LOW_W}x{LOW_H}", "-r", str(fps), "-i", "-",
           "-vf", f"scale={config.W}:{config.H}:flags=bicubic,gradfun=strength={config.BG_DEBAND}:radius=32",
           "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", str(out)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    try:
        for k in range(n):
            proc.stdin.write(frame_at(accent, k / fps, duration).tobytes())
        proc.stdin.close()
    except BrokenPipeError:
        pass
    err = proc.stderr.read().decode("utf-8", "replace")
    if proc.wait() != 0:
        out.unlink(missing_ok=True)
        raise RuntimeError(f"génération du fond échouée :\n{err[-1200:]}")
    return out


# --- fond vidéo personnalisé (avant/arrière) -------------------------------------------------------
def probe_video(path: Path) -> dict:
    """{width, height, duration} du premier flux vidéo."""
    import json
    import subprocess
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
         "stream=width,height:format=duration", "-of", "json", str(path)],
        capture_output=True, text=True, check=True).stdout
    d = json.loads(out)
    st = d["streams"][0]
    return {"width": int(st["width"]), "height": int(st["height"]), "duration": float(d["format"]["duration"])}


def pingpong(src: Path, dst: Path, w: int, h: int, fps: int, est_frames: int | None = None) -> int:
    """src → dst = lecture AVANT puis ARRIÈRE (boomerang), prête à être répétée par `-stream_loop -1`.

    Frame-exact et sans surcharge mémoire : le fond est décodé UNE fois dans un fichier brut sur disque, puis relu
    image par image (avant, puis arrière) vers l'encodeur. Les deux images charnières ne sont pas dupliquées
    (suite 0..n-1, n-2..1) → le raccord, y compris à la répétition, ne marque aucun temps d'arrêt.
    Retourne le nombre d'images de la boucle. Coût disque temporaire : ~3 Mo par image en 1080×1920 (supprimé ensuite).
    """
    import shutil
    import subprocess
    import tempfile

    from .audio import run

    fsize = w * h * 3 // 2                                     # yuv420p
    if est_frames and fsize * est_frames * 1.1 > shutil.disk_usage(dst.parent).free:
        raise RuntimeError(f"pas assez d'espace disque pour le fond personnalisé "
                           f"(~{fsize * est_frames / 1e9:.1f} Go temporaires nécessaires dans {dst.parent})")
    raw = dst.with_suffix(".raw")
    vf = f"scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},fps={fps},format=yuv420p"
    try:
        run(["ffmpeg", "-y", "-i", str(src), "-an", "-vf", vf, "-f", "rawvideo", str(raw)])
        n = raw.stat().st_size // fsize
        if n < 1:
            raise RuntimeError(f"fond vidéo vide ou illisible : {src}")
        order = list(range(n)) + list(range(n - 2, 0, -1))
        with tempfile.TemporaryFile() as err:
            enc = subprocess.Popen(
                ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", f"{w}x{h}",
                 "-r", str(fps), "-i", "-", "-c:v", "libx264", "-crf", "14", "-preset", "veryfast",
                 "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(dst)],
                stdin=subprocess.PIPE, stderr=err)
            with open(raw, "rb") as f:
                for i in order:
                    f.seek(i * fsize)
                    enc.stdin.write(f.read(fsize))
            enc.stdin.close()
            if enc.wait() != 0:
                err.seek(0)
                raise RuntimeError(f"encodage du fond ping-pong échoué :\n{err.read().decode(errors='replace')[-1500:]}")
        return len(order)
    finally:
        raw.unlink(missing_ok=True)


def from_file(src: Path, build_dir: Path, total: float, log=print) -> tuple[Path, bool]:
    """Prépare un fond vidéo personnalisé pour une vidéo de `total` secondes. Retourne (fichier, à_boucler).

    - assez long, mêmes dimensions → utilisé tel quel (assemble coupe à la durée) ;
    - plus court, mêmes dimensions → lecture avant/arrière répétée (boomerang) ;
    - dimensions différentes → recadrage « cover » centré (avec avertissement), puis même logique.
    Les fichiers préparés sont mis en cache dans build/<id>/ (clé = fichier source + taille de sortie).
    """
    import hashlib

    from .audio import run

    info = probe_video(src)
    w, h, fps = config.W, config.H, config.FPS
    st = src.stat()
    sig = hashlib.sha1(f"{src.resolve()}|{st.st_size}|{st.st_mtime_ns}|{w}x{h}|{fps}".encode()).hexdigest()[:12]
    same = (info["width"], info["height"]) == (w, h)
    if not same:
        log(f"  ⚠ fond {info['width']}×{info['height']} ≠ {w}×{h} : recadrage centré (cover). "
            f"Pour un rendu net, fournir un fond en {w}×{h}.")
    if info["duration"] >= total - 0.05:
        if same:
            return src, False
        out = build_dir / f"bg_custom_{sig}_{w}x{h}.mp4"
        if not out.exists():
            run(["ffmpeg", "-y", "-i", str(src), "-an", "-t", f"{total:.3f}",
                 "-vf", f"scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},fps={fps}",
                 "-c:v", "libx264", "-crf", "14", "-preset", "veryfast", "-pix_fmt", "yuv420p", str(out)])
        return out, False
    out = build_dir / f"bg_pingpong_{sig}_{w}x{h}.mp4"
    if not out.exists():
        log(f"  [fond] {info['duration']:.1f}s < {total:.1f}s : lecture avant/arrière répétée (boomerang)…")
        pingpong(src, out, w, h, fps, est_frames=int(info["duration"] * fps) + 2)
    return out, True


def prepare_loop(src: Path, log=print) -> tuple[Path, float]:
    """Boucle parfaite (fond par défaut) → copie au format du profil actif : recadrage « cover », fps, assombrie
    (BG_VIDEO_DIM), DURÉE COMPLÈTE conservée (la boucle reste parfaite). Cache partagé : build/_bg/.
    Retourne (fichier, durée d'une boucle en s)."""
    import hashlib

    from .audio import run

    w, h, fps, dim = config.W, config.H, config.FPS, config.BG_VIDEO_DIM
    st = src.stat()
    sig = hashlib.sha1(f"{src.resolve()}|{st.st_size}|{st.st_mtime_ns}|{w}x{h}|{fps}|{dim}".encode()).hexdigest()[:12]
    out_dir = config.BUILD_DIR / "_bg"
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / f"loop_{src.stem}_{w}x{h}_{sig}.mp4"
    if not out.exists():
        info = probe_video(src)
        if (info["width"], info["height"]) != (w, h):
            log(f"  [fond] {info['width']}×{info['height']} → {w}×{h} (recadrage centré, une seule fois)")
        vf = (f"scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},fps={fps},"
              f"colorchannelmixer=rr={dim}:gg={dim}:bb={dim}")
        run(["ffmpeg", "-y", "-i", str(src), "-an", "-vf", vf, "-c:v", "libx264", "-crf", "16",
             "-preset", "veryfast", "-pix_fmt", "yuv420p", str(out)])
    n = round(probe_video(out)["duration"] * fps)
    return out, n / fps
