"""L3 : carte `plan`, chapitres (calque + chapters.txt) et lint des vidéos longues."""
import copy
import json

import pytest

from pipeline import align, assets, chapters, config, layers, lint, schema, timeline

pytestmark = pytest.mark.skipif(
    not (config.FONTS_DIR / "Montserrat.ttf").exists(), reason="polices absentes (fetch-assets)")


@pytest.fixture(autouse=True)
def _mascots():
    assets.make_placeholder_mascots()


def _long():
    return schema.find_script(config.SCRIPTS_DIR, "long-02")


def _issues(script, level=None):
    return [i.message for i in lint.lint_script(script) if level is None or i.level == level]


# --- carte plan ----------------------------------------------------------------------------------
def test_plan_schema_requires_a_title_per_step():
    with pytest.raises(ValueError, match=r"items\[2\] sans `title`"):
        schema.Card(kind="plan", data={"items": [{"title": "A"}, {"detail": "sans titre"}]})
    schema.Card(kind="plan", data={"items": [{"title": "A"}, {"title": "B", "detail": "ok"}]})   # detail facultatif
    schema.Card(kind="plan", data={})                                                            # vide = placeholder


@pytest.mark.parametrize("fmt", ["short", "long"])
def test_plan_card_keeps_its_size_and_fits_the_zone(fmt):
    config.use_profile(fmt)
    data = _long().blocks[0].card.data
    sizes = set()
    for vis, st in ((0, "plain"), (1, "plain"), (2, "plain"), (None, "revealed")):
        img = layers.render_card("plan", data, st, "indigo", visible=vis)
        x0, y0, x1, y1 = img.getchannel("A").getbbox()
        sizes.add((x0, y0, x1, y1))
        assert y0 >= config.LAYOUT["card_y"] and y1 <= config.LAYOUT["card_y"] + config.LAYOUT["card_max_h"]
    assert len(sizes) == 1                                            # la carte ne « saute » pas entre les apparitions
    a = layers.render_card("plan", data, "plain", "indigo", visible=1).tobytes()
    b = layers.render_card("plan", data, "plain", "indigo", visible=2).tobytes()
    assert a != b


def test_plan_without_detail_is_more_compact():
    with_d = {"items": [{"title": "Un", "detail": "x"}, {"title": "Deux", "detail": "y"}]}
    without = {"items": [{"title": "Un"}, {"title": "Deux"}]}
    assert layers._plan_layout(without)["h"] < layers._plan_layout(with_d)["h"]


def test_plan_steps_appear_on_their_anchor_words():
    config.use_profile("long")
    script = _long()
    words = align.proportional_timings(align.flatten_script(script), 100.0)
    card = script.blocks[0].card
    anchors = timeline._anchor_words(card, words)
    assert [a.norm for a in anchors] == ["structurer", "b2", "piege"]
    start, end = 0.0, words[[i for i, w in enumerate(words) if w.block == 0][-1]].end
    segs = timeline._card_segments(card, "plain", 0, start, end, words)
    assert [s[2] for s in segs] == [0, 1, 2, 3]                       # 0 → 1 → 2 → 3 étapes visibles
    assert timeline._card_segments(card, "initial", 1, 0, 1, words)[0][2] == 0
    bad = copy.deepcopy(card)
    bad.data["items"][1]["at"] = "introuvable"
    with pytest.raises(ValueError, match="introuvable"):
        timeline._anchor_words(bad, words)


def test_lint_flags_unknown_anchor_and_too_many_steps_for_plan():
    s = _long()
    s.blocks[0].card.data["items"][0]["at"] = "zzz"
    assert any("introuvable" in m for m in _issues(s, "error"))
    s = _long()
    s.blocks[0].card.data["items"] += [{"title": f"Étape {i}"} for i in range(4)]
    assert any("7 éléments, 6 max" in m for m in _issues(s, "warn"))


# --- chapitres -----------------------------------------------------------------------------------
def _tl(tmp_path):
    script = _long()
    words = align.proportional_timings(align.flatten_script(script), 100.0)
    return script, timeline.build_timeline(script, words, 100.0, tmp_path)


