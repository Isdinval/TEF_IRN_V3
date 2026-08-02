-- profiles n'avait qu'une policy "Users can update their own profile" avec un
-- USING mais aucun WITH CHECK, donc aucune restriction de colonne : n'importe
-- quel utilisateur authentifié pouvait passer son propre is_admin à true via
-- un simple appel PostgREST. Ce trigger ferme ce trou, quel que soit le chemin
-- d'appel (RLS actuelle ou future), sans casser les mises à jour légitimes du
-- reste du profil (username, niveau, etc.) : le changement de is_admin est
-- silencieusement ignoré plutôt que de faire échouer toute la requête.
--
-- auth.role() = 'service_role' laisse passer notre route API serveur
-- (/api/admin/profiles/toggle-admin), qui a déjà vérifié les droits admin
-- de l'appelant avant d'utiliser la clé service_role.
CREATE OR REPLACE FUNCTION prevent_self_admin_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    IF auth.role() = 'service_role' THEN
      RETURN NEW;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    ) THEN
      NEW.is_admin := OLD.is_admin;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_self_admin_escalation ON profiles;
CREATE TRIGGER trg_prevent_self_admin_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_admin_escalation();
