import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/TEF_IRN/lessons', '/TEF_IRN/guides', '/TEF_IRN/parcours'],
        disallow: [
          '/TEF_IRN/dashboard',
          '/TEF_IRN/practice',
          '/TEF_IRN/writing',
          '/TEF_IRN/grammar-check',
          '/TEF_IRN/vocab',
          '/TEF_IRN/oral',
          '/TEF_IRN/coach',
          '/TEF_IRN/correction',
          '/api',
          '/admin',
          '/TEF_IRN/login',
          '/TEF_IRN/onboarding',
          '/TEF_IRN/settings',
          '/TEF_IRN/profile',
          '/TEF_IRN/lessons/*/complete',
        ],
      },
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'Google-Extended', 'CCBot', 'Bytespider'],
        disallow: '/',
      },
      {
        userAgent: ['OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Claude-SearchBot', 'Claude-User'],
        allow: '/',
      },
    ],
    sitemap: 'https://tef-irn-v3.vercel.app/sitemap.xml',
  };
}
