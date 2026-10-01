"""Construit timeline.json + les PNG de calques à partir du script et des timings des mots."""
from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path

from . import chapters as chapters_mod
from . import config, layers, textutil
from .align import Word, block_spans, group_words, snap
from .schema import STEPPED_CARDS, Card, VideoScript
from .textutil import tokenize

TRACK_ORDER = ["brand", "chapter", "card", "mascot", "overlay", "cta", "arrow", "subs"]   # ordre = z-index croissant
FRAME = 1.0 / config.FPS


def _save(img, layers_dir: Path, prefix: str, key: str) -> str:
    name = f"{prefix}_{hashlib.sha1(key.encode('utf-8')).hexdigest()[:10]}.png"
    path = layers_dir / name
    if not path.exists():
        img.save(path, "PNG", optimize=False)
    return f"layers/{name}"


def _check_layers_signature(layers_dir: Path) -> None:
    """Vide le cache des calques PNG si le code de rendu ou le profil de mise en page a changé
    (plus besoin de supprimer build/<id>/layers à la main après une modification du rendu)."""
    sig = hashlib.sha1((config.profile_signature()
                        + Path(layers.__file__).read_text(encoding="utf-8")
                        + Path(textutil.__file__).read_text(encoding="utf-8")).encode("utf-8")).hexdigest()
    marker = layers_dir / ".signature"
    if layers_dir.exists() and (not marker.exists() or marker.read_text() != sig):
        shutil.rmtree(layers_dir)
    layers_dir.mkdir(parents=True, exist_ok=True)
    marker.write_text(sig)


def _resolve_cards(script: VideoScript) -> dict[str, tuple[Card, str]]:
    cards: dict[str, Card] = {}
    out: dict[str, tuple[Card, str]] = {}
    for b in script.blocks:
        card = b.card or (cards.get(b.card_from) if b.card_from else None)
        if b.card:
            cards[b.id] = b.card
        elif card:
            cards[b.id] = card
        if card:
            out[b.id] = (card, b.card_state)
    return out


def _clean(segments: list[dict], total: float) -> list[dict]:
    """Trie, supprime les segments vides, empêche les chevauchements."""
    out, cursor = [], 0.0
    for seg in sorted(segments, key=lambda s: s["start"]):
        start = max(seg["start"], cursor)
        end = min(seg["end"], total)
        if end - start >= FRAME * 0.5:
            out.append({**seg, "start": round(start, 4), "end": round(end, 4)})
            cursor = end
    return out


def _stem(norm: str) -> str:
    """Tolère le pluriel simple (« argument » ↔ « arguments »)."""
    return norm[:-1] if len(norm) > 3 and norm.endswith("s") else norm


def _anchor_words(card: Card, words: list[Word]) -> list[Word]:
    """Un mot d'ancrage par item, cherché dans l'ordre (celui de la liste) dans TOUTE la voix.

    Ancre = `at` si fourni, sinon le champ par défaut de la carte (`term`, `label`, puis `role`).
    `at: "de#2"` = 2e occurrence du mot (après l'ancre précédente). L'item apparaît quand la voix
    prononce ce mot. Échec explicite si l'ancre est introuvable.
    """
    key, field = STEPPED_CARDS[card.kind]
    anchors: list[Word] = []
    cursor = 0
    for item in card.data[key]:
        spec = str(item.get("at") or item.get(field) or item.get("role") or "")
        word_part, _, nth = spec.partition("#")
        toks = tokenize(word_part)
        if not toks:
            raise ValueError(f"carte '{card.kind}' : ancre vide pour l'item {item}")
        target = _stem(toks[0].norm)
        occurrence = int(nth) if nth.strip().isdigit() else 1
        seen = 0
        for i in range(cursor, len(words)):
            if _stem(words[i].norm) == target:
                seen += 1
                if seen == occurrence:
                    anchors.append(words[i])
                    cursor = i + 1
                    break
        else:
            raise ValueError(f"carte '{card.kind}' : ancre « {spec} » (item « {word_part or item} ») "
                             "introuvable dans la voix (après l'item précédent) ; utiliser `at:`")
    return anchors


def _card_segments(card: Card, state: str, bi: int, start: float, end: float,
                   words: list[Word]) -> list[tuple[float, float, int | None, bool]]:
    """Découpe le segment d'un bloc en étapes (start, end, nb d'items visibles, focus sur le dernier)."""
    spec = STEPPED_CARDS.get(card.kind)
    if not spec or not card.data.get(spec[0]):
        return [(start, end, None, True)]
    n = len(card.data[spec[0]])
    if state == "revealed":
        return [(start, end, n, True)]
    if state == "initial":                                     # retour visuel à l'accroche
        return [(start, end, 0, False)]
    anchors = _anchor_words(card, words)
    visible = sum(1 for a in anchors if a.block < bi)          # déjà dévoilés dans les blocs précédents
    focus = 0 < visible < n                                    # continuité ; tout dévoilé = pas de focus
    segs, cur = [], start
    for a in (a for a in anchors if a.block == bi):
        t = min(max(snap(a.start), start), end)
        if t > cur + FRAME * 0.5:
            segs.append((cur, t, visible, focus))
            cur = t
        visible += 1
        focus = True                                           # un item vient d'apparaître : on le met en avant
    segs.append((cur, end, visible, focus))
    return segs

