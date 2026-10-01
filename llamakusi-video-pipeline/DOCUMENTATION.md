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
| `--background <fichier>` | **fond vidéo personnalisé** (voir § ci-dessous) ; prioritaire sur `background:` du script | tes propres fonds |
| `--placeholder-mascots` | silhouettes de test si les assets manquent | tests hors-ligne uniquement |

Le cache TTS se **réinvalide tout seul** si le texte, le modèle, la voix ou le style changent.

### `subs` — sous-titres `.srt` multilingues

```
python cli.py subs long-01                      # français + ar, en, es, zh-Hans (défaut des vidéos LONGUES)
python cli.py subs short-03                     # français seul (défaut des Shorts : pas de traduction)
python cli.py subs short-03 --langs ar,en       # forcer des langues sur un Short
python cli.py subs long-01 --dry                # traduction factice « [ar] texte », sans réseau
python cli.py subs long-01 --force              # ignore le cache (nouvel appel Gemini payant)
```

Prérequis : avoir lancé `build <id>` (le texte et les timings viennent de `build/<id>/words.json`). Sortie : `build/<id>/subs.fr.srt`
(toujours) et `subs.<langue>.srt`. Les cues suivent les **phrases** (pas les groupes karaoké de l'image) ; les timings sont ceux
du français ; **un seul appel Gemini par langue** (contexte complet), mis en cache dans `build/<id>/translation.<langue>.json`
(relancer ne coûte rien tant que le texte ne change pas). Les mots français enseignés restent en français, suivis de leur traduction.

Envoi : YouTube Studio → *Sous-titres* → *Ajouter une langue* → *Importer un fichier* → **avec minutage**. Codes YouTube : `ar`, `en`, `es`,
`zh-Hans` (chinois simplifié). Un `.srt` français est aussi produit : YouTube indexe les pistes de sous-titres (bon pour le SEO).

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
| `TAIL_SECONDS` | silence final après le dernier mot, en secondes (défaut **0.7**) |
| `SEG_MAX_WORDS` | vidéo longue : taille maximale d'un segment de voix, en mots (défaut **150**, ~47 s) |
| `GEMINI_TRANSLATE_MODEL` | modèle texte pour les traductions `.srt` (défaut `gemini-3.8-flash`) |
| `SUB_LANGS_LONG` / `SUB_LANGS_SHORT` | langues `.srt` par défaut (défaut : `ar,en,es,zh-Hans` / **aucune**) |

> ⚠ Si votre `.env` contient encore `MUSIC_GAIN_DB=-20` (copié de l'ancien `.env.example`), **supprimez la ligne ou mettez -14**.
> Plus le nombre est proche de 0, plus la musique est forte : `-10` fort · `-14` défaut · `-18` discret.

### `pipeline\config.py` (mise en page et look)
- `PROFILES` : **un profil de mise en page par format** (`short` 1080×1920 centré sur x = 540 ; `long` 1920×1080, cartes à gauche, mascotte à droite). `LAYOUT` (positions du logo, badge, carte, sous-titres, mascotte, CTA) est le profil actif ; on règle les positions dans `PROFILES[...]["layout"]`. Le format du script (`format: short|long`) choisit le profil automatiquement.
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
| `card` | carte à afficher (`question`, `compare`, `terms`, `text_annotated`, `plan` sont prêtes) |
| `card_from` | réutilise la carte d'un bloc précédent (ex. `hook`) |
| `card_state` | `plain` (défaut) · `revealed` (allume la bonne réponse / dévoile tout) · `initial` (retour visuel à l'accroche) |
| `background` | fond vidéo personnalisé (nom dans `assets/backgrounds/` ou chemin) ; défaut : fond animé généré |
| `cta_overlay` | petit texte discret ; en Short, `Lien en bio` sur le dernier bloc. **Jamais parlé.** |
| `tts_text` | prononciation forcée (TTS seulement, sans changer les sous-titres) |

En tête de fichier : `pillar`, `product`, `hook_formula`, `accent` (`indigo` TEF · `blue` civique · `gold`), `title`, et
`claims:` (chaque affirmation factuelle avec `source_hint`, puis `source_url` + `verified: true` une fois vérifiée).

---

### Fond vidéo personnalisé

Au lieu du fond animé généré, tu peux fournir **ta propre vidéo de fond** : déposer le fichier dans `assets/backgrounds/` (non versionné), puis soit
`python cli.py build short-03 --background mon-fond.mp4`, soit `background: mon-fond.mp4` dans le script (le lint vérifie que le fichier existe ;
un chemin absolu marche aussi). Le son du fond est ignoré.

| Situation | Comportement |
|---|---|
| fond **plus court** que la vidéo, mêmes dimensions | lu **en avant puis en arrière (boomerang)**, répété jusqu'à la fin ; raccords sans temps d'arrêt |
| fond **assez long**, mêmes dimensions | utilisé tel quel, coupé à la durée de la vidéo |
| dimensions **différentes** | recadrage centré (« cover ») avec avertissement ; pour un rendu net, fournir 1080×1920 (Short) ou 1920×1080 (Long) |

Le fond préparé est mis en cache dans `build/<id>/` (`bg_pingpong_*.mp4`) : il ne dépend pas de la durée cible, donc il est réutilisé d'un script à l'autre.
Coût temporaire à la première préparation : le fond est décodé sur disque (~3 Mo par image en 1080×1920, soit ~1 Go pour 10 s), puis supprimé ; un message
clair s'affiche s'il manque de la place. Conseil de création : un mouvement lent et peu contrasté (les cartes et les sous-titres doivent rester lisibles) ;
un fond dont la première et la dernière image sont proches n'a pas besoin d'être « bouclable » : le boomerang s'en charge.
**Si tu avais remplacé à la main `build/<id>/background_*.mp4`, utilise désormais cette option** (ce fichier est prévu pour le fond généré).

### Format long 16:9 (état : L1 mise en page + L2 voix par segments + L3 plan/chapitres/lint livrés)

`format: long` dans le script → profil 1920×1080 : logo en haut à gauche, carte dans la colonne gauche (x 96-1216), sous-titres karaoké sous la carte,
mascotte dans la colonne droite. Pas de flèche ni de CTA incrusté en long (le CTA est parlé, une seule fois, à la fin). Le fond animé n'est calculé que
sur **30 s** puis répété (`BG_LOOP_S`) ; la musique boucle déjà.

- `scripts/long-02.yaml` = **démo technique** (les 5 cartes enchaînées, ~108 s, avec chapitres) pour contrôler la mise en page : `python cli.py build long-02 --dry --placeholder-mascots`
  puis `python cli.py preview long-02` (planche en grille 3 colonnes). Elle ne sera pas publiée.
- Le cache des calques PNG (`build/<id>/layers`) est **vidé automatiquement** quand `layers.py`, `textutil.py` ou le profil changent : plus de suppression manuelle.
- **Temps de rendu mesuré (sandbox, ffmpeg 6, preset `veryfast`, `--dry`)** : ~8 min pour 97 s de vidéo, soit ~5× la durée. Une vidéo de 6 min demandera donc
  beaucoup plus (plusieurs dizaines de minutes) : à confirmer sur ta machine ; voir la piste d'optimisation dans la stratégie.
- **Voix par segments (L2)** : pour `format: long`, `build` fait un appel TTS **et** un appel ASR par segment (= un bloc ; un bloc de plus de
  `SEG_MAX_WORDS` mots, 150 par défaut, est coupé en fin de phrase). Chaque segment est mis en cache dans `build/<id>/voice_segments/` par empreinte de son
  texte (+ modèle, voix, style) : **corriger un bloc ne régénère et ne paie que ce bloc**. Les segments sont assemblés avec une respiration de 0,35 s entre blocs
  (0,15 s entre deux morceaux d'un même bloc), niveaux recalés (± 6 dB max) et fondus de 5 ms aux raccords ; les timings de chaque segment sont alignés puis décalés.
  `build/<id>/voice_segments.json` liste les segments (début, fin, mots, clé, `cached`). `--force` refait **tous** les segments (payant) ; pour un seul bloc,
  modifier son texte suffit. Les Shorts gardent leur appel unique. Si l'alignement échoue (< 90 %), c'est le segment fautif qu'il faut écouter.
  Limite : les segments sont synthétisés l'un après l'autre (pas en parallèle) ; un bloc avec `tts_text` n'est jamais coupé (le lint prévient s'il dépasse `SEG_MAX_WORDS`).
- **Carte `plan` (L3)** : étapes numérotées reliées par un fil, qui apparaissent une à une sur un mot prononcé (mêmes règles que `terms` : `at:`, sinon le titre ;
  `card_state: plain | revealed | initial`). Données : `items: [{title, detail?, at?}]`, 6 étapes maximum. Étapes pas encore annoncées = cases « … ».
  Exemple dans `scripts/long-02.yaml` (bloc `intro`). Usage type : un bloc `setup` qui annonce le plan, puis `card_state: revealed` pour le rappeler.
- **Chapitres (L3)** : `chapter: "Titre"` sur un bloc **ouvre** un chapitre (il dure jusqu'au prochain). Effet : titre « CHAPITRE n » en haut à droite de l'image,
  et `build/<id>/chapters.txt` (lignes `m:ss Titre`, à coller dans la description YouTube). Règles YouTube contrôlées par le lint et à l'export : 1er chapitre à 0:00
  (donc `chapter:` sur le premier bloc), 3 chapitres minimum, 10 s minimum chacun (règles rappelées de mémoire : à confirmer dans l'aide YouTube).
  Le dernier chapitre va jusqu'à la fin ; ne pas ouvrir de chapitre sur un bloc final très court (le CTA).
- **Lint des longs (L3)** : durée estimée 4-8 min (600-1200 mots) ; bloc `rehook*` attendu dès ~2 min 30 ; **un seul** CTA parlé, dans le dernier bloc ;
  titres de chapitres ≤ 48 caractères et uniques ; `overlay` déconseillé. `long-02` (démo de ~100 s) garde donc 1 avertissement de durée : c'est normal.
- Ce qui reste (hors MVP) : optimisation du temps de rendu, miniature générée, barre de progression, plan « fil rouge » avec étape courante mise en évidence.

### Règle de boucle (Shorts) — obligatoire

Sur YouTube, Facebook, etc., un Short est **construit en boucle** : la fin doit se raccorder au début pour que la vidéo
redémarre sans que le spectateur s'en rende compte (temps de visionnage moyen artificiellement doublé, très bien vu des
algorithmes). Le `lint` vérifie ce qui est automatisable ; le raccord de phrase reste à valider **à l'oreille**.

| Règle | Contrôle |
|---|---|
| Le bloc `loop` reprend la carte du `hook` (`card_from: hook`, pas de `card` propre) | erreur de lint |
| Carte progressive (`terms`, `text_annotated`) → `card_state: initial` sur `loop` | erreur de lint |
| Carte non progressive → `card_state: plain` sur `loop` | avertissement |
| Même `overlay` (ou aucun) sur `hook` et `loop` | avertissement |
| **Dernière phrase suspendue** : finit par `…` `:` `—` `,` (pas de point final) | avertissement |
| Mascotte du `loop` ≠ celle du `hook` | rappel (compromis assumé, voir ci-dessous) |
| La dernière phrase se raccorde-t-elle à la première ? | **à l'oreille** : lire `loop` puis `hook` à la suite |

Écriture : la dernière phrase reste en suspens et la première la complète, ou du moins la relance sans « salut ».
Exemple : `… sans jamais l'avoir apprise…` → `Il y a une raison qui bloque 9 candidats…`.

**Pas de CTA parlé** : dire « lien en bio » à voix haute casserait le raccord. Le CTA est visuel : pill « Lien en bio » +
**flèche animée** (`cta_arrow: true` par défaut, désactivable par script).

**Silence final** : `TAIL_SECONDS` (défaut 0,7 s, `.env` ou `config.py`) laisse un peu de vide après le dernier mot : la carte, la
mascotte, le fond et le CTA sont prolongés, la musique continue puis s'estompe (`MUSIC_FADE_S`, 0,8 s). Plus le silence est long, plus le
redémarrage de la boucle est retardé : rester entre 0,5 et 1 s.

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


### Cartes à apparition progressive : `terms` et `text_annotated`

Ces cartes dévoilent leurs éléments **un par un pendant la voix**. Chaque élément est déclenché par un **mot
d'ancrage** : il apparaît à l'instant où la voix le prononce (timings réels de l'ASR). Les éléments sont listés
**dans l'ordre où la voix les nomme**.

```yaml
# terms : N lignes « terme + définition » (cases « ? » tant que non dévoilées)
card:
  kind: terms
  data:
    label: Vocabulaire · Préfecture
    items:
    - term: Récépissé
      definition: Papier provisoire qui prouve que ta demande est en cours
      at: récépissé          # optionnel : mot de la voix qui déclenche (défaut : 1er mot de `term`)

# text_annotated : un texte d'exemple, d'abord DÉSORDONNÉ, puis RÉORGANISÉ en blocs colorés
card:
  kind: text_annotated
  data:
    label: Exemple · Faut-il limiter les écrans ?
    shuffled: [2, 0, 3, 1]   # ordre d'affichage avant réorganisation (défaut : ordre inverse)
    parts:                   # ordre LOGIQUE (= ordre dans lequel la voix les nomme)
    - role: intro            # intro | argument | conclusion  (couleur de l'étiquette)
      label: Intro           # texte de la pastille (défaut : le rôle)
      at: intro              # mot de la voix qui fait apparaître la pastille (défaut : label, puis rôle)
      text: Aujourd'hui, les enfants passent beaucoup de temps devant les écrans.
```

Cycle typique d'un Short (la carte est définie dans `hook`, les autres blocs font `card_from: hook`) :

| Bloc | `card_state` | Ce qu'on voit |
|---|---|---|
| `hook` | `plain` | tout masqué (`terms` : cases « ? ») / texte désordonné sans étiquette |
| `build` | `plain` | un élément apparaît à chaque mot d'ancrage (le dernier apparu est mis en évidence) |
| `payoff` | `revealed` | tout dévoilé (`text_annotated` : texte réordonné, blocs colorés) |
| `loop` | `initial` (ou `plain`) | `initial` = retour à l'état de l'accroche ; `plain` = tout reste dévoilé, sans mise en évidence |

Règles d'ancrage :
- `at` accepte le pluriel (`argument` ↔ `arguments`) et `mot#2` pour « 2e occurrence du mot » (après l'ancre
  précédente). Utile si le mot est déjà prononcé plus tôt (dans le hook, par exemple).
- Une ancre introuvable est signalée **par `lint`, avant tout appel TTS** (erreur bloquante).
- Limites de lisibilité (`lint` avertit au-delà) : 4 lignes pour `terms`, 5 parties pour `text_annotated`.
- La bascule « désordonné → réorganisé » est une coupe franche (pas d'animation) : voir §9.

---

## 9. Ce qui n'existe pas encore

- Génération automatique des scripts (section 2).
- Transition animée pour la réorganisation de `text_annotated` (aujourd'hui : coupe franche).
- Upload YouTube (en privé).
- Boucle visuelle complète : la mascotte finit `heureux` alors que le hook commence `perplexe` (coupe visible).
- Baisse automatique de la musique quand la voix parle (« ducking ») : aujourd'hui un niveau fixe.
