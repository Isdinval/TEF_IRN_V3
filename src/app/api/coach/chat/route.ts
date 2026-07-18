import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { resolveNextExercises } from '@/lib/recommendation-resolver';

export const runtime = 'edge';

// Reflète le type CoachPageContext défini côté client (src/contexts/CoachContext.tsx).
// Dupliqué volontairement ici (pas d'import cross-runtime) — edge function isolée.
interface CoachPageContext {
  type: 'lesson' | 'parcours' | 'writing' | 'oral' | 'guide' | 'browsing';
  title?: string;
  level?: string;
  category?: string;
  difficulty?: string;
  objective?: string;
  instructions?: string;
  sujet?: string;
  objectifs?: string[];
  description?: string;
  section?: 'lessons' | 'guides';
  progress?: { completed: number; total: number; percent: number };
  nextExercise?: { type: string; instructions: string } | null;
}

function describePageContext(pageContext: CoachPageContext | string | undefined): string {
  if (!pageContext) return 'Dashboard';
  if (typeof pageContext === 'string') return pageContext; // fallback pathname brut (pages non migrées)

  switch (pageContext.type) {
    case 'lesson':
      return `L'utilisateur consulte la leçon "${pageContext.title}" (niveau ${pageContext.level}, catégorie ${pageContext.category}${pageContext.difficulty ? `, difficulté ${pageContext.difficulty}` : ''})${pageContext.objective ? `. Objectif de la leçon : ${pageContext.objective}` : ''}.`;
    case 'parcours': {
      const progressLine = pageContext.progress
        ? ` Progression actuelle : ${pageContext.progress.completed}/${pageContext.progress.total} leçons (${pageContext.progress.percent}%).`
        : '';
      return `L'utilisateur est sur le parcours "${pageContext.category} ${pageContext.level}"${pageContext.objective ? ` — objectif : ${pageContext.objective}` : ''}.${progressLine}`;
    }
    case 'writing':
      return `L'utilisateur est en train de rédiger un exercice d'expression écrite (niveau ${pageContext.level}). Sujet : "${pageContext.instructions}".`;
    case 'oral':
      return `L'utilisateur est en pleine simulation d'expression orale : "${pageContext.title}" (niveau ${pageContext.level}). Sujet : ${pageContext.sujet}.${pageContext.objectifs?.length ? ` Objectifs : ${pageContext.objectifs.join(', ')}.` : ''}`;
    case 'guide':
      return `L'utilisateur lit le guide "${pageContext.title}"${pageContext.level ? ` (niveau ${pageContext.level})` : ''}${pageContext.category ? `, catégorie ${pageContext.category}` : ''}.${pageContext.description ? ` Résumé : ${pageContext.description}` : ''}`;
    case 'browsing':
      return pageContext.section === 'guides'
        ? `L'utilisateur parcourt la liste des guides TEF IRN, à la recherche d'un guide à lire.`
        : `L'utilisateur parcourt la liste des leçons, à la recherche d'une leçon à faire.`;
    default:
      return 'Dashboard';
  }
}

