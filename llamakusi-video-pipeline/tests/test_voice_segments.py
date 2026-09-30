"""Voix des vidéos longues : découpage, cache par segment, concaténation, timings globaux (TTS/ASR simulés)."""
import copy
import json
import math
import wave

import numpy as np
import pytest

from pipeline import align, audio, config, schema, voice


def _script(blocks, fmt="long"):
    return schema.VideoScript.model_validate({
        "id": "t", "format": fmt, "status": "draft", "pillar": "C", "product": "tef_irn", "title": "t",
        "blocks": [{"id": f"b{i}", **b} for i, b in enumerate(blocks)]})


class Fake:
    """TTS simulé : 0,25 s par mot (ton 220 Hz) + 0,3 s de silence de chaque côté. ASR simulé : lit le texte mémorisé."""
    def __init__(self, amp=0.3):
        self.texts, self.synth_calls, self.asr_calls, self.amp = {}, [], [], amp

    def synth(self, text, out):
        self.synth_calls.append(text)
        self.texts[out.name.removesuffix(".raw.wav")] = text
        n = len(text.split())
        t = np.arange(int(24000 * 0.25 * n)) / 24000
        x = np.concatenate([np.zeros(7200), self.amp * np.sin(2 * math.pi * 220 * t), np.zeros(7200)])
        with wave.open(str(out), "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000)
            w.writeframes((x * 32767).astype(np.int16).tobytes())

    def transcribe(self, path):
        self.asr_calls.append(path.name)
        ws = self.texts[path.stem].split()
        return [{"text": w, "start": 0.25 * i, "end": 0.25 * i + 0.2} for i, w in enumerate(ws)]


def _run(script, tmp_path, fake, **kw):
    words = align.flatten_script(script)
    out = voice.build_voice(script, words, tmp_path, synth=fake.synth, transcribe=fake.transcribe,
                            log=lambda *_: None, **kw)
    return words, out


LONG_BLOCK = " ".join(f"Phrase numéro {i} avec quelques mots simples." for i in range(1, 9))   # 8 phrases × 7 mots


def test_plan_one_segment_per_block_and_split_of_long_blocks_at_sentences():
    script = _script([{"voice": "Bonjour à tous. Voici la suite."}, {"voice": LONG_BLOCK}, {"voice": "Merci.", "tts_text": "Merci."}])
    words = align.flatten_script(script)
    segs = voice.plan_segments(script, words, max_words=30)
    assert [s.block for s in segs] == [0, 1, 1, 2]                     # bloc 1 (56 mots) coupé en 2
    assert segs[1].text.endswith("7.") is False and segs[1].text.rstrip().endswith(".")   # coupe en fin de phrase
    assert [(s.first_word, s.last_word) for s in segs] == sorted({(s.first_word, s.last_word) for s in segs})
    assert segs[0].first_word == 0 and segs[-1].last_word == len(words)
    assert all(a.last_word == b.first_word for a, b in zip(segs, segs[1:]))        # aucun mot perdu ni doublé
    assert [s.pause_before for s in segs] == [0.0, config.SEG_PAUSE_BLOCK, config.SEG_PAUSE_SENTENCE, config.SEG_PAUSE_BLOCK]


def test_block_with_tts_text_is_never_split():
    script = _script([{"voice": LONG_BLOCK, "tts_text": LONG_BLOCK}])
    assert len(voice.plan_segments(script, align.flatten_script(script), max_words=10)) == 1


def test_global_timings_are_offset_by_segment_and_pauses(tmp_path):
    script = _script([{"voice": "Un deux trois quatre."}, {"voice": "Cinq six sept."}])
    words, (wav, dur, rep, segs) = _run(script, tmp_path, Fake())
    assert audio.probe_duration(wav) == pytest.approx(dur, abs=0.03)
    assert segs[1].start == pytest.approx(segs[0].end + config.SEG_PAUSE_BLOCK, abs=0.01)
    assert words[4].start >= segs[1].start - 1e-6 and words[3].end <= segs[0].end + 1e-6
    assert all(a.start <= b.start for a, b in zip(words, words[1:]))
    assert rep.ok and (tmp_path / "voice_segments.json").exists()


def test_cache_per_segment_only_the_edited_block_is_regenerated(tmp_path):
    script = _script([{"voice": "Premier bloc de test."}, {"voice": "Deuxième bloc de test."}, {"voice": "Troisième bloc."}])
    f = Fake()
    _run(script, tmp_path, f)
    assert len(f.synth_calls) == 3 and len(f.asr_calls) == 3
    f2 = Fake(); f2.texts = f.texts
    _run(script, tmp_path, f2)
    assert f2.synth_calls == [] and f2.asr_calls == []                 # tout en cache : zéro appel payant
    edited = copy.deepcopy(script)
    edited.blocks[1].voice = "Deuxième bloc corrigé."
    f3 = Fake(); f3.texts = f.texts
    _run(edited, tmp_path, f3)
    assert f3.synth_calls == ["Deuxième bloc corrigé."] and len(f3.asr_calls) == 1
    _run(edited, tmp_path, Fake(), force=True)                         # --force : tout est refait
    

def test_proportional_mode_never_calls_asr(tmp_path):
    script = _script([{"voice": "Un deux trois."}, {"voice": "Quatre cinq."}])
    f = Fake()
    words, (_, dur, rep, segs) = _run(script, tmp_path, f, use_asr=False)
    assert f.asr_calls == [] and words[-1].end <= dur + 1e-6 and rep.ok


def test_levels_are_matched_between_segments_with_capped_gain():
    quiet, loud = 0.05 * np.ones(4800, dtype=np.float32), 0.4 * np.ones(4800, dtype=np.float32)
    mid = 0.2 * np.ones(4800, dtype=np.float32)
    out = voice.match_levels([quiet, mid, loud])
    cap = 10 ** (config.SEG_LEVEL_MAX_GAIN_DB / 20)
    assert out[1].max() == pytest.approx(0.2, abs=1e-4)
    assert out[0].max() == pytest.approx(0.05 * cap, rel=1e-3)         # 0,05 → 0,2 demanderait ×4 : plafonné à ×2
    assert out[2].max() == pytest.approx(0.4 / cap, rel=1e-3)


def test_bad_asr_on_one_segment_fails_the_global_report(tmp_path):
    script = _script([{"voice": "Un deux trois quatre cinq six."}, {"voice": "Sept huit neuf dix onze douze."}])
    f = Fake()
    good = f.transcribe
    f.transcribe = lambda p: good(p) if "Un" in f.texts[p.stem] else [{"text": "zzz", "start": 0, "end": 1}]
    _, (_, _, rep, _) = _run(script, tmp_path, f)
    assert not rep.ok and 0.4 < rep.coverage < 0.6


@pytest.mark.skipif(not (config.FONTS_DIR / "Montserrat.ttf").exists(), reason="polices absentes (fetch-assets)")
def test_cli_build_long_end_to_end_with_fake_tts_asr(tmp_path, monkeypatch, capsys):
    import cli
    from pipeline import asr, tts
    f = Fake()
    monkeypatch.setattr(tts, "synthesize", lambda text, out, **kw: f.synth(text, out))
    monkeypatch.setattr(asr, "transcribe_words", f.transcribe)
    monkeypatch.setattr(config, "BUILD_DIR", tmp_path)
    monkeypatch.setattr("sys.argv", ["cli.py", "build", "long-02", "--placeholder-mascots", "--until", "timeline"])
    assert cli.main() == 0
    bdir = tmp_path / "long-02"
    tl = json.loads((bdir / "timeline.json").read_text())
    assert tl["size"] == [1920, 1080] and tl["duration"] > 60
    segs = json.loads((bdir / "voice_segments.json").read_text())
    assert len(segs) >= 13 and (bdir / "voice.wav").exists()
    assert json.loads((bdir / "align_report.json").read_text())["coverage"] >= 0.9
    n_calls = len(f.synth_calls)
    assert cli.main() == 0                                              # 2e build : voix entièrement en cache
    assert len(f.synth_calls) == n_calls
    assert "[voix]" in capsys.readouterr().out
