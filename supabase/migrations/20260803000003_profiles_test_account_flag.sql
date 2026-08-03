-- Distingue les comptes de test (créés par le dev pour QA) des comptes
-- réels, pour pouvoir les filtrer sur la page admin Profils à mesure que
-- le nombre d'utilisateurs réels augmente. Défaut false : aucun compte
-- existant n'est marqué test rétroactivement, à faire manuellement.
ALTER TABLE profiles ADD COLUMN is_test_account boolean NOT NULL DEFAULT false;
