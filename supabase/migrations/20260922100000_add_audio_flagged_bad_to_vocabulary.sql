-- Ajoute un marquage manuel de qualité audio sur la table vocabulary
-- (page admin/vocabulary, item 3/4 du chantier "audio QA").
--
-- audio_flagged_bad = true signifie qu'un admin a écouté l'audio et jugé
-- qu'il doit être régénéré (mauvaise prononciation, coupure, bruit...).
-- Ne déclenche rien automatiquement : le nettoyage groupé (vidage de
-- audio_url + suppression du fichier dans le bucket Storage vocab-audio)
-- est une action manuelle séparée, prévue à l'item 4 de ce chantier.
--
-- Aucune nouvelle policy RLS nécessaire : les policies UPDATE admin déjà
-- en place sur vocabulary (migration 20260803000008_vocabulary_admin_policies.sql)
-- couvrent l'ensemble des colonnes de la table.

ALTER TABLE public.vocabulary
  ADD COLUMN IF NOT EXISTS audio_flagged_bad boolean NOT NULL DEFAULT false;
