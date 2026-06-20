import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/lessons', '/guides'],
      disallow: [
        '/dashboard',
        '/practice',
        '/writing',
        '/api',
        '/admin',
        '/login',
        '/onboarding',
        '/settings',
        '/profile',
        '/lessons/*/complete'
      ],
    },
    sitemap: 'https://tef-irn-v3.vercel.app/sitemap.xml',
  };
}
