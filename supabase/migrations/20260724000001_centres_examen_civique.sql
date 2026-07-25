-- Centres d'examen civique agréés CCI Paris IDF / FEI.
-- Alimentée manuellement ~1x/mois via le pipeline scrape → enrich → import
-- (source : francais.cci-paris-idf.fr/candidat). Table 100% publique en lecture,
-- écriture réservée à la service_role (script d'import), pas de policy INSERT/UPDATE
-- côté utilisateur authentifié.

CREATE TABLE centres_examen_civique (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tc_id INTEGER UNIQUE NOT NULL, -- id source CCI, clé d'upsert du script d'import
    nom TEXT NOT NULL,
    adresse TEXT NOT NULL,
    code_postal TEXT,
    ville TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    produits TEXT[] NOT NULL DEFAULT '{}', -- sous-ensemble de: 'naturalisation', 'carte_resident', 'csp'
    email TEXT,
    telephone TEXT,
    url_contact TEXT NOT NULL,
    actif BOOLEAN NOT NULL DEFAULT true, -- false = plus présent au dernier fetch (désagréé), gardé pour l'historique
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_centres_examen_civique_ville ON centres_examen_civique(ville);
CREATE INDEX idx_centres_examen_civique_actif ON centres_examen_civique(actif);
CREATE INDEX idx_centres_examen_civique_produits ON centres_examen_civique USING GIN(produits);

ALTER TABLE centres_examen_civique ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Centres actifs visibles publiquement" ON centres_examen_civique
  FOR SELECT
  USING (actif = true);
