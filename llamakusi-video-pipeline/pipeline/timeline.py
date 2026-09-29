"""Construit timeline.json + les PNG de calques à partir du script et des timings des mots."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

from . import config, layers
from .align import Word, block_spans, group_words, snap
from .schema import Card, VideoScript

TRACK_ORDER = ["brand", "card", "mascot", "overlay", "cta", "subs"]   # ordre = z-index croissant
FRAME = 1.0 / config.FPS


def _save(img, layers_dir: Path, prefix: str, key: str) -> str:
    name = f"{prefix}_{hashlib.sha1(key.encode('utf-8')).hexdigest()[:10]}.png"
    path = layers_dir / name
    if not path.exists():
        img.save(path, "PNG", optimize=False)
    return f"layers/{name}"


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


def build_timeline(script: VideoScript, words: list[Word], audio_duration: float,
                   build_dir: Path) -> dict:
    layers_dir = build_dir / "layers"
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
            key = json.dumps([card.kind, card.data, state, script.accent, block.visual_note],
                             sort_keys=True, ensure_ascii=False)
            img = layers.render_card(card.kind, card.data, state, script.accent, block.visual_note)
            tracks["card"].append({"start": start, "end": end,
                                   "png": _save(img, layers_dir, "card", key)})
        if block.overlay:
            tracks["overlay"].append({
                "start": start, "end": end,
                "png": _save(layers.render_overlay(block.overlay), layers_dir, "overlay", block.overlay)})
        cta = block.cta_overlay or (script.cta_overlay if (script.format == "short"
                                    and bi == len(script.blocks) - 1) else None)
        if cta:
            tracks["cta"].append({
                "start": start, "end": end,
                "png": _save(layers.render_cta(cta), layers_dir, "cta", cta)})

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
