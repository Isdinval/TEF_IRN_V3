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

# Cartes à apparition progressive (un item par étape, calé sur un mot de la voix) :
#   kind -> (clé de la liste dans `data`, champ qui donne le mot d'ancrage par défaut)
STEPPED_CARDS = {"terms": ("items", "term"), "text_annotated": ("parts", "label"), "plan": ("items", "title")}
ROLES = ("intro", "argument", "conclusion")
_REQUIRED_FIELDS = {"terms": ("term", "definition"), "text_annotated": ("role", "text"), "plan": ("title",)}


class Claim(BaseModel):
    """Affirmation factuelle. Publiable uniquement si reprise d'un guide LlamaKusi publié (`source_guide`)."""

    text: str
    source_guide: Optional[str] = None  # slug du guide publié (table `guides`) dont la claim est reprise
    source_url: Optional[str] = None    # informatif : source officielle citée par le guide
    source_hint: Optional[str] = None   # informatif : où chercher la source (ex. service-public.fr)


class Card(BaseModel):
    kind: CardKind
    data: dict = Field(default_factory=dict)

    @model_validator(mode="after")
    def _check_stepped_data(self) -> "Card":
        """Erreur claire dès le chargement (plutôt qu'un KeyError au rendu). Données vides = placeholder."""
        spec = STEPPED_CARDS.get(self.kind)
        if not spec or not self.data.get(spec[0]):
            return self
        key = spec[0]
        items = self.data[key]
        if not isinstance(items, list) or not all(isinstance(i, dict) for i in items):
            raise ValueError(f"carte '{self.kind}' : `{key}` doit être une liste d'objets")
        for n, item in enumerate(items, 1):
            for f in _REQUIRED_FIELDS[self.kind]:
                if not str(item.get(f, "")).strip():
                    raise ValueError(f"carte '{self.kind}' : {key}[{n}] sans `{f}`")
        if self.kind == "text_annotated":
            for n, item in enumerate(items, 1):
                if item["role"] not in ROLES:
                    raise ValueError(f"carte 'text_annotated' : parts[{n}].role « {item['role']} » "
                                     f"invalide (attendu : {', '.join(ROLES)})")
            order = self.data.get("shuffled")
            if order is not None and sorted(order) != list(range(len(items))):
                raise ValueError("carte 'text_annotated' : `shuffled` doit être une permutation de "
                                 f"0..{len(items) - 1} (ordre d'affichage avant réorganisation)")
        return self


class Block(BaseModel):
    id: str
    voice: str = ""
    mascot: Mascot = "reflechit"
    pose: int = 1                       # 1..6 (voir config.MASCOT_COUNTS)
    chapter: Optional[str] = None       # LONG : ce bloc OUVRE un chapitre (titre affiché en haut à droite + chapters.txt)
    overlay: Optional[str] = None       # gros badge d'accroche (ex. « 2026 », « B1 → B2 »)
    cta_overlay: Optional[str] = None   # petit texte discret (jamais parlé en Short)
    card: Optional[Card] = None
    card_from: Optional[str] = None     # réutilise la carte d'un bloc précédent (boucle)
    card_state: Literal["plain", "revealed", "initial"] = "plain"   # initial = retour à l'état de l'accroche
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
    background: Optional[str] = None             # fond VIDÉO personnalisé (assets/backgrounds/<nom> ou chemin) ; défaut = fond animé généré
    cta_arrow: bool = True                       # flèche animée au-dessus du CTA (Short, dernier bloc)
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
