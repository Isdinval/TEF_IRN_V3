"""Alignement script ↔ ASR.

Principe : le TEXTE vient toujours du script (accents, « B2 », chiffres corrects),
seuls les TIMINGS viennent de l'ASR. Alignement type Needleman-Wunsch (flou) entre
les mots du script et ceux de l'ASR ; les mots non appariés sont interpolés.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from difflib import SequenceMatcher

from . import config
from .schema import VideoScript
from .textutil import Token, normalize, tokenize


@dataclass
class Word:
    text: str
    norm: str
    block: int                # index du bloc
    start: float = 0.0
    end: float = 0.0
    sim: float = 1.0          # similarité avec le mot ASR apparié (0 = interpolé)
    pause_after: bool = False

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class AlignReport:
    n_script: int
    n_asr: int
    coverage: float                       # part des mots avec sim >= 0.6
    interpolated: list[str] = field(default_factory=list)
    weak: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return self.coverage >= 0.9


def flatten_script(script: VideoScript) -> list[Word]:
    words: list[Word] = []
    for bi, block in enumerate(script.blocks):
        for tok in tokenize(block.voice):
            words.append(Word(tok.text, tok.norm, bi, pause_after=tok.pause_after))
    return words


# --- estimation / repli sans ASR ---------------------------------------------
def estimate_duration(words: list[Word]) -> float:
    return len(words) / config.SPEECH_WPS + 0.15 * sum(w.pause_after for w in words)


def proportional_timings(words: list[Word], duration: float) -> list[Word]:
    """Répartition par longueur de mot (repli/`--dry`). Précision ~±150 ms."""
    weights = [len(w.norm) + 1 + (4 if w.pause_after else 0) for w in words]
    total = sum(weights) or 1
    t = 0.0
    for w, wt in zip(words, weights):
        span = duration * wt / total
        w.start, w.end, w.sim = t, t + span * 0.88, 0.0
        t += span
    return words


# --- alignement --------------------------------------------------------------
def _sim(a: str, b: str) -> float:
    if a == b:
        return 1.0
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a, b).ratio()


def _nw(script: list[str], asr: list[str], max_merge: int = 3):
    """Alignement global. Un mot du script peut couvrir 1 à `max_merge` mots ASR consécutifs
    (« B1 » transcrit « B 1 »). Retourne des triplets (i, j0, j1) :
      (i, j0, j1)   mot script i ↔ mots ASR [j0, j1)
      (i, None, None) mot script sans équivalent ASR
      (None, j, j+1)  mot ASR en trop
    """
    n, m = len(script), len(asr)
    GAP = -0.7
    score = [[0.0] * (m + 1) for _ in range(n + 1)]
    back = [[0] * (m + 1) for _ in range(n + 1)]      # k>0 : diag(k) ; -1 : script sans ASR ; -2 : ASR en trop
    for i in range(1, n + 1):
        score[i][0], back[i][0] = i * GAP, -1
    for j in range(1, m + 1):
        score[0][j], back[0][j] = j * GAP, -2
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            best, move = score[i - 1][j] + GAP, -1
            left = score[i][j - 1] + GAP
            if left > best:
                best, move = left, -2
            for k in range(1, min(max_merge, j) + 1):
                sim = _sim(script[i - 1], "".join(asr[j - k:j]))
                cand = score[i - 1][j - k] + (2 * sim - 0.8) - 0.05 * (k - 1)
                if cand >= best:                      # à égalité, la diagonale gagne
                    best, move = cand, k
            score[i][j], back[i][j] = best, move
    path, i, j = [], n, m
    while i > 0 or j > 0:
        move = back[i][j]
        if move > 0:
            path.append((i - 1, j - move, j)); i -= 1; j -= move
        elif move == -1:
            path.append((i - 1, None, None)); i -= 1
        else:
            path.append((None, j - 1, j)); j -= 1
    path.reverse()
    return path


def align_words(words: list[Word], asr: list[dict], audio_end: float) -> tuple[list[Word], AlignReport]:
    """asr = [{"text","start","end"}, ...] (secondes). Modifie `words` en place."""
    asr_norm = [normalize(a["text"]) for a in asr]
    path = _nw([w.norm for w in words], asr_norm)

    matched: set[int] = set()
    last_script = None
    for i, j0, j1 in path:
        if i is not None and j0 is not None:
            words[i].start, words[i].end = asr[j0]["start"], asr[j1 - 1]["end"]
            words[i].sim = _sim(words[i].norm, "".join(asr_norm[j0:j1]))
            matched.add(i)
            last_script = i
        elif i is None and j0 is not None and last_script is not None:
            words[last_script].end = max(words[last_script].end, asr[j0]["end"])   # mot ASR en trop
        elif i is not None:
            last_script = None   # ne pas prolonger un mot à travers un trou

    # interpolation des mots sans appariement
    idx, n = 0, len(words)
    while idx < n:
        if idx in matched:
            idx += 1
            continue
        run_start = idx
        while idx < n and idx not in matched:
            idx += 1
        prev_end = words[run_start - 1].end if run_start > 0 else 0.0
        next_start = words[idx].start if idx < n else audio_end
        next_start = max(next_start, prev_end)
        run = words[run_start:idx]
        weights = [len(w.norm) + 1 for w in run]
        total = sum(weights)
        t = prev_end
        for w, wt in zip(run, weights):
            span = (next_start - prev_end) * wt / total
            w.start, w.end, w.sim = t, t + span, 0.0
            t += span

    # monotonie + durée minimale
    prev_end = 0.0
    for w in words:
        w.start = max(w.start, prev_end)
        w.end = max(w.end, w.start + 0.04)
        prev_end = w.end

    good = sum(1 for w in words if w.sim >= 0.6)
    report = AlignReport(
        n_script=n, n_asr=len(asr),
        coverage=good / n if n else 0.0,
        interpolated=[w.text for w in words if w.sim == 0.0],
        weak=[w.text for w in words if 0.0 < w.sim < 0.6],
    )
    return words, report


# --- blocs, groupes karaoké ---------------------------------------------------
def snap(t: float) -> float:
    return round(t * config.FPS) / config.FPS


def block_spans(words: list[Word], n_blocks: int, duration: float) -> list[tuple[float, float]]:
    """Frontières de blocs = milieu de la pause entre dernier mot et premier mot suivant."""
    firsts: list[Word | None] = [None] * n_blocks
    lasts: list[Word | None] = [None] * n_blocks
    for w in words:
        firsts[w.block] = firsts[w.block] or w
        lasts[w.block] = w
    bounds = [0.0]
    for b in range(1, n_blocks):
        prev_last, cur_first = lasts[b - 1], firsts[b]
        if prev_last is None or cur_first is None:
            bounds.append(bounds[-1])
        else:
            bounds.append((prev_last.end + cur_first.start) / 2)
    bounds.append(duration)
    return [(snap(bounds[i]), snap(bounds[i + 1])) for i in range(n_blocks)]


def group_words(words: list[Word], max_words: int = 3, max_chars: int = 22) -> list[list[int]]:
    groups: list[list[int]] = []
    cur: list[int] = []
    for i, w in enumerate(words):
        cur.append(i)
        chars = sum(len(words[k].text) + 1 for k in cur) - 1
        last = w.text[-1]
        nxt = words[i + 1] if i + 1 < len(words) else None
        next_chars = chars + len(nxt.text) + 1 if nxt else 10**6
        if (
            last in ".!?…"
            or nxt is None
            or nxt.block != w.block
            or len(cur) >= max_words
            or (last in ",;:" and len(cur) >= 2)
            or next_chars > max_chars
        ):
            groups.append(cur)
            cur = []
    if cur:
        groups.append(cur)
    return groups
