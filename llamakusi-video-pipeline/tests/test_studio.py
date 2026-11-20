from pipeline import config, publish, schema


def test_studio_file_has_title_description_chapters_and_tags(tmp_path):
    script = schema.find_script(config.SCRIPTS_DIR, "long-01")
    (tmp_path / "chapters.txt").write_text("0:00 Intro\n0:30 Suite\n", encoding="utf-8")
    out = publish.studio_file(script, tmp_path).read_text(encoding="utf-8")
    assert script.title in out and "0:30 Suite" in out and "TAGS" in out and "#" in out
