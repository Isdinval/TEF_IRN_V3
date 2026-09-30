"""Voix des vidéos LONGUES : TTS + ASR par SEGMENT, cache par segment, concaténation, timings décalés.

Pourquoi : un seul appel TTS/ASR sur 6 min a une limite de durée non vérifiée ; et corriger un bloc ne doit
regénérer (et payer) que ce bloc. Un segment = un bloc, ou un groupe de phrases d'un bloc trop long.

Chaque segment vit dans build/<id>/voice_segments/ sous une clé = sha(texte TTS, modèle, voix, style) :
    <clé>.raw.wav (sortie TTS) · <clé>.wav (silences de bord coupés) · <clé>.asr.json (mots + timings ASR)
Les Shorts gardent leur unique appel (intonation continue) : ce module ne sert qu'aux `format: long`.
"""
from __future__ import annotations

import hashlib
import json
import re
import wave
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

import numpy as np

from . import align, audio, config
from .schema import VideoScript
from .textutil import count_words

SR = 48000                      # sortie de audio.trim_silence
_SENTENCE_END = re.compile(r"(?<=[.!?…])\s+")
FADE_S = 0.005                  # fondu de 5 ms aux raccords (pas de clic)


@dataclass
class Segment:
    index: int
    block: int
    text: str                   # texte envoyé au TTS (prononciations appliquées)
    first_word: int             # mots du script : [first_word, last_word)
    last_word: int
    pause_before: float         # silence inséré avant le segment (0 pour le premier)
    key: str = ""
    start: float = 0.0          # position dans voice.wav (rempli par build_voice)
    end: float = 0.0
    cached: bool = False


def _tts_text(text: str) -> str:
    for src, dst in config.PRONUNCIATIONS.items():
        text = text.replace(src, dst)
    return text.strip()


def _key(text: str) -> str:
    return hashlib.sha1("\x1f".join([text, config.TTS_MODEL, config.TTS_VOICE, config.TTS_STYLE]).encode()).hexdigest()[:16]


