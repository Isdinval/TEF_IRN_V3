-- Item 8 du chantier "fondations abonnements" (2026-09).
--
-- La landing page (Pricing.tsx) promet "1 correction d'Expression Écrite"
-- au palier Gratuit -- validé avec Olivier : "1 à vie", pas "1/jour".
-- Mécanisme différent du quota quotidien existant (ai_usage_daily,
-- writing_correct.gratuit = 3/jour dans ai-rate-limit.ts, qui n'a pas de
-- notion de compteur "à vie" et reset chaque jour) -- une colonne booléenne
-- suffit, pas besoin d'une table dédiée.
--
-- Portée : uniquement la pratique libre EE (page /writing). L'examen blanc
-- reste inchangé -- Gratuit y est déjà bloqué à 100% par
-- hasExamWritingCorrection (voir entitlements.ts, item 7), sans lien avec
-- ce compteur "à vie".
--
-- free_ee_correction_used ajoutée à la liste des colonnes protégées du
-- trigger trg_prevent_self_admin_escalation (même mécanisme que
-- subscription_tier, is_admin, etc.) : sans ça, un compte gratuit pourrait
-- réinitialiser lui-même son propre indicateur via un appel PostgREST direct
-- et obtenir des corrections gratuites illimitées.
--
-- Vérifié en dry-run BEGIN/ROLLBACK sur la base live avant livraison.
-- Défaut `false` correct pour les 6 comptes existants (tous gratuits,
-- aucun n'a encore utilisé la fonctionnalité).

BEGIN;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS free_ee_correction_used boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.prevent_self_admin_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RETURN NEW;
  END IF;

  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    NEW.is_admin := OLD.is_admin;
  END IF;

  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    NEW.subscription_tier := OLD.subscription_tier;
  END IF;

  IF NEW.is_test_account IS DISTINCT FROM OLD.is_test_account THEN
    NEW.is_test_account := OLD.is_test_account;
  END IF;

  IF NEW.ai_credits IS DISTINCT FROM OLD.ai_credits THEN
    NEW.ai_credits := OLD.ai_credits;
  END IF;

  IF NEW.total_xp IS DISTINCT FROM OLD.total_xp THEN
    NEW.total_xp := OLD.total_xp;
  END IF;

  IF NEW.streak_count IS DISTINCT FROM OLD.streak_count THEN
    NEW.streak_count := OLD.streak_count;
  END IF;

  IF NEW.free_ee_correction_used IS DISTINCT FROM OLD.free_ee_correction_used THEN
    NEW.free_ee_correction_used := OLD.free_ee_correction_used;
  END IF;

  RETURN NEW;
END;
$$;

COMMIT;
