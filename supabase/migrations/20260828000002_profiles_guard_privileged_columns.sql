-- Audit sécurité 2026-08 (item 4) : le trigger prevent_self_admin_escalation
-- (20260802000002_profiles_admin_guard.sql) ne protégeait que is_admin. Or la
-- policy "Users can update their own profile" a un USING mais toujours aucun
-- WITH CHECK, donc aucune restriction de colonne au niveau RLS : n'importe
-- quel utilisateur authentifié pouvait passer son propre subscription_tier à
-- 'premium' (accès Premium gratuit, sans lien avec un paiement), ou gonfler
-- total_xp/streak_count (triche sur le classement), via un simple appel
-- PostgREST direct (ex. depuis la console du navigateur).
--
-- Correctif : le trigger est étendu à subscription_tier, is_test_account,
-- ai_credits, total_xp et streak_count -- même logique que is_admin (silencieux
-- au lieu de faire échouer toute la requête, pour ne pas casser la mise à
-- jour légitime du reste du profil dans le même appel).
--
-- current_level est volontairement EXCLUE : c'est le niveau autodéclaré par
-- l'utilisateur lui-même (settings, onboarding), pas un droit acquis -- la
-- bloquer casserait ces écrans.
--
-- total_xp/streak_count restent légitimement modifiables par la route
-- api/exercise-complete, qui est passée sur le client admin (service_role)
-- dans ce même item -- voir le patch applicatif associé.
--
-- Validé par dry-run BEGIN/ROLLBACK sur la base live avant livraison :
--   - un compte non-admin ne peut modifier aucune des 5 colonnes protégées
--     (tentative silencieusement ignorée, reste du profil intact)
--   - le même compte peut toujours modifier username/current_level
--   - un appel service_role (nos routes admin + exercise-complete après son
--     changement de client) peut toujours écrire ces colonnes

CREATE OR REPLACE FUNCTION prevent_self_admin_escalation()
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

  RETURN NEW;
END;
$$;
