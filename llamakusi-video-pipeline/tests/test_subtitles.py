"""Sous-titres .srt : découpage en cues, traduction (mockée), cache, format SRT."""
import json

import pytest

from pipeline import config, subtitles
from pipeline.align import Word


def _words(sentence_list, t0=0.0, block=0, dt=0.3):
    out, t = [], t0
    for s in sentence_list:
        for tok in s.split():
            out.append(Word(text=tok, norm=tok.lower(), block=block, start=t, end=t + dt - 0.05))
            t += dt
    return out


def test_cues_split_on_sentences_and_keep_source_timings():
    w = _words(["Tu reçois une contravention.", "Tu as combien de jours ?"])
    cues = subtitles.build_cues(w)
    assert [c.text for c in cues] == ["Tu reçois une contravention.", "Tu as combien de jours ?"]
    assert cues[0].start == w[0].start and cues[1].start == w[4].start
    assert cues[0].end <= cues[1].start                                   # jamais de chevauchement
    assert cues[-1].end == pytest.approx(w[-1].end + subtitles.HOLD)


def test_long_sentence_is_cut_at_comma_then_hard_cap():
    w = _words(["Un deux trois quatre cinq six, sept huit neuf dix onze douze treize quatorze quinze seize"])
    cues = subtitles.build_cues(w)
    assert cues[0].text.endswith("six,")
    assert all(len(c.text.split()) <= subtitles.HARD_MAX_WORDS for c in cues)


def test_cue_never_crosses_a_block_boundary_and_nbsp_is_cleaned():
    w = _words(["Bonjour à tous"], block=0) + _words(["Salut\u00a0?"], t0=2.0, block=1)
    cues = subtitles.build_cues(w)
    assert [c.text for c in cues] == ["Bonjour à tous", "Salut ?"]


def test_srt_format_and_wrapping():
    cues = [subtitles.Cue("a " * 30, 3661.5, 3663.0)]
    out = subtitles.to_srt(cues, ["mot " * 20], "en")
    assert out.startswith("1\n01:01:01,500 --> 01:01:03,000\n")
    assert all(len(line) <= subtitles.MAX_CHARS_LINE + 5 for line in out.splitlines()[2:4])
    assert subtitles._wrap("你好" * 20, "zh-Hans").count("\n") == 1


def test_parse_translation_validates_count_and_fences():
    assert subtitles._parse_translation('```json\n["a", "b"]\n```', 2) == ["a", "b"]
    with pytest.raises(ValueError):
        subtitles._parse_translation('["a"]', 2)
    with pytest.raises(ValueError):
        subtitles._parse_translation('{"a": 1}', 1)


def test_translation_is_cached_and_invalidated_when_source_changes(tmp_path, monkeypatch):
    calls = []
    monkeypatch.setattr(subtitles, "_gemini_translate", lambda texts, lang: calls.append(lang) or [f"{lang}:{t}" for t in texts])
    assert subtitles.translate(["Salut"], "en", tmp_path) == ["en:Salut"]
    assert subtitles.translate(["Salut"], "en", tmp_path) == ["en:Salut"]
    assert calls == ["en"]                                                # 2e appel : cache
    subtitles.translate(["Salut !"], "en", tmp_path)                      # source modifiée
    subtitles.translate(["Salut !"], "en", tmp_path, force=True)          # --force
    assert calls == ["en", "en", "en"]
    assert subtitles.translate(["Salut"], "fr", tmp_path) == ["Salut"]     # français : jamais d'appel


def test_generate_writes_fr_plus_requested_langs_offline(tmp_path):
    words = _words(["Tu reçois une contravention.", "Tu as combien de jours ?"])
    (tmp_path / "words.json").write_text(json.dumps([w.to_dict() for w in words]), encoding="utf-8")
    paths = subtitles.generate(tmp_path, ["ar", "zh-Hans"], dry=True)
    assert [p.name for p in paths] == ["subs.fr.srt", "subs.ar.srt", "subs.zh-Hans.srt"]
    assert "[ar] Tu reçois une contravention." in (tmp_path / "subs.ar.srt").read_text(encoding="utf-8")
    assert not list(tmp_path.glob("translation.*.json"))                  # dry : rien en cache
    with pytest.raises(FileNotFoundError):
        subtitles.generate(tmp_path / "vide", [], dry=True)


def test_default_langs_encode_the_long_first_decision():
    assert config.SUB_LANGS_SHORT == [] and "zh-Hans" in config.SUB_LANGS_LONG
