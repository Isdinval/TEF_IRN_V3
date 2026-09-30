"""Silence final, règle de boucle (lint) et flèche CTA animée."""
import copy

import pytest

from pipeline import align, assets, audio, config, layers, lint, schema, timeline

pytestmark = pytest.mark.skipif(
    not (config.FONTS_DIR / "Montserrat.ttf").exists(), reason="polices absentes (fetch-assets)")


@pytest.fixture(autouse=True)
def _mascots():
    assets.make_placeholder_mascots()


def _script(sid="short-03"):
    return schema.find_script(config.SCRIPTS_DIR, sid)


def _msgs(script):
    return [i.message for i in lint.lint_script(script) if i.level in ("error", "warn")]


def test_example_shorts_respect_loop_rule():
    for s in schema.load_all(config.SCRIPTS_DIR):
        if s.format == "short":
            assert not [m for m in _msgs(s) if m.startswith("boucle")], s.id


def test_closed_last_sentence_warns():
    s = _script()
    s.blocks[-1].voice = "Voilà, c'est tout."
    assert any("phrase est « fermée »" in m for m in _msgs(s))


def test_loop_must_reuse_hook_card():
    s = _script()
    s.blocks[-1].card_from = None
    assert any("reprendre la carte du hook" in m for m in _msgs(s))


def test_progressive_card_requires_initial_state():
    s = _script("short-04")
    s.blocks[-1].card_state = "plain"
    assert any("card_state: initial" in m for m in _msgs(s))


def test_tail_silence_is_long_enough_and_visuals_reach_the_end(tmp_path):
    assert 0.5 <= config.TAIL_SECONDS <= 1.0
    s = _script()
    words = align.flatten_script(s)
    dur = align.estimate_duration(words)
    audio.make_silence(tmp_path / "voice.wav", dur)
    words = align.proportional_timings(words, dur)
    tl = timeline.build_timeline(s, words, dur, tmp_path)
    end = tl["duration"]
    assert end == pytest.approx(align.snap(dur + config.TAIL_SECONDS))
    last_voice = words[-1].end
    assert end - last_voice >= config.TAIL_SECONDS - 0.05
    for track in ("brand", "mascot", "cta", "arrow"):
        assert tl["tracks"][track][-1]["end"] == pytest.approx(end, abs=1 / config.FPS)
    assert tl["tracks"]["subs"][-1]["end"] < end - 0.3          # sous-titres disparus : c'est le « vide »


def test_arrow_animation_cycles_and_can_be_disabled(tmp_path):
    a0 = layers.render_cta_arrow(0, "Lien en bio").tobytes()
    assert a0 != layers.render_cta_arrow(config.ARROW_PHASES // 2, "Lien en bio").tobytes()
    assert a0 == layers.render_cta_arrow(config.ARROW_PHASES, "Lien en bio").tobytes()      # cycle fermé
    s = _script()
    s2 = copy.deepcopy(s)
    s2.cta_arrow = False
    words = align.flatten_script(s)
    dur = align.estimate_duration(words)
    words = align.proportional_timings(words, dur)
    assert timeline.build_timeline(s, words, dur, tmp_path / "a")["tracks"]["arrow"]
    assert timeline.build_timeline(s2, words, dur, tmp_path / "b")["tracks"]["arrow"] == []
