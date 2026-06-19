import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { messages, sessionId, pageContext } = await req.json();

    // 1. Fetch User Context
    const [profileRes, errorsRes, progressRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('user_errors').select('*').eq('user_id', user.id).order('last_seen_at', { ascending: false }).limit(5),
      supabase.from('user_parcours_progress').select('*, parcours(title)').eq('user_id', user.id)
    ]);

    const profile = profileRes.data;
    const recentErrors = errorsRes.data;
    const parcoursProgress = progressRes.data;

    // 2. RAG
    let knowledgeContext = "";
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()?.content || "";

    if (lastUserMessage && lastUserMessage.length > 5) {
      try {
        const { data: knowledge } = await supabase.rpc('match_knowledge_for_coach', {
          query_text: lastUserMessage,
          match_threshold: 0.2,
          match_count: 4
        });
        knowledgeContext = knowledge?.map((k: any) => `[${k.source}] ${k.content}`).join('\n---\n') || "";
      } catch (e) {
        console.error("RAG Error:", e);
      }
    }

    // 3. System Prompt
    const systemPrompt = `Tu es le Coach Maitris, l'assistant IA ultra-intelligent expert du TEF IRN.
Utilisateur: ${profile?.full_name || 'Étudiant'}
Niveau CEFR: ${profile?.current_level || 'A2'}
Objectif: ${profile?.goal_level || 'B1'}
Page actuelle: ${pageContext || 'Dashboard'}

Context Pédagogique:
- Erreurs récentes: ${recentErrors?.map((e: any) => e.category).join(', ') || 'n/a'}
- Progrès: ${parcoursProgress?.map((p: any) => `${p.parcours?.title} (${p.progress_percentage}%)`).join(', ') || 'n/a'}
- Savoir TEF: ${knowledgeContext}

CONSIGNES:
1. Sois bienveillant, encourageant et concis (max 4 phrases par réponse standard).
2. Ton but est d'aider à réussir le TEF IRN. Réponds en français.
3. Si l'élève fait une faute dans sa question, corrige-la gentiment.
4. Utilise le Markdown pour la structure.
5. Ne propose un exercice que si c'est pertinent ou demandé.`;

    // 4. Persistence Setup
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const { data: newSession } = await supabase
        .from('chat_sessions')
        .insert({
            user_id: user.id,
            title: lastUserMessage.substring(0, 50) || "Nouveau chat",
            metadata: { page: pageContext }
        })
        .select()
        .single();
      currentSessionId = newSession?.id;
    }

    // 5. Data Stream Response
    const result = await streamText({
      model: openai('gpt-4o-mini') as any,
      system: systemPrompt,
      messages,
      tools: {
        generate_exercise: {
          description: 'Génère un exercice personnalisé selon le besoin (Grammaire, Vocabulaire, TEF).',
          parameters: z.object({
            type: z.enum(['qcm', 'trous', 'reécriture']),
            title: z.string(),
            instructions: z.string(),
            questions: z.array(z.object({
                question: z.string(),
                options: z.array(z.string()).optional(),
                answer: z.string(),
                explanation: z.string()
            }))
          }),
          execute: async (args: any) => {
            const { data } = await supabase.from('coach_generated_exercises').insert({
              user_id: user.id,
              session_id: currentSessionId,
              type: args.type,
              content: args
            }).select().single();

            await supabase.rpc('decrement_ai_credits', { user_id: user.id, amount: 2 });

            return {
                result: "Exercice généré avec succès !",
                exerciseId: data?.id,
                message: `J'ai préparé un exercice de ${args.type} pour toi : **${args.title}**.`
            };
          }
        },
        correct_text: {
            description: 'Analyse et corrige un texte écrit par l\'utilisateur.',
            parameters: z.object({
                text: z.string(),
                focus: z.string().optional()
            }),
            execute: async ({ text, focus }: any) => {
                await supabase.rpc('decrement_ai_credits', { user_id: user.id, amount: 1 });
                return {
                    message: "Analyse terminée.",
                    suggestions: "C'est une excellente production. Attention cependant aux accords."
                };
            }
        },
        search_detailed_knowledge: {
            description: 'Recherche approfondie dans la base de connaissances TEF.',
            parameters: z.object({
                query: z.string()
            }),
            execute: async ({ query }: any) => {
                const { data } = await supabase.rpc('match_knowledge_for_coach', {
                    query_text: query,
                    match_count: 8
                });
                return { data };
            }
        }
      },
      onFinish: async ({ text, toolResults }: any) => {
        if (currentSessionId) {
          await supabase.from('chat_messages').insert({
            session_id: currentSessionId,
            role: 'assistant',
            content: text || (toolResults?.length ? "J'utilise un outil pour vous aider..." : ""),
            metadata: { toolResults }
          });
        }
      }
    } as any);

    return result.toTextStreamResponse();

  } catch (error: any) {
    console.error('Coach API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
