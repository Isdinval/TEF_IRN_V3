"""Lint de script (GATE 1) : automatise ce qui est automatisable de la checklist Phase 0."""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

from . import chapters as chapters_mod

from . import config, supabase_source
from .schema import STEPPED_CARDS, VideoScript
from .textutil import count_words

_SPOKEN_CTA = re.compile(
    r"lien en bio|dans la description|abonne|abonnez|t'abonner|télécharge|inscris|"
    r"rejoins|clique|essaie l'app|sur l'app|commentaire épinglé",
    re.IGNORECASE,
)
_PROGRESSION = ["perplexe", "reflechit", "victorieux", "heureux"]
IMPLEMENTED_CARDS = {"question", "compare", "terms", "text_annotated", "plan"}
_CARD_REQUIRED = {"compare": "rows", "terms": "items", "text_annotated": "parts", "plan": "items"}   # sans elles : placeholder
_MAX_STEPS = {"terms": 4, "text_annotated": 5, "plan": 6}      # au-delà, illisible sur 640 px de haut
# Titre de colonne d'une carte `compare` : Montserrat Black 54 px, police fixe, ≈ 31 px/caractère, dans une colonne de
# 400 px (Short) ou 510 px (Long). Au-delà de ces longueurs, le texte déborde du bloc (constaté sur short-11/13/15).
_COMPARE_TITLE_MAX = {"short": 11, "long": 15}


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


def _lint_anchor_range(script: VideoScript, owner, anchors, add) -> None:
    """Les ancres sont cherchées dans TOUTE la voix : un mot déjà prononcé plus tôt déclencherait l'apparition
    au mauvais endroit. On vérifie que chaque ancre tombe dans un bloc où la carte est affichée."""
    start = script.blocks.index(owner)
    users = [i for i, x in enumerate(script.blocks) if x is owner or x.card_from == owner.id]
    lo, hi = min(users + [start]), max(users)
    for a in anchors:
        if not lo <= a.block <= hi:
            where = "avant" if a.block < lo else "après"
            add("warn", f"bloc '{owner.id}' : l'ancre « {a.text.strip(' .,:;')} » est prononcée dans le bloc "
                        f"'{script.blocks[a.block].id}', {where} l'affichage de la carte → apparition mal placée ; "
                        "reformuler la voix ou cibler une autre occurrence (`mot#2`)")


LONG_MIN_S, LONG_MAX_S = 240.0, 480.0          # 4-8 min (stratégie)
_REHOOK_AFTER_S = 150.0                          # re-hook attendu dès que la vidéo dépasse ce seuil (~3:00 visé)


def _lint_long(script: VideoScript, add) -> None:
    """Règles des vidéos longues (stratégie § Format long) : durée, re-hook, un seul CTA parlé à la fin, chapitres."""
    secs = estimate_seconds(script)
    words = sum(count_words(b.voice) for b in script.blocks)
    if secs < LONG_MIN_S:
        add("warn", f"{words} mots (~{secs:.0f}s estimées) < {LONG_MIN_S:.0f}s : en dessous du format long visé (4-8 min)")
    elif secs > LONG_MAX_S:
        add("warn", f"{words} mots (~{secs:.0f}s estimées) > {LONG_MAX_S:.0f}s : au-dessus du format long visé (4-8 min)")
    if secs > _REHOOK_AFTER_S and not any(b.id.lower().startswith("rehook") for b in script.blocks):
        add("warn", "aucun bloc `rehook*` : relancer l'attention vers 3:00 (rétention du milieu de vidéo)")
    ctas = [i for i, b in enumerate(script.blocks) if _SPOKEN_CTA.search(b.voice)]
    if not ctas:
        add("warn", "aucun CTA parlé : un seul appel à l'action est attendu, dans le dernier bloc")
    elif len(ctas) > 1:
        add("warn", f"{len(ctas)} CTA parlés (blocs {', '.join(script.blocks[i].id for i in ctas)}) : un seul, à la fin")
    elif ctas[0] != len(script.blocks) - 1:
        add("warn", f"CTA parlé dans le bloc '{script.blocks[ctas[0]].id}' : le placer dans le dernier bloc")
    opens = [b for b in script.blocks if b.chapter and b.chapter.strip()]
    if not opens:
        add("todo", "aucun `chapter:` : pas de titre de chapitre ni de chapters.txt (YouTube : 3 chapitres minimum)")
    else:
        if script.blocks[0].chapter is None or not script.blocks[0].chapter.strip():
            add("warn", "le 1er bloc n'ouvre pas de chapitre : YouTube exige un chapitre à 0:00 (ajouter `chapter:` au hook)")
        if len(opens) < chapters_mod.MIN_CHAPTERS:
            add("warn", f"{len(opens)} chapitre(s) : YouTube n'affiche les chapitres qu'à partir de {chapters_mod.MIN_CHAPTERS}")
        titles = [b.chapter.strip().lower() for b in opens]
        if len(set(titles)) != len(titles):
            add("warn", "titres de chapitres dupliqués")
        for b in opens:
            if len(b.chapter.strip()) > 48:
                add("warn", f"chapitre « {b.chapter[:30]}… » : titre trop long (> 48 caractères, illisible en haut à droite)")


