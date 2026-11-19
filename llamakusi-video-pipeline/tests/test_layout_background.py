import subprocess
import json

import numpy as np
import pytest

from pipeline import assets, background, config, layers, schema

needs_fonts = pytest.mark.skipif(
    not (config.FONTS_DIR / "Montserrat.ttf").exists(), reason="polices absentes (fetch-assets)")


def center_x(img):
    bbox = img.getchannel("A").getbbox()
    return (bbox[0] + bbox[2]) / 2


@needs_fonts
def test_every_layer_is_centered_on_the_screen_axis():
    assets.make_placeholder_mascots()
    s = schema.find_script(config.SCRIPTS_DIR, "short-03")
    q = s.blocks[0].card.data
    cmp_data = schema.find_script(config.SCRIPTS_DIR, "short-05").blocks[0].card.data
    items = {
        "card question": layers.render_card("question", q, "plain", "blue"),
        "card compare": layers.render_card("compare", cmp_data, "plain", "gold"),
        "subs": layers.render_subs(["une", "raison", "qui"], 1),
        "overlay": layers.render_overlay("B1 → B2"),
        "cta": layers.render_cta("Lien en bio"),
        "brand": layers.render_brand("blue"),
        "mascot": layers.render_mascot("perplexe", 1),
    }
    for name, img in items.items():
        assert abs(center_x(img) - config.W / 2) <= 8, f"{name} décentré : {center_x(img)}"


def test_background_is_small_smooth_and_right_size(tmp_path):
    out = background.generate(tmp_path, "indigo", 1.0)
    info = json.loads(subprocess.run(
        ["ffprobe", "-v", "error", "-show_streams", "-of", "json", str(out)],
        capture_output=True, text=True, check=True).stdout)
    v = info["streams"][0]
    assert (v["width"], v["height"]) == (1080, 1920)
    assert abs(float(v["duration"]) - 1.0) < 0.1
    assert out.stat().st_size < 3_000_000            # garde-fou : le grain `noise` faisait ~10 Mo/s
    assert background.generate(tmp_path, "indigo", 1.0) == out      # cache


def test_background_frames_move_but_stay_subtle():
    a = background.frame_at("blue", 0.0, 24.0).astype(int)
    b = background.frame_at("blue", 6.0, 24.0).astype(int)
    assert abs(a - b).mean() > 0.2                    # ça bouge
    assert a.max() < 130                              # jamais un fond éclatant (texte/cartes restent le centre)


def test_background_dust_is_periodic_and_visible():
    """Poussière dorée : cycles entiers → l'image à t = durée égale celle de t = 0 (boucle invisible) ; elle éclaircit le fond."""
    a = background.frame_at("indigo", 0.0, 12.0).astype(int)
    b = background.frame_at("indigo", 12.0, 12.0).astype(int)
    assert np.abs(a - b).max() <= 2
    old = config.BG_DUST_COUNT
    try:
        config.BG_DUST_COUNT = 0
        bare = background.frame_at("indigo", 0.0, 12.0).astype(int)
    finally:
        config.BG_DUST_COUNT = old
    assert (a - bare).max() > 8 and (a >= bare).all()


def test_loops_are_opt_in_and_card_has_glow(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "BACKGROUNDS_DIR", tmp_path)
    monkeypatch.setitem(config.DEFAULT_BG_FORCED, "short", "")
    (tmp_path / "short-loop-01.mp4").write_bytes(b"x")
    assert config.resolve_default_background("short", "short-01") is None      # fond généré par défaut
    monkeypatch.setattr(config, "CARD_GLOW_ALPHA", 70)                          # halo actif : déborde de la carte
    img = layers.render_question_card({"question": "Q ?", "choices": ["a", "b", "c", "d"], "correct": "A"}, "initial", "gold")
    solid = img.getchannel("A").point(lambda v: 255 if v > 200 else 0).getbbox()
    full = img.getchannel("A").getbbox()
    assert full[0] < solid[0] and full[1] < solid[1]
