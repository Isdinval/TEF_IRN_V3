"""Fond vidéo personnalisé : lecture avant/arrière (boomerang), dimensions, cache, rendu complet."""
import subprocess

import numpy as np
import pytest

from pipeline import background, config, lint, schema


def _make_clip(path, w, h, frames, fps=30):
    """Clip dont la LUMINANCE de l'image n vaut n*8 : la suite des images se lit dans les pixels."""
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i",
                    f"color=c=black:s={w}x{h}:r={fps}:d={frames / fps:.4f},geq=lum='N*8':cb=128:cr=128",
                    "-frames:v", str(frames), "-c:v", "libx264", "-crf", "10", "-pix_fmt", "yuv420p", str(path)], check=True)


def _lumas(path, w, h):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(path), "-vf", "format=gray", "-f", "rawvideo", "-"],
                         capture_output=True, check=True).stdout
    a = np.frombuffer(raw, dtype=np.uint8).reshape(-1, h, w)
    return [float(f.mean()) for f in a]


def test_pingpong_is_a_seamless_palindrome(tmp_path):
    w, h, n = 64, 96, 20
    src, dst = tmp_path / "s.mp4", tmp_path / "pp.mp4"
    _make_clip(src, w, h, n)
    assert background.pingpong(src, dst, w, h, 30) == 2 * n - 2
    ref = _lumas(src, w, h)                                            # mêmes conversions de plage que la sortie
    assert len(ref) == n and ref == sorted(ref)                        # contrôle : la source est bien croissante
    got = _lumas(dst, w, h)
    expect = [ref[i] for i in list(range(n)) + list(range(n - 2, 0, -1))]
    assert len(got) == len(expect)
    assert max(abs(a - b) for a, b in zip(got, expect)) < 3            # même suite d'images, avant puis arrière
    assert abs(got[-1] - got[0]) <= (ref[1] - ref[0]) + 3              # raccord à la répétition = images voisines
    assert not (tmp_path / "pp.raw").exists()                          # fichier temporaire supprimé


def test_single_frame_clip_does_not_crash(tmp_path):
    src, dst = tmp_path / "one.mp4", tmp_path / "pp.mp4"
    _make_clip(src, 64, 96, 1)
    assert background.pingpong(src, dst, 64, 96, 30) == 1


def test_not_enough_disk_space_is_reported(tmp_path, monkeypatch):
    import collections
    import shutil
    monkeypatch.setattr(shutil, "disk_usage", lambda p: collections.namedtuple("u", "total used free")(1, 1, 1000))
    with pytest.raises(RuntimeError, match="espace disque"):
        background.pingpong(tmp_path / "x.mp4", tmp_path / "y.mp4", 1080, 1920, 30, est_frames=300)


@pytest.fixture
def small(monkeypatch):
    monkeypatch.setattr(config, "W", 64)
    monkeypatch.setattr(config, "H", 96)


def test_from_file_long_enough_is_used_as_is(tmp_path, small):
    src = tmp_path / "bg.mp4"
    _make_clip(src, 64, 96, 60)                                        # 2 s
    assert background.from_file(src, tmp_path, 1.5) == (src, False)


def test_from_file_shorter_is_pingponged_and_cached(tmp_path, small):
    src = tmp_path / "bg.mp4"
    _make_clip(src, 64, 96, 30)
    logs = []
    out, loop = background.from_file(src, tmp_path, 10.0, log=logs.append)
    assert loop and out.name.startswith("bg_pingpong_") and any("boomerang" in m for m in logs)
    mtime = out.stat().st_mtime_ns
    logs.clear()
    out2, _ = background.from_file(src, tmp_path, 25.0, log=logs.append)      # autre durée cible : même fichier
    assert out2 == out and out.stat().st_mtime_ns == mtime and logs == []


def test_from_file_other_dimensions_are_cover_cropped_with_warning(tmp_path, small):
    src = tmp_path / "wide.mp4"
    _make_clip(src, 192, 108, 30)                                      # 16:9 dans un profil 9:16
    logs = []
    out, loop = background.from_file(src, tmp_path, 10.0, log=logs.append)
    assert any("recadrage" in m for m in logs) and loop
    info = background.probe_video(out)
    assert (info["width"], info["height"]) == (64, 96)
    out2, loop2 = background.from_file(src, tmp_path, 0.5, log=logs.append)   # assez long mais mauvaises dimensions
    assert not loop2 and background.probe_video(out2)["width"] == 64


def test_resolve_background_and_lint(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "BACKGROUNDS_DIR", tmp_path)
    (tmp_path / "mon-fond.mp4").write_bytes(b"x")
    assert config.resolve_background("mon-fond.mp4") == (tmp_path / "mon-fond.mp4").resolve()
    with pytest.raises(FileNotFoundError, match="introuvable"):
        config.resolve_background("absent.mp4")
    s = schema.find_script(config.SCRIPTS_DIR, "short-03")
    s.background = "absent.mp4"
    assert any("introuvable" in i.message for i in lint.lint_script(s) if i.level == "error")
    s.background = "mon-fond.mp4"
    assert not any("introuvable" in i.message for i in lint.lint_script(s))


@pytest.mark.skipif(not (config.FONTS_DIR / "Montserrat.ttf").exists(), reason="polices absentes (fetch-assets)")
def test_cli_render_applies_the_pingpong_background(tmp_path, monkeypatch):
    """Rendu réel d'un Short de ~25 s sur un fond de 1 s : la luminance du coin libre suit la suite avant/arrière."""
    import cli
    monkeypatch.setattr(config, "BUILD_DIR", tmp_path)
    clip = tmp_path / "bg1s.mp4"
    _make_clip(clip, 1080, 1920, 30)                                   # 30 images, boucle = 58 images
    monkeypatch.setattr("sys.argv", ["cli.py", "build", "short-03", "--dry", "--placeholder-mascots",
                                     "--background", str(clip)])
    assert cli.main() == 0
    out = tmp_path / "short-03" / "out.dry.mp4"
    assert background.probe_video(out)["duration"] > 20                # ≫ 1 s : le fond couvre toute la vidéo
    ref = _lumas(clip, 1080, 1920)
    expected = lambda t: ref[(lambda p: p if p < 30 else 58 - p)(int(round(t * 30)) % 58)]
    for t in (0.5, 1.2, 2.0, 10.0, 20.0):
        frame = subprocess.run(["ffmpeg", "-loglevel", "error", "-ss", f"{t}", "-i", str(out), "-frames:v", "1",
                                "-vf", "crop=200:100:860:1800,format=gray", "-f", "rawvideo", "-"],
                               capture_output=True, check=True).stdout
        got = float(np.frombuffer(frame, dtype=np.uint8).mean())
        assert abs(got - expected(t)) < 14, (t, got, expected(t))
