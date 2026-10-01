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
