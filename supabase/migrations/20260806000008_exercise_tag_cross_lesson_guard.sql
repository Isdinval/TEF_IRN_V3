-- Item 10.10 du plan de robustification des étiquettes (dashboard) :
--
-- Décision : un exercice PEUT porter des étiquettes empruntées à d'autres
-- leçons que la sienne (90 occurrences déjà observées en pratique avant
-- nettoyage -- une notion transversale peut légitimement toucher plusieurs
-- leçons). Ce n'était qu'un effet de bord non documenté ; on le formalise.
--
-- Condition : toute étiquette empruntée doit déjà exister dans la taxonomie
-- officielle (docs/lessons-tags-taxonomy.md) -- jamais un mot inventé à la
-- volée. Combiné à 10.9 (au moins une étiquette de sa PROPRE leçon), la
-- règle complète devient : les étiquettes d'un exercice = au moins une de
-- sa leçon + zéro ou plus d'autres leçons, toujours dans la taxonomie
-- officielle.
--
-- Testé avant application (transaction de test) :
-- - Un exercice avec une étiquette de sa leçon + une étiquette empruntée à
--   une autre leçon (existante dans la taxonomie) est accepté
-- - Un exercice avec une étiquette totalement inventée est rejeté
-- - Les 403 exercices existants respectent déjà cette règle renforcée (0
--   exception), aucune régression

CREATE OR REPLACE FUNCTION public.check_exercise_shares_lesson_tag()
RETURNS TRIGGER AS $$
DECLARE
  v_lesson_tags TEXT[];
  v_bad_tag TEXT;
BEGIN
  IF NEW.lesson_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT tags INTO v_lesson_tags FROM public.lessons WHERE id = NEW.lesson_id;

  IF v_lesson_tags IS NULL OR NOT (NEW.tags && v_lesson_tags) THEN
    RAISE EXCEPTION 'exercise tags % must share at least one tag with parent lesson tags %', NEW.tags, v_lesson_tags;
  END IF;

  -- Cross-tagging autorisé (item 10.10), mais uniquement avec des étiquettes
  -- déjà présentes quelque part dans la taxonomie officielle.
  SELECT t INTO v_bad_tag
  FROM unnest(NEW.tags) t
  WHERE t NOT IN (SELECT DISTINCT unnest(tags) FROM public.lessons)
  LIMIT 1;

  IF v_bad_tag IS NOT NULL THEN
    RAISE EXCEPTION 'exercise tag "%" does not exist in the official lessons tag taxonomy', v_bad_tag;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
