"""Lecture des VRAIES questions civiques (table civic_questions, RLS : reviewed = true).

Colonnes (migration 20260722000001) : id, theme, question, options (JSONB, 4 choix),
correct_answer, explanation, source_ref. Lecture seule ; filtre reviewed=true toujours appliqué.
⚠ Format exact de `correct_answer` non vérifié (lettre ou texte ?) : les deux sont gérés.
"""
from __future__ import annotations

import re

import requests

from . import config
from .schema import VideoScript

_PREFIX = re.compile(r"^\s*[A-D][\)\.\-:]\s*")


DEFAULT_URL = "https://jksrmyyfllitrkarvgvk.supabase.co"


def _base_url() -> str:
    url = config.env("NEXT_PUBLIC_SUPABASE_URL") or config.env("SUPABASE_URL") or DEFAULT_URL
    return url.rstrip("/")


def _headers() -> dict:
    """Clé : SUPABASE_SERVICE_ROLE_KEY (comme l'app Next), sinon SUPABASE_ANON_KEY.

    ⚠ La service role contourne la RLS : la protection « questions relues uniquement » repose
    donc sur le filtre `reviewed=eq.true` de fetch_questions() (ne jamais le retirer).
    Les nouvelles clés `sb_secret_…` ne sont pas des JWT : header `apikey` seul.
    """
    key = config.env("SUPABASE_SERVICE_ROLE_KEY") or config.env("SUPABASE_ANON_KEY")
    if not key:
        raise RuntimeError("clé Supabase manquante : SUPABASE_SERVICE_ROLE_KEY dans .env "
                           "(ou dans ../.env.local de l'app)")
    headers = {"apikey": key}
    if key.count(".") == 2:            # JWT (clés historiques anon / service_role)
        headers["Authorization"] = f"Bearer {key}"
    return headers


def fetch_questions(search: str | None = None, qid: str | None = None, limit: int = 10) -> list[dict]:
    url = f"{_base_url()}/rest/v1/civic_questions"
    params: dict = {"select": "id,theme,question,options,correct_answer,explanation,source_ref",
                    "reviewed": "eq.true",   # INDISPENSABLE avec la service role (pas de RLS)
                    "limit": str(limit)}
    if qid:
        params["id"] = f"eq.{qid}"
    if search:
        params["question"] = f"ilike.*{search}*"
    r = requests.get(url, headers=_headers(), params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def to_card_data(row: dict) -> dict:
    options = [_PREFIX.sub("", str(o)).strip() for o in row["options"]]
    ans = str(row["correct_answer"]).strip()
    if len(ans) == 1 and ans.upper() in "ABCD":
        letter = ans.upper()
    else:
        cleaned = _PREFIX.sub("", ans).strip().lower()
        idx = next((i for i, o in enumerate(options) if o.lower() == cleaned), None)
        if idx is None:
            raise ValueError(f"correct_answer introuvable parmi les options : {ans!r}")
        letter = "ABCD"[idx]
    return {"question": row["question"].strip(), "choices": options[:4], "correct": letter,
            "label": "Examen civique · Question", "question_id": row["id"],
            "source_ref": row.get("source_ref")}


def resolve_cards(script: VideoScript) -> None:
    """Remplace les données provisoires des cartes `question` qui portent un `question_id`."""
    for b in script.blocks:
        if b.card and b.card.kind == "question" and b.card.data.get("question_id"):
            rows = fetch_questions(qid=b.card.data["question_id"], limit=1)
            if not rows:
                raise RuntimeError(f"question {b.card.data['question_id']} introuvable (reviewed=true ?)")
            b.card.data = to_card_data(rows[0])
