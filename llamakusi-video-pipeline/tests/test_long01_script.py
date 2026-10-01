"""long-01 : premier vrai script long (expression écrite TEF IRN) — contenu, ancres, chapitres, sources."""
import re

import pytest

from pipeline import align, assets, chapters, config, lint, schema, timeline

pytestmark = pytest.mark.skipif(
    not (config.FONTS_DIR / "Montserrat.ttf").exists(), reason="polices absentes (fetch-assets)")


def _s():
    return schema.find_script(config.SCRIPTS_DIR, "long-01")


def _msgs(script, level=None, **kw):
    return [i.message for i in lint.lint_script(script, **kw) if level is None or i.level == level]


def test_long01_has_no_lint_error_and_no_misplaced_anchor():
    msgs = _msgs(_s())
    assert not [i for i in lint.lint_script(_s()) if i.level == "error"]
    assert not [m for m in msgs if "ancre" in m]


def test_every_progressive_card_reveals_in_the_expected_block():
    s = _s()
    words = align.flatten_script(s)
    expected = {
        "setup": ["setup"] * 4,
        "method_problem": ["method_build"] * 4,
        "connectors": ["connectors"] * 4,
        "time": ["time"] * 3,
        "errors": ["errors"] * 3,
        "section_a": ["section_a"] * 3,
    }
    for b in s.blocks:
        if b.card and b.card.kind in schema.STEPPED_CARDS:
            got = [s.blocks[a.block].id for a in timeline._anchor_words(b.card, words)]
            assert got == expected[b.id], b.id


def test_anchor_range_rule_catches_a_word_spoken_too_early():
    s = _s()
    ideas = next(b for b in s.blocks if b.id == "method_ideas")
    ideas.voice = ideas.voice.replace("ces questions", "trois questions")      # « trois » avant le plan du temps
    assert any("ancre « trois »" in m and "avant l'affichage" in m for m in _msgs(s, "warn"))


def test_chapters_are_valid_for_youtube(tmp_path):
    assets.make_placeholder_mascots()
    s = _s()
    words = align.proportional_timings(align.flatten_script(s), 240.0)
    tl = timeline.build_timeline(s, words, 240.0, tmp_path)
    chs = chapters.extract(s, tl["blocks"], tl["duration"])
    assert len(chs) == 8 and chs[0].start == 0.0
    assert chapters.problems(chs, s.blocks[0].id) == []


def test_exam_figures_match_the_official_tef_irn_format():
    """Régression : l'ébauche annonçait « entre 30 et 90 mots » (fourchettes du TCF IRN) et le PDF 2024 dit encore 80 mots."""
    s = _s()
    text = " ".join(b.voice for b in s.blocks)
    assert "30 et 90" not in text and "80 mots" not in text
    assert "100 mots minimum" in text and "40 mots minimum" in text and "30 minutes" in text
    assert "1er janvier 2026" in text and "B2" in text
    claims = " ".join(c.text for c in s.claims)
    assert "100 mots minimum" in claims and "40 mots minimum" in claims


def test_model_text_really_exceeds_the_minimum_it_illustrates():
    s = _s()
    card = next(b.card for b in s.blocks if b.card and b.card.kind == "text_annotated")
    n = sum(len(p["text"].split()) for p in card.data["parts"])
    assert n >= 100
    payoff = next(b for b in s.blocks if b.id == "method_payoff")
    assert f"{n} mots" in payoff.voice                                    # le chiffre dit = le chiffre réel
    # chaque connecteur enseigné apparaît bien dans le texte modèle
    body = " ".join(p["text"] for p in card.data["parts"]).lower()
    teach = next(b.card for b in s.blocks if b.id == "connectors")
    for item in teach.data["items"]:
        assert item["term"].lower() in body


def test_one_spoken_cta_in_the_last_block_and_no_unverified_claim_can_be_published():
    s = _s()
    assert not [m for m in _msgs(s, "warn") if "CTA" in m or "chapitre" in m or "rehook" in m]
    assert re.search(r"dans la description", s.blocks[-1].voice)
    publish = _msgs(s, "error", publish=True)
    assert sum("claim non vérifiée" in m for m in publish) == 4         # à vérifier à la main avant publication
    assert all(c.source_url for c in s.claims)
