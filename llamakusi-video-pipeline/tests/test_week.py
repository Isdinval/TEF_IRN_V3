import cli
from pipeline import config, schema


def _sc(sid, status):
    return schema.VideoScript.model_construct(id=sid, status=status, title="Titre test")


def test_week_selection(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "BUILD_DIR", tmp_path)
    scripts = [_sc("short-01", "approved"), _sc("short-02", "approved"), _sc("short-03", "draft")]
    bd = config.build_dir(scripts[1])
    bd.mkdir()
    (bd / "out.mp4").write_bytes(b"x")
    assert [s.id for s in cli.week_selection(scripts, [])] == ["short-01"]                 # approved, pas encore généré
    assert [s.id for s in cli.week_selection(scripts, [], force=True)] == ["short-01", "short-02"]
    assert [s.id for s in cli.week_selection(scripts, ["short-03"])] == ["short-03"]       # ids explicites


def test_publish_slot_start_date():
    from datetime import date
    assert cli._publish_slot(1, date(2026, 11, 29)) == "29/11/2026 (dimanche) à 11h00"
    assert cli._publish_slot(2, date(2026, 11, 29)) == "30/11/2026 (lundi) à 12h30"
    assert cli._publish_slot(3, date(2026, 11, 29)).startswith("01/12/2026 (mardi) à 19h30")


def test_parse_start():
    from datetime import date
    assert cli._parse_start("29/11/2026") == date(2026, 11, 29) == cli._parse_start("2026-11-29")
