import { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Règle générale pour tous les bots
      {
        userAgent: '*',
        allow: [
          '/TEF_IRN/lessons',
          '/TEF_IRN/guides',
          '/TEF_IRN/parcours',
          '/TEF_IRN/lessons/*',
          '/TEF_IRN/guides/*',
        ],
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
