"""Assemblage ffmpeg : 1 fond + N pistes de PNG (concat demuxer) + voix + musique → MP4."""
from __future__ import annotations

from pathlib import Path

from . import config
from .audio import run
from .timeline import TRACK_ORDER


def _concat_list(segments: list[dict], blank: str, total: float, build_dir: Path, dst: Path) -> None:
    lines = ["ffconcat version 1.0"]
    cursor, last = 0.0, blank

    def add(png: str, dur: float) -> None:
        nonlocal last
        p = (build_dir / png).resolve().as_posix().replace("'", r"'\''")
        lines.append(f"file '{p}'")
        lines.append(f"duration {dur:.5f}")
        last = png

    for seg in segments:
        if seg["start"] > cursor + 1e-4:
            add(blank, seg["start"] - cursor)
        add(seg["png"], seg["end"] - seg["start"])
        cursor = seg["end"]
    if cursor < total - 1e-4:
        add(blank, total - cursor)
    p = (build_dir / last).resolve().as_posix().replace("'", r"'\''")
    lines.append(f"file '{p}'")      # exigence du concat demuxer : dernier fichier répété
    dst.write_text("\n".join(lines), encoding="utf-8")


def _pulse(times: list[float], amp: float, dur: float) -> str:
    """Bosse sin(0→π) de hauteur `amp` px à chaque instant (amp < 0 = vers le haut)."""
    return "".join(f"+({amp})*sin(PI*(t-{s:.3f})/{dur})*between(t,{s:.3f},{s + dur:.3f})" for s in times)


def _ease_in(times: list[float], amp: float, dur: float) -> str:
    """Arrivée décélérée : décalage `amp` px à l'instant t, ramené à 0 en `dur` s (ease-out cubique)."""
    return "".join(f"+({amp})*pow(1-(t-{s:.3f})/{dur},3)*between(t,{s:.3f},{s + dur:.3f})" for s in times)


def _periodic(amp: float, period: float, total: float) -> str:
    """Oscillation dont la période divise `total` : raccord exact en fin de Short (boucle)."""
    p = total / max(1, round(total / period))
    return f"({amp})*sin(2*PI*t/{p:.4f})"


def motion_y(name: str, motion: dict, total: float) -> str | None:
    """Expression ffmpeg du décalage vertical d'une piste (premier plan vivant) ; None = piste fixe."""
    if name == "mascot":
        return (_periodic(config.FG_MASCOT_BOB, config.FG_MASCOT_BOB_PERIOD, total)
                + _pulse(motion.get("hop", []), -config.FG_MASCOT_HOP, config.FG_HOP_S))
    if name == "card":
        return (_periodic(config.FG_CARD_FLOAT, config.FG_CARD_FLOAT_PERIOD, total)
                + _ease_in(motion.get("card_enter", []), config.FG_CARD_ENTER, config.FG_CARD_ENTER_S)
                + _pulse(motion.get("card_bump", []), -config.FG_CARD_BUMP, config.FG_CARD_BUMP_S))
    if name == "overlay" and motion.get("overlay_drop"):
        return "0" + _ease_in(motion["overlay_drop"], -config.FG_OVERLAY_DROP, config.FG_OVERLAY_DROP_S)
    return None


def render(build_dir: Path, timeline: dict, out_path: Path, music: Path | None = None,
           preset: str = "medium", background: Path | None = None, loop_background: bool = False,
           bg_period: float | None = None) -> Path:
    """`bg_period` : durée d'une boucle de fond périodique (fond motion). La vitesse du fond est recalée
    (±~25 %) pour qu'un nombre entier de boucles tienne pile dans la vidéo : la fin raccorde au début."""
    total = timeline["duration"]
    motion = timeline.get("motion", {})
    if background and Path(background).exists():
        inputs: list[str] = (["-stream_loop", "-1"] if loop_background else []) + ["-i", str(background)]
    else:
        inputs = ["-f", "lavfi", "-i",
                  f"color=c=0x{config.COLORS['bg'].lstrip('#')}:s={config.W}x{config.H}:r={config.FPS}:d={total:.5f}"]
    filters, last, idx = [], "[0:v]", 1
    if background and loop_background and bg_period:
        k = max(1, round(total / bg_period))
        filters.append(f"[0:v]setpts=PTS*{total / (k * bg_period):.6f},fps={config.FPS}[bg]")
        last = "[bg]"
    for name in TRACK_ORDER:
        segs = timeline["tracks"].get(name, [])
        if not segs:
            continue
        lst = build_dir / f"track_{name}.txt"
        _concat_list(segs, timeline["blank"], total, build_dir, lst)
        inputs += ["-f", "concat", "-safe", "0", "-i", str(lst)]
        filters.append(f"[{idx}:v]fps={config.FPS},format=rgba[t{idx}]")
        y = motion_y(name, motion, total)
        pos = f"x=0:y='{y}':eval=frame" if y else "0:0"
        filters.append(f"{last}[t{idx}]overlay={pos}:format=yuv444[v{idx}]")
        last = f"[v{idx}]"
        idx += 1

    inputs += ["-i", str(build_dir / timeline["voice"])]
    voice_idx = idx
    filters.append(f"[{voice_idx}:a]aresample=48000,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,"
                   f"apad=whole_dur={total:.5f},atrim=0:{total:.5f}[voice]")
    if music and music.exists():
        inputs += ["-stream_loop", "-1", "-i", str(music)]
        filters.append(f"[{voice_idx + 1}:a]aresample=48000,atrim=0:{total:.5f},asetpts=PTS-STARTPTS,"
                       f"loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,"
                       f"volume={config.MUSIC_GAIN_DB}dB,afade=t=out:st={max(0.0, total - config.MUSIC_FADE_S):.3f}:d={config.MUSIC_FADE_S}[music]")
        filters.append("[voice][music]amix=inputs=2:duration=first:dropout_transition=0,volume=2[aout]")
        amap = "[aout]"
    else:
        print("  ⚠ pas de musique (assets/music/bed.mp3|wav… ou MUSIC_FILE) : voix seule")
        amap = "[voice]"

    cmd = ["ffmpeg", "-y", *inputs, "-filter_complex", ";".join(filters),
           "-map", last, "-map", amap, "-t", f"{total:.5f}",
           "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", preset,
           "-r", str(config.FPS), "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
           str(out_path)]
    run(cmd)
    return out_path
