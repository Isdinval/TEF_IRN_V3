"""Test d'intégration hors-ligne : Short 3 en mode dry → MP4 vertical de la bonne durée."""
import json
import shutil
import subprocess

import pytest

from pipeline import align, assemble, assets, audio, config, schema, timeline

pytestmark = pytest.mark.skipif(
    not (config.FONTS_DIR / "Montserrat.ttf").exists(), reason="polices absentes (fetch-assets)")


def test_dry_render_short_03(tmp_path):
    assets.make_placeholder_mascots()
    script = schema.find_script(config.SCRIPTS_DIR, "short-03")
    words = align.flatten_script(script)
    dur = align.estimate_duration(words)
    audio.make_silence(tmp_path / "voice.wav", dur)
    words = align.proportional_timings(words, dur)
    tl = timeline.build_timeline(script, words, dur, tmp_path)
    assert tl["duration"] == align.snap(dur + config.TAIL_SECONDS)
    for track in tl["tracks"].values():                       # pas de chevauchement
        for a, b in zip(track, track[1:]):
            assert a["end"] <= b["start"] + 1e-6
    out = assemble.render(tmp_path, tl, tmp_path / "out.mp4", None)
    info = json.loads(subprocess.run(
        ["ffprobe", "-v", "error", "-show_streams", "-of", "json", str(out)],
        capture_output=True, text=True, check=True).stdout)
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    assert (v["width"], v["height"]) == (1080, 1920)
    assert abs(float(v["duration"]) - tl["duration"]) < 0.1
    shutil.rmtree(tmp_path / "layers", ignore_errors=True)


def test_find_music_prefers_env_then_bed_files(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "MUSIC_DIR", tmp_path)
    monkeypatch.delenv("MUSIC_FILE", raising=False)
    assert config.find_music() is None
    (tmp_path / "bed.mp3").write_bytes(b"x")
    assert config.find_music() == tmp_path / "bed.mp3"
    (tmp_path / "bed.wav").write_bytes(b"x")
    assert config.find_music() == tmp_path / "bed.wav"          # wav prioritaire
    monkeypatch.setenv("MUSIC_FILE", str(tmp_path / "absent.mp3"))
    with pytest.raises(FileNotFoundError):
        config.find_music()
