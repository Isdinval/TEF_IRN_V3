# Analytics — PostHog

Pilotage de LlamaKusi par deux dashboards PostHog complémentaires (projet PostHog `240932`, région EU).
Dernière mise à jour : 2026-09-23.

| Dashboard | Question | Cadre | Fenêtre | Lien |
|---|---|---|---|---|
| **LlamaKusi — Pilotage** | Le produit transforme-t-il les visiteurs en utilisateurs actifs puis payants ? | AARRR | 7 j | `https://eu.posthog.com/project/240932/dashboard/955754` |
| **LlamaKusi — Web & Guides** | Les guides attirent-ils et font-ils passer à l'app ? | Entonnoir de contenu SEO en 5 étapes + matrice impressions × CTR | 28 à 90 j | `https://eu.posthog.com/project/240932/dashboard/970935` |

Les deux sont envoyés par email chaque lundi à 06:00 UTC (8 h Paris en été), 10 graphiques chacun.

---

## 1. Configuration côté app

- Client : `src/components/providers/PostHogProvider.tsx` — `capture_pageview: 'history_change'` (navigations App Router comptées), `person_profiles: 'identified_only'`, autocapture et `$pageleave` actifs par défaut, `capture_exceptions: true`.
- Serveur : `src/lib/posthog-server.ts` (événements émis par les routes API).
- Variables : `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` et `NEXT_PUBLIC_POSTHOG_HOST`. En dev, leur absence lève une erreur volontairement (sinon les événements sont perdus en silence).
- Enregistrement de sessions (replays) : actif, champs de saisie masqués par défaut.

### Conventions de mesure

| Sujet | Règle |
|---|---|
| Comptes internes | Exclus partout : `filterTestAccounts: true` (requêtes typées) ou `person_id NOT IN COHORT 201381` (SQL). |
| Robots | Exclus via `$virt_is_bot`. |
| Liens internes des guides | Tagués `utm_source=guide&utm_medium=content&utm_campaign=<slug>` par `withGuideUtm()` (`src/lib/analytics.ts`). Sert le North Star Metric (« Latest UTM campaign »). Ne jamais utiliser l'UTM pour mesurer l'acquisition : utiliser le canal d'entrée de session (`$channel_type`, `$entry_referring_domain`). |
| Clics depuis un guide | Mesurés par `$autocapture` (`elements_chain_href`), pas par l'UTM : le chemin principal vers l'app est le bouton Connexion du menu, non tagué. |
| Profondeur de lecture | `$pageleave` → `$prev_pageview_max_scroll_percentage` (ratio 0-1) et `$prev_pageview_duration` (s). |
| Petit volume | Lire en valeurs absolues tant qu'il y a moins de 30 personnes par étape. |

---

## 2. Sources data warehouse

| Source | Tables utilisées | Remarques |
|---|---|---|
| Google Search Console (`sc-domain:llamakusi.com`) | `googlesearchconsole.search_analytics_by_date`, `_by_page`, `_by_query`, `_by_query_page`, `_by_device` | Sync toutes les 6 h. Données Google en retard d'environ 3 jours : les fenêtres sont calées sur `max(date)`. |
| Bing Webmaster Tools | — | Connectée le 2026-09-23 (source en alpha), pas encore utilisée dans les dashboards. |

### Règles de calcul Search Console (ne pas dévier)

- **Position moyenne = pondérée par les impressions** : `sum(position * impressions) / sum(impressions)`. Jamais `avg(position)`.
- **Totaux = `search_analytics_by_date`**. Environ 95 % des impressions viennent de requêtes que Google masque : les tables par requête ne somment pas au total. Le pilotage se fait **par page**.
- **Normalisation des URL** avant toute jointure avec les événements PostHog : minuscules, suppression du domaine, de la query string et du slash final, et `/tef_irn` → `/tef-irn`. Google remonte encore les anciennes URL `/TEF_IRN/...` (redirection 308 dans `next.config.ts`) ; sans cette normalisation, un même guide est compté deux fois.

```sql
replaceRegexpOne(replaceRegexpOne(replaceAll(lower(replaceRegexpOne(page, '[?#].*$', '')),
  '/tef_irn', '/tef-irn'), '^https?://[^/]+', ''), '(.)/$', '\\1')
```

---

## 3. Dashboard « LlamaKusi — Web & Guides »

| Section | Insights (short_id) |
|---|---|
| 1. Chiffres clés — 28 derniers jours | Google en chiffres, 28 j vs 28 j précédents (`PFQMycE7`) · Lecteurs des guides (`spCALGam`) · Lecteurs qui cliquent vers l'app (`vAIsQqJ0`) |
| 2. Plan d'action — un guide = une ligne | Plan d'action par guide, 90 j (`CVW1otYX`) |
| 3. Visibilité — Google nous voit-il ? | Impressions et clics par semaine (`kKrnxi9A`) · Guides visibles et position moyenne (`WBezWGF2`) · Matrice impressions × CTR (`clGxkyhD`) · Google par appareil (`5A8qFNbg`) · Requêtes Google connues (`eAWo3wpd`) |
| 4. Acquisition | Lecteurs des guides par canal (`uTh1sUkz`) · Moteurs, assistants IA et sites référents (`9jfV25CM`) |
| 5. Engagement | Profondeur de lecture par guide (`LODTRBdx`) · Jusqu'où les lecteurs lisent (`V65bHVs4`) |
| 6. Action & conversion | Où cliquent les lecteurs des guides (`qsY1Qq3P`) · Guide → connexion → inscription, 7 j (`RSNLj0GO`) |

### Règles de la matrice et du plan d'action (90 j, par guide)

| Priorité | Condition | Action |
|---|---|---|
| 1 | ≥ 10 impressions, position ≤ 10, CTR < 2 % | ✏️ Réécrire titre + meta |
| 2 | ≥ 10 impressions, position 11 à 15 | 🚀 Enrichir le contenu (quick win) |
| 3 | ≥ 3 lecteurs et 0 clic vers l'app | 🎯 Renforcer le CTA |
| 4 | ≥ 10 impressions, position > 15 | 🔍 Renforcer ou fusionner |
| 5 | Autres cas jugeables | ✅ Maintenir |
| 6 | < 10 impressions | 💤 Pas encore jugeable |

Les seuils sont calibrés pour le volume de septembre 2026. À relever quand le trafic aura été multiplié par environ 5.

---

## 4. Dashboard « LlamaKusi — Pilotage »

Le détail de ses funnels et insights est tenu dans le fichier de suivi du projet (`claude_posthog-funnels-setup.md`). Cinq sections : Chiffres clés 7 j → Acquisition → Activation → Monétisation → Rétention.

Deux alertes par email : « 0 inscription sur la semaine écoulée » et « Première session de paiement créée ».

---

## 5. Rituel du lundi (≈ 20 min)

1. **Pilotage** : repérer le premier des 4 chiffres clés qui baisse ; c'est l'étape du parcours à traiter.
2. **Web & Guides** : dans le plan d'action, choisir les 2 ou 3 premières lignes pour la semaine, puis laisser 2 à 4 semaines à Google pour réagir avant de juger.
3. Noter **une** décision dans une annotation PostHog, pour pouvoir relier plus tard une variation de courbe à une action.
