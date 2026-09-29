"""Contrat de données : un YAML par vidéo, validé par pydantic.

Tout le pipeline lit ce contrat (jamais le markdown de la Phase 0).
Le futur skill de génération de scripts produira ce même format (GATE 1).
"""
from __future__ import annotations

from pathlib import Path
from typing import Literal, Optional

import yaml
from pydantic import BaseModel, Field, model_validator

Mascot = Literal["perplexe", "reflechit", "victorieux", "heureux"]
HookFormula = Literal["stakes", "contrarian", "curiosity_gap", "in_medias_res", "direct_promise"]
CardKind = Literal["question", "compare", "text_annotated", "terms", "plan"]

SHORT_BLOCKS = ["hook", "build", "payoff", "loop"]


class Claim(BaseModel):
    """Affirmation factuelle vérifiable. Bloque la publication tant que non vérifiée."""

    text: str
    source_url: Optional[str] = None
    source_hint: Optional[str] = None   # où chercher la source (ex. service-public.fr)
    verified: bool = False


class Card(BaseModel):
    kind: CardKind
    data: dict = Field(default_factory=dict)


class Block(BaseModel):
    id: str
    voice: str = ""
    mascot: Mascot = "reflechit"
    pose: int = 1                       # 1..6 (voir config.MASCOT_COUNTS)
    overlay: Optional[str] = None       # gros badge d'accroche (ex. « 2026 », « B1 → B2 »)
    cta_overlay: Optional[str] = None   # petit texte discret (jamais parlé en Short)
    card: Optional[Card] = None
    card_from: Optional[str] = None     # réutilise la carte d'un bloc précédent (boucle)
    card_state: Literal["plain", "revealed"] = "plain"
    tts_text: Optional[str] = None      # surcharge de prononciation (TTS uniquement)
    visual_note: str = ""               # description Phase 0 (référence humaine)


class VideoScript(BaseModel):
    id: str
    format: Literal["short", "long"] = "short"
    status: Literal["draft", "approved", "outline"] = "draft"
    pillar: Literal["A", "B", "C", "D", "E", "F"]
    product: Literal["tef_irn", "examen_civique", "both", "fle_bridge"]
    hook_formula: Optional[HookFormula] = None
    accent: Literal["indigo", "blue", "gold"] = "indigo"
    title: str
    cta_overlay: Optional[str] = "Lien en bio"   # appliqué au dernier bloc d'un Short
    blocks: list[Block]
    claims: list[Claim] = Field(default_factory=list)

    @model_validator(mode="after")
    def _check(self) -> "VideoScript":
        ids = [b.id for b in self.blocks]
        if len(set(ids)) != len(ids):
            raise ValueError("ids de blocs dupliqués")
        if self.format == "short":
            if ids != SHORT_BLOCKS:
                raise ValueError(f"un Short doit avoir les blocs {SHORT_BLOCKS}, reçu {ids}")
            if self.hook_formula is None:
                raise ValueError("hook_formula obligatoire pour un Short")
        seen: set[str] = set()
        for b in self.blocks:
            if b.card_from and b.card_from not in seen:
                raise ValueError(f"card_from='{b.card_from}' doit référencer un bloc précédent")
            if not 1 <= b.pose <= 6:
                raise ValueError("pose doit être entre 1 et 6")
            seen.add(b.id)
        return self

    def voice_text(self) -> str:
        return " ".join(b.voice.strip() for b in self.blocks if b.voice.strip())


def load_script(path: Path) -> VideoScript:
    data = yaml.safe_load(Path(path).read_text(encoding="utf-8"))
    return VideoScript.model_validate(data)


def load_all(directory: Path) -> list[VideoScript]:
    return [load_script(p) for p in sorted(Path(directory).glob("*.yaml"))]


def find_script(directory: Path, script_id: str) -> VideoScript:
    path = Path(directory) / f"{script_id}.yaml"
    if not path.exists():
        raise FileNotFoundError(f"script introuvable : {path}")
    return load_script(path)
