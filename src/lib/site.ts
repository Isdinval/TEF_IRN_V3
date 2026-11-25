export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://llamakusi.com';

/** Email de contact public (mentions légales, Footer, JSON-LD). */
export const contactEmail = 'contact@llamakusi.com';

/** Réseaux sociaux officiels : source unique du Footer et du JSON-LD (Organization.sameAs). */
export const socialLinks = [
  { id: 'youtube', name: 'YouTube', href: 'https://www.youtube.com/channel/UCK36Fhxh_dRxzfH14J9W89w' },
  { id: 'linkedin', name: 'LinkedIn', href: 'https://www.linkedin.com/company/llamakusi/' },
  { id: 'instagram', name: 'Instagram', href: 'https://www.instagram.com/llamakusi/' },
  { id: 'tiktok', name: 'TikTok', href: 'https://www.tiktok.com/@llamakusi' },
] as const;