def _group_sentences(sentences: list[str], counts: list[int], limit: int) -> list[tuple[int, int]]:
    """Regroupe des phrases consécutives en segments ≤ limit mots (une phrase seule peut dépasser)."""
    n_groups = max(1, -(-sum(counts) // limit))
    target = sum(counts) / n_groups
    groups, start, acc = [], 0, 0
    for i, c in enumerate(counts):
        if acc and acc + c > limit or (acc >= target and len(groups) < n_groups - 1):
            groups.append((start, i))
            start, acc = i, 0
        acc += c
    groups.append((start, len(counts)))
    return groups


def plan_segments(script: VideoScript, words: list[align.Word], max_words: int | None = None) -> list[Segment]:
    max_words = max_words or config.SEG_MAX_WORDS
    by_block: dict[int, list[int]] = {}
    for i, w in enumerate(words):
        by_block.setdefault(w.block, []).append(i)
    segs: list[Segment] = []
    for bi, block in enumerate(script.blocks):
        idx = by_block.get(bi)
        if not idx:
            continue
        first, n_block = idx[0], len(idx)
        pieces = [(block.tts_text or block.voice, first, first + n_block)]
        if n_block > max_words and not block.tts_text:               # tts_text : pas de découpe (mots non alignables)
            sentences = [s for s in _SENTENCE_END.split(block.voice.strip()) if s]
            counts = [count_words(s) for s in sentences]
            if sum(counts) == n_block and len(sentences) > 1:        # sinon : on garde le bloc entier
                pieces, cursor = [], first
                for a, b in _group_sentences(sentences, counts, max_words):
                    n = sum(counts[a:b])
                    pieces.append((" ".join(sentences[a:b]), cursor, cursor + n))
                    cursor += n
        for k, (text, a, b) in enumerate(pieces):
            tts = _tts_text(text)
            pause = 0.0 if not segs else (config.SEG_PAUSE_SENTENCE if k else config.SEG_PAUSE_BLOCK)
            segs.append(Segment(len(segs), bi, tts, a, b, pause, key=_key(tts)))
    return segs


# --- audio -----------------------------------------------------------------------------------
def _read(path: Path) -> np.ndarray:
    with wave.open(str(path), "rb") as w:
        assert w.getframerate() == SR and w.getnchannels() == 1 and w.getsampwidth() == 2, path
        return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0


def _rms(x: np.ndarray) -> float:
    active = x[np.abs(x) > 0.01]                       # ignore les silences internes
    return float(np.sqrt(np.mean(active ** 2))) if active.size else 1e-6


def match_levels(chunks: list[np.ndarray]) -> list[np.ndarray]:
    """Ramène chaque segment vers le niveau médian (correction plafonnée) : deux appels TTS n'ont pas
    forcément le même volume. La normalisation finale (loudnorm) se fait ensuite dans assemble."""
    if len(chunks) < 2:
        return chunks
    rms = [_rms(c) for c in chunks]
    target, cap = float(np.median(rms)), 10 ** (config.SEG_LEVEL_MAX_GAIN_DB / 20)
    out = []
    for c, r in zip(chunks, rms):
        gain = float(np.clip(target / r, 1 / cap, cap))
        out.append(np.clip(c * gain, -1.0, 1.0))
    return out


def _fade(x: np.ndarray) -> np.ndarray:
    n = min(int(FADE_S * SR), x.size // 2)
    if n:
        ramp = np.linspace(0.0, 1.0, n, dtype=np.float32)
        x = x.copy()
        x[:n] *= ramp
        x[-n:] *= ramp[::-1]
    return x


def _write(path: Path, x: np.ndarray) -> None:
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())


# --- orchestration ---------------------------------------------------------------------------
Synth = Callable[[str, Path], object]
Transcribe = Callable[[Path], list[dict]]


def build_voice(script: VideoScript, words: list[align.Word], bdir: Path, *, use_asr: bool = True,
                force: bool = False, synth: Synth | None = None, transcribe: Transcribe | None = None,
                log: Callable[[str], None] = print) -> tuple[Path, float, align.AlignReport, list[Segment]]:
    """Produit build/<id>/voice.wav et remplit start/end de `words` (timings globaux).
    Retourne (voice.wav, durée, rapport d'alignement agrégé, segments)."""
    if synth is None:
        from . import tts
        synth = tts.synthesize
    if transcribe is None and use_asr:
        from . import asr
        transcribe = asr.transcribe_words
    sdir = bdir / "voice_segments"
    sdir.mkdir(parents=True, exist_ok=True)
    segs = plan_segments(script, words)
    log(f"[voix] {len(segs)} segment(s) · {config.TTS_MODEL} / {config.TTS_VOICE}")

    chunks: list[np.ndarray] = []
    reports: list[align.AlignReport] = []
    for seg in segs:
        raw, trimmed, asr_json = sdir / f"{seg.key}.raw.wav", sdir / f"{seg.key}.wav", sdir / f"{seg.key}.asr.json"
        seg.cached = raw.exists() and not force
        if not seg.cached:
            log(f"  [tts] segment {seg.index + 1}/{len(segs)} · bloc '{script.blocks[seg.block].id}' · "
                f"{len(seg.text.split())} mots")
            synth(seg.text, raw)
            trimmed.unlink(missing_ok=True)
            asr_json.unlink(missing_ok=True)
        if not trimmed.exists():
            audio.trim_silence(raw, trimmed)
        chunk = _read(trimmed)
        dur = chunk.size / SR
        seg_words = words[seg.first_word:seg.last_word]
        if use_asr:
            if not asr_json.exists():
                log(f"  [asr] segment {seg.index + 1}/{len(segs)}")
                asr_json.write_text(json.dumps(transcribe(trimmed), ensure_ascii=False), encoding="utf-8")
            _, rep = align.align_words(seg_words, json.loads(asr_json.read_text(encoding="utf-8")), dur)
            reports.append(rep)
        else:
            align.proportional_timings(seg_words, dur)
        chunks.append(chunk)

    chunks = match_levels(chunks)
    pieces, cursor = [], 0.0
    for seg, chunk in zip(segs, chunks):
        if seg.pause_before:
            pieces.append(np.zeros(int(seg.pause_before * SR), dtype=np.float32))
            cursor += int(seg.pause_before * SR) / SR
        seg.start, seg.end = cursor, cursor + chunk.size / SR
        for w in words[seg.first_word:seg.last_word]:            # timings locaux → globaux
            w.start += seg.start
            w.end += seg.start
        pieces.append(_fade(chunk))
        cursor = seg.end
    voice = bdir / "voice.wav"
    _write(voice, np.concatenate(pieces))
    (bdir / "voice_segments.json").write_text(json.dumps(
        [{"index": s.index, "block": script.blocks[s.block].id, "start": round(s.start, 3), "end": round(s.end, 3),
          "words": [s.first_word, s.last_word], "key": s.key, "cached": s.cached} for s in segs],
        ensure_ascii=False, indent=1), encoding="utf-8")
    return voice, cursor, _merge(reports, words), segs


def _merge(reports: list[align.AlignReport], words: list[align.Word]) -> align.AlignReport:
    if not reports:
        return align.AlignReport(n_script=len(words), n_asr=0, coverage=1.0, interpolated=[], weak=[])
    n = sum(r.n_script for r in reports)
    good = sum(r.coverage * r.n_script for r in reports)
    return align.AlignReport(
        n_script=n, n_asr=sum(r.n_asr for r in reports), coverage=good / n if n else 0.0,
        interpolated=[w for r in reports for w in r.interpolated], weak=[w for r in reports for w in r.weak])
