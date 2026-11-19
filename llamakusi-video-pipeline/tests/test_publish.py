"""Publication : textes, garde-fous, flux YouTube / Facebook / Instagram (HTTP simulé, aucun réseau)."""
import json

import pytest

from pipeline import config, publish, schema


class Resp:
    ok, status_code, text = True, 200, ""

    def __init__(self, data=None, headers=None):
        self._data, self.headers = data or {}, headers or {}

    def json(self):
        return self._data


@pytest.fixture
def short():
    return schema.find_script(config.SCRIPTS_DIR, "short-01")


@pytest.fixture
def long():
    return schema.find_script(config.SCRIPTS_DIR, "long-01")


@pytest.fixture
def env(monkeypatch, tmp_path):
    for k, v in {"YOUTUBE_CLIENT_ID": "id", "YOUTUBE_CLIENT_SECRET": "s", "FACEBOOK_PAGE_ID": "P",
                 "FACEBOOK_PAGE_TOKEN": "T", "INSTAGRAM_USER_ID": "U"}.items():
        monkeypatch.setenv(k, v)
    token = tmp_path / "yt.json"
    token.write_text(json.dumps({"refresh_token": "r"}))
    monkeypatch.setattr(publish, "YT_TOKEN_FILE", token)
    monkeypatch.setattr(config, "BUILD_DIR", tmp_path / "build")


def built(script, tmp_path):
    bdir = tmp_path / "build" / script.id
    bdir.mkdir(parents=True)
    (bdir / "out.mp4").write_bytes(b"video")
    return bdir


def test_texts_youtube_short_adds_shorts_tag_and_default_hashtags(short, tmp_path):
    t = publish.texts(short, tmp_path, "youtube")
    assert "#Shorts" in t["text"] and "#LlamaKusi" in t["text"] and t["title"] == short.title


def test_texts_instagram_caption_falls_back_to_title_without_shorts_tag(short, tmp_path):
    t = publish.texts(short, tmp_path, "instagram")
    assert t["text"].startswith(short.title) and "#Shorts" not in t["text"]
    assert publish.SITE in t["text"]


def test_texts_long_youtube_gets_chapters_only_on_youtube(long, tmp_path):
    (tmp_path / "chapters.txt").write_text("0:00 Intro\n1:00 Suite")
    assert "0:00 Intro" in publish.texts(long, tmp_path, "youtube")["text"]
    assert "0:00 Intro" not in publish.texts(long, tmp_path, "facebook")["text"]


def test_check_requires_confirmation_video_credentials_and_short_for_instagram(short, long, env, tmp_path, monkeypatch):
    with pytest.raises(SystemExit) as e:
        publish.check_publishable(short, ["youtube"], confirm_public=False)
    assert "--confirm-public" in str(e.value) and "out.mp4 absent" in str(e.value)
    built(short, tmp_path)
    publish.check_publishable(short, list(publish.PLATFORMS), confirm_public=True)      # tout est en règle
    built(long, tmp_path)
    with pytest.raises(SystemExit, match="Reels verticaux"):
        publish.check_publishable(long, ["instagram"], confirm_public=True)
    monkeypatch.delenv("FACEBOOK_PAGE_TOKEN")
    with pytest.raises(SystemExit, match="facebook : réglage manquant — FACEBOOK_PAGE_TOKEN"):
        publish.check_publishable(short, ["facebook"], confirm_public=True)


def test_dry_run_prints_texts_and_sends_nothing(short, tmp_path, monkeypatch):
    monkeypatch.setattr(publish, "_http", lambda *a, **k: pytest.fail("aucun appel réseau en --dry"))
    out = publish.publish(short, tmp_path, ["youtube", "facebook"], dry=True)
    assert out["youtube"].startswith("[dry]") and not (tmp_path / "published.json").exists()


