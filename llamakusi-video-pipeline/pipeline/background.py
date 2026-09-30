"""Fond animé : halos de couleur floutés qui dérivent lentement + vignettage + anti-banding.

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
    r2 = ((xs / (LOW_W - 1) - 0.5) ** 2 + (ys / (LOW_H - 1) - 0.5) ** 2) / 0.5
    img *= (1.0 - 0.45 * r2)[..., None]                                # vignettage
    return (np.clip(img, 0, 1) * 255).astype(np.uint8)


def is_loop(duration: float) -> bool:
    """Vidéo longue : le fond n'est généré que sur BG_LOOP_S secondes et répété (assemble : -stream_loop)."""
    return duration > config.BG_LOOP_S * 1.05


def generate(build_dir: Path, accent: str, duration: float, fps: int | None = None) -> Path:
    """Génère (ou réutilise) build/<id>/background_<accent>_<W>x<H>_<n>.mp4 (taille du profil actif).
    Au-delà de BG_LOOP_S, ne génère qu'une boucle de BG_LOOP_S s (mouvement périodique → raccord invisible)."""
    fps = fps or config.FPS
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
