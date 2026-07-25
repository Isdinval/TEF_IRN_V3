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
          // Produit d'entrée examen civique — explicité pour éviter qu'un futur
          // resserrement de cette règle générique ne le bloque par accident.
          '/examen-civique',
          '/examen-civique/*',
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
          '/sitemap-debug',
        ],
      },

      // === Bots IA "Mauvais" (entraînement / scraping agressif) ===
      // Tokens vérifiés (2026) contre la documentation officielle de chaque
      // fournisseur — cf. audit SEO/GEO du 2026-07. Corrections apportées :
      //   - 'cohere-training' n'existe pas -> vrai token Cohere = 'cohere-ai'
      //   - 'meta-llama' / 'LLaMA' sont des noms de modèles, pas des user-agents
      //     HTTP -> vrai token Meta (crawler training) = 'Meta-ExternalAgent'
      //   - 'weborama' retiré : pas de lien documenté avec le training IA
      {
        userAgent: [
          'GPTBot',
          'ClaudeBot',
          'CCBot',
          'Bytespider',
          'anthropic-ai', // token déprécié, plus aucun crawler ne l'utilise — conservé sans risque
          'cohere-ai',
          'Meta-ExternalAgent',
          'Diffbot',
        ],
        disallow: '/',
      },

      // === Bots IA "Bons" (recherche avec citation de sources) ===
      // Idem, tokens revérifiés. Corrections :
      //   - 'ClaudeBot-Search' supprimé (n'existe pas, doublon fantôme de
      //     'Claude-SearchBot' déjà listé)
      //   - 'CohereBot' / 'Cohere' supprimés (n'existent pas — le vrai crawler
      //     Cohere est 'cohere-ai', déplacé dans le bloc "mauvais bots" ci-dessus,
      //     cohérent avec l'intention initiale de bloquer l'entraînement)
      //   - 'MetaBot' / 'Meta-AI' remplacés par le vrai token de retrieval Meta
      //   - 'MistralBot' / 'Mistral' remplacés par le vrai token documenté
      //   - 'Applebot-Extended' ajouté (équivalent Apple de Google-Extended,
      //     absent alors que la même politique d'autorisation IA s'applique)
      // Non vérifiables : GrokBot/Grok/xAI (xAI n'a aucune doc crawler publiée
      // à ce jour), PerplexityAI, DeepSeekBot/DeepSeek, YouBot/You.com, PiBot,
      // PhindBot/Phind, HuggingFaceBot/HuggingFace — conservés (inoffensifs,
      // 'allow' est de toute façon le comportement par défaut) mais à ne pas
      // considérer comme des tokens confirmés.
      {
        userAgent: [
          // OpenAI
          'OAI-SearchBot',
          'ChatGPT-User',
          'ChatGPT',

          // Anthropic
          'Claude-SearchBot',
          'Claude-User',

          // xAI (non documenté officiellement, conservé par précaution)
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

          // Apple
          'Applebot-Extended',

          // DeepSeek (non documenté officiellement, conservé par précaution)
          'DeepSeekBot',
          'DeepSeek',

          // Meta (retrieval / citation, distinct du crawler training ci-dessus)
          'Meta-ExternalFetcher',

          // Mistral
          'MistralAI-User',

          // Autres bons bots IA / Recherche (non documentés officiellement,
          // conservés par précaution)
          'YouBot',
          'You.com',
          'PiBot', // Inflection Pi
          'PhindBot',
          'Phind',
          'HuggingFaceBot',
          'HuggingFace',
        ],
        allow: '/',
      },
    ],

    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
