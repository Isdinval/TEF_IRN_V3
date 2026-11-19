"""Miniatures : gabarit commun long (1280×720) / short (1080×1920), < 2 Mo, accroche qui tient."""
import pytest

from pipeline import assets, config, lint, schema, thumbnail

pytestmark = pytest.mark.skipif(
    not (config.FONTS_DIR / "Montserrat.ttf").exists(), reason="polices absentes (fetch-assets)")


@pytest.fixture(autouse=True)
def _mascots():
    assets.make_placeholder_mascots()


@pytest.mark.parametrize("sid,size", [("short-01", (1080, 1920)), ("long-01", (1280, 720))])
def test_thumbnail_size_and_weight(sid, size, tmp_path):
    from PIL import Image
    out = thumbnail.save(schema.find_script(config.SCRIPTS_DIR, sid), tmp_path)
    assert Image.open(out).size == size
    assert out.stat().st_size <= thumbnail.MAX_BYTES


def test_fit_title_highlight_and_truncation():
    _, lines = thumbnail.fit_title("Section B : la méthode en *4 blocs*", 740, 3, 112, 64)
    assert len(lines) <= 3 and [w for ln in lines for w, hl in ln if hl] == ["4", "BLOCS"]
    _, lines = thumbnail.fit_title("mot " * 40, 740, 3, 112, 64)
    assert len(lines) == 3 and lines[-1][-1][0].endswith("…")


def test_lint_warns_on_long_thumbnail_text():
    sc = schema.find_script(config.SCRIPTS_DIR, "long-01")
    assert not any("miniature" in i.message for i in lint.lint_script(sc))
    sc.thumbnail.text = "un deux trois quatre cinq six sept huit"
    assert any("miniature" in i.message for i in lint.lint_script(sc))