export async function POST(req: Request) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API Key missing' }), { status: 500 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet: any[]) {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            },
          },
        }
      );

    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    const user = session.user;

    const body = await req.json().catch(() => ({}));
    const { messages, sessionId, pageContext, interactionCount = 0 } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, current_level, goal_level')
        .eq('id', user.id)
        .single();

    const userLevel = profile?.current_level || 'A2';

    const systemPrompt = `Tu es le Coach TEF, un professeur de français expert, pédagogue, patient et encourageant.
Ton but est d'aider l'utilisateur à préparer son examen TEF IRN.

TON PERSONA:
- Chaleureux, naturel, encourageant.
- Adapte ton vocabulaire au niveau ${userLevel} de l'apprenant.
- Ne juge jamais. Sois toujours positif.

TON RÔLE & PÉRIMÈTRE:
- Tu ne réponds QU'AUX questions liées à l'apprentissage du français ou au TEF IRN.
- Grammaire, orthographe, syntaxe, vocabulaire, conjugaison, expression/compréhension (écrite/orale), méthodologie TEF.
- Si la question est hors sujet (ex: code, cuisine, sport), réponds: "Désolé, je suis Coach TEF, je suis spécialisé uniquement en français et en préparation au TEF IRN. Je ne peux pas t'aider avec ce sujet. Veux-tu que l'on travaille sur une règle de grammaire ou un exercice ?"

LOGIQUE DE RESSOURCES & CONTRAINTES:
- Tu n'utilises JAMAIS d'URLs ou de liens vers le site ou l'extérieur. Tout se passe dans le chat.
- Tu as accès à des outils pour chercher des exemples réels de leçons ou d'exercices dans la base pour t'en inspirer.
- SI l'utilisateur pose une question sur un point de cours, utilise 'get_resources' pour récupérer du contenu PUIS rédige toi-même une mini-leçon adaptée.
- SI l'utilisateur demande un exercice:
    - /exercice -> utilise 'get_random_exercise' pour récupérer un modèle, PUIS affiche l'exercice directement dans le chat en demandant à l'utilisateur d'y répondre.
    - /tef -> utilise 'get_tef_info' pour expliquer les épreuves.
    - /grammaire -> explique un point de grammaire directement.
    - /vocab -> utilise 'get_vocab_list' pour donner une liste thématique.
- SI l'utilisateur demande "que dois-je faire ensuite ?", "quel est mon prochain parcours/ma prochaine leçon ?", ou toute question sur SA progression personnelle -> utilise 'get_next_recommendation' (ne PAS deviner, cette info dépend de son historique réel).
- PROACTIVITÉ: Une fois toutes les 3 interactions (interactionCount: ${interactionCount}), si c'est pertinent, propose une activité directe (ex: "Veux-tu un petit exercice sur ce point ?").

MASCOTTE (obligatoire):
- À LA TOUTE FIN de ta réponse, sur une nouvelle ligne, ajoute EXACTEMENT une de ces balises, sans aucun texte autour :
  [[mood:victorieux]] si l'utilisateur vient de réussir, a une bonne réponse, ou mérite une célébration.
  [[mood:perplexe]] si l'utilisateur s'est trompé, est confus, ou si tu refuses une question hors-sujet.
  [[mood:neutre]] dans tous les autres cas.
- N'explique JAMAIS cette balise à l'utilisateur, ne la commente pas, contente-toi de l'ajouter.

CONTRAINTES TECHNIQUES:
- Uniquement du TEXTE et du MARKDOWN. Pas de pièces jointes.
- INTERDICTION FORMELLE DE DONNER DES LIENS OU DES URLS.
- IMPORTANT: Si tu utilises un outil (tool), tu DOIS toujours accompagner le résultat d'un message explicatif ou d'un conseil. Ne laisse jamais une réponse vide.

Contexte de la page actuelle : ${describePageContext(pageContext)}`;

    const openai = createOpenAI({ apiKey });

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages,
      maxSteps: 5,
      tools: {
        get_resources: tool({
          description: 'Recherche des leçons ou exercices adaptés au niveau de l\'utilisateur dans la base du site.',
          parameters: z.object({
            keywords: z.array(z.string()).describe('Mots-clés (ex: passé composé, subjonctif)'),
            type: z.enum(['lesson', 'exercise', 'any']).optional()
          }),
          execute: async ({ keywords, type }) => {
            console.log('Tool get_resources called:', { keywords, type });
            const results: any[] = [];
            if (type !== 'exercise') {
                const { data } = await supabase.from('lessons').select('title, content').overlaps('tags', keywords).eq('level', userLevel).limit(1);
                if (data) results.push(...data.map(l => ({ title: l.title, content: l.content })));
            }
            if (type !== 'lesson') {
                const { data } = await supabase.from('exercises').select('instructions, content').overlaps('tags', keywords).eq('level', userLevel).limit(1);
                if (data) results.push(...data.map(e => ({ instructions: e.instructions, details: e.content })));
            }
            return { resources: results };
          }
        }),
        get_next_recommendation: tool({
            description: 'Donne la ou les prochaines leçons/exercices recommandés pour l\'utilisateur, tous parcours confondus, basé sur son vrai historique (SRS, erreurs, leçons non terminées). À utiliser quand l\'utilisateur demande "que dois-je faire ensuite ?", "quel est mon prochain parcours/leçon ?", etc.',
            parameters: z.object({}),
            execute: async () => {
                console.log('Tool get_next_recommendation called');
                const recommended = await resolveNextExercises(user.id, { level: userLevel }, supabase, 3);
                if (recommended.length === 0) {
                    return { message: "Je n'ai pas encore assez de données pour te faire une recommandation personnalisée. Commence par un exercice et je pourrai mieux te guider ensuite !" };
                }
                return {
                    recommendations: (recommended as any[]).map((ex) => ({
                        category: ex.category,
                        type: ex.type,
                        instructions: ex.instructions,
                        reason: ex.recommendation_reason
                    }))
                };
            }
        }),
        get_random_exercise: tool({
            description: 'Donne un exercice adapté au niveau de l\'utilisateur. Si l\'utilisateur est sur un parcours, privilégie la recommandation déjà calculée pour lui plutôt qu\'un tirage aléatoire.',
            parameters: z.object({}),
            execute: async () => {
                // Sur /parcours, resolveNextExercises() a déjà tourné côté page — on réutilise
                // sa recommandation plutôt que de retirer au hasard (cf. dette technique Phase 5).
                if (pageContext && typeof pageContext === 'object' && pageContext.type === 'parcours' && pageContext.nextExercise) {
                    console.log('Tool get_random_exercise: reuse resolveNextExercises recommendation');
                    return {
                        instructions: pageContext.nextExercise.instructions,
                        type: pageContext.nextExercise.type
                    };
                }

                console.log('Tool get_random_exercise called (fallback aléatoire)');
                const { data } = await supabase.from('exercises').select('instructions, content, type').eq('level', userLevel).limit(30);
                if (!data || data.length === 0) return { error: "Désolé, je n'ai pas trouvé d'exercice pour le moment." };
                const random = data[Math.floor(Math.random() * data.length)];
                return {
                    instructions: random.instructions,
                    content: random.content,
                    type: random.type
                };
            }
        }),
        get_tef_info: tool({
            description: 'Infos sur les épreuves du TEF IRN.',
            parameters: z.object({
                section: z.enum(['CO', 'CE', 'EE', 'EO'])
            }),
            execute: async ({ section }) => {
                const info = {
                    'CO': { title: 'Compréhension Orale', desc: "20 min, 20 questions. L'épreuve consiste à écouter des enregistrements et répondre à des questions de compréhension." },
                    'CE': { title: 'Compréhension Écrite', desc: "30 min, 20 questions. Vous devrez lire des documents variés et répondre à des questions." },
                    'EE': { title: 'Expression Écrite', desc: "30 min, 2 sections. Section A : rédaction d'un fait divers. Section B : rédaction d'une lettre formelle ou d'un article." },
                    'EO': { title: 'Expression Orale', desc: "10 min, 2 sections. Section A : obtenir des renseignements. Section B : convaincre un ami." }
                };
                return info[section];
            }
        }),
        get_vocab_list: tool({
            description: 'Donne une liste de mots de vocabulaire par catégorie.',
            parameters: z.object({
                category: z.string().describe('Thème (ex: Travail, Santé, Ville)')
            }),
            execute: async ({ category }) => {
                const { data } = await supabase
                    .from('vocabulary')
                    .select('word, definition')
                    .ilike('category', `%${category}%`)
                    .eq('level', userLevel)
                    .limit(5);

                return { words: data || [] };
            }
        })
      },
      onFinish: async ({ text }: { text: string }) => {
        if (sessionId && text) {
          try {
            await supabase.from('chat_messages').insert({
                session_id: sessionId,
                role: 'assistant',
                content: text
            });
          } catch (dbErr) {
            console.error('DB Error:', dbErr);
          }
        }
      }
    } as any);

    return result.toDataStreamResponse({
      init: {
        headers: {
          'x-vercel-ai-data-stream': 'v1',
        }
      }
    });

  } catch (error: any) {
    console.error('FATAL:', error);
    return new Response(JSON.stringify({ error: 'Internal Error', message: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
    });
  }
}
