"""Carte `text_annotated` + généralisation des cartes à apparition progressive (hors-ligne)."""
import pytest
from pydantic import ValidationError

from pipeline import align, config, layers, lint, schema, timeline
from pipeline.schema import Card
from pipeline.textutil import tokenize

needs_fonts = pytest.mark.skipif(
    not (config.FONTS_DIR / "Montserrat.ttf").exists(), reason="polices absentes (fetch-assets)")


def _parts(**over):
    base = {"shuffled": [2, 0, 3, 1], "parts": [
        {"role": "intro", "label": "Intro", "at": "intro", "text": "Première phrase de l'introduction."},
        {"role": "argument", "label": "Argument 1", "at": "arguments", "text": "Premier argument."},
        {"role": "argument", "label": "Argument 2", "at": "reliés", "text": "Second argument."},
        {"role": "conclusion", "label": "Conclusion", "at": "conclusion", "text": "Conclusion finale."},
    ]}
    return base | over


def _words(blocks: list[str]) -> list[align.Word]:
    out, t = [], 0.0
    for bi, text in enumerate(blocks):
        for tok in tokenize(text):
            out.append(align.Word(tok.text, tok.norm, bi, start=t, end=t + 0.9))
            t += 1.0
    return out


# --- schéma -----------------------------------------------------------------------------------------
def test_schema_rejects_bad_role_and_bad_shuffle():
    with pytest.raises(ValidationError, match="role"):
        Card(kind="text_annotated", data={"parts": [{"role": "milieu", "text": "x"}]})
    with pytest.raises(ValidationError, match="permutation"):
        Card(kind="text_annotated", data=_parts(shuffled=[0, 0, 1, 2]))
    with pytest.raises(ValidationError, match="sans `definition`"):
        Card(kind="terms", data={"items": [{"term": "a"}]})


def test_schema_accepts_empty_data_as_placeholder():
    assert Card(kind="text_annotated", data={}).data == {}
    assert Card(kind="terms", data={}).data == {}


def test_card_state_initial_is_valid():
    schema.Block(id="loop", voice="x", card_state="initial")


# --- ancres -----------------------------------------------------------------------------------------
def test_anchors_plural_and_nth_occurrence():
    words = _words(["Un texte, des arguments.", "Le mot de puis le mot de encore."])
    card = Card(kind="text_annotated", data={"parts": [
        {"role": "argument", "text": "x", "at": "argument"},     # « argument » ↔ « arguments »
        {"role": "argument", "text": "y", "at": "de#2"},         # 2e « de » APRÈS l'ancre précédente
    ]})
    a = timeline._anchor_words(card, words)
    assert [w.norm for w in a] == ["arguments", "de"]
    assert a[1].start > a[0].start


def test_anchor_defaults_to_label_then_role():
    words = _words(["Une intro puis une conclusion."])
    card = Card(kind="text_annotated", data={"parts": [
        {"role": "intro", "text": "x"}, {"role": "conclusion", "label": "Conclusion", "text": "y"}]})
    assert [w.norm for w in timeline._anchor_words(card, words)] == ["intro", "conclusion"]


# --- segments (machine à états) ---------------------------------------------------------------------
def test_segments_hook_build_payoff_loop():
    card = Card(kind="text_annotated", data=_parts())
    words = _words(["Un texte.", "Une intro, deux arguments reliés, une conclusion.", "Fin.", "Encore."])
    hook = timeline._card_segments(card, "plain", 0, 0.0, 2.0, words)
    assert hook == [(0.0, 2.0, 0, False)]                        # désordonné, aucune étiquette
    build = timeline._card_segments(card, "plain", 1, 2.0, 12.0, words)
    assert [s[2] for s in build] == [0, 1, 2, 3, 4]              # 4 étiquettes, une par mot dit
    assert all(b[0] == a[1] for a, b in zip(build, build[1:]))
    assert timeline._card_segments(card, "revealed", 2, 12.0, 13.0, words) == [(12.0, 13.0, 4, True)]
    assert timeline._card_segments(card, "initial", 3, 13.0, 15.0, words) == [(13.0, 15.0, 0, False)]


def test_initial_state_resets_terms_too():
    card = Card(kind="terms", data={"items": [{"term": "Un", "definition": "a"}]})
    assert timeline._card_segments(card, "initial", 3, 5.0, 6.0, []) == [(5.0, 6.0, 0, False)]


# --- rendu ------------------------------------------------------------------------------------------
@needs_fonts
def test_render_constant_size_and_reorder():
    data = _parts()
    boxes = {layers.render_text_annotated_card(data, st, "indigo", v).getbbox()
             for st, v in (("plain", 0), ("plain", 2), ("plain", 4), ("revealed", 4))}
    assert len(boxes) == 1                                       # ni saut, ni changement de taille
    assert layers._text_layout(data)["h"] <= config.LAYOUT["card_max_h"]
    shuffled = layers.render_text_annotated_card(data, "plain", "indigo", 0)
    ordered = layers.render_text_annotated_card(data, "revealed", "indigo", 4)
    assert shuffled.tobytes() != ordered.tobytes()               # l'ordre change vraiment


@needs_fonts
def test_default_shuffle_differs_from_logical_order():
    data = _parts()
    data.pop("shuffled")
    a = layers.render_text_annotated_card(data, "plain", "indigo", 0)
    b = layers.render_text_annotated_card(data, "revealed", "indigo", 4)
    assert a.tobytes() != b.tobytes()


# --- script d'exemple + lint --------------------------------------------------------------------------
def test_short_01_is_wired():
    s = schema.find_script(config.SCRIPTS_DIR, "short-01")
    card = s.blocks[0].card
    assert card.kind == "text_annotated" and len(card.data["parts"]) == 4
    assert s.blocks[2].card_state == "revealed" and s.blocks[3].card_state == "initial"
    assert len(timeline._anchor_words(card, align.flatten_script(s))) == 4
    issues = lint.lint_script(s)
    assert not any(i.level == "error" and "carte" in i.message for i in issues)
    assert not any("text_annotated" in i.message and i.level == "todo" for i in issues)


def test_lint_reports_missing_anchor_before_tts():
    s = schema.find_script(config.SCRIPTS_DIR, "short-01")
    s.blocks[0].card.data["parts"][3]["at"] = "inexistant"
    errs = [i for i in lint.lint_script(s) if i.level == "error"]
    assert any("introuvable" in i.message for i in errs)