def test_youtube_uploads_public_then_skips_duplicate_unless_forced(short, env, tmp_path, monkeypatch):
    bdir, calls = built(short, tmp_path), []

    def fake(method, url, **kw):
        calls.append((method, url.split("?")[0], kw.get("json")))
        if url == publish.YT_TOKEN:
            return Resp({"access_token": "A"})
        if "videos?uploadType" in url:
            return Resp(headers={"Location": "https://upload/session"})
        return Resp({"id": "abc", "status": {"privacyStatus": "public"}})

    monkeypatch.setattr(publish, "_http", fake)
    out = publish.publish(short, bdir, ["youtube"])
    assert out["youtube"].startswith("https://youtu.be/abc")
    body = next(c[2] for c in calls if c[2])
    assert body["status"]["privacyStatus"] == "public" and body["snippet"]["categoryId"] == "27"
    assert json.loads((bdir / "published.json").read_text())["youtube"].startswith("https://youtu.be/abc")
    n = len(calls)
    assert "déjà publié" in publish.publish(short, bdir, ["youtube"])["youtube"] and len(calls) == n
    assert publish.publish(short, bdir, ["youtube"], force=True)["youtube"].startswith("https://youtu.be/abc")


def test_youtube_warns_when_video_stays_private_and_long_sends_thumbnail(long, env, tmp_path, monkeypatch):
    bdir = built(long, tmp_path)
    (bdir / "thumbnail.png").write_bytes(b"png")
    urls = []

    def fake(method, url, **kw):
        urls.append(url.split("?")[0])
        if url == publish.YT_TOKEN:
            return Resp({"access_token": "A"})
        if "videos?uploadType" in url:
            return Resp(headers={"Location": "https://upload/session"})
        return Resp({"id": "abc", "status": {"privacyStatus": "private"}})

    monkeypatch.setattr(publish, "_http", fake)
    out = publish.publish(long, bdir, ["youtube"])["youtube"]
    assert "PRIVÉE" in out and f"{publish.YT_UPLOAD}/thumbnails/set" in urls


def test_facebook_short_uses_reels_flow_and_instagram_polls_until_finished(short, env, tmp_path, monkeypatch):
    bdir, posts = built(short, tmp_path), []
    statuses = iter(["IN_PROGRESS", "FINISHED"])
    monkeypatch.setattr(publish.time, "sleep", lambda s: None)

    def fake(method, url, **kw):
        posts.append((method, url.split("?")[0], (kw.get("data") or {}) if isinstance(kw.get("data"), dict) else {}))
        if url.endswith("/P/video_reels") and kw["data"]["upload_phase"] == "start":
            return Resp({"video_id": "V", "upload_url": "https://rupload.facebook.com/video-upload/V"})
        if url.endswith("/U/media"):
            return Resp({"id": "C", "uri": "https://rupload.facebook.com/ig-api-upload/C"})
        if url.endswith("/C"):
            return Resp({"status_code": next(statuses)})
        if url.endswith("/U/media_publish"):
            return Resp({"id": "M"})
        return Resp({})

    monkeypatch.setattr(publish, "_http", fake)
    out = publish.publish(short, bdir, ["facebook", "instagram"])
    assert out["facebook"].startswith("https://www.facebook.com/reel/V") and out["instagram"].startswith("instagram media M")
    finish = next(p for p in posts if p[2].get("upload_phase") == "finish")
    assert finish[2]["video_state"] == "PUBLISHED"


def test_one_platform_failing_does_not_block_the_others(short, env, tmp_path, monkeypatch):
    bdir = built(short, tmp_path)

    def fake(method, url, **kw):
        if "graph.facebook.com" in url:
            raise publish.PublishError("HTTP 400")
        return Resp({"video_id": "V"})

    monkeypatch.setattr(publish, "_http", fake)
    monkeypatch.setitem(publish.SENDERS, "youtube", lambda *a: "https://youtu.be/ok")
    out = publish.publish(short, bdir, ["facebook", "youtube"])
    assert out["facebook"].startswith("✗") and out["youtube"].startswith("https://youtu.be/ok")
    assert list(json.loads((bdir / "published.json").read_text())) == ["youtube"]


def test_default_hashtags_follow_the_product(tmp_path):
    sc = schema.find_script(config.SCRIPTS_DIR, "short-03")           # examen_civique
    text = publish.texts(sc, tmp_path, "youtube")["text"]
    assert "#ExamenCivique" in text and "#TEFIRN" not in text
    sc.publish.description = "Ma description"
    assert publish.texts(sc, tmp_path, "youtube")["text"].startswith("Ma description")
