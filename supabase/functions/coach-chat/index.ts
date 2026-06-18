import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"
import { streamText, createDataStreamResponse, tool } from "npm:ai"
import { createOpenAI } from "npm:@ai-sdk/openai"
import { z } from "npm:zod"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { messages, sessionId } = await req.json()

    // 1. Fetch Rich Context
    const [profileRes, errorsRes, progressRes] = await Promise.all([
      supabaseClient.from('profiles').select('*').eq('id', user.id).single(),
      supabaseClient.from('user_errors').select('*').eq('user_id', user.id).order('last_seen_at', { ascending: false }).limit(10),
      supabaseClient.from('user_parcours_progress').select('*, parcours(title)').eq('user_id', user.id)
    ])

    const profile = profileRes.data
    const recentErrors = errorsRes.data
    const parcoursProgress = progressRes.data

    // Credit Check
    if ((profile?.ai_credits || 0) <= 0) {
      return new Response(JSON.stringify({
        error: "Désolé, vous n'avez plus de crédits IA. Veuillez passer au forfait Premium pour continuer à discuter avec moi !"
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. RAG
    let knowledgeContext = ""
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()?.content || ""

    if (lastUserMessage) {
      const embResp = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: lastUserMessage
        })
      })
      const embData = await embResp.json()
      if (embData.data && embData.data[0]) {
        const embedding = embData.data[0].embedding
        const { data: knowledge } = await supabaseClient.rpc('match_knowledge_for_coach', {
          query_embedding: embedding,
          query_text: lastUserMessage,
          match_threshold: 0.4,
          match_count: 3
        })
        knowledgeContext = knowledge?.map((k: any) => k.content).join('\n---\n') || ""
      }
    }

    // 3. System Prompt
    const systemPrompt = `
Tu es le Coach Maitris, un coach pédagogique expert du TEF IRN. Ton ton est extrêmement bienveillant, encourageant, patient et structuré.

OBJECTIF: Aider l'élève à réussir son examen TEF IRN (A2/B1).

INFOS ÉLÈVE:
- Nom: ${profile?.full_name || 'Étudiant'}
- Niveau actuel: ${profile?.current_level || 'A2'}
- Cible: ${profile?.goal_level || 'B1'}
- Erreurs récurrentes: ${recentErrors?.map((e: any) => `${e.category}`).join(', ') || 'Aucune identifiée'}
- Progrès: ${parcoursProgress?.map((p: any) => `${p.parcours.title} (${p.progress_percentage}%)`).join(', ') || 'Débutant'}

CONNAISSANCES TEF:
${knowledgeContext}

CONSIGNES:
- Parle en français clair et adapté au niveau de l'élève (A2/B1).
- Sois bref et efficace.
- Si l'élève fait une faute dans sa question, corrige-la gentiment en expliquant pourquoi.
- Utilise le Markdown (gras, listes) pour rendre tes réponses lisibles.
- Ne donne pas de réponses trop longues.
- Si l'élève demande un exercice, utilise l'outil generate_exercise.
`;

    // 4. Persistence: Handle Session ID
    let currentSessionId = sessionId
    if (!currentSessionId) {
      const { data: newSession } = await supabaseClient
        .from('chat_sessions')
        .insert({ user_id: user.id, title: lastUserMessage.substring(0, 40) || "Discussion Coach" })
        .select()
        .single()
      currentSessionId = newSession?.id
    }

    // 5. Initialize OpenAI Provider
    const openai = createOpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    })

    // 6. Stream Text with AI SDK
    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: openai('gpt-4o-mini'),
          system: systemPrompt,
          messages,
          tools: {
            generate_exercise: tool({
              description: 'Génère un exercice interactif (QCM, trous, etc.).',
              parameters: z.object({
                type: z.enum(['qcm', 'trous', 'reformulage']),
                title: z.string(),
                instructions: z.string(),
                questions: z.array(z.object({
                  question: z.string(),
                  options: z.array(z.string()).optional(),
                  answer: z.string(),
                  explanation: z.string()
                }))
              }),
              execute: async (args) => {
                await supabaseClient.from('coach_generated_exercises').insert({
                  user_id: user.id,
                  session_id: currentSessionId,
                  type: args.type,
                  content: args
                })
                return { status: 'Exercise created and saved to user profile.' }
              }
            }),
            correct_text: tool({
              description: 'Analyse et corrige une production écrite.',
              parameters: z.object({
                text: z.string(),
              }),
              execute: async ({ text }) => {
                 return { message: "Correction en cours..." }
              }
            })
          },
          onFinish: async ({ text, toolCalls }) => {
            // Save Assistant Message
            if (text) {
              await supabaseClient.from('chat_messages').insert({
                session_id: currentSessionId,
                role: 'assistant',
                content: text
              })
            }

            // Deduct credits
            const cost = toolCalls && toolCalls.length > 0 ? 3 : 1
            await supabaseClient.rpc('decrement_ai_credits', { user_id: user.id, amount: cost })
          }
        })

        result.mergeIntoDataStream(dataStream)
      },
      onError: (error) => {
        console.error('Stream Error:', error)
        return 'Une erreur est survenue.'
      }
    })

  } catch (error: any) {
    console.error('Edge Function Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
