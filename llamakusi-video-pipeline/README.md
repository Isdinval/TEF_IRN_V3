# llamakusi-video-pipeline

> **Toutes les commandes, leur rôle et le workflow : voir [DOCUMENTATION.md](DOCUMENTATION.md).**

Pipeline de création des vidéos de la chaîne **La Naturalisation avec LlamaKusi** (Shorts 9:16 d'abord).
Sous-dossier autonome de `TEF_IRN_V3` : Python, aucune dépendance avec l'app Next.js.

```
scripts/*.yaml ──lint──▶ TTS (1 appel) ──▶ ASR mots ──▶ alignement ──▶ timeline.json + PNG ──▶ ffmpeg ──▶ out.mp4
   (GATE 1)                Gemini             Gemini      texte=script      calques Pillow        1 commande      (GATE 2 : téléphone)
                                                          timing=ASR
```

## Démarrage

```bash
cd llamakusi-video-pipeline
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt            # + ffmpeg installé sur la machine
cp .env.example .env                        # GEMINI_API_KEY, GEMINI_TTS_VOICE (voix du site), SUPABASE_ANON_KEY
python cli.py fetch-assets                  # polices (Google Fonts) + mascotte (Supabase Storage)
python cli.py lint --quiet                  # contrôle des scripts
python cli.py build short-03 --dry          # rendu SANS API : voix muette, timings estimés
python cli.py preview short-03              # planche contact build/short-03/preview.jpg
python cli.py build short-03                # vrai run : TTS → ASR → alignement → rendu
python -m pytest -q                         # tests
```

Fond : déposer `assets/backgrounds/short-loop-01.mp4`, `-02.mp4`… et `long-loop-01.mp4`… (boucles en rotation, voir DOCUMENTATION.md). Absents → halos générés.
Musique : déposer `assets/music/bed.wav` (30 s, générée avec le prompt de la stratégie). Absente → voix seule.

## Aide-mémoire : routine de la semaine

```bash
python cli.py list                          # état de tous les scripts (draft / approved, vidéo générée ou non)
python cli.py lint --publish                # GATE 1 : claims sourcées, status approved
python cli.py approve                       # GATE 1 : approuve les drafts déjà propres en lint --publish (`approve <id> --force` pour forcer un cas précis)
python cli.py week --dry                    # essai SANS API de toutes les vidéos du lot
python cli.py week                          # génère TOUTES les vidéos `approved` pas encore faites (Shorts puis Long en dernier ; ids possibles : week short-01 long-01)
python cli.py studio --all                  # build/<id>/studio.txt : titre, date de publication prévue, description, tags, playlist, vidéo associée, commentaire à épingler
python cli.py thumbnail --all               # miniatures de tout le lot (build/<id>/thumbnail.jpg)
```
Puis, pour chaque vidéo, dans YouTube Studio : envoyer `out.mp4` + miniature, copier `studio.txt` (titre, description, tags), ajouter à la playlist indiquée,
régler la « Vidéo associée » (Short → long), publier/programmer, puis poster et épingler le commentaire. Fichiers dans `build/<id>/`.

## Aide-mémoire : toutes les commandes

| Besoin | Commande |
|---|---|
| Préparer (une fois) | `python cli.py fetch-assets` · `python cli.py publish-auth youtube` |
| Nouveau script | `python cli.py new short-06 --pillar D [--product …] [--formula …]` |
| Contrôler | `python cli.py lint [--publish] [--quiet] [ids…]` |
| Approuver (GATE 1) | `python cli.py approve [ids…] [--force]` (sans id : approuve les drafts déjà sans erreur `lint --publish`) |
| Une vidéo, sans API | `python cli.py build <id> --dry` (voix muette) · `--no-bg` (fond noir, plus rapide) |
| Une vidéo, pour de vrai | `python cli.py build <id>` (TTS → ASR → alignement → rendu) |
| Aperçu | `python cli.py preview <id>` (planche contact `preview.jpg`) |
| Tout le lot | `python cli.py week [--dry] [--force] [ids…]` |
| Textes Studio | `python cli.py studio <id…>` ou `--all` |
| Miniatures | `python cli.py thumbnail <id…>` ou `--all` |
| Sous-titres | `python cli.py subs <id> [--langs ar,en] [--dry] [--force]` |
| Dossier d'envoi manuel | `python cli.py pack <id>` |
| Publication directe | `python cli.py publish <id> --dry` puis `--confirm-public` (`--platforms youtube,facebook,instagram`, `--force` = doublon) |
| Vraies questions civiques | `python cli.py fetch-question <mot> [--limit 10]` |
| Tests | `python -m pytest -q` |

Champs `publish:` utiles dans un script : `keyword`, `answer`, `description`, `guide`, `tags`, `hashtags`, `playlist` (`start|tef|civique|regles|prefecture`, sinon selon le pilier),
`related` (Short → id du long à lier), `pinned_question` (sinon une question par pilier).

## Options de `build`

| Commande | Effet |
|---|---|
| `build <id> --until tts\|asr\|align\|timeline\|render` | s'arrête après l'étape (cache par étape) |
| `build <id> --proportional` | vrai TTS, timings estimés (pas d'ASR) : repli si l'alignement échoue |
| `build <id> --force` | ignore le cache TTS/ASR (le cache est invalidé seul si le texte/la voix change) |
| `build <id> --placeholder-mascots` | silhouettes de test si les assets sont absents |
| `lint --publish` | règles de publication : claims reprises d'un guide publié (`source_guide`), cartes non `draft`, `status: approved` |
| `fetch-question <mot>` | liste de vraies questions de `civic_questions` (`reviewed = true`) |

## Contrat de script (`scripts/<id>.yaml`)

Un Short = 4 blocs `hook / build / payoff / loop`. Par bloc : `voice`, `mascot` (`perplexe|reflechit|victorieux|heureux`),
`overlay` (gros badge doré), `card` ou `card_from` (réutilise la carte d'un bloc précédent), `card_state` (`plain|revealed`).
`claims[]` = affirmations factuelles, chacune reprise d'un guide publié (`source_guide: <slug>`, vérifié par `lint --publish`). Le CTA n'est **jamais parlé** :
`cta_overlay` est un petit texte sur le dernier bloc.

## État (au 23/11/2026)

- ✅ Livré : Shorts 9:16 (boucle, CTA animé), cartes `question`, `compare`, `terms`, `text_annotated`, `plan`,
  format long 16:9 (L1 mise en page, L2 voix par segments en cache, L3 chapitres + `chapters.txt` + lint des longs),
  sous-titres `.srt` multilingues (`subs`), fond vidéo personnalisé (`--background`, boucle boomerang),
  commande `approve` (GATE 1), date de publication auto-calculée dans `studio.txt` (lot : Shorts puis Long en dernier).
- ✅ Testé hors-ligne : schéma, lint, alignement (bruit ASR simulé), karaoké, timeline, rendu ffmpeg en `--dry`.
- ✅ Premier run réel TTS + ASR effectué (lot 2026-S48 : 5 Shorts + 1 long rendus pour de vrai sur la machine d'Olivier).
- ⚠ Contenu : 14 scripts en `status: draft` ; `long-03` et `short-06` à `short-10` ont toutes leurs claims sourcées
  (`source_guide`) et `trailer-01` n'en a aucune — tous restent à passer `approved` (`python cli.py approve`) ;
  aucune vidéo encore publiable (`lint --publish`).

## Hypothèses à confirmer

- `heureux` → mascotte **`neutre`** (le repo n'a pas d'expression « heureux »). Changer dans `config.MASCOT_MOOD`.
- Voix : `Kore` par défaut → mettre celle utilisée sur le site dans `.env`.
- `SPEECH_WPS = 2.7` (mots/s) sert uniquement à estimer la durée avant TTS.
- Sous-titres karaoké en **Montserrat ExtraBold** (lisibilité) au lieu d'Inter Medium : à trancher (`layers.render_subs`).
- Clé Supabase : `SUPABASE_SERVICE_ROLE_KEY`, sinon `SUPABASE_ANON_KEY` (lecture seule, filtre `reviewed = true` toujours appliqué).

## Prochaines tâches

Voir `DOCUMENTATION.md` § 9 (ce qui n'existe pas encore). En tête : génération de scripts sourcés. Publication : `python cli.py publish <id> --dry` (voir DOCUMENTATION.md).
