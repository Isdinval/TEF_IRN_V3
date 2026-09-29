"""Lint de script (GATE 1) : automatise ce qui est automatisable de la checklist Phase 0."""
from __future__ import annotations

import re
from dataclasses import dataclass

from . import config
from .schema import VideoScript
from .textutil import count_words

_SPOKEN_CTA = re.compile(
    r"lien en bio|dans la description|abonne|abonnez|t'abonner|télécharge|inscris|"
    r"rejoins|clique|essaie l'app|sur l'app|commentaire épinglé",
    re.IGNORECASE,
)
_PROGRESSION = ["perplexe", "reflechit", "victorieux", "heureux"]
IMPLEMENTED_CARDS = {"question", "compare"}


@dataclass
class Issue:
    level: str        # "error" | "warn" | "todo"
    script_id: str
    message: str


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

        moods = [b.mascot for b in script.blocks]
        if moods != _PROGRESSION:
            add("warn", f"mascotte hors ordre narratif {_PROGRESSION} : {moods}")

    for b in script.blocks:
        if b.card and b.card.kind == "compare" and not b.card.data.get("rows"):
            add("todo", f"carte 'compare' (bloc '{b.id}') sans `rows` : placeholder rendu")
        elif b.card and b.card.kind == "terms":
            if not b.card.data.get("items"):
                add("todo", f"carte 'terms' (bloc '{b.id}') sans `items` : placeholder rendu")
            elif len(b.card.data["items"]) > 4:
                add("warn", f"carte 'terms' (bloc '{b.id}') : {len(b.card.data['items'])} items, "
                            "4 max lisibles sur 640 px")
        elif b.card and b.card.kind not in IMPLEMENTED_CARDS:
            add("todo", f"carte '{b.card.kind}' (bloc '{b.id}') pas encore implémentée : placeholder rendu")

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

    add("todo", "à vérifier à la main : la dernière ligne boucle-t-elle vers la première ?")
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
