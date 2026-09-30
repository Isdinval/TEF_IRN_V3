"""Sous-titres .srt : `words.json` (texte du script + timings) → cues → traductions Gemini → fichiers .srt.

Choix :
- les cues suivent les PHRASES (pas le karaoké 2-3 mots de l'image) : une traduction mot à mot n'aurait pas de sens ;
- la traduction se fait cue par cue mais en UN appel par langue (contexte complet, terminologie cohérente) ;
- les timings sont ceux de la cue française, jamais recalculés ;
- cache par (cues, langue, modèle) : relancer ne coûte rien ; `--dry` = traduction factice, sans réseau.
"""
from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from pathlib import Path

from . import config
from .align import Word

_STRONG = (".", "?", "!", "…")
_SOFT = (",", ";", ":")
SOFT_MIN_WORDS, HARD_MAX_WORDS, MAX_CHARS_LINE = 6, 12, 42
MIN_DUR, HOLD = 1.0, 0.3            # durée mini d'une cue ; maintien après le dernier mot (si la place le permet)


@dataclass
class Cue:
    text: str
    start: float
    end: float


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace("\u00a0", " ")).strip()


def load_words(path: Path) -> list[Word]:
    return [Word(**d) for d in json.loads(Path(path).read_text(encoding="utf-8"))]


def build_cues(words: list[Word]) -> list[Cue]:
    """Coupe aux fins de phrase ; aux virgules/tirets si la cue est déjà longue ; plafond dur en mots."""
    groups: list[list[Word]] = []
    cur: list[Word] = []
    for i, w in enumerate(words):
        cur.append(w)
        last_of_block = i + 1 == len(words) or words[i + 1].block != w.block
        t = w.text.rstrip()
        cut = (t.endswith(_STRONG) or last_of_block
               or (len(cur) >= SOFT_MIN_WORDS and (t.endswith(_SOFT) or w.pause_after))
               or len(cur) >= HARD_MAX_WORDS)
        if cut:
            groups.append(cur)
            cur = []
    if cur:
        groups.append(cur)
    cues = [Cue(_clean(" ".join(w.text for w in g)), g[0].start, g[-1].end) for g in groups]
    for k, c in enumerate(cues):                       # maintien / durée mini sans chevaucher la suivante
        limit = cues[k + 1].start if k + 1 < len(cues) else c.end + HOLD
        c.end = min(max(c.end + HOLD, c.start + MIN_DUR), max(limit, c.end))
    return cues


# --- traduction ------------------------------------------------------------------------------
def _sha(*parts: str) -> str:
    return hashlib.sha1("\x1f".join(parts).encode("utf-8")).hexdigest()


def _prompt(texts: list[str], lang: str) -> str:
    name = config.SUB_LANG_NAMES.get(lang, lang)
    payload = json.dumps(texts, ensure_ascii=False)
    return (
        f"Traduis en {name} ces sous-titres d'une vidéo pédagogique sur la naturalisation française et les examens "
        "TEF IRN / TCF IRN / examen civique. Ils forment un texte continu : garde le sens et la cohérence entre eux.\n"
        "Règles : une traduction par entrée, même nombre d'entrées, même ordre ; ton naturel et simple (niveau B1) ; "
        "ne traduis pas les noms propres et sigles (LlamaKusi, TEF, TCF, IRN, A2, B1, B2, C1) ; "
        "un mot ou une expression FRANÇAISE que la vidéo enseigne (entre guillemets, ou terme officiel comme "
        "« préfecture », « récépissé ») reste en français, suivi de sa traduction entre parenthèses ; "
        "pas d'explication ajoutée, pas de numérotation.\n"
        "Réponds UNIQUEMENT par un tableau JSON de chaînes.\n"
        f"Entrées : {payload}")


def _parse_translation(raw: str, n: int) -> list[str]:
    txt = re.sub(r"^```(?:json)?|```$", "", raw.strip(), flags=re.MULTILINE).strip()
    data = json.loads(txt)
    if not isinstance(data, list) or not all(isinstance(x, str) for x in data):
        raise ValueError("réponse de traduction : tableau JSON de chaînes attendu")
    if len(data) != n:
        raise ValueError(f"traduction : {len(data)} entrées reçues, {n} attendues")
    return [_clean(x) for x in data]


def _gemini_translate(texts: list[str], lang: str) -> list[str]:
    from google import genai

    client = genai.Client()
    last: Exception | None = None
    for _ in range(2):                                          # un seul nouvel essai si le JSON est invalide
        resp = client.models.generate_content(
            model=config.TRANSLATE_MODEL, contents=_prompt(texts, lang),
            config={"response_mime_type": "application/json", "temperature": 0.2})
        try:
            return _parse_translation(resp.text, len(texts))
        except (ValueError, json.JSONDecodeError) as exc:
            last = exc
    raise RuntimeError(f"traduction {lang} invalide après 2 essais : {last}")


def translate(texts: list[str], lang: str, cache_dir: Path, *, dry: bool = False, force: bool = False) -> list[str]:
    if lang == "fr":
        return texts
    if dry:
        return [f"[{lang}] {t}" for t in texts]
    cache = cache_dir / f"translation.{lang}.json"
    key = _sha(json.dumps(texts, ensure_ascii=False), lang, config.TRANSLATE_MODEL)
    if cache.exists() and not force:
        obj = json.loads(cache.read_text(encoding="utf-8"))
        if obj.get("key") == key:
            return obj["texts"]
    out = _gemini_translate(texts, lang)
    cache.write_text(json.dumps({"key": key, "texts": out}, ensure_ascii=False, indent=1), encoding="utf-8")
    return out


# --- SRT -------------------------------------------------------------------------------------
def _wrap(text: str, lang: str) -> str:
    """≤ 2 lignes. CJK : ~20 caractères par ligne, sans espaces ; autres : 42."""
    if lang.startswith("zh"):
        return text if len(text) <= 20 else "\n".join([text[:len(text) // 2 + len(text) % 2], text[len(text) // 2 + len(text) % 2:]])
    if len(text) <= MAX_CHARS_LINE:
        return text
    words, best, mid = text.split(), None, len(text) / 2
    for i in range(1, len(words)):
        a, b = " ".join(words[:i]), " ".join(words[i:])
        score = abs(len(a) - mid)
        if best is None or score < best[0]:
            best = (score, a, b)
    return f"{best[1]}\n{best[2]}" if best else text


def _ts(t: float) -> str:
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def to_srt(cues: list[Cue], texts: list[str], lang: str) -> str:
    blocks = [f"{i}\n{_ts(c.start)} --> {_ts(c.end)}\n{_wrap(t, lang)}\n"
              for i, (c, t) in enumerate(zip(cues, texts), 1)]
    return "\n".join(blocks)


def generate(build_dir: Path, langs: list[str], *, dry: bool = False, force: bool = False) -> list[Path]:
    """Écrit build/<id>/subs.fr.srt (toujours) + subs.<lang>.srt pour chaque langue demandée."""
    words_path = build_dir / "words.json"
    if not words_path.exists():
        raise FileNotFoundError(f"{words_path} introuvable : lancer d'abord `python cli.py build <id>`")
    cues = build_cues(load_words(words_path))
    fr = [c.text for c in cues]
    written = []
    for lang in ["fr", *[x for x in langs if x != "fr"]]:
        texts = translate(fr, lang, build_dir, dry=dry, force=force)
        path = build_dir / f"subs.{lang}.srt"
        path.write_text(to_srt(cues, texts, lang), encoding="utf-8")
        written.append(path)
    return written
