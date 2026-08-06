-- Item 10.9 du plan de robustification des étiquettes (dashboard) :
--
-- La règle "un exercice partage toujours au moins une étiquette avec sa
-- leçon" était vraie à 100% par convention (403/403 exercices liés à une
-- leçon, vérifié après les nettoyages 10.7/10.8), mais rien ne l'imposait :
-- rien n'empêchait un futur exercice mal étiqueté de casser cet invariant.
--
-- Ce trigger la fait respecter formellement pour tout nouvel exercice ou
-- toute modification de tags/lesson_id. Les exercices sans leçon parente
-- (lesson_id NULL, ex. centre d'entraînement) ne sont pas concernés.
--
-- Testé avant application (transaction de test) :
-- - Un insert valide (tag partagé avec la leçon) passe normalement
-- - Un insert invalide (aucun tag en commun) est rejeté avec une erreur claire

CREATE OR REPLACE FUNCTION public.check_exercise_shares_lesson_tag()
RETURNS TRIGGER AS $$
DECLARE
  v_lesson_tags TEXT[];
BEGIN
  IF NEW.lesson_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT tags INTO v_lesson_tags FROM public.lessons WHERE id = NEW.lesson_id;

  IF v_lesson_tags IS NULL OR NOT (NEW.tags && v_lesson_tags) THEN
    RAISE EXCEPTION 'exercise tags % must share at least one tag with parent lesson tags %', NEW.tags, v_lesson_tags;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_exercise_shares_lesson_tag ON public.exercises;

CREATE TRIGGER trg_exercise_shares_lesson_tag
  BEFORE INSERT OR UPDATE OF tags, lesson_id ON public.exercises
  FOR EACH ROW EXECUTE FUNCTION public.check_exercise_shares_lesson_tag();
