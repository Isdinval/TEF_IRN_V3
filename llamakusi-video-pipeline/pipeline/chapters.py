"""Chapitres YouTube : `chapter:` des blocs → calque de titre + fichier chapters.txt (à coller dans la description).

Règles YouTube (à confirmer dans l'aide YouTube en cas de doute) : premier chapitre à 0:00, au moins 3 chapitres,
chaque chapitre d'au moins 10 secondes. Un chapitre OUVRE au bloc qui porte `chapter:` et dure jusqu'au suivant.
"""
from __future__ import annotations

from dataclasses import dataclass

from .schema import VideoScript

MIN_CHAPTERS, MIN_SECONDS = 3, 10.0


@dataclass
class Chapter:
    index: int          # 1, 2, 3…
    title: str
    start: float
    end: float
    block: str          # id du bloc qui ouvre le chapitre


def extract(script: VideoScript, block_info: list[dict], total: float) -> list[Chapter]:
    opens = [(i, b.chapter.strip()) for i, b in enumerate(script.blocks) if b.chapter and b.chapter.strip()]
    out: list[Chapter] = []
    for n, (bi, title) in enumerate(opens):
        start = block_info[bi]["start"]
        end = block_info[opens[n + 1][0]]["start"] if n + 1 < len(opens) else total
        out.append(Chapter(n + 1, title, start, end, script.blocks[bi].id))
    return out


def stamp(t: float) -> str:
    s = int(t)                                   # YouTube lit des secondes entières : on arrondit vers le bas
    h, rem = divmod(s, 3600)
    m, sec = divmod(rem, 60)
    return f"{h}:{m:02d}:{sec:02d}" if h else f"{m}:{sec:02d}"


def to_text(chapters: list[Chapter]) -> str:
    """Un chapitre par ligne « m:ss Titre », le premier forcé à 0:00 (exigence YouTube)."""
    lines = [f"{stamp(0.0 if c.index == 1 else c.start)} {c.title}" for c in chapters]
    return "\n".join(lines) + "\n"


def problems(chapters: list[Chapter], first_block_id: str) -> list[str]:
    out = []
    if not chapters:
        return out
    if chapters[0].block != first_block_id:
        out.append(f"le 1er chapitre s'ouvre au bloc « {chapters[0].block} » et non au 1er bloc : YouTube exige 0:00")
    if len(chapters) < MIN_CHAPTERS:
        out.append(f"{len(chapters)} chapitre(s) : YouTube n'affiche les chapitres qu'à partir de {MIN_CHAPTERS}")
    for c in chapters:
        if c.end - c.start < MIN_SECONDS:
            out.append(f"chapitre « {c.title} » : {c.end - c.start:.0f} s < {MIN_SECONDS:.0f} s minimum")
    return out
