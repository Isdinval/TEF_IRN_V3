import React from 'react';
import Script from 'next/script';

interface JsonLdProps {
  data: any;
  id?: string;
}

/**
 * Composant utilitaire pour injecter des données structurées JSON-LD
 */
export default function JsonLd({ data, id }: JsonLdProps) {
  return (
    <Script
      id={id || 'json-ld'}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
