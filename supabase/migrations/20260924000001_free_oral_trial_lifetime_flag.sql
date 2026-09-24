-- Business case croissance du 24/09/2026 (claude/growth-business-case-2026-09-24.md),
-- idée 1 validée par Olivier le jour même ("OK pour idée 1. 1 essai du coach
-- IA Oral par compte à vie. Un seul !!!").
--
-- Constat : hasOralCoach (entitlements.ts) exclut Gratuit ET Essentiel --
-- seuls Premium/Super Premium (54,9€/77,9€) y ont accès, sans aucun essai.
-- Résultat mesuré (Supabase, 24/09) : 100% des lignes de
-- oral_session_results appartiennent au seul compte admin/test, les 9
-- comptes réels (tous Gratuit) n'ont jamais pu essayer le Coach Oral avant
-- d'envisager un abonnement payant.
--
-- Périmètre validé : Gratuit UNIQUEMENT (idée 1, pas la variante Essentiel),
-- une seule session à vie -- même mécanisme que
-- free_ee_correction_used (migration 20260909000002) pour le Coach
-- Écriture, mais avec un point de consommation différent : le jeton éphémère
-- OpenAI Realtime coûte dès qu'il est émis (audio en streaming), pas
-- seulement si l'analyse finale aboutit -- voir /api/oral/session pour le
-- détail ("Un seul !!!" veut dire une seule connexion Realtime jamais
-- relancée, pas seulement une seule note obtenue).
--
-- free_oral_trial_used ajoutée à la liste des colonnes protégées du trigger
-- trg_prevent_self_admin_escalation (même mécanisme que
-- free_ee_correction_used, subscription_tier, etc.) : sans ça, un compte
-- gratuit pourrait réinitialiser lui-même son propre indicateur via un
-- appel PostgREST direct et relancer une session gratuite à volonté.
--
-- Vérifié en dry-run BEGIN/ROLLBACK sur la base live avant livraison.
-- Défaut `false` correct pour les 9 comptes réels existants (tous gratuits,
-- aucun n'a encore utilisé le Coach Oral).

BEGIN;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS free_oral_trial_used boolean NOT NULL DEFAULT false;

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

  IF NEW.free_oral_trial_used IS DISTINCT FROM OLD.free_oral_trial_used THEN
    NEW.free_oral_trial_used := OLD.free_oral_trial_used;
  END IF;

  RETURN NEW;
END;
$$;

COMMIT;
