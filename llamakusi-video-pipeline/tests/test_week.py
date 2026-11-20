import cli
from pipeline import config, schema


def _sc(sid, status):
    return schema.VideoScript.model_construct(id=sid, status=status)


def test_week_selection(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "BUILD_DIR", tmp_path)
    (tmp_path / "short-02").mkdir()
    (tmp_path / "short-02" / "out.mp4").write_bytes(b"x")
    scripts = [_sc("short-01", "approved"), _sc("short-02", "approved"), _sc("short-03", "draft")]
    assert [s.id for s in cli.week_selection(scripts, [])] == ["short-01"]                 # approved, pas encore généré
    assert [s.id for s in cli.week_selection(scripts, [], force=True)] == ["short-01", "short-02"]
    assert [s.id for s in cli.week_selection(scripts, ["short-03"])] == ["short-03"]       # ids explicites
