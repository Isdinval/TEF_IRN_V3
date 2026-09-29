import pytest
from pydantic import ValidationError

from pipeline import config, lint, schema


def test_all_repo_scripts_validate():
    scripts = schema.load_all(config.SCRIPTS_DIR)
    assert {s.id for s in scripts} >= {"short-01", "short-02", "short-03", "short-04", "short-05"}


def test_hook_formulas_rotate():
    scripts = schema.load_all(config.SCRIPTS_DIR)
    errors = [i for i in lint.lint_all(scripts) if i.level == "error"]
    assert errors == []


def test_short_requires_four_blocks():
    with pytest.raises(ValidationError):
        schema.VideoScript.model_validate({
            "id": "x", "pillar": "A", "product": "both", "title": "t", "hook_formula": "stakes",
            "blocks": [{"id": "hook", "voice": "a"}]})


def test_spoken_cta_is_an_error():
    s = schema.find_script(config.SCRIPTS_DIR, "short-03")
    s.blocks[3].voice = "Abonne-toi et clique sur le lien en bio."
    assert any(i.level == "error" and "CTA parlé" in i.message for i in lint.lint_script(s))


def test_publish_blocks_unverified_claims_and_draft_cards():
    s = schema.find_script(config.SCRIPTS_DIR, "short-03")
    msgs = [i.message for i in lint.lint_script(s, publish=True) if i.level == "error"]
    assert any("claim" in m for m in msgs)
    assert any("draft" in m for m in msgs)
    assert any("approved" in m for m in msgs)


def test_same_hook_formula_twice_in_a_row_is_flagged():
    a = schema.find_script(config.SCRIPTS_DIR, "short-01")
    b = schema.find_script(config.SCRIPTS_DIR, "short-02")
    b.hook_formula = a.hook_formula
    assert any("même formule" in i.message for i in lint.lint_all([a, b]))


def test_compare_cards_are_implemented_for_shorts_2_and_5():
    for sid in ("short-02", "short-05"):
        s = schema.find_script(config.SCRIPTS_DIR, sid)
        assert s.blocks[0].card.kind == "compare" and s.blocks[0].card.data["rows"]
        assert not any("compare" in i.message and i.level == "todo" and "placeholder" in i.message
                       for i in lint.lint_script(s))
