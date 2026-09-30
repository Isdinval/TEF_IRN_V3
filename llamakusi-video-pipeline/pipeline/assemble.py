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


def render(build_dir: Path, timeline: dict, out_path: Path, music: Path | None = None,
           preset: str = "medium", background: Path | None = None, loop_background: bool = False) -> Path:
    total = timeline["duration"]
    if background and Path(background).exists():
        inputs: list[str] = (["-stream_loop", "-1"] if loop_background else []) + ["-i", str(background)]
    else:
        inputs = ["-f", "lavfi", "-i",
                  f"color=c=0x{config.COLORS['bg'].lstrip('#')}:s={config.W}x{config.H}:r={config.FPS}:d={total:.5f}"]
    filters, last, idx = [], "[0:v]", 1
    for name in TRACK_ORDER:
        segs = timeline["tracks"].get(name, [])
        if not segs:
            continue
        lst = build_dir / f"track_{name}.txt"
        _concat_list(segs, timeline["blank"], total, build_dir, lst)
        inputs += ["-f", "concat", "-safe", "0", "-i", str(lst)]
        filters.append(f"[{idx}:v]fps={config.FPS},format=rgba[t{idx}]")
        filters.append(f"{last}[t{idx}]overlay=0:0:format=yuv444[v{idx}]")
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
