"""Configuration centrale du pipeline vidéo LlamaKusi."""
from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = ROOT / "scripts"
ASSETS_DIR = ROOT / "assets"
FONTS_DIR = ASSETS_DIR / "fonts"
MASCOT_DIR = ASSETS_DIR / "mascot"
MUSIC_DIR = ASSETS_DIR / "music"
BUILD_DIR = ROOT / "build"


def _load_dotenv() -> None:
    """Charge, sans écraser l'environnement existant : 1) .env du pipeline, 2) .env.local de l'app Next
    (racine du repo) → on réutilise NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY sans les copier."""
    for path in (ROOT / ".env", ROOT.parent / ".env.local"):
        if not path.exists():
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_dotenv()


def env(name: str, default: str = "") -> str:
    return os.environ.get(name, default)


# --- Modèles Gemini (à ajuster via .env si Google renomme) -------------------
TTS_MODEL = env("GEMINI_TTS_MODEL", "gemini-3.8-flash-tts")
TTS_VOICE = env("GEMINI_TTS_VOICE", "Kore")
TTS_STYLE = env("GEMINI_TTS_STYLE", "")
ASR_MODEL = env("GEMINI_ASR_MODEL", "gemini-3.5-transcribe")
ASR_LANGUAGE = "fr-FR"

# Prononciations forcées, appliquées au texte envoyé au TTS uniquement
# (le texte affiché reste celui du script). Ex : {"IRN": "I R N"}. Vide par défaut.
PRONUNCIATIONS: dict[str, str] = {}

# --- Vidéo -------------------------------------------------------------------
W, H, FPS = 1080, 1920, 30
TAIL_SECONDS = 0.15          # marge après le dernier mot (boucle serrée)
SPEECH_WPS = 3.18            # mesuré : Short 3, voix Charon, 74 mots en 23,27 s ≈ 3,18 mots/s
MUSIC_GAIN_DB = float(env("MUSIC_GAIN_DB", "-14"))   # relatif à la voix (musique normalisée à la même loudness)
MUSIC_EXTS = (".wav", ".mp3", ".m4a", ".flac", ".ogg")


def find_music() -> Path | None:
    """MUSIC_FILE (.env) prioritaire, sinon assets/music/bed.<wav|mp3|m4a|flac|ogg>."""
    override = env("MUSIC_FILE")
    if override:
        path = Path(override)
        path = path if path.is_absolute() else ROOT / path
        if not path.exists():
            raise FileNotFoundError(f"MUSIC_FILE introuvable : {path}")
        return path
    for ext in MUSIC_EXTS:
        path = MUSIC_DIR / f"bed{ext}"
        if path.exists():
            return path
    return None

# Mise en page CENTRÉE sur l'axe de l'écran (x = 540).
# Les boutons YouTube (droite) n'occupent que la moitié basse : la carte (haut) peut être pleine largeur,
# les sous-titres restent plus étroits (SUBS_MAX_W) pour ne pas frôler le rail de droite.
CONTENT_W = 900
CONTENT_X0 = (W - CONTENT_W) // 2     # 90
CONTENT_CX = W // 2                   # 540
SUBS_MAX_W = 780
SAFE_BOTTOM = H - 250                 # 1670 : rien d'important en dessous (légende YouTube)

LAYOUT = {
    "brand_y": 175,          # ligne de base du logo texte
    "overlay_cy": 300,       # badge d'accroche (centre vertical)
    "card_y": 390,
    "card_max_h": 640,
    "subs_cy": 1105,
    "mascot_bottom": 1580,   # mascotte centrée, sous les sous-titres
    "mascot_h": 420,
    "cta_cy": 1630,          # pill « Lien en bio », centré sous la mascotte
}

# --- Palette (tokens du design system / globals.css) -------------------------
COLORS = {
    "bg": "#09090B",         # zinc-950
    "card": "#FFFFFF",
    "ink": "#18181B",        # zinc-900
    "ink2": "#52525B",       # zinc-600
    "muted": "#A1A1AA",      # zinc-400
    "line": "#E4E4E7",       # zinc-200
    "soft": "#F4F4F5",       # zinc-100
    "gold": "#F2C94C",       # --brand-gold (mode sombre, globals.css)
    "gold_soft": "#FEF6D8",
    "white": "#FFFFFF",
    "black": "#000000",
}
ACCENTS = {
    "indigo": "#4F46E5",     # indigo-600 : TEF IRN
    "blue": "#2563EB",       # blue-600 : Examen Civique
    "gold": "#F2C94C",
}
ACCENT_BAR = {"indigo": "#6366F1", "blue": "#3B82F6", "gold": "#F2C94C"}  # -500

# --- Fond animé (background.py) : halos flous qui dérivent lentement, volontairement peu contrastés ----
# (couleur, intensité 0-1, centre x, centre y, rayon d'orbite x, y, cycles/vidéo, phase, sigma)
BG_PALETTES = {
    "indigo": {"base": "#08080F", "blobs": [
        ("#4F46E5", 0.34, 0.25, 0.28, 0.16, 0.10, 1, 0.0, 0.34),
        ("#7C3AED", 0.24, 0.80, 0.62, 0.14, 0.12, 1, 2.1, 0.36),
        ("#0EA5E9", 0.16, 0.45, 0.92, 0.18, 0.06, 2, 4.0, 0.32)]},
    "blue": {"base": "#070A12", "blobs": [
        ("#2563EB", 0.34, 0.75, 0.25, 0.16, 0.10, 1, 0.5, 0.34),
        ("#0EA5E9", 0.20, 0.20, 0.60, 0.14, 0.12, 1, 2.6, 0.36),
        ("#4F46E5", 0.18, 0.55, 0.92, 0.18, 0.06, 2, 4.4, 0.32)]},
    "gold": {"base": "#0B0A09", "blobs": [
        ("#4F46E5", 0.26, 0.22, 0.30, 0.16, 0.10, 1, 1.0, 0.36),
        ("#B8892A", 0.20, 0.82, 0.58, 0.14, 0.12, 1, 3.0, 0.34),
        ("#7C3AED", 0.14, 0.45, 0.92, 0.18, 0.06, 2, 5.0, 0.32)]},
}
BG_DEBAND = 1.2              # force de `gradfun` (anti-banding des dégradés sombres ; un grain `noise` pèserait 70× plus)

# --- Mascotte ----------------------------------------------------------------
# Le repo n'a PAS d'expression « heureux » : on la mappe sur « neutre » (lama souriant).
MASCOT_MOOD = {
    "perplexe": "perplexe",
    "reflechit": "reflechit",
    "victorieux": "victorieux",
    "heureux": "neutre",
}
MASCOT_COUNTS = {"perplexe": 6, "reflechit": 6, "victorieux": 6, "neutre": 5}
MASCOT_URL_BASE = (
    "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/grammar-check"
)

FONT_FILES = {"montserrat": "Montserrat.ttf", "inter": "Inter.ttf"}
FONT_URLS = {
    "Montserrat.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/Montserrat%5Bwght%5D.ttf",
    "Inter.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf",
}

# --- Lint --------------------------------------------------------------------
MAX_WORDS_WARN = 80
MAX_WORDS_ERROR = 110
MAX_SECONDS_WARN = 36.0
MAX_SECONDS_ERROR = 45.0
