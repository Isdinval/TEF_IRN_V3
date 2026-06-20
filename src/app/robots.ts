import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/lessons', '/guides', '/parcours'],
        disallow: [
          '/dashboard',
          '/practice',
          '/writing',
          '/grammar-check',
          '/vocab',
          '/oral',
          '/coach',
          '/correction',
          '/api',
          '/admin',
          '/login',
          '/onboarding',
          '/settings',
          '/profile',
          '/lessons/*/complete',
        ],
      },
      {
        // Bots d'entraînement — bloqués
        userAgent: ['GPTBot', 'ClaudeBot', 'Google-Extended', 'CCBot', 'Bytespider'],
        disallow: '/',
      },
      {
        // Bots de recherche live / réponse à une requête utilisateur — autorisés
        userAgent: ['OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Claude-SearchBot', 'Claude-User'],
        allow: '/',
      },
    ],
    sitemap: 'https://tef-irn-v3.vercel.app/sitemap.xml',
  };
}