def build_timeline(script: VideoScript, words: list[Word], audio_duration: float,
                   build_dir: Path) -> dict:
    config.use_profile(script.format)
    layers_dir = build_dir / "layers"
    _check_layers_signature(layers_dir)
    layers_dir.mkdir(parents=True, exist_ok=True)
    total = snap(audio_duration + config.TAIL_SECONDS)
    spans = block_spans(words, len(script.blocks), total)
    cards = _resolve_cards(script)
    tracks: dict[str, list[dict]] = {k: [] for k in TRACK_ORDER}

    blank = layers.canvas()
    blank.save(layers_dir / "blank.png")

    tracks["brand"].append({"start": 0.0, "end": total,
                            "png": _save(layers.render_brand(script.accent), layers_dir, "brand", script.accent)})

    block_info = []
    for bi, (block, (start, end)) in enumerate(zip(script.blocks, spans)):
        block_info.append({"id": block.id, "start": start, "end": end, "mascot": block.mascot})
        tracks["mascot"].append({
            "start": start, "end": end,
            "png": _save(layers.render_mascot(block.mascot, block.pose), layers_dir, "mascot",
                         f"{block.mascot}-{block.pose}")})
        if block.id in cards:
            card, state = cards[block.id]
            for seg_start, seg_end, visible, focus in _card_segments(card, state, bi, start, end, words):
                key = json.dumps([card.kind, card.data, state, script.accent, block.visual_note,
                                  visible, focus], sort_keys=True, ensure_ascii=False)
                img = layers.render_card(card.kind, card.data, state, script.accent,
                                         block.visual_note, visible, focus)
                tracks["card"].append({"start": seg_start, "end": seg_end,
                                       "png": _save(img, layers_dir, "card", key)})
        if block.overlay:
            tracks["overlay"].append({
                "start": start, "end": end,
                "png": _save(layers.render_overlay(block.overlay), layers_dir, "overlay", block.overlay)})
        cta = block.cta_overlay or (script.cta_overlay if (script.format == "short"
                                    and bi == len(script.blocks) - 1) else None)
        if cta:
            with_arrow = script.format == "short" and script.cta_arrow
            tracks["cta"].append({
                "start": start, "end": end,
                "png": _save(layers.render_cta(cta, with_arrow), layers_dir, "cta", f"{cta}|arrow={with_arrow}")})
            if with_arrow:
                step = config.ARROW_CYCLE_S / config.ARROW_PHASES
                arrow_png: dict[int, str] = {}
                t, k = start, 0
                while t < end - FRAME * 0.5:
                    nxt = min(snap(t + step) if snap(t + step) > t else t + FRAME, end)
                    ph = k % config.ARROW_PHASES
                    if ph not in arrow_png:
                        arrow_png[ph] = _save(layers.render_cta_arrow(ph, cta), layers_dir, "arrow", f"{cta}#{ph}")
                    tracks["arrow"].append({"start": t, "end": nxt, "png": arrow_png[ph]})
                    t, k = nxt, k + 1

    if script.format == "long":
        for ch in chapters_mod.extract(script, block_info, total):
            tracks["chapter"].append({"start": ch.start, "end": ch.end, "png": _save(
                layers.render_chapter(ch.index, ch.title), layers_dir, "chapter", f"{ch.index}|{ch.title}")})

    groups = group_words(words)
    for gi, group in enumerate(groups):
        next_start = words[groups[gi + 1][0]].start if gi + 1 < len(groups) else total
        for j, idx in enumerate(group):
            st = snap(words[idx].start)
            if j + 1 < len(group):
                en = snap(words[group[j + 1]].start)
            else:
                en = snap(min(next_start, words[group[-1]].end + 0.25))
            texts = [words[k].text for k in group]
            img = layers.render_subs(texts, j)
            tracks["subs"].append({"start": st, "end": max(en, st + FRAME),
                                   "png": _save(img, layers_dir, "subs", "|".join(texts) + f"#{j}")})

    timeline = {
        "id": script.id,
        "fps": config.FPS,
        "size": [config.W, config.H],
        "duration": total,
        "voice": "voice.wav",
        "blank": "layers/blank.png",
        "blocks": block_info,
        "tracks": {k: _clean(v, total) for k, v in tracks.items()},
    }
    (build_dir / "timeline.json").write_text(json.dumps(timeline, ensure_ascii=False, indent=2),
                                             encoding="utf-8")
    return timeline
