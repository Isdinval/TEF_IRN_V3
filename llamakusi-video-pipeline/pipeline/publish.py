"""Publication DIRECTE (publique, sans brouillon) : YouTube, Facebook (Page) et Instagram (Reels).

Entrée : build/<id>/out.mp4 (+ chapters.txt / thumbnail.png pour YouTube, formats longs).
Sortie : build/<id>/published.json (plateforme → lien) — évite les doublons ; `--force` pour republier.
Seulement `requests` : OAuth YouTube par boucle locale, jetons Meta fournis dans .env (voir .env.example).
"""
from __future__ import annotations

import json
import secrets
import time
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urlparse

import requests

from . import config
from .schema import VideoScript

PLATFORMS = ("youtube", "facebook", "instagram")
DEFAULT_HASHTAGS = ["LlamaKusi", "TEFIRN", "Naturalisation"]
GRAPH_VERSION = config.env("GRAPH_VERSION", "v25.0")
GRAPH = f"https://graph.facebook.com/{GRAPH_VERSION}"
GRAPH_VIDEO = f"https://graph-video.facebook.com/{GRAPH_VERSION}"
YT_UPLOAD = "https://www.googleapis.com/upload/youtube/v3"
YT_AUTH = "https://accounts.google.com/o/oauth2/v2/auth"
YT_TOKEN = "https://oauth2.googleapis.com/token"
YT_TOKEN_FILE = config.ROOT / ".youtube_token.json"      # ignoré par git
YT_SCOPE = "https://www.googleapis.com/auth/youtube.upload"


class PublishError(RuntimeError):
    pass


def _http(method: str, url: str, **kw) -> requests.Response:
    r = requests.request(method, url, timeout=kw.pop("timeout", (10, 600)), **kw)
    if not r.ok:
        raise PublishError(f"{method} {url.split('?')[0]} → HTTP {r.status_code} : {r.text[:300]}")
    return r


def _meta_token(platform: str) -> str:
    own = config.env("INSTAGRAM_TOKEN") if platform == "instagram" else ""
    return own or config.env("FACEBOOK_PAGE_TOKEN")


def _missing(platform: str) -> list[str]:
    """Réglages absents pour une plateforme (noms des variables .env)."""
    if platform == "youtube":
        miss = [k for k in ("YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET") if not config.env(k)]
        return miss + ([] if YT_TOKEN_FILE.exists() else ["autorisation (python cli.py publish-auth youtube)"])
    id_var = "FACEBOOK_PAGE_ID" if platform == "facebook" else "INSTAGRAM_USER_ID"
    return [v for v, ok in ((id_var, config.env(id_var)), ("FACEBOOK_PAGE_TOKEN", _meta_token(platform))) if not ok]


def texts(script: VideoScript, bdir: Path, platform: str) -> dict[str, str]:
    """Titre + texte de publication d'une plateforme (description, chapitres YouTube des longs, hashtags)."""
    info = script.publish
    tags = list(info.hashtags or DEFAULT_HASHTAGS)
    body = info.description or ""
    if platform == "youtube":
        if script.format == "short":
            tags.append("Shorts")
        chapters = bdir / "chapters.txt"
        if script.format == "long" and chapters.exists():
            body = f"{body}\n\n{chapters.read_text(encoding='utf-8').strip()}".strip()
    elif not body:
        body = script.title
    text = f"{body}\n\n{' '.join('#' + t for t in tags)}".strip()
    return {"title": script.title[:100], "text": text, "tags": tags}


def check_publishable(script: VideoScript, platforms: list[str], confirm_public: bool) -> None:
    """Garde-fous avant tout envoi (la publication est PUBLIQUE et immédiate). Quitte avec un message si KO."""
    errors = []
    if not confirm_public:
        errors.append("publication publique immédiate : relancer avec --confirm-public")
    errors += [f"plateforme inconnue « {p} » (youtube, facebook, instagram)" for p in platforms if p not in PLATFORMS]
    if not (config.BUILD_DIR / script.id / "out.mp4").exists():
        errors.append(f"build/{script.id}/out.mp4 absent : python cli.py build {script.id}")
    if "instagram" in platforms and script.format != "short":
        errors.append("instagram : Reels verticaux seulement (formats short)")
    for p in platforms:
        if p in PLATFORMS and (miss := _missing(p)):
            errors.append(f"{p} : réglage manquant — {', '.join(miss)}")
    if errors:
        raise SystemExit("✗ publication impossible :\n  - " + "\n  - ".join(errors))


