import numpy as np

from pipeline import assemble, config, layers


def _alpha_box(im):
    return im.getchannel("A").getbbox()


def test_mascot_fx_adds_halo_without_moving_her(monkeypatch):
    plain = layers.render_mascot("victorieux", 1)
    monkeypatch.setattr(config, "MASCOT_FX", True)
    fx = layers.render_mascot("victorieux", 1)
    assert fx.size == plain.size
    p, f = _alpha_box(plain), _alpha_box(fx)
    assert f[0] < p[0] and f[2] > p[2] and f[1] < p[1]           # halo : emprise plus large…
    a = np.asarray(fx.getchannel("A")).astype(int)
    cx, cy = (p[0] + p[2]) // 2, (p[1] + p[3]) // 2
    assert a[cy, cx] > 200                                       # …mais le corps de la mascotte reste opaque


def test_front_particles_are_soft_and_clear_of_the_subtitles():
    im = layers.render_front("short-01", 0)
    assert im.size == (config.W, config.H)
    a = np.asarray(im.getchannel("A"))
    assert a.max() <= 130 and a.max() > 0
    cy = config.LAYOUT["subs_cy"]
    assert a[cy - 90:cy + 90, config.W // 4: 3 * config.W // 4].max() == 0   # rien sur le texte des sous-titres


def test_final_fx_filters(monkeypatch):
    fl: list[str] = []
    assert assemble._final_fx(fl, "[v9]") == "[fxg]"
    assert any("c0_mode=screen" in f and "c1_expr=A" in f for f in fl) and any("noise=c0s=" in f for f in fl)
    monkeypatch.setattr(config, "FINAL_FX", False)
    assert assemble._final_fx([], "[v9]") == "[v9]"


def test_final_fx_keeps_neutral_colors():
    """Régression : le bloom/grain ne doit pas teinter l'image (chrominance neutre 128 conservée)."""
    import subprocess

    import numpy as np
    monkey = config.W, config.H
    config.W, config.H = 270, 480
    try:
        fl = ["[0:v]format=yuv444p[v1]"]
        last = assemble._final_fx(fl, "[v1]")
        r = subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "color=c=0x1a1a1a:s=270x480:r=10:d=1",
                            "-filter_complex", ";".join(fl), "-map", last, "-frames:v", "1", "-pix_fmt", "yuv444p",
                            "-f", "rawvideo", "-"], capture_output=True, check=True)
    finally:
        config.W, config.H = monkey
    a = np.frombuffer(r.stdout, np.uint8).reshape(3, 480, 270)
    assert abs(float(a[1].mean()) - 128) < 1.5 and abs(float(a[2].mean()) - 128) < 1.5
