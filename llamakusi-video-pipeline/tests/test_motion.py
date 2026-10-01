"""Premier plan vivant (expressions ffmpeg) et boucle de fond par défaut."""
import subprocess

from pipeline import assemble, background, config


def test_motion_y_expressions():
    m = {"hop": [5.0], "card_enter": [], "card_bump": [21.0], "overlay_drop": []}
    assert assemble.motion_y("brand", m, 25.0) is None
    assert assemble.motion_y("overlay", m, 25.0) is None          # pas de badge animé → piste fixe
    mascot = assemble.motion_y("mascot", m, 25.0)
    assert "between(t,5.000,5.350)" in mascot
    card = assemble.motion_y("card", m, 25.0)
    assert "21.000" in card and "pow(" not in card                  # rebond seul, aucune entrée


def test_prepare_loop_crops_and_keeps_full_duration(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "BUILD_DIR", tmp_path)
    config.use_profile("short")
    src = tmp_path / "wide.mp4"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", "testsrc=s=320x180:r=30:d=2",
                    "-pix_fmt", "yuv420p", str(src)], check=True)
    out, dur = background.prepare_loop(src, log=lambda *_: None)
    info = background.probe_video(out)
    assert (info["width"], info["height"]) == (1080, 1920)
    assert abs(dur - 2.0) < 0.05
    assert background.prepare_loop(src, log=lambda *_: None)[0] == out        # cache


def test_default_background_rotation(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "BACKGROUNDS_DIR", tmp_path)
    monkeypatch.setitem(config.DEFAULT_BG_FORCED, "short", "")
    assert config.resolve_default_background("short", "short-01") is None        # aucun fichier
    for n in ("03", "01", "02"):
        (tmp_path / f"short-loop-{n}.mp4").write_bytes(b"x")
    pick = lambda sid: config.resolve_default_background("short", sid).name
    assert [pick(f"short-0{i}") for i in range(1, 5)] == [
        "short-loop-01.mp4", "short-loop-02.mp4", "short-loop-03.mp4", "short-loop-01.mp4"]
    assert pick("demo") == pick("demo")                                          # sans numéro : stable


def test_default_background_forced(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "BACKGROUNDS_DIR", tmp_path)
    (tmp_path / "short-loop-01.mp4").write_bytes(b"x")
    (tmp_path / "special.mp4").write_bytes(b"x")
    monkeypatch.setitem(config.DEFAULT_BG_FORCED, "short", "special.mp4")
    assert config.resolve_default_background("short", "short-01").name == "special.mp4"