# --- YouTube ----------------------------------------------------------------------------------------
def youtube_authorize() -> None:
    """Une fois : ouvre le navigateur, enregistre le jeton de rafraîchissement dans .youtube_token.json."""
    cid, secret = config.env("YOUTUBE_CLIENT_ID"), config.env("YOUTUBE_CLIENT_SECRET")
    if not (cid and secret):
        raise SystemExit("✗ YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET absents du .env (client OAuth « application de bureau »)")
    box: dict[str, str] = {}

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            box.update({k: v[0] for k, v in parse_qs(urlparse(self.path).query).items()})
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write("Autorisation reçue : vous pouvez fermer cet onglet.".encode())

        def log_message(self, *args):
            pass

    server = HTTPServer(("127.0.0.1", 0), Handler)
    redirect, state = f"http://127.0.0.1:{server.server_port}", secrets.token_urlsafe(16)
    url = YT_AUTH + "?" + urlencode({"client_id": cid, "redirect_uri": redirect, "response_type": "code", "scope": YT_SCOPE,
                                     "access_type": "offline", "prompt": "consent", "state": state})
    print(f"Autorisation YouTube — si le navigateur ne s'ouvre pas, ouvrir :\n{url}")
    webbrowser.open(url)
    while "code" not in box and "error" not in box:
        server.handle_request()
    if box.get("state") != state or "code" not in box:
        raise SystemExit(f"✗ autorisation refusée ({box.get('error', 'état invalide')})")
    r = _http("POST", YT_TOKEN, data={"code": box["code"], "client_id": cid, "client_secret": secret,
                                      "redirect_uri": redirect, "grant_type": "authorization_code"})
    YT_TOKEN_FILE.write_text(json.dumps({"refresh_token": r.json()["refresh_token"]}), encoding="utf-8")
    print(f"✓ jeton enregistré : {YT_TOKEN_FILE.name}")


def _youtube_headers() -> dict[str, str]:
    refresh = json.loads(YT_TOKEN_FILE.read_text(encoding="utf-8"))["refresh_token"]
    r = _http("POST", YT_TOKEN, data={"client_id": config.env("YOUTUBE_CLIENT_ID"), "client_secret": config.env("YOUTUBE_CLIENT_SECRET"),
                                      "refresh_token": refresh, "grant_type": "refresh_token"})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def _send_youtube(script: VideoScript, bdir: Path, video: Path, t: dict) -> str:
    h = _youtube_headers()
    body = {"snippet": {"title": t["title"], "description": t["text"], "tags": t["tags"], "categoryId": "27",
                        "defaultLanguage": "fr", "defaultAudioLanguage": "fr"},
            "status": {"privacyStatus": "public", "selfDeclaredMadeForKids": False}}
    r = _http("POST", f"{YT_UPLOAD}/videos?uploadType=resumable&part=snippet,status",
              headers={**h, "X-Upload-Content-Type": "video/mp4", "X-Upload-Content-Length": str(video.stat().st_size)}, json=body)
    with video.open("rb") as f:
        info = _http("PUT", r.headers["Location"], headers={**h, "Content-Type": "video/mp4"}, data=f).json()
    link, notes = f"https://youtu.be/{info['id']}", []
    if info.get("status", {}).get("privacyStatus") != "public":
        notes.append("vidéo restée PRIVÉE : projet API non audité par YouTube (formulaire d'audit « API Services »)")
    thumb = next((p for p in (bdir / "thumbnail.png", bdir / "thumbnail.jpg") if p.exists()), None)
    if script.format == "long" and thumb:
        try:
            _http("POST", f"{YT_UPLOAD}/thumbnails/set?videoId={info['id']}", data=thumb.read_bytes(),
                  headers={**h, "Content-Type": "image/png" if thumb.suffix == ".png" else "image/jpeg"})
        except PublishError as e:
            notes.append(f"miniature non envoyée ({e})")
    return link + "".join(f"  ⚠ {n}" for n in notes)


