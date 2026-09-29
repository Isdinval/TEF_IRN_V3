# Documentation — pipeline vidéo LlamaKusi

Toutes les commandes se lancent depuis le dossier `llamakusi-video-pipeline`, environnement conda activé.

---

## 1. Comprendre le pipeline en 30 secondes

```
scripts/short-03.yaml        ← LE SCRIPT (texte de la voix, mascotte, carte…) : écrit par vous / avec Claude
        │  lint              ← contrôle automatique (durée, CTA parlé, claims sourcées…)
        ▼
   TTS Gemini                ← voix (1 seul appel, intonation continue)          → voice.wav
        ▼
   ASR Gemini                ← ré-écoute la voix pour dater chaque mot            → words_asr.json
        ▼
   Alignement                ← texte = celui du script, horaires = ceux de l'ASR  → words.json
        ▼
   Timeline + calques PNG    ← cartes, sous-titres karaoké, mascotte, badge, CTA  → timeline.json
        ▼
   Fond animé + ffmpeg       ← assemble tout + musique                             → out.mp4
```

Chaque étape écrit son résultat dans `build\<id>\` : relancer une commande **ne refait pas** ce qui est déjà fait
(donc ne repaie pas l'API pour la voix si le texte n'a pas changé).

---

## 2. Qui écrit les scripts ? (réponse à « c'est automatique ? »)

**Aujourd'hui : c'est manuel. Le pipeline ne génère aucun script.**

- Les scripts sont des fichiers `scripts\*.yaml`. Les 6 premiers ont été convertis depuis votre document *Phase 0*.
- Le pipeline **lit** ces fichiers, les **contrôle** (`lint`) et les **transforme en vidéo** (`build`). Il n'invente rien.
- Pour créer un nouveau script, deux façons :
  1. **Avec Claude dans le chat** : vous donnez le pilier, la formule de hook et le sujet ; Claude écrit le YAML ; vous le
     copiez dans `scripts\` (c'est le « GATE 1 » : vous relisez et vous passez `status: approved`).
  2. **Squelette à remplir vous-même** : `python cli.py new short-06 --pillar D --formula stakes`.
- **Pas encore construit** : une commande `generate` qui écrirait le script toute seule via une API de LLM. C'est une
  évolution possible, mais volontairement laissée pour plus tard : tant que les vidéos ne sont pas validées à la main,
  automatiser la création multiplierait les erreurs (surtout que chaque affirmation doit être sourcée).

Le **contenu factuel** (chiffres, délais, règles) reste de votre responsabilité : la section `claims:` de chaque script
liste ce qu'il faut vérifier, et `lint --publish` refuse une vidéo dont les claims ne sont pas vérifiées.

---

## 3. Workflow d'une nouvelle vidéo

| # | Action | Commande |
|---|---|---|
| 1 | Créer / obtenir le script YAML | `python cli.py new short-06 --pillar D` (ou coller un YAML écrit avec Claude) |
| 2 | Compléter le texte, les cartes, les claims | éditer `scripts\short-06.yaml` |
| 3 | Vérifier le script | `python cli.py lint short-06` |
| 4 | Test rapide sans API (voix muette) | `python cli.py build short-06 --dry` |
| 5 | Voir une planche des 4 blocs | `python cli.py preview short-06` |
| 6 | Vrai rendu (voix + alignement + musique) | `python cli.py build short-06` |
| 7 | **Regarder sur téléphone, son activé** | ouvrir `build\short-06\out.mp4` |
| 8 | Sourcer les claims, `status: approved` | éditer le YAML puis `python cli.py lint --publish short-06` |

---

## 4. Toutes les commandes — et pourquoi

### `fetch-assets` — récupérer polices et mascotte
`python cli.py fetch-assets`
**Pourquoi :** les polices (Montserrat, Inter) et les 23 poses de la mascotte ne sont pas dans git (trop lourds, et la
mascotte vit déjà sur Supabase Storage). À lancer **une fois** après l'installation, ou si un dossier `assets\` a été vidé.

### `lint` — contrôler les scripts
`python cli.py lint` · `python cli.py lint short-03` · `python cli.py lint --quiet` · `python cli.py lint --publish`
**Pourquoi :** attraper les erreurs avant de payer un appel API.
Vérifie : durée estimée trop longue, CTA parlé (interdit en Short), formule de hook identique à la vidéo précédente,
ordre de la mascotte, texte « À REMPLACER » oublié, cartes pas encore implémentées.
- `--quiet` : masque les simples rappels (« · »).
- `--publish` : règles strictes avant mise en ligne → toutes les claims vérifiées **et** sourcées, carte sans données
  provisoires (`draft`), `status: approved`. Tant qu'une erreur reste, la vidéo n'est pas publiable.

### `list` — vue d'ensemble
`python cli.py list`
**Pourquoi :** voir en un coup d'œil chaque script : statut, pilier, formule de hook, durée estimée, claims vérifiées,
et si une vidéo a déjà été générée.

### `new` — créer un squelette de script
`python cli.py new short-06 --pillar D [--formula stakes] [--product examen_civique]`
**Pourquoi :** démarrer avec la bonne structure (4 blocs, champs commentés). Piliers : A produit TEF · B actu ·
C méthode · D civique · E FLE · F comparatif. Le fichier contient des « À REMPLACER » : `lint` refuse tant qu'il en reste.

### `fetch-question` — chercher de vraies questions civiques
`python cli.py fetch-question contravention [--limit 10]`
**Pourquoi :** les cartes « question » doivent reprendre de **vraies** questions de la base (`civic_questions`,
uniquement `reviewed = true`). La commande affiche les questions trouvées avec leur `id` ; copiez l'`id` dans
`card.data.question_id` du script. Au `build`, la carte est alors remplie depuis Supabase.

### `build` — fabriquer la vidéo
`python cli.py build short-03`
**Pourquoi :** exécute toute la chaîne (voix → alignement → carte/sous-titres → assemblage). Résultat : `build\short-03\out.mp4`.

| Option | Effet | Quand l'utiliser |
|---|---|---|
| `--dry` | **aucun appel API** : voix muette, timings estimés → `out.dry.mp4` | tester la mise en page, gratuit |
| `--until tts` | s'arrête après la voix (`voice.wav`) | écouter la voix avant de continuer |
| `--until asr` | s'arrête après la transcription (`words_asr.json`) | |
| `--until align` | s'arrête après l'alignement (`align_report.json`) | vérifier la couverture (≥ 90 %) |
| `--until timeline` | s'arrête avant l'assemblage ffmpeg | |
| `--proportional` | vrai TTS mais **sans ASR** : timings estimés | repli si l'alignement échoue |
| `--force` | refait TTS et ASR même si en cache (**payant**) | voix à regénérer sans changer le texte |
| `--no-bg` | fond noir uni au lieu du fond animé | rendu un peu plus rapide pour tester |
| `--placeholder-mascots` | silhouettes de test si les assets manquent | tests hors-ligne uniquement |

Le cache TTS se **réinvalide tout seul** si le texte, le modèle, la voix ou le style changent.

### `preview` — planche contact
`python cli.py preview short-03`
**Pourquoi :** produit `build\short-03\preview.jpg` (une image par bloc) pour valider la mise en page d'un coup d'œil sans
regarder la vidéo. À lancer **après** un `build`.

---

## 5. Où est quoi

```
llamakusi-video-pipeline/
├─ scripts/            ← les scripts YAML (un par vidéo)  ← ce que vous éditez
├─ assets/
│   ├─ music/          ← bed.mp3 (musique de fond)        ← vous y déposez la musique
│   ├─ mascot/  fonts/ ← téléchargés par fetch-assets
├─ build/<id>/         ← tout ce qui est généré (ignoré par git)
│   ├─ voice.wav  words_asr.json  words.json  align_report.json
│   ├─ timeline.json   ← qui apparaît quand
│   ├─ layers/         ← les PNG (cartes, sous-titres…)
│   ├─ background_*.mp4← fond animé
│   ├─ out.mp4  out.dry.mp4  preview.jpg
├─ pipeline/           ← le code (schema, lint, tts, asr, align, layers, background, timeline, assemble)
├─ tests/              ← `python -m pytest -q`
├─ .env                ← vos clés (JAMAIS dans git)
└─ cli.py              ← point d'entrée
```

`build\<id>\align_report.json` : couverture de l'alignement (1.0 = tous les mots datés). Si elle est < 0,9, le build s'arrête.

---

## 6. Réglages

### `.env` (vos clés et choix)
| Variable | Rôle |
|---|---|
| `GEMINI_API_KEY` | clé Google AI Studio (TTS + transcription) |
| `GEMINI_TTS_VOICE` | voix (ex. `Charon`) — changer de voix régénère la voix |
| `GEMINI_TTS_STYLE` | consigne de ton optionnelle (ex. « voix posée, chaleureuse ») |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | lecture des questions civiques (lues aussi dans `..\.env.local` de l'app) |
| `MUSIC_FILE` | chemin d'un fichier musique (sinon `assets\music\bed.*`) |
| `MUSIC_GAIN_DB` | niveau de la musique **sous la voix**, en dB (défaut **-14**) |

> ⚠ Si votre `.env` contient encore `MUSIC_GAIN_DB=-20` (copié de l'ancien `.env.example`), **supprimez la ligne ou mettez -14**.
> Plus le nombre est proche de 0, plus la musique est forte : `-10` fort · `-14` défaut · `-18` discret.

### `pipeline\config.py` (mise en page et look)
- `LAYOUT` : positions verticales (logo, badge, carte, sous-titres, mascotte, CTA). Tout est centré sur x = 540.
- `BG_PALETTES` : couleurs et intensité des halos du fond animé (une palette par accent : `indigo`, `blue`, `gold`).
  Pour un fond plus discret, baisser les intensités (2ᵉ valeur de chaque ligne) ; plus présent, les augmenter.
- `MASCOT_MOOD` : correspondance des expressions (`heureux` → `neutre`, car le repo n'a pas de « heureux »).
- `SPEECH_WPS` : mots par seconde (mesuré), sert seulement à estimer la durée avant de payer le TTS.

---

## 7. Format d'un script (`scripts\<id>.yaml`)

Un Short = 4 blocs **dans cet ordre** : `hook`, `build`, `payoff`, `loop`.

| Champ du bloc | Rôle |
|---|---|
| `voice` | texte dit **et** affiché en sous-titres |
| `mascot` | `perplexe` · `reflechit` · `victorieux` · `heureux` |
| `overlay` | gros badge doré en haut (ex. `"2026"`, `"B1 → B2"`) |
| `card` | carte à afficher (`question` et `compare` sont prêtes ; les autres sont des placeholders) |
| `card_from` | réutilise la carte d'un bloc précédent (ex. `hook`) |
| `card_state` | `plain` ou `revealed` (allume la bonne réponse / les lignes clés) |
| `cta_overlay` | petit texte discret ; en Short, `Lien en bio` sur le dernier bloc. **Jamais parlé.** |
| `tts_text` | prononciation forcée (TTS seulement, sans changer les sous-titres) |

En tête de fichier : `pillar`, `product`, `hook_formula`, `accent` (`indigo` TEF · `blue` civique · `gold`), `title`, et
`claims:` (chaque affirmation factuelle avec `source_hint`, puis `source_url` + `verified: true` une fois vérifiée).

---

## 8. Dépannage

| Symptôme | Cause probable | Action |
|---|---|---|
| `ffmpeg` introuvable | environnement non activé | `conda activate llamakusi_pipeline_youtube` |
| `UnicodeEncodeError` | UTF-8 non actif | `conda env config vars set PYTHONUTF8=1`, puis réactiver l'env |
| `polices absentes` / `mascotte absente` | assets non téléchargés | `python cli.py fetch-assets` |
| `alignement insuffisant (<90 %)` | ASR a mal compris la voix | réécouter `voice.wav`, sinon `build … --proportional` |
| Musique trop faible / trop forte | gain | `MUSIC_GAIN_DB` dans `.env` |
| Pas de musique | fichier absent | déposer `assets\music\bed.mp3` (ou `MUSIC_FILE`) |
| `preview.jpg` introuvable | `preview` pas lancé | `python cli.py preview <id>` après un build |
| Erreur 403/429 Gemini | quota / facturation | vérifier le projet dans AI Studio |
| `pip install` a changé | nouvelle dépendance (numpy) | `pip install -r requirements.txt` |

---

## 9. Ce qui n'existe pas encore

- Génération automatique des scripts (section 2).
- Cartes `text_annotated`, `terms`, `plan` (Shorts 1 et 4, vidéo longue) : rendues en placeholder.
- Upload YouTube (en privé), sous-titres multilingues, vidéo longue 16:9.
- Baisse automatique de la musique quand la voix parle (« ducking ») : aujourd'hui un niveau fixe.
