"""Lint de script (GATE 1) : automatise ce qui est automatisable de la checklist Phase 0."""
from __future__ import annotations

import re
from dataclasses import dataclass

from . import config
from .schema import STEPPED_CARDS, VideoScript
from .textutil import count_words

_SPOKEN_CTA = re.compile(
    r"lien en bio|dans la description|abonne|abonnez|t'abonner|télécharge|inscris|"
    r"rejoins|clique|essaie l'app|sur l'app|commentaire épinglé",
    re.IGNORECASE,
)
_PROGRESSION = ["perplexe", "reflechit", "victorieux", "heureux"]
IMPLEMENTED_CARDS = {"question", "compare", "terms", "text_annotated"}
_CARD_REQUIRED = {"compare": "rows", "terms": "items", "text_annotated": "parts"}   # sans elles : placeholder
_MAX_STEPS = {"terms": 4, "text_annotated": 5}      # au-delà, illisible sur 640 px de haut


@dataclass
class Issue:
    level: str        # "error" | "warn" | "todo"
    script_id: str
    message: str


_OPEN_END = ("…", "...", ":", "—", "–", ",")


def _lint_loop(script: VideoScript, add) -> None:
    """Règle de boucle Short : la fin doit redémarrer sur le début sans que le spectateur le remarque."""
    hook, loop = script.blocks[0], script.blocks[-1]
    hook_card = hook.card
    loop_card = loop.card or next((b.card for b in script.blocks if b.id == loop.card_from), None)
    if hook_card and (loop.card_from != hook.id or loop.card):
        add("error", "boucle : le dernier bloc doit reprendre la carte du hook (`card_from: hook`, sans `card` propre)")
    if hook_card and loop_card is hook_card and loop.card_from == hook.id:
        if hook_card.kind in STEPPED_CARDS and loop.card_state != "initial":
            add("error", f"boucle : carte progressive '{hook_card.kind}' → le bloc loop doit avoir `card_state: initial` "
                         "(retour visuel exact à l'accroche)")
        if hook_card.kind not in STEPPED_CARDS and loop.card_state != "plain":
            add("warn", f"boucle : carte '{hook_card.kind}' → `card_state: plain` conseillé sur le bloc loop "
                        "(même image que le début)")
    if hook.overlay and loop.overlay and loop.overlay != hook.overlay:
        add("warn", "boucle : overlay du loop différent de celui du hook (saut visible au redémarrage)")
    end = loop.voice.rstrip()
    if end and not end.endswith(_OPEN_END):
        add("warn", "boucle : la dernière phrase est « fermée » (point final). Écrire une phrase SUSPENDUE qui se "
                    "raccorde au hook (ex. « …sans jamais l'avoir » → « Il y a une raison… »), terminée par … ou : ou —")
    if loop.mascot != hook.mascot:
        add("todo", f"boucle visuelle : mascotte {hook.mascot} (hook) ≠ {loop.mascot} (loop) → coupe visible au redémarrage "
                    "(compromis assumé tant que la progression narrative prime)")


def estimate_seconds(script: VideoScript) -> float:
    words = sum(count_words(b.voice) for b in script.blocks)
    return words / config.SPEECH_WPS


def lint_script(script: VideoScript, publish: bool = False) -> list[Issue]:
    sid, out = script.id, []

    def add(level: str, msg: str) -> None:
        out.append(Issue(level, sid, msg))

    if script.status == "outline":
        add("todo", "script à l'état d'ébauche (outline) : voix incomplète, lint limité")
        return out

    for b in script.blocks:
        if not b.voice.strip():
            add("error", f"bloc '{b.id}' sans texte de voix")
        elif "À REMPLACER" in b.voice:
            add("error", f"bloc '{b.id}' : squelette non complété (« À REMPLACER »)")

    if script.format == "short":
        total = sum(count_words(b.voice) for b in script.blocks)
        secs = estimate_seconds(script)
        if total > config.MAX_WORDS_ERROR or secs > config.MAX_SECONDS_ERROR:
            add("error", f"trop long : {total} mots (~{secs:.0f}s estimées)")
        elif secs > config.MAX_SECONDS_WARN:
            add("warn", f"{total} mots (~{secs:.0f}s estimées) > cible ~{config.MAX_SECONDS_WARN:.0f}s : "
                        "durée réelle à mesurer via le TTS")

        for b in script.blocks:
            if _SPOKEN_CTA.search(b.voice):
                add("error", f"CTA parlé interdit en Short (bloc '{b.id}') : overlay texte uniquement")

        _lint_loop(script, add)

        moods = [b.mascot for b in script.blocks]
        if moods != _PROGRESSION:
            add("warn", f"mascotte hors ordre narratif {_PROGRESSION} : {moods}")

    if script.format == "long":
        for b in script.blocks:
            if b.overlay:
                add("warn", f"bloc '{b.id}' : le badge `overlay` est prévu pour l'accroche d'un Short ; "
                            "en 16:9 il se superpose à la zone haute (titre de chapitre à venir)")

    words = None
    for b in script.blocks:
        if not b.card:
            continue
        kind, need = b.card.kind, _CARD_REQUIRED.get(b.card.kind)
        if need and not b.card.data.get(need):
            add("todo", f"carte '{kind}' (bloc '{b.id}') sans `{need}` : placeholder rendu")
        elif kind not in IMPLEMENTED_CARDS:
            add("todo", f"carte '{kind}' (bloc '{b.id}') pas encore implémentée : placeholder rendu")
        elif kind in STEPPED_CARDS:
            n = len(b.card.data[need])
            if n > _MAX_STEPS[kind]:
                add("warn", f"carte '{kind}' (bloc '{b.id}') : {n} éléments, {_MAX_STEPS[kind]} max lisibles")
            try:                                     # ancres introuvables : détecté ici, avant tout appel TTS
                from . import align, timeline
                words = words or align.flatten_script(script)
                timeline._anchor_words(b.card, words)
            except ValueError as exc:
                add("error", f"bloc '{b.id}' : {exc}")

    if script.pillar in {"B", "C", "D", "F"} and not script.claims:
        add("warn", f"pilier {script.pillar} : aucune claim déclarée (sources officielles obligatoires)")
    if publish:
        for c in script.claims:
            if not (c.verified and c.source_url):
                add("error", f"claim non vérifiée/sans source : « {c.text} »")
        for b in script.blocks:
            if b.card and b.card.data.get("draft"):
                add("error", f"carte du bloc '{b.id}' en données provisoires (draft) : brancher une vraie source")
        if script.status != "approved":
            add("error", "status != approved (validation humaine GATE 1 manquante)")
    else:
        unv = [c for c in script.claims if not (c.verified and c.source_url)]
        if unv:
            add("todo", f"{len(unv)} claim(s) à sourcer/vérifier avant publication")

    if script.format == "short":
        add("todo", "à vérifier à l'oreille : la dernière phrase se raccorde-t-elle à la première ? "
                    "(lire loop puis hook à la suite)")
    return out


def lint_all(scripts: list[VideoScript], publish: bool = False) -> list[Issue]:
    out: list[Issue] = []
    for s in scripts:
        out.extend(lint_script(s, publish))
    shorts = [s for s in scripts if s.format == "short" and s.status != "outline"]
    for prev, cur in zip(shorts, shorts[1:]):
        if prev.hook_formula and prev.hook_formula == cur.hook_formula:
            out.append(Issue("error", cur.id,
                             f"même formule de hook que {prev.id} ({cur.hook_formula}) : à faire tourner"))
    return out
