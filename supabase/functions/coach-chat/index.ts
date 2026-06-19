import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"
import { streamText, createDataStreamResponse, tool } from "npm:ai"
import { createOpenAI } from "npm:@ai-sdk/openai"
import { z } from "npm:zod"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-vercel-ai-data-stream',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { messages, sessionId } = await req.json()

    // 1. Fetch User Context
    const [profileRes, errorsRes, progressRes] = await Promise.all([
      supabaseClient.from('profiles').select('*').eq('id', user.id).single(),
      supabaseClient.from('user_errors').select('*').eq('user_id', user.id).order('last_seen_at', { ascending: false }).limit(5),
      supabaseClient.from('user_parcours_progress').select('*, parcours(title)').eq('user_id', user.id)
    ])

    const profile = profileRes.data
    const recentErrors = errorsRes.data
    const parcoursProgress = progressRes.data

    // Credit Check
    if ((profile?.ai_credits || 0) <= 0) {
      return new Response(JSON.stringify({
        error: "Crédits épuisés.",
        message: "Désolé, vous n'avez plus de crédits IA. Veuillez passer au forfait Premium pour continuer."
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. RAG (Simplified search)
    let knowledgeContext = ""
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()?.content || ""

    if (lastUserMessage && lastUserMessage.length > 10) {
      try {
        const { data: knowledge } = await supabaseClient.rpc('match_knowledge_for_coach', {
          query_text: lastUserMessage,
          match_threshold: 0.3,
          match_count: 2
        })
        knowledgeContext = knowledge?.map((k: any) => k.content).join('\n---\n') || ""
      } catch (e) {
        console.error("RAG Error:", e)
      }
    }

    // 3. System Prompt
    const systemPrompt = `Tu es le Coach Maitris, expert TEF IRN.
Utilisateur: ${profile?.full_name || 'Étudiant'} (Niveau: ${profile?.current_level || 'A2'}).
Erreurs à surveiller: ${recentErrors?.map((e: any) => e.category).join(', ') || 'n/a'}.
Context TEF: ${knowledgeContext}

CONSIGNES:
- Français clair, bienveillant.
- Max 3-4 phrases par réponse.
- Si l'élève fait une faute, corrige-la subtilement.
- Utilise le Markdown.`;

    // 4. Persistence
    let currentSessionId = sessionId
    if (!currentSessionId) {
      const { data: newSession } = await supabaseClient
        .from('chat_sessions')
        .insert({ user_id: user.id, title: lastUserMessage.substring(0, 50) || "Nouveau chat" })
        .select()
        .single()
      currentSessionId = newSession?.id
    }

    const openai = createOpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') })

    // 5. Data Stream Response
    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: openai('gpt-4o-mini'),
          system: systemPrompt,
          messages,
          tools: {
            generate_exercise: tool({
              description: 'Génère un exercice.',
              parameters: z.object({
                type: z.enum(['qcm', 'trous']),
                title: z.string(),
                questions: z.array(z.any())
              }),
              execute: async (args) => {
                await supabaseClient.from('coach_generated_exercises').insert({
                  user_id: user.id,
                  session_id: currentSessionId,
                  type: args.type,
                  content: args
                })
                return { result: "Exercice créé !" }
              }
            })
          },
          onFinish: async ({ text }) => {
            if (text && currentSessionId) {
              await supabaseClient.from('chat_messages').insert({
                session_id: currentSessionId,
                role: 'assistant',
                content: text
              })
              await supabaseClient.rpc('decrement_ai_credits', { user_id: user.id, amount: 1 })
            }
          }
        })
        result.mergeIntoDataStream(dataStream)
      },
      onError: (error) => {
        console.error('Stream error:', error)
        return 'Erreur de connexion avec le Coach.'
      },
    })

  } catch (error: any) {
    console.error('Global error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
