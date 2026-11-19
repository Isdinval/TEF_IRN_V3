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
BACKGROUNDS_DIR = ASSETS_DIR / "backgrounds"   # vidéos de fond personnalisées (non versionnées)
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
TRANSLATE_MODEL = env("GEMINI_TRANSLATE_MODEL", "gemini-3.8-flash")   # modèle texte GA (doc Google, 09/2026)

# --- Sous-titres .srt (pistes YouTube natives ; le français est gravé dans l'image) ------------
# Décision : traduire les vidéos LONGUES par défaut ; les Shorts seulement sur demande (--langs ou .env).
# Codes = ceux de YouTube Studio (chinois simplifié = zh-Hans).
SUB_LANGS_LONG = [x for x in env("SUB_LANGS_LONG", "ar,en,es,zh-Hans").split(",") if x.strip()]
SUB_LANGS_SHORT = [x for x in env("SUB_LANGS_SHORT", "").split(",") if x.strip()]
SUB_LANG_NAMES = {"ar": "arabe standard moderne", "en": "anglais", "es": "espagnol (neutre)",
                  "zh-Hans": "chinois simplifié", "uk": "ukrainien", "fr": "français"}

# --- Voix des vidéos LONGUES : un appel TTS (+ un ASR) par segment, mis en cache par segment ---------------
# Un segment = un bloc, ou un groupe de phrases d'un bloc trop long. La limite de durée d'un appel TTS n'est pas
# vérifiée (hypothèse) : SEG_MAX_WORDS=150 (~47 s de voix) est volontairement prudent. Réglable dans .env.
SEG_MAX_WORDS = int(env("SEG_MAX_WORDS", "150"))
SEG_PAUSE_BLOCK = 0.35       # respiration entre deux blocs (s)
SEG_PAUSE_SENTENCE = 0.15    # respiration entre deux segments d'un MÊME bloc (s)
SEG_LEVEL_MAX_GAIN_DB = 6.0  # recalage de niveau entre segments : correction plafonnée à ± cette valeur

# Prononciations forcées, appliquées au texte envoyé au TTS uniquement
# (le texte affiché reste celui du script). Ex : {"IRN": "I R N"}. Vide par défaut.
PRONUNCIATIONS: dict[str, str] = {}

# --- Vidéo -------------------------------------------------------------------
FPS = 30
TAIL_SECONDS = float(env("TAIL_SECONDS", "0.7"))   # silence final après le dernier mot (0,5-1 s ; plus = boucle moins serrée)
MUSIC_FADE_S = 0.8           # fondu de sortie de la musique (démarre à total - MUSIC_FADE_S)
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

# --- Profils de mise en page -------------------------------------------------------------------
# Un profil par format (`short` 9:16, `long` 16:9). `use_profile(fmt)` écrit le profil actif dans les
# variables globales ci-dessous (W, H, CONTENT_*, LAYOUT…), lues dynamiquement par layers/background/assemble.
# Choix MVP : état global plutôt que paramètre passé partout (layers.py = 500 lignes) ; `build_timeline`
# et le CLI appellent `use_profile` ; tests/conftest.py remet `short` avant chaque test.
#
# SHORT : tout CENTRÉ sur x = 540. Les boutons YouTube (droite) n'occupent que la moitié basse : la carte
#   (haut) peut être pleine largeur ; les sous-titres restent plus étroits (subs_max_w).
# LONG  : 1920×1080. Colonne gauche (x 96-1216) = cartes + sous-titres ; colonne droite = mascotte + CTA.
PROFILES = {
    "short": {
        "W": 1080, "H": 1920, "bg_low": (216, 384),
        "content_w": 900, "content_x0": 90, "content_cx": 540, "subs_max_w": 780,
        "layout": {
            "brand_align": "center", "brand_x": 540, "brand_y": 175, "brand_size": 50,
            "overlay_cy": 300,       # badge d'accroche (centre vertical)
            "card_y": 390, "card_max_h": 640,
            "subs_cy": 1105, "subs_size": 70, "progress_y": 96,
            "mascot_cx": 540, "mascot_bottom": 1580, "mascot_h": 420,   # centrée, sous les sous-titres
            "cta_cx": 540, "cta_cy": 1630, "cta_max_w": 900,           # pill « Lien en bio »
        },
    },
    "long": {
        "W": 1920, "H": 1080, "bg_low": (384, 216),
        "content_w": 1120, "content_x0": 96, "content_cx": 656, "subs_max_w": 1080,
        "layout": {
            "brand_align": "left", "brand_x": 96, "brand_y": 98, "brand_size": 40,
            "overlay_cy": 110,       # non prévu en 16:9 (le lint prévient)
            "card_y": 150, "card_max_h": 690,
            "subs_cy": 930, "subs_size": 66, "progress_y": 0,
            "mascot_cx": 1562, "mascot_bottom": 900, "mascot_h": 560,
            "cta_cx": 1562, "cta_cy": 960, "cta_max_w": 520,
        },
    },
}
BG_LOOP_S = 75.0             # fond des vidéos longues : boucle de 30 s répétée (calcul et poids divisés par ~12)

