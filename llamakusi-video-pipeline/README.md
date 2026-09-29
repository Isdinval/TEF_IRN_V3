# llamakusi-video-pipeline

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
python -m pytest -q                         # 16 tests
```

Musique : déposer `assets/music/bed.wav` (30 s, générée avec le prompt de la stratégie). Absente → voix seule.

## Commandes utiles

| Commande | Effet |
|---|---|
| `build <id> --until tts\|asr\|align\|timeline\|render` | s'arrête après l'étape (cache par étape) |
| `build <id> --proportional` | vrai TTS, timings estimés (pas d'ASR) : repli si l'alignement échoue |
| `build <id> --force` | ignore le cache TTS/ASR (le cache est invalidé seul si le texte/la voix change) |
| `build <id> --placeholder-mascots` | silhouettes de test si les assets sont absents |
| `lint --publish` | règles de publication : claims sourcées + vérifiées, cartes non `draft`, `status: approved` |
| `fetch-question <mot>` | liste de vraies questions de `civic_questions` (`reviewed = true`) |

## Contrat de script (`scripts/<id>.yaml`)

Un Short = 4 blocs `hook / build / payoff / loop`. Par bloc : `voice`, `mascot` (`perplexe|reflechit|victorieux|heureux`),
`overlay` (gros badge doré), `card` ou `card_from` (réutilise la carte d'un bloc précédent), `card_state` (`plain|revealed`).
`claims[]` = affirmations factuelles à sourcer (bloquent `lint --publish`). Le CTA n'est **jamais parlé** :
`cta_overlay` est un petit texte sur le dernier bloc.

## Ce qui est testé / non testé (au 29/09/2026)

- ✅ Testé hors-ligne : schéma, lint, alignement (bruit ASR simulé), groupes karaoké, timeline, rendu ffmpeg complet en `--dry`.
- ⚠ **Non testé (pas d'accès réseau à la conception)** : appels TTS et ASR réels, téléchargement des assets, lecture Supabase.
  Le code suit les pages Google « Text-to-speech generation » et « Audio transcription » (API *Interactions*) du 29/09/2026.
  Le **premier run réel = le spike T1** : contrôler `build/<id>/align_report.json` et écouter `voice.wav`.

## Hypothèses à confirmer

- `heureux` → mascotte **`neutre`** (le repo n'a pas d'expression « heureux »). Changer dans `config.MASCOT_MOOD`.
- Voix : `Kore` par défaut → mettre celle utilisée sur le site dans `.env`.
- `SPEECH_WPS = 2.7` (mots/s) sert uniquement à estimer la durée avant TTS.
- Sous-titres karaoké en **Montserrat ExtraBold** (lisibilité) au lieu d'Inter Medium : à trancher (`layers.render_subs`).
- Cartes `compare`, `text_annotated`, `terms`, `plan` : **placeholder** (seule `question` est réelle).

## Prochaines tâches

1. Premier run réel Short 3 + spike alignement (T1) · 2. carte `compare` (Shorts 2 et 5) · 3. cartes `text_annotated` / `terms`
4. upload YouTube en privé · 5. sous-titres multilingues (`captions.insert`) · 6. vidéo longue (16:9).
