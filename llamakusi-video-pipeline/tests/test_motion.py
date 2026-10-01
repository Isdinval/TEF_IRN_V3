"""Fond motion (boucle parfaite) et premier plan vivant (expressions ffmpeg)."""
import numpy as np

from pipeline import assemble, config, motion


def test_motion_loop_is_periodic():
    config.use_profile("short")
    scene = motion._Scene("indigo", 0)
    assert np.array_equal(scene.frame(0.0), scene.frame(config.MOTION_LOOP_S))


def test_variant_is_stable_and_bounded():
    assert motion.variant_for("short-01") == motion.variant_for("short-01")
    assert 0 <= motion.variant_for("short-02") < config.MOTION_VARIANTS


def test_motion_y_expressions():
    m = {"hop": [5.0], "card_enter": [], "card_bump": [21.0], "overlay_drop": []}
    assert assemble.motion_y("brand", m, 25.0) is None
    assert assemble.motion_y("overlay", m, 25.0) is None          # pas de badge animé → piste fixe
    mascot = assemble.motion_y("mascot", m, 25.0)
    assert "between(t,5.000,5.350)" in mascot
    card = assemble.motion_y("card", m, 25.0)
    assert "21.000" in card and "pow(" not in card                  # rebond seul, aucune entrée
