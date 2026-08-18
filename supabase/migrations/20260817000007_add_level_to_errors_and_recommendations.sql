-- Fix critique découvert en test P0 (session de validation du plan "Refonte
-- recommandation erreur -> tag -> ressource") : ni user_errors ni
-- recommendations ne stockaient le niveau CECRL du contenu source de
-- l'erreur. analyzeUserErrorsAndRecommend() cherchait donc une leçon au
-- niveau du PROFIL de l'utilisateur (profiles.current_level), qui peut
-- diverger largement du niveau réel de la notion en cause -- ex. une erreur
-- de subjonctif présent (leçon B1) chez un utilisateur dont le profil est
-- resté à A1 ne retrouvait jamais la bonne leçon, et retombait
-- silencieusement sur la première leçon de la catégorie au niveau A1, sans
-- rapport avec l'erreur réelle (vérifié en test : "Subjonctif Présent" ->
-- recommandation pointant vers "Être, Avoir et Verbes en -ER au Présent").
--
-- Cette migration ajoute la colonne, sans rien migrer côté valeurs
-- existantes (NULL pour les lignes déjà en base -- le code applicatif gère
-- ce cas en repli sur profile.current_level, cf. patch applicatif associé).

ALTER TABLE public.user_errors ADD COLUMN IF NOT EXISTS level TEXT;
ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS level TEXT;
