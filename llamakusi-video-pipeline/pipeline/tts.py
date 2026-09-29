"""TTS Gemini — UN appel par Short (intonation continue), frontières de blocs déduites de l'alignement.

API : Interactions (doc Google « Text-to-speech generation », consultée le 29/09/2026).
⚠ Non exécutable dans le sandbox de conception : à valider au premier run réel.
"""
from __future__ import annotations

import base64
import io
import time
import wave
from pathlib import Path

from . import config
from .schema import VideoScript


def spoken_text(script: VideoScript) -> str:
    """Texte envoyé au TTS : voix des blocs (ou tts_text), prononciations forcées appliquées."""
    parts = []
    for b in script.blocks:
        text = (b.tts_text or b.voice).strip()
        for src, dst in config.PRONUNCIATIONS.items():
            text = text.replace(src, dst)
        if text:
            parts.append(text)
    return " ".join(parts)


def _ensure_wav(data: bytes) -> bytes:
    """La doc annonce du WAV (RIFF) en unary ; on emballe du PCM 24 kHz s16 mono si besoin."""
    if data[:4] == b"RIFF":
        return data
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(24000)
        w.writeframes(data)
    return buf.getvalue()


def synthesize(text: str, out_path: Path, *, model: str | None = None, voice: str | None = None,
               style: str | None = None, retries: int = 3) -> Path:
    from google import genai   # import tardif : le reste du pipeline marche sans SDK

    client = genai.Client()
    content: dict = {"type": "text", "text": text}
    style = config.TTS_STYLE if style is None else style
    if style:
        content["annotations"] = [{"type": "speech_metadata", "style": style}]

    last_err: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            interaction = client.interactions.create(
                model=model or config.TTS_MODEL,
                input=[{"type": "user_input", "content": [content]}],
                response_format={"type": "audio"},
                generation_config={"speech_config": [{"voice": voice or config.TTS_VOICE}]},
            )
            data = base64.b64decode(interaction.output_audio.data)
            out_path.write_bytes(_ensure_wav(data))
            return out_path
        except Exception as exc:  # noqa: BLE001 — on réessaie puis on remonte
            last_err = exc
            time.sleep(2 * attempt)
    raise RuntimeError(f"TTS échoué après {retries} essais : {last_err}")
