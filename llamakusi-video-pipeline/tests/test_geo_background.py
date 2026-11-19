import numpy as np

from pipeline import background, config


def _frame(seed="short-01", t=0.0, duration=12.0):
    return np.asarray(background.GeoScene(seed, 270, 480).render(t, duration)).astype(int)


def test_geo_is_periodic_moves_and_varies_by_seed():
    a, b = _frame(), _frame(t=12.0)
    assert np.abs(a - b).mean() < 0.5                           # t = durée → identique à t = 0 : boucle invisible
    assert np.abs(a - _frame(t=3.0)).mean() > 0.2               # ça bouge
    assert np.abs(a - _frame("short-02")).mean() > 0.2          # disposition propre à chaque script


def test_geo_is_dark_neutral_with_luminous_points():
    a = _frame()
    assert a.mean() < 40 and a.max() > 150                      # fond sombre + points lumineux
    assert abs(a[..., 1].mean() - a[..., 0].mean()) < 12        # pas de dominante verte ou jaune


def test_generate_dispatches_to_geo(tmp_path, monkeypatch):
    calls = []
    monkeypatch.setattr(background, "_generate_geo", lambda b, d, f, s: calls.append((d, s)) or tmp_path / "x.mp4")
    background.generate(tmp_path, "indigo", 10.0, seed="short-01")
    background.generate(tmp_path, "indigo", 100.0, seed="long-01")
    assert calls == [(10.0, "short-01"), (config.BG_LOOP_S, "long-01")]
