# Piège PostgREST : troncature silencieuse à 1000 lignes (Max Rows)

## Le problème

Supabase expose les tables via PostgREST. Chaque projet a un réglage serveur
**`Max Rows`** (Project Settings → API → Max Rows), qui vaut **1000 par défaut**.

Ce réglage plafonne **toute** requête REST (`supabase.from(...).select(...)`),
**quel que soit le `.limit(N)` demandé côté client**, et **sans erreur ni
avertissement**. Un `.select().limit(5000)` sur une table qui contient 1643
lignes ne renverra que les 1000 premières -- silencieusement.

C'est différent de `execute_sql` / l'éditeur SQL Supabase, qui parlent
directement à Postgres et ne sont jamais concernés par cette limite. Deux
implémentations qui semblent "faire la même requête" peuvent donc renvoyer des
volumes de données différents selon qu'elles passent par l'API REST (limitée)
ou par une connexion Postgres directe (non limitée).

## Symptôme observé (2026-08-25)

`/tef-irn/admin/recommendation-coverage` affichait ~167 "trous" de couverture
leçon → exercice, alors qu'une requête SQL directe (MCP `execute_sql`, ou
l'éditeur SQL Supabase) montrait 12 trous réels. Diagnostic confirmé en
inspectant la réponse réseau brute (`Network` DevTools) de la requête
`exercises?select=level,tags&limit=5000` : **1000 lignes reçues sur 1643**.
Les ~643 exercices manquants faussaient le calcul de couverture (fait en
mémoire côté client), en faisant croire que des tags n'étaient couverts par
aucun exercice alors qu'ils l'étaient.

## Règle à appliquer

**Ne jamais faire confiance à `.limit(N)` seul pour "tout récupérer" dès
qu'une table peut dépasser 1000 lignes** (`exercises` en particulier, en
croissance constante). Deux options, non exclusives :

1. **Remonter `Max Rows`** dans Project Settings → API (rapide, mais repousse
   le problème -- un nouveau plafond silencieux réapparaît si la table
   continue de grossir au-delà de la nouvelle valeur).
2. **Paginer explicitement** avec `.range(from, to)` en boucle jusqu'à
   recevoir une page plus courte que la taille demandée. C'est la solution
   pérenne, indépendante du réglage serveur. Voir `fetchAllRows()` dans
   `src/app/tef-irn/admin/recommendation-coverage/page.tsx` pour un exemple
   minimal réutilisable.

Tout nouveau code qui lit une table potentiellement volumineuse via l'API
REST Supabase (pas via une RPC/fonction SQL paginée côté serveur) doit
appliquer la règle 2, ou au minimum vérifier explicitement que le volume réel
de la table reste sous `Max Rows`.
