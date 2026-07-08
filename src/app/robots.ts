import { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Règle générale pour tous les bots
      {
        userAgent: '*',
        allow: [
          '/tef-irn/lessons',
          '/tef-irn/guides',
          '/tef-irn/parcours',
          '/tef-irn/lessons/*',
          '/tef-irn/guides/*',
        ],
        disallow: [
          '/tef-irn/dashboard',
          '/tef-irn/practice',
          '/tef-irn/writing',
          '/tef-irn/grammar-check',
          '/tef-irn/vocab',
          '/tef-irn/oral',
          '/tef-irn/coach',
          '/tef-irn/correction',
          '/api',
          '/admin',
          '/tef-irn/login',
          '/tef-irn/onboarding',
          '/tef-irn/settings',
          '/tef-irn/profile',
          '/tef-irn/lessons/*/complete',
        ],
      },

      // === Bots IA "Mauvais" (entraînement / scraping agressif) ===
      {
        userAgent: [
          'GPTBot',
          'ClaudeBot',
          'CCBot',
          'Bytespider',
          'anthropic-ai',
          'cohere-training',
          'meta-llama',
          'LLaMA',
          'weborama',
          'diffbot',
        ],
        disallow: '/',
      },

      // === Bots IA "Bons" (recherche avec citation de sources) ===
      {
        userAgent: [
          // OpenAI
          'OAI-SearchBot',
          'ChatGPT-User',
          'ChatGPT',
          
          // Anthropic
          'Claude-SearchBot',
          'Claude-User',
          'ClaudeBot-Search',
          
          // xAI
          'GrokBot',
          'Grok',
          'xAI',
          
          // Perplexity
          'PerplexityBot',
          'Perplexity-User',
          'PerplexityAI',

          // Google (très important)
          'Google-Extended',
          'Googlebot',
          
          // DeepSeek
          'DeepSeekBot',
          'DeepSeek',
          
          // Autres bons bots IA / Recherche
          'YouBot',
          'You.com',
          'MetaBot',
          'Meta-AI',
          'MistralBot',
          'Mistral',
          'PiBot',           // Inflection Pi
          'PhindBot',
          'Phind',
          'HuggingFaceBot',
          'HuggingFace',
          'CohereBot',
          'Cohere',
        ],
        allow: '/',
      },
    ],

    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
