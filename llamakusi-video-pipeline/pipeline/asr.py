"""Transcription Gemini avec timestamps au mot (gemini-3.5-transcribe).

API : Interactions, mode verbatim + timestamp_granularities=["word"]
(doc Google « Audio transcription », consultée le 29/09/2026).
Réserve documentée : les timestamps au mot peuvent dégrader la précision du texte → c'est
pourquoi seul le TIMING est repris, jamais le texte (voir align.py).
⚠ Appel réseau non testé dans le sandbox de conception ; le parsing est testé.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

from . import config


def _get(obj: Any, key: str, default: Any = None) -> Any:
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def parse_offset(value: Any) -> float:
    """'0.100s' | 0.1 | {'seconds':0,'nanos':1e8} → secondes."""
    if value is None:
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        return float(value.strip().rstrip("s"))
    seconds = _get(value, "seconds", 0) or 0
    nanos = _get(value, "nanos", 0) or 0
    return float(seconds) + float(nanos) / 1e9


def extract_words(interaction: Any) -> list[dict]:
    """Extrait les annotations `word_info` (structure décrite dans la doc Google)."""
    words: list[dict] = []
    for step in _get(interaction, "steps", []) or []:
        for content in _get(step, "content", []) or []:
            for ann in _get(content, "annotations", []) or []:
                if _get(ann, "type") == "word_info":
                    words.append({
                        "text": _get(ann, "text", ""),
                        "start": parse_offset(_get(ann, "start_offset")),
                        "end": parse_offset(_get(ann, "end_offset")),
                    })
    return words


def transcribe_words(audio_path: Path, *, model: str | None = None,
                     language: str | None = None) -> list[dict]:
    from google import genai

    client = genai.Client()
    audio_file = client.files.upload(file=str(audio_path))
    interaction = client.interactions.create(
        model=model or config.ASR_MODEL,
        input=[{"type": "audio", "uri": audio_file.uri, "mime_type": audio_file.mime_type}],
        generation_config={
            "transcription_config": {
                "language_codes": [language or config.ASR_LANGUAGE],
                "mode": {"type": "verbatim", "timestamp_granularities": ["word"]},
            }
        },
    )
    words = extract_words(interaction)
    if not words:
        raise RuntimeError("aucune annotation word_info reçue : vérifier modèle/config ASR")
    return words
