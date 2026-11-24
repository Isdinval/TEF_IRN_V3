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


def test_ab_variants_long_only(tmp_path):
    from PIL import Image
    long_sc, short_sc = (schema.find_script(config.SCRIPTS_DIR, i) for i in ("long-01", "short-01"))
    thumbnail.save(long_sc, tmp_path)
    assert [thumbnail.thumbnail_path(tmp_path, v).name for v in range(3)] == ["thumbnail.jpg", "thumbnail_B.jpg", "thumbnail_C.jpg"]
    for v in range(3):
        p = thumbnail.thumbnail_path(tmp_path, v)
        assert Image.open(p).size == (1280, 720) and p.stat().st_size <= thumbnail.MAX_BYTES
    assert len({thumbnail.thumbnail_path(tmp_path, v).read_bytes() for v in range(3)}) == 3
    thumbnail.save(short_sc, tmp_path / "s")
    assert not thumbnail.thumbnail_path(tmp_path / "s", 1).exists()


def test_rotating_mascots_differ_per_video():
    picks = {}
    for i in (1, 2, 3, 4):
        sc = schema.find_script(config.SCRIPTS_DIR, "long-01").model_copy(update={"id": f"long-0{i}"})
        b, c = thumbnail.rotation_mascot(sc, 1), thumbnail.rotation_mascot(sc, 2)
        assert b != c and thumbnail.rotation_mascot(sc, 1) == b      # stable
        picks[i] = (b, c)
    assert len({x for pair in picks.values() for x in pair}) == 8     # aucune mascotte B/C répétée sur 4 vidéos


def test_rotating_mascots_never_cropped():
    """Toutes les mascottes, styles B et C : entièrement dans l'image, à SAFE px du bord (aucune coupe en bas ni sur les côtés)."""
    from PIL import Image
    canvas = thumbnail.LAYOUTS["long"]["size"]
    for mood, count in config.MASCOT_COUNTS.items():
        for pose in range(1, count + 1):
            src = Image.open(config.MASCOT_DIR / f"{mood}_{pose}_transparent.webp").convert("RGBA")
            src = src.crop(src.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox())
            for v in (1, 2, *range(10, 10 + len(thumbnail.SHORT_PRESETS))):                    # 1, 2 : styles B/C du long ; 10+ : Shorts
                fmt = "short" if v >= 10 else "long"
                canvas = thumbnail.LAYOUTS[fmt]["size"]
                lay = {**thumbnail.LAYOUTS[fmt], **(thumbnail.STYLE_LAYOUTS[v] if fmt == "long" else thumbnail.SHORT_PRESETS[v - 10]), "mood": mood}
                w, h, bottom = thumbnail.mascot_box(src.size, lay, canvas)
                cx = lay["mascot_cx"]
                assert bottom <= canvas[1] - thumbnail.SAFE and bottom - h >= thumbnail.SAFE, (mood, pose, v)
                assert cx - w / 2 >= thumbnail.SAFE and cx + w / 2 <= canvas[0] - thumbnail.SAFE, (mood, pose, v)


def test_short_mascot_rotates_per_video():
    base = schema.find_script(config.SCRIPTS_DIR, "short-01")
    picks = [thumbnail.rotation_mascot(base.model_copy(update={"id": f"short-0{i}"}), 1) for i in range(1, 6)]
    assert len(set(picks)) == 5 and len({m for m, _ in picks}) == 4      # les 4 humeurs défilent


def test_short_layout_rotates_per_video(tmp_path):
    base = schema.find_script(config.SCRIPTS_DIR, "short-01")
    rank = lambda i: thumbnail._rank(base.model_copy(update={"id": f"short-0{i}"})) % len(thumbnail.SHORT_PRESETS)
    assert len({rank(i) for i in range(1, 5)}) == 4 and rank(1) != rank(2)         # 4 mises en page différentes, voisines distinctes
    sizes = {thumbnail.render(base.model_copy(update={"id": f"short-0{i}"})).tobytes() for i in range(1, 5)}
    assert len(sizes) == 4
