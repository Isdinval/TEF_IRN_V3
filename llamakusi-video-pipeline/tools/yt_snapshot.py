"""Instantané quotidien de la chaîne YouTube vers PostHog.

La source PostHog « YouTube » ne garde que les compteurs du moment. Ce script
enregistre chaque jour un événement par vidéo (`yt_video_snapshot`) et un pour la
chaîne (`yt_channel_snapshot`), ce qui donne l'historique nécessaire à la vélocité
(vues à J+1, J+7) et à la courbe d'abonnés.

Variables d'environnement :
  YOUTUBE_API_KEY    clé API YouTube Data v3 (données publiques)
  POSTHOG_KEY        jeton du projet PostHog (phc_...)
  POSTHOG_HOST       par défaut https://eu.i.posthog.com
  YOUTUBE_CHANNEL_ID par défaut la chaîne LlamaKusi

Relancer le même jour est sans risque : l'uuid d'un événement dépend de la vidéo
et du jour.

Usage : python yt_snapshot.py [--dry-run]
"""

import json
import os
import re
import sys
import urllib.parse
import urllib.request
import uuid
from datetime import UTC, datetime

API = "https://www.googleapis.com/youtube/v3"
DEFAULT_CHANNEL = "UCK36Fhxh_dRxzfH14J9W89w"
SHORT_MAX_SECONDS = 180
DISTINCT_ID = "youtube-snapshot"


def duration_seconds(iso):
    m = re.fullmatch(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", iso or "")
    if not m:
        return 0
    h, mi, s = (int(x or 0) for x in m.groups())
    return h * 3600 + mi * 60 + s


def build_events(channel, videos, now):
    """Construit la liste d'événements PostHog à partir des réponses de l'API."""
    day = now.date().isoformat()
    stamp = now.isoformat()

    def event(name, key, props):
        props = {**props, "snapshot_date": day, "$process_person_profile": False}
        return {
            "event": name,
            "distinct_id": DISTINCT_ID,
            "timestamp": stamp,
            "uuid": str(uuid.uuid5(uuid.NAMESPACE_URL, f"{name}:{key}:{day}")),
            "properties": props,
        }

    stats = channel["statistics"]
    events = [
        event(
            "yt_channel_snapshot",
            channel["id"],
            {
                "subscribers": int(stats.get("subscriberCount", 0)),
                "total_views": int(stats.get("viewCount", 0)),
                "video_count": int(stats.get("videoCount", 0)),
            },
        )
    ]
    for v in videos:
        seconds = duration_seconds(v["contentDetails"]["duration"])
        published = datetime.fromisoformat(v["snippet"]["publishedAt"])
        s = v["statistics"]
        events.append(
            event(
                "yt_video_snapshot",
                v["id"],
                {
                    "video_id": v["id"],
                    "title": v["snippet"]["title"],
                    "format": "short" if seconds <= SHORT_MAX_SECONDS else "long",
                    "duration_s": seconds,
                    "published_at": v["snippet"]["publishedAt"],
                    "age_days": (now - published).days,
                    "views": int(s.get("viewCount", 0)),
                    "likes": int(s.get("likeCount", 0)),
                    "comments": int(s.get("commentCount", 0)),
                },
            )
        )
    return events


def _get(path, **params):
    params["key"] = os.environ["YOUTUBE_API_KEY"]
    url = f"{API}/{path}?{urllib.parse.urlencode(params)}"
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.load(r)


def fetch_channel(channel_id):
    items = _get("channels", part="statistics,contentDetails", id=channel_id)["items"]
    if not items:
        sys.exit(f"Chaîne introuvable : {channel_id}")
    return items[0]


def fetch_videos(channel):
    uploads = channel["contentDetails"]["relatedPlaylists"]["uploads"]
    ids, token = [], None
    while True:
        params = {"part": "contentDetails", "playlistId": uploads, "maxResults": 50}
        if token:
            params["pageToken"] = token
        page = _get("playlistItems", **params)
        ids += [i["contentDetails"]["videoId"] for i in page["items"]]
        token = page.get("nextPageToken")
        if not token:
            break
    videos = []
    for i in range(0, len(ids), 50):
        batch = ",".join(ids[i : i + 50])
        videos += _get("videos", part="snippet,contentDetails,statistics", id=batch)[
            "items"
        ]
    return videos


def send(events):
    host = os.environ.get("POSTHOG_HOST", "https://eu.i.posthog.com").rstrip("/")
    body = json.dumps({"api_key": os.environ["POSTHOG_KEY"], "batch": events}).encode()
    req = urllib.request.Request(
        f"{host}/batch/", body, {"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status


def main():
    channel = fetch_channel(os.environ.get("YOUTUBE_CHANNEL_ID", DEFAULT_CHANNEL))
    events = build_events(channel, fetch_videos(channel), datetime.now(UTC))
    if "--dry-run" in sys.argv:
        print(json.dumps(events[:2], ensure_ascii=False, indent=2))
        print(f"{len(events)} événements (non envoyés)")
        return
    print(f"{len(events)} événements envoyés, statut {send(events)}")


if __name__ == "__main__":
    main()
