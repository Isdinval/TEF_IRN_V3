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
SPEECH_WPS = 2.7             # HYPOTHÈSE : mots/seconde en français parlé (estimation)
MUSIC_GAIN_DB = float(env("MUSIC_GAIN_DB", "-20"))

# Zones de sécurité Shorts : rien d'important dans les 250 px du bas / 200 px de droite
SAFE_RIGHT = W - 200         # 880
SAFE_BOTTOM = H - 250        # 1670
CONTENT_X0 = 60
CONTENT_W = SAFE_RIGHT - CONTENT_X0   # 820
CONTENT_CX = CONTENT_X0 + CONTENT_W // 2

LAYOUT = {
    "brand_y": 150,
    "overlay_cy": 265,       # badge d'accroche (centre vertical)
    "card_y": 350,
    "card_max_h": 660,
    "subs_cy": 1090,
    "mascot_x": 40,
    "mascot_bottom": SAFE_BOTTOM,
    "mascot_h": 500,
    "cta_x": 450,
    "cta_cy": 1590,
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