def test_chapter_timestamps_and_txt(tmp_path):
    script, tl = _tl(tmp_path)
    chs = chapters.extract(script, tl["blocks"], tl["duration"])
    assert [c.title for c in chs][:2] == ["Introduction", "Structurer un texte"]
    assert chs[0].start == 0.0 and chs[-1].end == tl["duration"]
    assert all(a.end == b.start for a, b in zip(chs, chs[1:]))        # contigus
    lines = chapters.to_text(chs).splitlines()
    assert lines[0] == "0:00 Introduction" and lines[1].split()[0] == chapters.stamp(chs[1].start)
    assert chapters.problems(chs, "intro") == []
    assert chapters.stamp(59.9) == "0:59" and chapters.stamp(3725) == "1:02:05"


def test_chapter_problems_are_reported():
    cs = [chapters.Chapter(1, "A", 0, 5, "b1"), chapters.Chapter(2, "B", 5, 40, "b2")]
    msgs = " | ".join(chapters.problems(cs, "hook"))
    assert "0:00" in msgs and "à partir de 3" in msgs and "< 10 s" in msgs


def test_chapter_track_exists_for_long_only(tmp_path):
    _, tl = _tl(tmp_path)
    track = tl["tracks"]["chapter"]
    assert len(track) == 5 and track[0]["start"] == 0.0
    sc = schema.find_script(config.SCRIPTS_DIR, "short-03")
    w = align.proportional_timings(align.flatten_script(sc), 24.0)
    assert timeline.build_timeline(sc, w, 24.0, tmp_path / "s")["tracks"]["chapter"] == []


def test_chapter_layer_sits_top_right_and_shrinks_long_titles():
    config.use_profile("long")
    x0, y0, x1, y1 = layers.render_chapter(2, "Ce que change le B2").getchannel("A").getbbox()
    assert x1 == config.W - config.LAYOUT["brand_x"] and y1 < 140 and x0 > 900
    long_title = "Un titre de chapitre vraiment beaucoup trop long pour la barre"
    lx0 = layers.render_chapter(2, long_title).getchannel("A").getbbox()[0]
    assert lx0 >= config.LAYOUT["brand_x"] + 520 - 4                  # ne recouvre jamais le logo


def test_cli_dry_long_writes_chapters_txt(tmp_path, monkeypatch, capsys):
    import cli
    monkeypatch.setattr(config, "BUILD_DIR", tmp_path)
    monkeypatch.setattr("sys.argv", ["cli.py", "build", "long-02", "--dry", "--placeholder-mascots", "--until", "timeline"])
    assert cli.main() == 0
    txt = (tmp_path / "long-02" / "chapters.txt").read_text(encoding="utf-8").splitlines()
    assert txt[0] == "0:00 Introduction" and len(txt) == 5
    assert "[chapitres] 5" in capsys.readouterr().out


# --- lint des longs ------------------------------------------------------------------------------
def test_lint_long_chapter_rules():
    s = _long()
    s.blocks[0].chapter = None
    assert any("0:00" in m for m in _issues(s, "warn"))
    s = _long()
    for b in s.blocks[2:]:
        b.chapter = None
    assert any("à partir de 3" in m for m in _issues(s, "warn"))
    s = _long()
    s.blocks[1].chapter = "x" * 60
    assert any("trop long" in m for m in _issues(s, "warn"))
    s = _long()
    s.blocks[4].chapter = s.blocks[1].chapter
    assert any("dupliqués" in m for m in _issues(s, "warn"))
    s = _long()
    for b in s.blocks:
        b.chapter = None
    assert any("aucun `chapter:`" in m for m in _issues(s, "todo"))


def test_lint_long_duration_rehook_and_cta_rules():
    s = _long()
    assert any("< 240s" in m for m in _issues(s, "warn"))              # démo de ~100 s
    s.blocks[2].voice += " " + "mot " * 1300                           # > 8 min
    msgs = _issues(s, "warn")
    assert any("> 480s" in m for m in msgs) and any("rehook" in m for m in msgs)
    s = _long()
    s.blocks[3].voice += " Abonne-toi !"
    assert any("CTA parlés" in m for m in _issues(s, "warn"))
    s = _long()
    s.blocks[-1].voice = "Merci d'avoir suivi cette leçon."
    assert any("aucun CTA parlé" in m for m in _issues(s, "warn"))


def test_chapter_ignored_in_short_is_flagged():
    s = schema.find_script(config.SCRIPTS_DIR, "short-03")
    s.blocks[0].chapter = "Hook"
    assert any("ignoré en Short" in m for m in _issues(s, "warn"))
