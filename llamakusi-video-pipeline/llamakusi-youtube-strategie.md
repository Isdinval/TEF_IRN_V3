# LlamaKusi — Stratégie chaîne YouTube d'acquisition
**Statut : en cours de construction — document de référence évolutif**
**Dernière mise à jour : 28/09/2026**

---

## 1. Contexte produit

LlamaKusi opère deux produits, ciblant la même audience à des moments différents de leur parcours :

| Produit | Modèle | Rôle |
|---|---|---|
| **Examen Civique** | Gratuit / appel | Acquisition, premier contact |
| **TEF IRN / TCF IRN** | Payant | Monétisation |

**Spécificités produit identifiées (recherche publique) :**
- Examen Civique : QCM 40 questions, seuil de réussite 32/40, thèmes fixes (institutions, histoire, société, vie quotidienne)
- TEF/TCF IRN : 4 compétences, niveaux A2/B1/B2, **correction IA de l'écrit et de l'oral avec examinateur virtuel**, simulations chronométrées réalistes

**Hypothèse posée (non re-vérifiée) :** la différenciation du produit payant repose sur la correction IA personnalisée et le volume d'entraînement structuré — ce que le contenu YouTube gratuit ne peut pas reproduire. Cette hypothèse structure toute la logique anti-cannibalisation (section 6).

---

## 2. Problématique

Le besoin initial combine quatre objectifs qui ne sont pas naturellement alignés :

1. **Acquisition** — faire connaître LlamaKusi via du contenu externe
2. **Contrainte format** — chaîne sans visage, si possible automatisable
3. **Revenu secondaire** — monétisation YouTube propre (Adsense, sponsoring, affiliation)
4. **Choix de niche** — large (FLE) vs étroit (TEF IRN) vs mix

**Question centrale tranchée** : une chaîne optimisée pour les métriques YouTube (vues, CPM) n'est pas automatiquement optimisée pour convertir vers LlamaKusi. Toute décision ci-dessous priorise l'acquisition qualifiée sur le volume brut.

---

## 3. Données de marché 2026 (recherche web)

- **Réforme réglementaire clé** : depuis le 1er janvier 2026, le niveau exigé pour la naturalisation est passé de **B1 à B2** (décret du 15 juillet 2025). L'**examen civique** est devenu obligatoire à la même date pour carte pluriannuelle, carte de résident et naturalisation.
  → Choc de demande : examen significativement plus dur, recherche d'aide en hausse, fenêtre de 6-12 mois avant saturation concurrentielle du sujet.
