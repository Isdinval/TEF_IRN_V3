from pipeline import config, lint, publish, schema


def test_studio_file_has_title_description_chapters_and_tags(tmp_path):
    script = schema.find_script(config.SCRIPTS_DIR, "long-01")
    (tmp_path / "chapters.txt").write_text("0:00 Intro\n0:30 Suite\n", encoding="utf-8")
    out = publish.studio_file(script, tmp_path).read_text(encoding="utf-8")
    assert script.title in out and "0:30 Suite" in out and "TAGS" in out and "#" in out


def _with(script, **info):
    return script.model_copy(update={"publish": schema.PublishInfo(**info),
                                     "claims": [schema.Claim(text="x", source_guide="mon-guide")]})


def test_youtube_text_answer_first_deep_link_and_3_hashtags(tmp_path):
    sc = _with(schema.find_script(config.SCRIPTS_DIR, "short-03"), answer="Réponse courte.", keyword="examen civique",
               hashtags=["A", "B", "C", "D"])
    t = publish.texts(sc, tmp_path, "youtube")
    lines = t["text"].splitlines()
    assert lines[0] == "Réponse courte."
    assert lines[1] == f"→ {publish.SITE}/examen-civique/guides/mon-guide"
    assert t["text"].splitlines()[-1] == "#A #B #Shorts"
    assert t["tags"][0] == "examen civique" and len(t["tags"]) <= 8


def test_long_youtube_text_has_chapters_links_and_footer(tmp_path):
    sc = _with(schema.find_script(config.SCRIPTS_DIR, "long-01"), description="Corps.")
    (tmp_path / "chapters.txt").write_text("0:00 Intro\n0:30 Suite\n", encoding="utf-8")
    text = publish.texts(sc, tmp_path, "youtube")["text"]
    assert "CHAPITRES\n0:00 Intro" in text and "S'ENTRAÎNER SUR LLAMAKUSI" in text and "/tef-irn/guides/mon-guide\n" in text
    assert "utm_" not in text and "?" not in text.split("CHAPITRES")[0].splitlines()[1]       # liens propres


def test_without_guide_the_link_is_the_product_home(tmp_path):
    sc = schema.find_script(config.SCRIPTS_DIR, "short-03").model_copy(update={"claims": [], "publish": schema.PublishInfo()})
    assert "→ https://llamakusi.com/examen-civique\n" in publish.texts(sc, tmp_path, "youtube")["text"]


def test_lint_flags_long_title_missing_keyword_and_short_long_description():
    sc = schema.find_script(config.SCRIPTS_DIR, "long-01").model_copy(update={"title": "Une accroche très longue qui ne contient aucun mot-clé ciblé, vraiment aucun"})
    msgs = " ".join(i.message for i in lint.lint_script(_with(sc, keyword="carte de résident", description="court")))
    assert "40 premiers caractères" in msgs and "moins de 200 mots" in msgs and "caractères (> 60" in msgs


def test_thumbnail_frame_follows_the_image_edges_and_leaves_the_inside_untouched():
    from PIL import Image
    from pipeline import thumbnail
    for sid, size, ring, inside in (("long-01", (1280, 720), 18, (640, 60)), ("short-01", (1080, 1920), 22, (540, 100))):
        img = Image.new("RGB", size, (10, 12, 11))
        thumbnail._frame(img, schema.find_script(config.SCRIPTS_DIR, sid))
        cx, cy = size[0] // 2, size[1] // 2
        for p in ((cx, ring), (cx, size[1] - 1 - ring), (ring, cy), (size[0] - 1 - ring, cy)):      # 4 côtés
            assert img.getpixel(p) != (10, 12, 11)
        assert img.getpixel(inside) == (10, 12, 11) and img.getpixel((cx, 2)) == (10, 12, 11)         # intérieur et bord intacts


def test_thumbnail_background_is_the_video_scene_of_the_same_script():
    from pipeline import thumbnail
    sc = schema.find_script(config.SCRIPTS_DIR, "short-03")
    a, b = thumbnail._video_background(270, 480, sc), thumbnail._video_background(270, 480, sc)
    other = thumbnail._video_background(270, 480, schema.find_script(config.SCRIPTS_DIR, "short-02"))
    assert a.size == (270, 480) and list(a.getdata()) == list(b.getdata()) and list(a.getdata()) != list(other.getdata())
