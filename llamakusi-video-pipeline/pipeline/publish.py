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

from . import config, schema
from .schema import VideoScript

PLATFORMS = ("youtube", "facebook", "instagram")
SITE = "https://llamakusi.com"
# Défauts par produit (surchargés par `publish.hashtags` / `publish.description` du script). Hashtags sans accent ni espace.
# Jamais de promesse « gratuit » : certaines briques sont réservées aux abonnés.
DEFAULT_HASHTAGS = {
    "tef_irn": ["LlamaKusi", "TEFIRN", "TEF", "Naturalisation"],
    "examen_civique": ["LlamaKusi", "ExamenCivique", "CSP", "CarteDeResident", "Naturalisation"],
    "both": ["LlamaKusi", "TEFIRN", "ExamenCivique", "Naturalisation"],
    "fle_bridge": ["LlamaKusi", "FLE", "Prefecture", "Naturalisation"],
}
DEFAULT_PITCH = {
    "tef_irn": "Prépare le TEF IRN avec LlamaKusi : exercices et coach d'expression écrite et orale.",
    "examen_civique": "Prépare l'examen civique (CSP, carte de résident, naturalisation) avec LlamaKusi.",
    "both": "Prépare le TEF IRN et l'examen civique avec LlamaKusi.",
    "fle_bridge": "Comprends le français administratif et prépare ta démarche avec LlamaKusi.",
}
# Tags YouTube par produit (≠ hashtags) : variantes d'orthographe et requêtes proches. 8 maximum au total.
DEFAULT_TAGS = {
    "tef_irn": ["TEF IRN", "TEF-IRN", "TCF IRN", "test de français naturalisation", "préparation TEF IRN"],
    "examen_civique": ["examen civique", "examen civique 2026", "carte de résident", "carte de séjour pluriannuelle", "naturalisation française"],
    "both": ["TEF IRN", "examen civique", "naturalisation française", "carte de résident"],
    "fle_bridge": ["français administratif", "préfecture", "naturalisation française", "FLE"],
}
SITE_PATHS = {   # (accueil, dossier des guides) : sitemap.ts → /tef-irn/guides/<slug> et /examen-civique/guides/<slug>
    "tef_irn": ("/tef-irn", "/tef-irn/guides"), "examen_civique": ("/examen-civique", "/examen-civique/guides"),
    "both": ("/tef-irn", "/tef-irn/guides"), "fle_bridge": ("/tef-irn", "/tef-irn/guides"),
}
# Playlists de la chaîne (clé → titre, description) : à créer dans YouTube Studio ; `studio.txt` indique laquelle choisir.
PLAYLISTS = {
    "start": ("Commencer ici : naturalisation, TEF IRN, examen civique",
              "Tu débutes ? Les bases pour comprendre le TEF IRN, le TCF IRN et l'examen civique, et savoir par où commencer.\n→ https://llamakusi.com/tef-irn"),
    "tef": ("TEF IRN : réussir l'expression écrite et orale",
            "Méthodes et exemples pour préparer le TEF IRN (niveaux A2, B1, B2) : expression écrite, expression orale, pièges à éviter.\n→ https://llamakusi.com/tef-irn"),
    "civique": ("Examen civique : questions et pièges",
                "Questions types, pièges et repères pour préparer l'examen civique (carte de séjour, carte de résident, naturalisation).\n→ https://llamakusi.com/examen-civique"),
    "regles": ("Naturalisation et titre de séjour : les règles 2026",
               "Niveau de français, démarches, délais : ce qui change en 2026, expliqué simplement.\n→ https://llamakusi.com/tef-irn"),
    "prefecture": ("Français de la préfecture : vocabulaire et courriers",
                   "Les mots et les courriers de l'administration expliqués simplement (récépissé, convocation, justificatifs…).\n→ https://llamakusi.com/tef-irn"),
}
_PLAYLIST_BY_PILLAR = {"C": "tef", "D": "civique", "B": "regles", "E": "prefecture", "F": "start"}
_PLAYLIST_PILLAR_A = {"tef_irn": "tef", "examen_civique": "civique", "both": "start", "fle_bridge": "prefecture"}
# 1er commentaire à épingler (question ouverte et simple à répondre), par pilier.
PINNED_QUESTION = {
    "A": "Quel piège te pose le plus de problèmes en ce moment ?",
    "B": "Quel examen prépares-tu en ce moment : TEF ou TCF ?",
    "C": "Où est-ce que tu bloques le plus dans ta préparation ? Dis-le en commentaire, ça nous aide à choisir les prochaines vidéos.",
    "D": "Quelle question de l'examen civique te fait le plus peur ?",
    "E": "Quel mot de l'administration ne comprends-tu toujours pas ?",
    "F": "Quel examen prépares-tu en ce moment : TEF ou TCF ?",
}
COMMENT_LINE = "Une question ? Pose-la en commentaire, on te répond."
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


def links(script: VideoScript) -> dict[str, str]:
    """Liens CTA propres (sans paramètres) : `guide` (lien profond : publish.guide, sinon source_guide de la 1re claim) et `home`."""
    home, guides = SITE_PATHS[script.product]
    slug = script.publish.guide or next((c.source_guide for c in script.claims if c.source_guide), None)
    out = {"home": SITE + home}
    if slug:
        out["guide"] = f"{SITE}{guides}/{slug}"
    return out