W, H = 1080, 1920
CONTENT_W = CONTENT_X0 = CONTENT_CX = SUBS_MAX_W = 0
BG_LOW = (216, 384)
SAFE_BOTTOM = 0
LAYOUT: dict = {}            # dict MUTÉ sur place (layers.py garde la même référence)
ACTIVE_PROFILE = ""


def use_profile(fmt: str) -> None:
    """Active le profil `short` ou `long` (idempotent)."""
    global W, H, CONTENT_W, CONTENT_X0, CONTENT_CX, SUBS_MAX_W, BG_LOW, SAFE_BOTTOM, ACTIVE_PROFILE
    prof = PROFILES[fmt]
    W, H = prof["W"], prof["H"]
    CONTENT_W, CONTENT_X0, CONTENT_CX = prof["content_w"], prof["content_x0"], prof["content_cx"]
    SUBS_MAX_W, BG_LOW = prof["subs_max_w"], tuple(prof["bg_low"])
    SAFE_BOTTOM = H - (250 if fmt == "short" else 60)    # short : légende YouTube ; long : marge simple
    LAYOUT.clear()
    LAYOUT.update(prof["layout"])
    ACTIVE_PROFILE = fmt


def profile_signature() -> str:
    """Empreinte du profil actif (sert à invalider le cache des calques PNG quand la mise en page change)."""
    import json
    return json.dumps({"fmt": ACTIVE_PROFILE, "W": W, "H": H, "cw": CONTENT_W, "x0": CONTENT_X0, "cx": CONTENT_CX,
                       "subs": SUBS_MAX_W, "layout": LAYOUT, "style": STYLE_VERSION}, sort_keys=True)


use_profile("short")

ARROW_BOUNCE = 8            # amplitude du rebond de la flèche CTA, dans le pill (px)
ARROW_SLOT = 56              # largeur réservée à droite du texte du pill pour la flèche (px)
ARROW_CYCLE_S = 0.9          # durée d'un rebond
ARROW_PHASES = 18            # images distinctes par rebond (18 → 20 i/s)

# --- Palette (tokens du design system / globals.css) -------------------------
# Charte « émeraude / or / rose » (inspirée de l'artefact The New York Tower) : fond sombre, cartes crème.
STYLE_VERSION = "2026-11-geo-gold"   # à changer quand la charte évolue (invalide le cache des calques)
COLORS = {
    "bg": "#0A0D0B",         # noir chaud
    "card": "#FFFEF8",       # crème (cartes)
    "ink": "#14201A",
    "ink2": "#55604F",
    "muted": "#8F9988",
    "line": "#D9CFAE",
    "soft": "#F0E9D2",
    "gold": "#E0B955",       # sous-titres actifs, badge, contours de cartes
    "gold_soft": "#FBF3D9",
    "white": "#F7F3E6",      # blanc chaud
    "black": "#000000",
    "pill": "#17241C",       # CTA « Lien en bio »
}
# L'accent ne distingue plus les produits par une teinte dominante : il colore la pastille du logo,
# le liseré des cartes et les rôles du texte annoté. Les clés `indigo`/`blue`/`gold` sont conservées (scripts YAML).
ACCENTS = {
    "indigo": "#A63D63",     # rose profond : TEF IRN (aplats sous texte clair)
    "blue": "#0B7A58",       # émeraude : Examen Civique
    "gold": "#E0B955",
}
ACCENT_BAR = {"indigo": "#E08AA8", "blue": "#5FCB9A", "gold": "#E0B955"}  # versions claires (liseré, pastille)