def estimate_seconds(script: VideoScript) -> float:
    words = sum(count_words(b.voice) for b in script.blocks)
    return words / config.SPEECH_WPS


def _guide_slugs(scripts: list[VideoScript]) -> set[str]:
    return {c.source_guide for s in scripts for c in s.claims if c.source_guide}


def _fold(text: str) -> str:
    """minuscules sans accents, pour comparer mot-clé et titre."""
    return "".join(c for c in unicodedata.normalize("NFD", text.lower()) if unicodedata.category(c) != "Mn")


def lint_script(script: VideoScript, publish: bool = False,
                published_guides: set[str] | None = None) -> list[Issue]:
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

    thumb = script.thumbnail.text or script.title
    if count_words(thumb.replace("*", "")) > 7:
        add("warn", "miniature : accroche > 7 mots (illisible en petit) → renseigner `thumbnail.text` (*mot* = en or)")

    if script.format == "short":
        if any(b.chapter for b in script.blocks):
            add("warn", "`chapter:` ignoré en Short (chapitres = vidéos longues)")
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

    if script.background:
        try:
            config.resolve_background(script.background)
        except FileNotFoundError as exc:
            add("error", str(exc))

    trailer = script.id.startswith("trailer")           # bande-annonce de chaîne : ni durée 4-8 min, ni chapitres, ni claims
    if script.format == "long" and not trailer:
        _lint_long(script, add)
        for b in script.blocks:
            if not b.card and not b.card_from:
                add("error", f"bloc '{b.id}' : aucune carte (`card` ou `card_from`) → écran vide pendant que la voix parle")
        for b in script.blocks:
            if b.tts_text and count_words(b.voice) > config.SEG_MAX_WORDS:
                add("warn", f"bloc '{b.id}' : {count_words(b.voice)} mots avec `tts_text` → envoyé en UN appel TTS "
                            f"(pas de découpe possible) ; couper le bloc en deux (> {config.SEG_MAX_WORDS} mots)")
            if b.overlay:
                add("warn", f"bloc '{b.id}' : le badge `overlay` est prévu pour l'accroche d'un Short ; "
                            "en 16:9 il se superpose à la zone haute (titre de chapitre à venir)")

    words = None
    for b in script.blocks:
        if not b.card:
            continue
        if b.card.kind == "compare":
            for side in ("left", "right"):
                title = str(b.card.data.get(side, {}).get("title", ""))
                if len(title) > _COMPARE_TITLE_MAX[script.format]:
                    add("error", f"carte 'compare' (bloc '{b.id}') : titre de colonne « {title} » "
                                 f"> {_COMPARE_TITLE_MAX[script.format]} caractères, il déborde du bloc")
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
                anchors = timeline._anchor_words(b.card, words)
            except ValueError as exc:
                add("error", f"bloc '{b.id}' : {exc}")
            else:
                _lint_anchor_range(script, b, anchors, add)

    if script.pillar in {"B", "C", "D", "F"} and not script.claims and not trailer:
        add("warn", f"pilier {script.pillar} : aucune claim déclarée (chaque fait doit venir d'un guide publié)")
    if publish:
        if published_guides is None and _guide_slugs([script]):
            try:
                published_guides = supabase_source.published_guide_slugs(_guide_slugs([script]))
            except Exception as exc:                 # échec réseau/clé : on bloque (jamais de publication non vérifiée)
                add("error", f"guides sources non vérifiables (Supabase) : {exc}")
                published_guides = set()
        for c in script.claims:
            if not c.source_guide:
                add("error", f"claim sans guide source (`source_guide`) : « {c.text} »")
            elif c.source_guide not in (published_guides or set()):
                add("error", f"claim : guide « {c.source_guide} » introuvable ou non publié : « {c.text} »")
        for b in script.blocks:
            if b.card and b.card.data.get("draft"):
                add("error", f"carte du bloc '{b.id}' en données provisoires (draft) : brancher une vraie source")
        if script.status != "approved":
            add("error", "status != approved (validation humaine GATE 1 manquante)")
    else:
        unv = [c for c in script.claims if not c.source_guide]
        if unv:
            add("todo", f"{len(unv)} claim(s) sans `source_guide` (slug d'un guide publié) avant publication")

    info = script.publish                                  # SEO / GEO de la publication
    if len(script.title) > 60:
        add("warn", f"titre de {len(script.title)} caractères (> 60 : tronqué sur mobile)")
    if not info.keyword:
        add("todo", "publish.keyword (requête cible) manquant")
    elif _fold(info.keyword) not in _fold(script.title)[:40]:
        add("warn", f"mot-clé « {info.keyword} » absent des 40 premiers caractères du titre")
    if script.format == "long" and not trailer and len(info.title_variants) != 2:
        add("warn", "publish.title_variants : 2 titres B/C attendus pour le test A/B (sinon : miniature seule)")
    if info.title_variants and script.format == "short":
        add("warn", "`title_variants` ignoré en Short (pas de test A/B sur les Shorts)")
    for v in info.title_variants:
        if len(v) > 60:
            add("warn", f"titre variante « {v[:30]}… » de {len(v)} caractères (> 60)")
        if info.keyword and _fold(info.keyword) not in _fold(v)[:40]:
            add("warn", f"mot-clé « {info.keyword} » absent des 40 premiers caractères de la variante « {v[:30]}… »")
    if len({_fold(x) for x in [script.title, *info.title_variants]}) < len(info.title_variants) + 1:
        add("warn", "title_variants : titres identiques")
    if not info.answer:
        add("todo", "publish.answer (réponse en une phrase, ligne 1 de la description) manquant")
    if len(info.hashtags) > 3:
        add("warn", "plus de 3 hashtags : seuls 3 sont gardés sur YouTube")
    if len(info.tags) > 8:
        add("warn", "plus de 8 tags : seuls 8 sont gardés")
    if script.format == "long" and not trailer and len(((info.answer or "") + " " + (info.description or "")).split()) < 200:
        add("warn", "description de moins de 200 mots (SEO/GEO : viser 200-300 mots pour un long)")

    if script.format == "short":
        add("todo", "à vérifier à l'oreille : la dernière phrase se raccorde-t-elle à la première ? "
                    "(lire loop puis hook à la suite)")
    return out


def has_errors(issues: list[Issue]) -> bool:
    return any(i.level == "error" for i in issues)


def lint_all(scripts: list[VideoScript], publish: bool = False) -> list[Issue]:
    out: list[Issue] = []
    published = None
    if publish and _guide_slugs(scripts):            # un seul appel Supabase pour tout le lot
        try:
            published = supabase_source.published_guide_slugs(_guide_slugs(scripts))
        except Exception:
            published = None                         # chaque script remontera l'erreur lui-même
    for s in scripts:
        out.extend(lint_script(s, publish, published))
    shorts = [s for s in scripts if s.format == "short" and s.status != "outline"]
    for prev, cur in zip(shorts, shorts[1:]):
        if prev.hook_formula and prev.hook_formula == cur.hook_formula:
            out.append(Issue("error", cur.id,
                             f"même formule de hook que {prev.id} ({cur.hook_formula}) : à faire tourner"))
    return out
