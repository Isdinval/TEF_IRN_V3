import React from 'react';

interface JsonLdProps {
  data: any;
  id?: string;
}

/**
 * Composant utilitaire pour injecter des données structurées JSON-LD.
 *
 * Volontairement un <script> natif et non next/script : next/script (stratégie par défaut
 * "afterInteractive") injecte le script côté client après hydratation, donc absent du HTML brut
 * renvoyé par le serveur. Un <script type="application/ld+json"> classique, lui, fait partie du
 * rendu serveur initial — indispensable pour les crawlers qui n'exécutent pas de JS (la plupart
 * des bots IA : GPTBot, PerplexityBot, etc.).
 */
export default function JsonLd({ data, id }: JsonLdProps) {
  return (
    <script
      id={id || 'json-ld'}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