# --- Fond animé (background.py) : halos flous qui dérivent lentement, volontairement peu contrastés ----
# (couleur, intensité 0-1, centre x, centre y, rayon d'orbite x, y, cycles/vidéo, phase, sigma)
BG_PALETTES = {
    "indigo": {"base": "#0A100C", "blobs": [          # TEF IRN : or + rose sur émeraude
        ("#C9A24A", 0.24, 0.25, 0.28, 0.16, 0.10, 1, 0.0, 0.36),
        ("#E08AA8", 0.18, 0.80, 0.62, 0.14, 0.12, 1, 2.1, 0.38),
        ("#1F7A52", 0.42, 0.45, 0.92, 0.18, 0.06, 2, 4.0, 0.38)]},
    "blue": {"base": "#08110F", "blobs": [            # Examen Civique : or + émeraude, rose discret
        ("#C9A24A", 0.22, 0.75, 0.25, 0.16, 0.10, 1, 0.5, 0.36),
        ("#2E8B73", 0.38, 0.20, 0.60, 0.14, 0.12, 1, 2.6, 0.38),
        ("#E08AA8", 0.12, 0.55, 0.92, 0.18, 0.06, 2, 4.4, 0.34)]},
    "gold": {"base": "#0C0D09", "blobs": [
        ("#C9A24A", 0.28, 0.22, 0.30, 0.16, 0.10, 1, 1.0, 0.38),
        ("#E08AA8", 0.16, 0.82, 0.58, 0.14, 0.12, 1, 3.0, 0.36),
        ("#1F7A52", 0.36, 0.45, 0.92, 0.18, 0.06, 2, 5.0, 0.36)]},
}
# --- Fond vidéo par défaut : boucles parfaites (ex. Pixabay) déposées dans assets/backgrounds/ ---------
# Fichiers <préfixe>-01.mp4, -02.mp4… : rotation par numéro de script (short-03 → 3e boucle). Lues en boucle
# (pas de boomerang) ; en Short, vitesse recalée pour finir pile sur une boucle (raccord).
# BG_SHORT / BG_LONG dans .env : force UN fichier pour tous les scripts du format (désactive la rotation).
DEFAULT_BG_PREFIX = {"short": "short-loop", "long": "long-loop"}
DEFAULT_BG_FORCED = {"short": env("BG_SHORT", ""), "long": env("BG_LONG", "")}
BG_USE_LOOPS = env("BG_USE_LOOPS", "0") == "1"     # 1 = reprendre la rotation des boucles de assets/backgrounds/ (ancien fond)

# --- Fond « constellation » (background.py, BG_STYLE=geo, défaut ; BG_STYLE=halo = ancien fond de halos flous) -------
# Grands polygones en traits fins qui dérivent + orbes lumineux reliés par de fins traits + poussière nette.
# Tout est périodique (cycles entiers) → raccord invisible ; la disposition dépend de l'id du script (seed).
BG_STYLE = env("BG_STYLE", "geo")
BG_WORKERS = int(env("BG_WORKERS", str(min(os.cpu_count() or 1, 8))))   # processus pour calculer les images du fond
BG_GEO_FPS = int(env("BG_GEO_FPS", "15"))            # images/s calculées (dupliquées à FPS) : mouvements lents, coût / 2
GEO = {
    "base": "#0A0D0B", "glow_gold": "#C9A24A", "glow_rose": "#E08AA8",
    "gold": "#D9B65E", "rose": "#E08AA8", "core": "#FFF4D6",
    "poly": 14, "poly_alpha": (120, 170), "poly_width": 4,    # traits fins, 25-40 % d'opacité (px pour 1080 de large)
    "orbs": 18, "link_alpha": 70, "dust": 90, "stars": 3, "mesh": 1.0, "grid": 1.0,       # maillage de facettes / grille de points en onde (x intensité)
    "react": 1.0,                                          # réactivité à la voix (0 = fond indépendant de la voix)
   
    "calm": 0.55,
    "glow": 2.4, "sweep": 0.10,                          # intensité de la lueur des traits / du balayage de lumière                                          # atténuation des traits derrière les sous-titres (0 = aucune)
}

