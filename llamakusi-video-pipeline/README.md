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

## Commandes utiles

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

## État (au 01/10/2026)

- ✅ Livré : Shorts 9:16 (boucle, CTA animé), cartes `question`, `compare`, `terms`, `text_annotated`, `plan`,
  format long 16:9 (L1 mise en page, L2 voix par segments en cache, L3 chapitres + `chapters.txt` + lint des longs),
  sous-titres `.srt` multilingues (`subs`), fond vidéo personnalisé (`--background`, boucle boomerang).
- ✅ Testé hors-ligne : schéma, lint, alignement (bruit ASR simulé), karaoké, timeline, rendu ffmpeg en `--dry`.
- ⚠ Premier run réel TTS + ASR (spike T1) : à confirmer — contrôler `build/<id>/align_report.json` et écouter `voice.wav`.
- ⚠ Contenu : 7 scripts en `status: draft`, aucune claim vérifiée → aucune vidéo publiable (`lint --publish`).

## Hypothèses à confirmer

- `heureux` → mascotte **`neutre`** (le repo n'a pas d'expression « heureux »). Changer dans `config.MASCOT_MOOD`.
- Voix : `Kore` par défaut → mettre celle utilisée sur le site dans `.env`.
- `SPEECH_WPS = 2.7` (mots/s) sert uniquement à estimer la durée avant TTS.
- Sous-titres karaoké en **Montserrat ExtraBold** (lisibilité) au lieu d'Inter Medium : à trancher (`layers.render_subs`).
- Clé Supabase : `SUPABASE_SERVICE_ROLE_KEY`, sinon `SUPABASE_ANON_KEY` (lecture seule, filtre `reviewed = true` toujours appliqué).

## Prochaines tâches

Voir `DOCUMENTATION.md` § 9 (ce qui n'existe pas encore). En tête : upload YouTube en privé, génération de scripts sourcés.