- **CPM/RPM** : niche éducation/langues $8-20 RPM ; niche "apprentissage de langue" spécifiquement citée comme sous-exploitée (ex. podcasts d'anglais : $11.88 RPM, seulement ~10K chaînes concurrentes).
- **Sponsoring** : base éducation $20-40/vidéo ; ciblage très qualifié (candidats à la naturalisation) = levier de négociation à la hausse.
- **Faceless content** : format normal et accepté en 2026 (voix IA/humaine + visuels/slides), pas un hack. Attention : YouTube durcit sa politique sur le contenu "inauthentique/reproduit en masse" — variation structurelle et identité visuelle propre nécessaires pour rester du bon côté.
- **Concurrence** : le FLE généraliste est saturé (Français Authentique, Norman, FrenchPod101...). Le créneau spécifique "TEF/TCF IRN + naturalisation + examen civique" est quasi vide sur YouTube (traité par des organismes de formation et des blogs, pas par des chaînes dédiées).

---

## 4. Décision stratégique : niche "Mix en entonnoir"

| Option | Verdict |
|---|---|
| Large (FLE généraliste) | ❌ Marché saturé, ICP dilué, CPM tiré vers le bas |
| Étroit (TEF IRN uniquement) | ⚠️ ICP parfait mais plafond de vues bas en solo |
| **Mix (retenu)** | ✅ Positionnement de marque étroit et identifiable, contenu d'appel large en Shorts pour le volume, contenu long spécifique pour la conversion |

Positionnement : chaîne unique (pas deux chaînes séparées Examen Civique / TEF IRN), car c'est le même public au même moment de son parcours.

---

## 5. Identité de chaîne

- **Voix** : humaine (toi ou voix louée), pas de visage
- **Mascotte** : lama 2D
  - MVP : statique (logo, watermark, intro 2s, réactions pré-dessinées neutre/surpris/validé)
  - Amélioration : légères animations (rig simple, clignement/hochement)
  - Scalable : avatar parlant complet — seulement si le format est validé et justifie l'investissement

---

## 6. Piliers de contenu (A à F)

| Pilier | Contenu | Rôle funnel | Produit lié | Risque factuel | Automatisation |
|---|---|---|---|---|---|
| **A** | Pièges & idées reçues | TOFU | Les deux | Faible | Quasi totale |
| **B** | Actu réglementaire 2026 | TOFU/MOFU | Les deux | **Élevé** — sourcer obligatoirement | Encadrée |
| **C** | Méthodologie d'examen (écrit/oral B2) | MOFU — conversion | TEF IRN | **Élevé** | Encadrée |
| **D** | Culture générale civique | MOFU | Examen Civique | **Élevé** | Encadrée |
| **E** | Vocabulaire & situations administratives | TOFU | Pont FLE large sans diluer le positionnement | Faible | Quasi totale |
| **F** | FAQ pratique / comparatif démarches (TEF vs TCF, prix, délais) | MOFU fort — intention de recherche directe | Les deux | **Élevé** | Encadrée si bien sourcée (service-public.fr, textes officiels) |

**Règle de génération pour B/C/D/F** : le script doit citer sa source officielle (service-public.fr, textes de loi, formation-civique.interieur.gouv.fr), générée avec la source injectée en contexte — pas de mémoire du modèle seule. Une erreur factuelle sur un examen à enjeu réel (naturalisation) détruit la confiance sur exactement le point que LlamaKusi vend (fiabilité).

---

## 7. Anti-cannibalisation

**Règle non négociable, chaque vidéo** : concept + 1 exemple traité entièrement gratuitement → CTA vers une capacité que YouTube ne peut pas offrir (correction personnalisée IA, volume d'entraînement structuré, simulation chronométrée) — **jamais** vers "plus de contenu du même type".

---

## 8. Formats

**Shorts (piliers A, B, E, F)**
- Question à l'écran (2s) → tension → réponse + explication (15-25s) → CTA orale courte
- Screen-recording réel de l'app + réaction mascotte
- Sous-titres burn-in obligatoires

**Long 4-8 min (piliers C, D)**
- 1 problème concret → méthode complète utilisable → exemple traité dans l'app en démonstration → CTA
- Porte l'essentiel de la conversion — mérite le plus de soin éditorial

---

## 9. Cadence de publication

**Décision (révisée)** : **5 Shorts + 1 vidéo longue par semaine**, dès le lancement.
Justification utilisateur : présence et consistance = facteur n°1 de démarrage rapide d'une nouvelle chaîne, plus important que la qualité individuelle de chaque vidéo sur les 90 premiers jours.
Nuance posée : ce rythme n'est soutenable en automatisé que si le pipeline est fiable dès le départ (cf. section 11, Phase 0).

---

## 10. Monétisation — réalisme du calendrier

- **AdSense** : seuils = 1000 abonnés + 4000h de visionnage OU 10M vues Shorts/90 jours → compter 6-12 mois minimum sur une niche étroite. Ne pas construire le plan business dessus à court terme.
- **Sponsoring** (centres de formation FLE, cabinets immigration) : plus réaliste et plus rapide, dès quelques milliers d'abonnés qualifiés, grâce au ciblage très spécifique.
- **Funnel LlamaKusi** : objectif principal réel. La chaîne est un canal d'acquisition d'abord, un revenu bis ensuite — ne pas confondre les deux dans les KPIs de pilotage.

---

## 11. Risques identifiés

1. **Cannibalisation** — traité en section 7
2. **Dépendance réglementaire** — l'angle B2/2026 est un momentum, pas un socle permanent. Mitigation : piliers C et D (evergreen) = 50% du volume, pilier B (actu réglementaire) volontairement minoritaire.
3. **Charge de production sous-estimée** — mitigée par l'automatisation, mais voir Phase 0 (section 12) : ne pas automatiser un processus jamais fait manuellement.
4. **Politique YouTube "contenu inauthentique/mass-produced"** — mitigée par voix humaine cohérente, contenu réellement spécifique (vraies questions, vraie interface), identité visuelle propre (mascotte, template).
5. **Quota API YouTube Data v3** — 10 000 unités/jour par défaut, 1 600 unités/upload → ~6 uploads/jour max. Passe largement le rythme prévu (6 vidéos/semaine) mais laisse peu de marge pour du re-upload/test le même jour. Point de vigilance, non bloquant.

---

## 12. Méthodologie de mise en œuvre — validée

**Principe accepté** : *"Automatiser un processus que tu n'as jamais fait manuellement, c'est automatiser tes erreurs à grande échelle avant de savoir où elles sont."*

**Phase 0 (non négociable, validée)** : produire 5-8 vidéos à la main — l'utilisateur valide chaque étape en la faisant lui-même, pas en la relisant après coup. Objectif : figer le template visuel, le ton de script, le rythme des Shorts, avant d'écrire le moindre code de pipeline.

---

## 13. Architecture pipeline (proposée, à affiner après Phase 0)

**Approche envisagée par l'utilisateur** : un skill Claude contenant toute la pipeline Python de création vidéo, + un connecteur YouTube pour générer le draft. Très peu d'humain dans la boucle — uniquement validation du scénario et validation de la vidéo finale.

```
1. Génération script (Claude, skill dédié)
   → prompt structuré par pilier (A-F), sources officielles injectées pour B/C/D/F
   → sortie : script + liste des visuels nécessaires
   [GATE 1 — validation humaine du script]

2. Génération audio (TTS voix cohérente)

3. Assemblage vidéo (Python : moviepy/ffmpeg — pas de génération vidéo IA)
   → template pré-construit (fonds, zones de texte, emplacement mascotte)
   → screen-recordings de l'app (bibliothèque réutilisable)
   → sous-titres synchronisés (burn-in pour Shorts)
   → overlay mascotte statique (réactions pré-dessinées)

4. Upload YouTube en DRAFT (API YouTube Data v3, statut privé/non répertorié)
   [GATE 2 — validation humaine de la vidéo finale + décision de publication]
```

**MVP → Amélioration → Scalable**
- MVP : pipeline ci-dessus, une fois le template Phase 0 figé
- Amélioration (S4+) : bibliothèque de screen-recordings enrichie en continu, 2-3 variantes de template, scheduling automatique post-validation
- Scalable : A/B testing miniatures/titres, mascotte animée, génération multi-langue (l'app existe déjà en 6 langues)

---

## 14 bis. Système visuel vidéo (dérivé du design system app réel)

Source : `docs/product/design-system.md` du repo `Isdinval/TEF_IRN_V3`. La chaîne YouTube reprend le registre **landing/vitrine** de LlamaKusi (`brand-blue`/`brand-gold`, mode sombre), pas le design system applicatif interne (indigo/zinc, registre "outil").

**Hypothèse non vérifiée à confirmer** : valeurs hex exactes de `brand-blue`/`brand-gold` non trouvées publiquement — palette provisoire en attendant confirmation (indigo `#4F46E5`, doré `#C9A96E`-`#D4AF37`).

**Palette**
| Rôle | Couleur | Usage |
|---|---|---|
| Fond | `zinc-950` / noir chaud | Fond Shorts et longs |
| Accent TEF IRN | Indigo | Piliers B/C/F côté TEF IRN |
| Accent Examen Civique | Blue | Piliers B/D/F côté civique (hérite de la convention app) |
| Accent CTA | Doré | Mots-clés surlignés, CTA visuel |

**Typographie** : Montserrat Black/Bold (titres, accroches, mots-clés) + Inter Medium (sous-titres de narration) — aucune autre police, cohérent avec l'app.

**Sous-titres — règle généralisée (correction validée)** : burn-in obligatoire sur **tous les formats, Shorts ET vidéos longues**, format karaoké 2-3 mots synchronisés.

**Visuel "question d'examen" — décision clé (correction validée)** : **pas de screen-recording réel de l'app**. Remplacé par une **carte de question générée par code** (mini-page HTML/CSS stylée avec les tokens exacts du design system — `rounded-3xl`, couleurs, typo — rendue en image via Playwright/html2image). 100% automatisable, pas de bibliothèque à maintenir manuellement, évite aussi d'exposer l'UI de prod à un public externe.

**Mascotte lama** : asset déjà existant dans l'app (élément décoratif). 4 expressions disponibles (character sheets, 5 positions chacune) : heureux, perplexe, victorieux, réfléchit.

Mapping narratif sur la structure vidéo :
| Expression | Moment d'usage |
|---|---|
| Perplexe | Accroche (0-2s) |
| Réfléchit | Explication/méthode |
| Victorieux | Résolution/bonne réponse |
| Heureux | CTA final |

**Structure Shorts (9:16, 1080×1920, 15-30s)**
```
0-2s    Accroche texte (Montserrat Black, accent gold) + mascotte perplexe
2-4s    Carte de question générée (mockup programmatique)
4-20s   Narration + sous-titres burn-in + mascotte réfléchit
20-25s  Résolution, accent couleur produit + mascotte victorieux
25-30s  CTA + mascotte heureux
```
Zones de sécurité : rien d'important dans les 250px du bas ni les 200px de droite (UI YouTube).

**Structure longue (16:9, 1920×1080, 4-8 min)**
```
0-10s      Hook (problème concret)
10-30s     Contexte/enjeu
30s-5min   Méthode complète + carte(s) de question générée(s) en démonstration
Fin        CTA
```
Sous-titres burn-in sur toute la durée. Bandeau titre Montserrat, accent produit en coin haut gauche permanent.

**Miniatures (vidéos longues uniquement)** : fond sombre, mascotte expressive + texte court Montserrat Black gold sur fond indigo/blue selon produit, 4-5 mots max.

---

## 14 ter. Décisions complémentaires validées

- **Nom de chaîne** : `La Naturalisation avec LlamaKusi`
- **Voix** : Gemini TTS (déjà utilisé sur le site, cohérence app↔chaîne, différenciation vs voix ElevenLabs génériques omniprésentes sur YouTube en 2026). Fallback possible sur voix humaine si le rendu Phase 0 sonne trop "app" et pas assez "créateur".
- **Musique de fond** : générée via Gemini (test validé par l'utilisateur), prompt de référence :
  > *Instrumental background music only, no vocals, no lyrics. Warm, light, encouraging corporate-education mood — optimistic but understated, not epic or dramatic. Soft piano or marimba lead with subtle percussion, minimal bassline. Tempo around 90-100 BPM. Mixed to stay unobtrusive under spoken narration — avoid strong melodic hooks, avoid harsh high frequencies, avoid sudden dynamic swells. Seamlessly loopable, 30 seconds.*
- **Correction d'hypothèse** : l'app LlamaKusi est **en français uniquement** (hypothèse "6 langues" précédente invalidée — erreur d'attribution issue d'une app tierce trouvée en recherche, sans lien avec le produit réel).

### Stratégie de sous-titrage multilingue (architecture tranchée)

Décision clé pour éviter de multiplier les rendus vidéo par langue :

| Langue | Traitement | Pourquoi |
|---|---|---|
| **Français** | **Burn-in** (gravé dans l'image) | Majorité des vues en muet par défaut sur mobile, quel que soit le niveau du spectateur — doit rester visible sans action de sa part |
| **Toutes les autres** (arabe, dari/pachto, ukrainien, anglais, espagnol, chinois, etc. — liste ouverte) | **Pistes de sous-titres natives YouTube** (`.srt`/`.vtt` via API Data v3, `captions.insert`) | Le spectateur active la langue de son choix dans les paramètres CC. Un seul rendu vidéo, N fichiers texte légers — le coût marginal par langue supplémentaire est quasi nul (traduction + fichier texte, pas de nouveau rendu) |

**Priorisation basée sur les données de naturalisation 2025** (ministère de l'Intérieur) — Maroc 13 643, Algérie 11 551, Tunisie 6 978 (Maghreb = ~33% du total), Afghanistan 6 828, Ukraine 5 372 :
- Phase 0 / test pipeline : arabe, anglais, ukrainien (valider traduction + génération `.srt` + upload multi-pistes de bout en bout)
- Extension post-MVP : dari/pachto, espagnol, chinois, et toute langue pertinente — sans contrainte de charge de rendu grâce à l'architecture ci-dessus

---

## 13 bis. Décision finale pipeline : construire, pas acheter

**Clarification actée** : "skill Claude" n'est pas une alternative au pipeline Python — c'est sa couche d'orchestration. Le vrai choix était construire vs acheter un service SaaS (Revid, Argil, HeyGen, Opus.pro...).

**Décision : construire.** Aucun service du marché ne peut reproduire les contraintes déjà verrouillées (cartes fidèles au design system propriétaire, 4 expressions mascotte spécifiques, arc hook/build/payoff/loop précis, TTS+musique Gemini, sous-titres karaoké FR + pistes multilingues natives) sans compromis majeur. Le SaaS serait un pas en arrière, pas un raccourci.

**Ordre de construction retenu — priorité à l'incertitude technique, pas à l'ordre chronologique du pipeline** :
1. Sous-titres karaoké mot-à-mot — via `gemini-3.5-transcribe`, `timestamp_granularities: ["word"]`. **Confirmé disponible.** Réserve à tester : la doc Google indique que l'activation des timestamps au mot peut réduire la précision de la transcription ; les timestamps bruts nécessitent un regroupement en groupes de 2-3 mots côté client avant affichage (pas de sortie SRT native par phrase).
2. TTS Gemini — qualité déjà validée par l'utilisateur, prix réel au caractère à chiffrer pendant le build
3. Carte de question générée (Playwright/html2image — choix technique délégué au build)
4. Musique Gemini — validé
5. Assemblage complet (moviepy/ffmpeg) — un seul Short d'abord, pas les 6 en batch
6. Upload YouTube en draft (API Data v3)
7. Pistes de sous-titres multilingues (traduction + `.srt` + `captions.insert`)

**Garde-fou non négociable** : le premier Short assemblé de bout en bout par le pipeline doit être visionné en entier (sur téléphone) avant de générer le suivant — substitut au visionnage manuel de la Phase 0 originale, pour ne pas batcher des erreurs non détectées à l'échelle.

**Environnement de build** : Claude Code (accès réseau réel aux API Gemini/YouTube, exécution de fichiers) — pas cette conversation, qui n'a pas d'accès réseau sortant vers ces API.

---

## 14. Décisions en attente / prochaines étapes

- [ ] Réaliser les 5-8 vidéos manuelles de Phase 0
- [ ] Caler le template visuel exact (format Shorts, emplacement mascotte, style de sous-titres) — **prérequis avant le code d'assemblage vidéo**
- [ ] Construire le skill Claude + squelette Python (structure de dossiers, prompts de génération par pilier, intégration API YouTube)
- [ ] Définir le funnel de conversion précis YouTube → LlamaKusi
- [ ] Calendrier de contenu détaillé (4 premières semaines)

---

## 15. Hypothèses non vérifiées à surveiller

- Différenciation payant = correction IA écrit/oral (section 1) — à reconfirmer avec la roadmap produit réelle
- Fenêtre de 6-12 mois avant saturation concurrentielle sur l'angle "naturalisation B2 2026" — estimation, pas une donnée mesurée
- Rythme 5 Shorts + 1 long/semaine soutenable dès le lancement en automatisé — dépend entièrement de la fiabilité du pipeline validée en Phase 0