# --- Poussière dorée (background.py) : bokeh doux qui monte lentement, périodique → raccord invisible ----
BG_DUST_COUNT = int(env("BG_DUST_COUNT", "38"))
BG_DUST_COLORS = ("#E8CE8A", "#E8CE8A", "#E8CE8A", "#E08AA8")   # ~1 grain sur 4 en rose

# --- Barre de progression dorée → rose (assemble.py) ; PROGRESS_BAR=0 pour la désactiver ---------------
PROGRESS_BAR = env("PROGRESS_BAR", "1") != "0"
PROGRESS_H = 8
PROGRESS_COLORS = ("#E8CE8A", "#C9A24A", "#E08AA8")

# --- Cartes : halo doré derrière la carte ---------------------------------------------------------
CARD_GLOW_ALPHA = 70
CARD_GLOW_BLUR = 28
BG_VIDEO_DIM = float(env("BG_VIDEO_DIM", "0.70"))   # luminosité du fond (1 = brut) : lisibilité carte/sous-titres

# --- Premier plan vivant (assemble.py) : amplitudes en px, durées en s -----------------------------------
FG_MASCOT_BOB = 7            # respiration de la mascotte (va-et-vient vertical)
FG_MASCOT_BOB_PERIOD = 2.8
FG_MASCOT_HOP = 34           # petit saut à chaque changement de bloc
FG_HOP_S = 0.35
FG_CARD_ENTER = 90           # la carte arrive par le bas (nouvelle carte)
FG_CARD_ENTER_S = 0.40
FG_CARD_BUMP = 16            # rebond quand la réponse est révélée
FG_CARD_BUMP_S = 0.30
FG_CARD_FLOAT = 3            # flottement très léger de la carte (lisibilité préservée)
FG_CARD_FLOAT_PERIOD = 4.0
FG_OVERLAY_DROP = 60         # le badge tombe du haut
FG_OVERLAY_DROP_S = 0.35
FG_SUBS_POP = (1.14, 1.06)   # échelle des 2 premières paires d'images de chaque groupe karaoké

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

FONT_FILES = {"montserrat": "Montserrat.ttf", "inter": "Inter.ttf", "cormorant": "CormorantGaramond.ttf"}
FONT_URLS = {
    "Montserrat.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/Montserrat%5Bwght%5D.ttf",
    "Inter.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf",
    "CormorantGaramond.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/CormorantGaramond%5Bwght%5D.ttf",
}

# --- Lint --------------------------------------------------------------------
MAX_WORDS_WARN = 80
MAX_WORDS_ERROR = 110
MAX_SECONDS_WARN = 36.0
MAX_SECONDS_ERROR = 45.0


def resolve_background(name: str) -> Path:
    """`background:` d'un script ou `--background` : chemin absolu / relatif au dossier courant, sinon assets/backgrounds/<nom>."""
    tried = []
    for cand in (Path(name), ROOT / name, BACKGROUNDS_DIR / name):
        tried.append(str(cand))
        if cand.is_file():
            return cand.resolve()
    raise FileNotFoundError(f"fond vidéo introuvable : « {name} » (cherché : {', '.join(tried)})")


def resolve_default_background(fmt: str, script_id: str) -> Path | None:
    """Boucle de fond par défaut : fichier forcé (BG_SHORT / BG_LONG), sinon rotation parmi
    assets/backgrounds/<préfixe>*.mp4 (triés). Le numéro final de l'id choisit la boucle (short-01 → 1re,
    short-02 → 2e… puis on recommence) : choix stable d'un rendu à l'autre et alternance entre vidéos
    consécutives. Id sans numéro → choix dérivé de l'id. None si aucun fichier n'est déposé."""
    import re
    import zlib

    if DEFAULT_BG_FORCED[fmt]:
        return resolve_background(DEFAULT_BG_FORCED[fmt])
    if not BG_USE_LOOPS:
        return None
    loops = sorted(BACKGROUNDS_DIR.glob(f"{DEFAULT_BG_PREFIX[fmt]}*.mp4"))
    if not loops:
        return None
    m = re.search(r"(\d+)$", script_id)
    k = int(m.group(1)) - 1 if m else zlib.crc32(script_id.encode("utf-8"))
    return loops[k % len(loops)]
