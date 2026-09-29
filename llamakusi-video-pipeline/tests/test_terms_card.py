"""Carte `terms` : apparition progressive calée sur les mots de la voix (hors-ligne)."""
import pytest

from pipeline import align, assets, config, layers, lint, schema, timeline
from pipeline.schema import Card
from pipeline.textutil import tokenize

needs_fonts = pytest.mark.skipif(
    not (config.FONTS_DIR / "Montserrat.ttf").exists(), reason="polices absentes (fetch-assets)")

CARD = Card(kind="terms", data={"items": [
    {"term": "Récépissé", "definition": "a"},
    {"term": "Convocation", "definition": "b"},
    {"term": "Pièce justificative", "definition": "c"},
]})


def _words(blocks: list[str]) -> list[align.Word]:
    """Mots factices : 1 s par mot, blocs consécutifs."""
    out, t = [], 0.0
    for bi, text in enumerate(blocks):
        for tok in tokenize(text):
            out.append(align.Word(tok.text, tok.norm, bi, start=t, end=t + 0.9))
            t += 1.0
    return out


def test_anchors_follow_voice_order():
    words = _words(["Trois mots.", "Le récépissé, la convocation, la pièce justificative."])
    anchors = timeline._anchor_words(CARD, words)
    assert [a.norm for a in anchors] == ["recepisse", "convocation", "piece"]
    assert [a.start for a in anchors] == sorted(a.start for a in anchors)


def test_missing_anchor_fails_loudly():
    words = _words(["Trois mots.", "Le récépissé et la convocation."])
    with pytest.raises(ValueError, match="introuvable"):
        timeline._anchor_words(CARD, words)


def test_segments_progressive_then_settled():
    words = _words(["Trois mots.", "Le récépissé, la convocation, la pièce justificative.", "Fin.", "Encore."])
    build = timeline._card_segments(CARD, "plain", 1, 2.0, 9.0, words)
    assert [s[2] for s in build] == [0, 1, 2, 3]                      # 0 → 3 items
    assert all(b[0] == a[1] for a, b in zip(build, build[1:]))          # jointifs
    assert build[0][0] == 2.0 and build[-1][1] == 9.0
    hook = timeline._card_segments(CARD, "plain", 0, 0.0, 2.0, words)
    assert hook == [(0.0, 2.0, 0, False)]                              # cases « ? » seulement
    payoff = timeline._card_segments(CARD, "revealed", 2, 9.0, 10.0, words)
    assert payoff == [(9.0, 10.0, 3, True)]
    loop = timeline._card_segments(CARD, "plain", 3, 10.0, 12.0, words)
    assert loop == [(10.0, 12.0, 3, False)]                            # tout visible, sans focus


def test_non_stepped_cards_unchanged():
    q = Card(kind="question", data={})
    assert timeline._card_segments(q, "plain", 0, 0.0, 3.0, []) == [(0.0, 3.0, None, True)]


@needs_fonts
def test_terms_render_constant_height():
    data = CARD.data | {"items": [
        {"term": "Récépissé", "definition": "Papier provisoire qui prouve que ta demande est en cours"},
        {"term": "Convocation", "definition": "Le rendez-vous fixé, à l'heure exacte"},
        {"term": "Pièce justificative", "definition": "Le document qui prouve ce que tu déclares"},
    ]}
    boxes = [layers.render_terms_card(data, "plain", "gold", v).getbbox() for v in (0, 1, 2, 3)]
    assert len(set(boxes)) == 1                                        # la carte ne « saute » pas
    assert boxes[0][3] - boxes[0][1] <= config.LAYOUT["card_max_h"]


def test_short_04_is_wired_and_lint_clean_of_todo_card():
    s = schema.find_script(config.SCRIPTS_DIR, "short-04")
    assert s.blocks[0].card.kind == "terms" and len(s.blocks[0].card.data["items"]) == 3
    assert s.blocks[2].card_state == "revealed"
    issues = lint.lint_script(s)
    assert not any("terms" in i.message for i in issues)
    timeline._anchor_words(s.blocks[0].card, align.flatten_script(s))  # les 3 ancres existent dans la voix
