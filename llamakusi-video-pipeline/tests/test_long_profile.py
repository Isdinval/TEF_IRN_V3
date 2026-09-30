"""Profil 16:9 (format long) : dimensions, zones de mise en page, cache des calques, fond en boucle."""
import pytest

from pipeline import align, assets, background, config, layers, lint, schema, timeline

pytestmark = pytest.mark.skipif(
    not (config.FONTS_DIR / "Montserrat.ttf").exists(), reason="polices absentes (fetch-assets)")


@pytest.fixture(autouse=True)
def _long():
    assets.make_placeholder_mascots()
    config.use_profile("long")


def _bbox(img):
    return img.getchannel("A").getbbox()


def test_profile_switch_keeps_the_same_layout_dict():
    ref = config.LAYOUT
    config.use_profile("short")
    assert (config.W, config.H) == (1080, 1920) and config.LAYOUT is ref and config.LAYOUT["cta_cy"] == 1630
    config.use_profile("long")
    assert (config.W, config.H) == (1920, 1080) and config.LAYOUT is ref and layers.LAYOUT is ref


def test_layers_have_the_profile_size_and_sit_in_their_zones():
    assert layers.canvas().size == (1920, 1080)
    x0, y0, x1, y1 = _bbox(layers.render_brand("indigo"))
    assert x0 >= 90 and x1 < 600 and y1 < 140                                   # logo en haut à gauche
    mx0, my0, mx1, my1 = _bbox(layers.render_mascot("reflechit", 1))
    assert abs((mx0 + mx1) / 2 - config.LAYOUT["mascot_cx"]) <= 2 and my1 == config.LAYOUT["mascot_bottom"]
    assert mx0 > 1216                                                           # colonne droite, hors carte
    sx0, sy0, sx1, sy1 = _bbox(layers.render_subs(["Trois", "blocs", "simples"], 1))
    assert sx0 >= config.CONTENT_X0 and sx1 <= config.CONTENT_X0 + config.CONTENT_W
    assert abs((sx0 + sx1) / 2 - config.CONTENT_CX) <= 8 and sy0 > 840          # sous la zone carte


@pytest.mark.parametrize("sid", ["short-01", "short-02", "short-03", "short-04"])
def test_every_card_fits_the_left_column(sid):
    script = schema.find_script(config.SCRIPTS_DIR, sid)
    card = next(b.card for b in script.blocks if b.card)
    img = layers.render_card(card.kind, card.data, "plain", script.accent)
    x0, y0, x1, y1 = _bbox(img)
    assert x0 >= config.CONTENT_X0 and x1 <= config.CONTENT_X0 + config.CONTENT_W
    assert y0 >= config.LAYOUT["card_y"] and y1 <= config.LAYOUT["card_y"] + config.LAYOUT["card_max_h"]


def test_long_timeline_has_no_short_only_tracks_and_purges_stale_layers(tmp_path, monkeypatch):
    config.use_profile("short")                                                # build_timeline doit rebasculer seul
    script = schema.find_script(config.SCRIPTS_DIR, "long-02")
    words = align.proportional_timings(align.flatten_script(script), 120.0)
    tl = timeline.build_timeline(script, words, 120.0, tmp_path)
    assert tl["size"] == [1920, 1080]
    assert tl["tracks"]["arrow"] == [] and tl["tracks"]["cta"] == []
    stale = tmp_path / "layers" / "stale.png"
    stale.write_bytes(b"x")
    timeline.build_timeline(script, words, 120.0, tmp_path)
    assert stale.exists()                                                      # même rendu : cache conservé
    monkeypatch.setitem(config.PROFILES["long"]["layout"], "card_y", 160)       # la mise en page change…
    timeline.build_timeline(script, words, 120.0, tmp_path)
    assert not stale.exists()                                                  # …le cache des calques est vidé


def test_background_loop_for_long_videos(tmp_path, monkeypatch):
    assert background.is_loop(400.0) and not background.is_loop(25.0)
    monkeypatch.setattr(config, "BG_LOOP_S", 1.0)
    out = background.generate(tmp_path, "indigo", 100.0)
    assert "1920x1080" in out.name and out.name.endswith("_30.mp4")            # 1 s de boucle, pas 100 s
    assert background.frame_at("indigo", 0.0, 1.0).shape == (216, 384, 3)


def test_overlay_in_long_is_flagged():
    script = schema.find_script(config.SCRIPTS_DIR, "long-02")
    script.blocks[0].overlay = "3 MOTS"
    assert any("overlay" in i.message for i in lint.lint_script(script) if i.level == "warn")
