"""Tokenisation partagée (lint, alignement, sous-titres)."""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

NBSP = "\u00a0"
_ATTACH = {":", ";", "?", "!", "»"}
_DASHES = {"—", "–", "-", "--"}


def normalize(token: str) -> str:
    """minuscules, sans accents ni ponctuation (utilisé des deux côtés de l'alignement)."""
    t = unicodedata.normalize("NFKD", token.lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]", "", t)


@dataclass
class Token:
    text: str            # forme affichée (ponctuation attachée)
    norm: str            # forme normalisée pour l'alignement
    pause_after: bool = False


def tokenize(text: str) -> list[Token]:
    out: list[Token] = []
    for raw in text.split():
        if raw in _DASHES:
            if out:
                out[-1].pause_after = True
            continue
        if not any(c.isalnum() for c in raw):
            if out:
                out[-1].text += (NBSP + raw) if raw in _ATTACH else raw
                out[-1].pause_after = True
            continue
        out.append(Token(raw, normalize(raw)))
    for t in out:
        if t.text and t.text[-1] in ".,;:!?…":
            t.pause_after = True
    return out


def count_words(text: str) -> int:
    return len(tokenize(text))