def hashtags(script: VideoScript, platform: str) -> list[str]:
    """3 hashtags maximum sur YouTube (les premiers sont affichés au-dessus du titre) ; Short : le dernier est #Shorts."""
    tags = list(script.publish.hashtags or DEFAULT_HASHTAGS[script.product])
    if platform != "youtube":
        return tags
    return tags[:2] + ["Shorts"] if script.format == "short" else tags[:3]


def seo_tags(script: VideoScript) -> list[str]:
    raw = [script.publish.keyword or "", *(script.publish.tags or DEFAULT_TAGS[script.product])]
    seen, out = set(), []
    for t in raw:
        if t.strip() and t.lower() not in seen:
            seen.add(t.lower())
            out.append(t.strip())
    return out[:8]


def _youtube_text(script: VideoScript, bdir: Path) -> str:
    """Ligne 1 = réponse (mot-clé), ligne 2 = lien profond (visibles avant « Voir plus »), puis corps, chapitres, liens, hashtags."""
    info, lk = script.publish, links(script)
    parts = [f"{info.answer or script.title}\n→ {lk.get('guide', lk['home'])}"]
    parts.append(info.description or DEFAULT_PITCH[script.product])
    if script.format == "long":
        chapters = bdir / "chapters.txt"
        if chapters.exists():
            parts.append("CHAPITRES\n" + chapters.read_text(encoding="utf-8").strip())
        parts.append(COMMENT_LINE)
        parts.append(f"S'ENTRAÎNER SUR LLAMAKUSI\n{lk['home']}")
        parts.append(f"LlamaKusi — {DEFAULT_PITCH[script.product]}")
    if script.format == "short":
        parts.append(COMMENT_LINE)
    parts.append(" ".join("#" + t for t in hashtags(script, "youtube")))
    return "\n\n".join(parts).strip()


def texts(script: VideoScript, bdir: Path, platform: str) -> dict[str, str]:
    """Titre + texte de publication d'une plateforme. YouTube : description SEO/GEO (voir `_youtube_text`) ; autres : titre + pitch + hashtags."""
    if platform == "youtube":
        return {"title": script.title[:100], "text": _youtube_text(script, bdir), "tags": seo_tags(script)}
    info = script.publish
    tags = hashtags(script, platform)
    body = info.description or f"{script.title}\n\n{DEFAULT_PITCH[script.product]}\n{SITE}"
    return {"title": script.title[:100], "text": f"{body}\n\n{' '.join('#' + t for t in tags)}".strip(), "tags": tags}


def playlist_key(script: VideoScript) -> str:
    key = script.publish.playlist or (_PLAYLIST_PILLAR_A[script.product] if script.pillar == "A" else _PLAYLIST_BY_PILLAR[script.pillar])
    if key not in PLAYLISTS:
        raise ValueError(f"{script.id} : playlist « {key} » inconnue ({', '.join(PLAYLISTS)})")
    return key


def pinned_question(script: VideoScript) -> str:
    return script.publish.pinned_question or PINNED_QUESTION[script.pillar]


def _related_section(script: VideoScript) -> str:
    """Short → long à lier ; long → Shorts qui pointent vers lui (réglage manuel : Studio > Contenu > Short > Détails)."""
    if script.format == "short":
        if not script.publish.related:
            return "VIDÉO ASSOCIÉE\naucune (pas de vidéo longue liée)"
        target = schema.find_script(config.SCRIPTS_DIR, script.publish.related)
        if target.format != "long":
            raise ValueError(f"{script.id} : related « {target.id} » n'est pas une vidéo longue")
        return f"VIDÉO ASSOCIÉE (Studio > Contenu > ce Short > Détails)\n{target.id} — « {target.title} »"
    shorts = [s for s in schema.load_all(config.SCRIPTS_DIR) if s.publish.related == script.id]
    lines = "\n".join(f"{s.id} — « {s.title} »" for s in shorts) or "aucun"
    return f"SHORTS LIÉS (leur « Vidéo associée » = cette vidéo)\n{lines}"


def studio_file(script: VideoScript, bdir: Path) -> Path:
    """build/<id>/studio.txt : champs à copier dans YouTube Studio (titre, description, tags, playlist, vidéo associée, commentaire)."""
    t = texts(script, bdir, "youtube")
    files = [f.name for f in (bdir / "out.mp4", bdir / "thumbnail.jpg") if f.exists()]
    short_title = "" if len(t["title"]) <= 60 else " — > 60 : tronqué sur mobile"
    out = bdir / "studio.txt"
    out.write_text(f"FICHIERS\n{' · '.join(files)}\n\nTITRE ({len(t['title'])}/100{short_title})\n{t['title']}\n\n"
                   f"DESCRIPTION ({len(t['text'].split())} mots)\n{t['text']}\n\n"
                   f"TAGS ({len(t['tags'])}/8, séparés par des virgules)\n{', '.join(t['tags'])}\n\n"
                   f"PLAYLIST (Studio > Contenu > Playlists)\n{PLAYLISTS[playlist_key(script)][0]}\n\n"
                   f"{_related_section(script)}\n\n"
                   f"COMMENTAIRE À ÉPINGLER (poster depuis la chaîne, puis ⋮ > Épingler)\n{pinned_question(script)}\n", encoding="utf-8")
    return out


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
