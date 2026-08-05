-- Item 2/10 du plan de correction du dashboard (analyse détaillée) :
--
-- writing_scenario_attempts et oral_session_results sont aujourd'hui alimentées
-- par deux origines différentes sans aucun moyen de les distinguer :
--   - context = 'standalone' : pratique libre, hors examen (page Rédaction pour
--     l'écrit, page Expression Orale pour l'oral)
--   - context = 'exam'       : tentative EE ou EO passée dans le cadre d'un
--     examen blanc complet chronométré (/tef-irn/exam)
--
-- Sans cette colonne, get_dashboard_data() ne peut pas répartir correctement les
-- corrections entre les 3 blocs du dashboard (Examen blanc / Écrit / Oral) :
-- voir items 3 à 9 du plan pour l'utilisation de ce champ.
--
-- DEFAULT 'standalone' : à ce jour, 100% des lignes existantes viennent des pages
-- de pratique libre (aucune sauvegarde EE/EO d'examen blanc n'existe encore, voir
-- item 5), donc ce défaut reflète fidèlement les données déjà en base.

ALTER TABLE public.writing_scenario_attempts
  ADD COLUMN context TEXT NOT NULL DEFAULT 'standalone'
    CHECK (context IN ('standalone', 'exam'));

ALTER TABLE public.oral_session_results
  ADD COLUMN context TEXT NOT NULL DEFAULT 'standalone'
    CHECK (context IN ('standalone', 'exam'));

CREATE INDEX IF NOT EXISTS writing_scenario_attempts_context_idx
  ON public.writing_scenario_attempts(context);

CREATE INDEX IF NOT EXISTS oral_session_results_context_idx
  ON public.oral_session_results(context);
