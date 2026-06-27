-- Wishlist merchandising LlamaKuzi (capture des emails pour la boutique à venir)
CREATE TABLE merch_wishlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    product TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (email, product)
);

ALTER TABLE merch_wishlist ENABLE ROW LEVEL SECURITY;

-- Les visiteurs (clé anon) peuvent uniquement insérer leur email, jamais lire la table.
CREATE POLICY "Anyone can join the merch wishlist" ON merch_wishlist FOR INSERT WITH CHECK (true);
