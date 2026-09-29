"""Utilitaires audio (ffmpeg/ffprobe)."""
from __future__ import annotations

import subprocess
from pathlib import Path


def run(cmd: list[str]) -> None:
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"commande échouée : {' '.join(cmd[:6])} …\n{proc.stderr[-1500:]}")


def probe_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return float(out)


def trim_silence(src: Path, dst: Path, threshold_db: int = -45) -> float:
    """Coupe le silence en début et fin (pas au milieu) → boucle Short serrée."""
    flt = (
        f"silenceremove=start_periods=1:start_threshold={threshold_db}dB:start_silence=0.03,"
        f"areverse,"
        f"silenceremove=start_periods=1:start_threshold={threshold_db}dB:start_silence=0.05,"
        f"areverse"
    )
    run(["ffmpeg", "-y", "-i", str(src), "-af", flt, "-ar", "48000", "-ac", "1", str(dst)])
    return probe_duration(dst)


def make_silence(dst: Path, seconds: float) -> None:
    run(["ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono",
         "-t", f"{seconds:.3f}", str(dst)])
