"""Test A/B (studio.txt, lint) et nom lisible du dossier de build."""
from pipeline import config, lint, publish, schema


def _script(sid="long-01"):
    return schema.find_script(config.SCRIPTS_DIR, sid)


def test_build_dir_has_title_and_migrates(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "BUILD_DIR", tmp_path)
    sc = _script("long-03")
    (tmp_path / "long-03").mkdir()
    (tmp_path / "long-03" / "out.mp4").write_bytes(b"x")
    (tmp_path / "long-030").mkdir()                              # id voisin : ne doit pas être touché
    d = config.build_dir(sc)
    assert d.name.startswith("long-03_programme-de-l-examen-civique") and len(d.name) <= 47
    assert (d / "out.mp4").exists() and (tmp_path / "long-030").exists() and not (tmp_path / "long-03").exists()
    assert config.build_dir(sc) == d


def test_studio_ab_section(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "BUILD_DIR", tmp_path)
    sc = _script()
    txt = publish.studio_file(sc, tmp_path).read_text(encoding="utf-8")
    assert "Titre et miniature" in txt and sc.publish.title_variants[1] in txt and "thumbnail_C.jpg" in txt
    sc.publish.title_variants = []
    assert "Miniature seule" in publish.studio_file(sc, tmp_path).read_text(encoding="utf-8")
    assert "TEST A/B" not in publish.studio_file(_script("short-01"), tmp_path).read_text(encoding="utf-8")


def test_lint_title_variants():
    sc = _script()
    assert not any("title_variants" in i.message or "variante" in i.message for i in lint.lint_script(sc))
    sc.publish.title_variants = ["Autre sujet : 1", sc.title]
    msgs = " ".join(i.message for i in lint.lint_script(sc))
    assert "variante" in msgs and "identiques" in msgs