# --- Facebook / Instagram (Graph API) ----------------------------------------------------------------
def _upload_headers(token: str, video: Path) -> dict[str, str]:
    return {"Authorization": f"OAuth {token}", "offset": "0", "file_size": str(video.stat().st_size)}


def _send_facebook(script: VideoScript, bdir: Path, video: Path, t: dict) -> str:
    page, token = config.env("FACEBOOK_PAGE_ID"), _meta_token("facebook")
    if script.format == "long":                          # vidéo de Page classique (16:9)
        with video.open("rb") as f:
            r = _http("POST", f"{GRAPH_VIDEO}/{page}/videos", files={"source": f},
                      data={"title": t["title"], "description": t["text"], "published": "true", "access_token": token})
        return f"https://www.facebook.com/{page}/videos/{r.json()['id']}"
    start = _http("POST", f"{GRAPH}/{page}/video_reels", data={"upload_phase": "start", "access_token": token}).json()
    with video.open("rb") as f:
        _http("POST", start["upload_url"], headers=_upload_headers(token, video), data=f)
    _http("POST", f"{GRAPH}/{page}/video_reels", data={"upload_phase": "finish", "video_id": start["video_id"],
                                                       "video_state": "PUBLISHED", "title": t["title"],
                                                       "description": t["text"], "access_token": token})
    return f"https://www.facebook.com/reel/{start['video_id']}"


def _send_instagram(script: VideoScript, bdir: Path, video: Path, t: dict) -> str:
    uid, token = config.env("INSTAGRAM_USER_ID"), _meta_token("instagram")
    box = _http("POST", f"{GRAPH}/{uid}/media", data={"media_type": "REELS", "upload_type": "resumable", "share_to_feed": "true",
                                                      "caption": t["text"][:2200], "access_token": token}).json()
    with video.open("rb") as f:
        _http("POST", box["uri"], headers=_upload_headers(token, video), data=f)
    for _ in range(60):                                  # traitement asynchrone : jusqu'à ~5 min
        status = _http("GET", f"{GRAPH}/{box['id']}", params={"fields": "status_code", "access_token": token}).json()["status_code"]
        if status == "FINISHED":
            break
        if status in ("ERROR", "EXPIRED"):
            raise PublishError(f"Instagram a rejeté la vidéo (status_code={status})")
        time.sleep(5)
    else:
        raise PublishError("Instagram : traitement > 5 min, réessayer (python cli.py publish <id> --platforms instagram)")
    media = _http("POST", f"{GRAPH}/{uid}/media_publish", data={"creation_id": box["id"], "access_token": token}).json()
    return f"instagram media {media['id']}"


SENDERS = {"youtube": _send_youtube, "facebook": _send_facebook, "instagram": _send_instagram}


def publish(script: VideoScript, bdir: Path, platforms: list[str], dry: bool = False, force: bool = False) -> dict[str, str]:
    """Envoie la vidéo ; renvoie plateforme → lien (ou « ✗ erreur »). Une erreur n'empêche pas les autres plateformes."""
    state_path = bdir / "published.json"
    state = json.loads(state_path.read_text(encoding="utf-8")) if state_path.exists() else {}
    out: dict[str, str] = {}
    for p in platforms:
        t = texts(script, bdir, p)
        if dry:
            out[p] = f"[dry] « {t['title']} »\n" + "\n".join("      " + line for line in t["text"].splitlines())
        elif p in state and not force:
            out[p] = f"déjà publié ({state[p]}) — --force pour republier"
        else:
            try:
                out[p] = state[p] = f"{SENDERS[p](script, bdir, bdir / 'out.mp4', t)}"
                state_path.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")
            except (PublishError, requests.RequestException, KeyError, OSError) as e:
                out[p] = f"✗ {e}"
    return out
