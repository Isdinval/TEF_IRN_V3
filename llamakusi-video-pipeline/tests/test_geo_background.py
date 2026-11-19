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
    monkeypatch.setattr(background, "_generate_geo", lambda b, d, f, s, **kw: calls.append((d, s)) or tmp_path / "x.mp4")
    background.generate(tmp_path, "indigo", 10.0, seed="short-01")
    background.generate(tmp_path, "indigo", 100.0, seed="long-01")
    assert calls == [(10.0, "short-01"), (config.BG_LOOP_S, "long-01")]


def test_voice_level_and_scenes_change_the_picture():
    sc = background.GeoScene("short-01", 270, 480)
    quiet = np.asarray(sc.render(3.0, 12.0, 0.0)).astype(int)
    loud = np.asarray(sc.render(3.0, 12.0, 1.0)).astype(int)
    assert loud.mean() > quiet.mean() + 0.3                          # la voix éclaire le fond
    sc.scene_starts = [0.0, 2.0]
    assert sc._scene(1.0)[3] == 0 and sc._scene(5.0)[3] == 1         # le bloc 2 change de scène


def test_envelope_follows_the_voice(tmp_path):
    import wave

    sr = 8000
    sig = np.concatenate([(np.sin(np.arange(sr) * 0.3) * 12000), np.zeros(sr)]).astype("<i2")
    w = tmp_path / "v.wav"
    with wave.open(str(w), "wb") as f:
        f.setnchannels(1), f.setsampwidth(2), f.setframerate(sr), f.writeframes(sig.tobytes())
    e = background._envelope(w, 30, 15)
    assert e[:10].mean() > 0.7 and e[-8:].mean() < 0.2
    assert background._envelope(None, 5, 15).sum() == 0


def test_geo_clip_renders_in_parallel(tmp_path, monkeypatch):
    from pipeline import config as cfg

    monkeypatch.setattr(cfg, "W", 108)
    monkeypatch.setattr(cfg, "H", 192)
    monkeypatch.setattr(cfg, "BG_WORKERS", 2)
    out = background._generate_geo(tmp_path, 1.0, 30, "short-01", scenes=[0.0, 0.5])
    assert out.exists() and out.stat().st_size > 0
