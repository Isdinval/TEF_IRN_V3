import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { OpenAI } from "https://esm.sh/openai@4"

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

    // Credit Check (Degraded mode)
    if ((profile?.ai_credits || 0) <= 0) {
      return new Response(JSON.stringify({
        content: "Désolé, vous n'avez plus de crédits IA. Veuillez passer au forfait Premium pour continuer à discuter avec moi !",
        sessionId: sessionId,
        degraded: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. RAG
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()?.content || ""
    const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') })

    let knowledgeContext = ""
    let ragSources: any[] = []
    if (lastUserMessage) {
      const embeddingRes = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: lastUserMessage,
      })
      const embedding = embeddingRes.data[0].embedding
      const { data: knowledge } = await supabaseClient.rpc('match_knowledge_for_coach', {
        query_embedding: embedding,
        query_text: lastUserMessage,
        match_threshold: 0.4,
        match_count: 3
      })
      knowledgeContext = knowledge?.map((k: any) => k.content).join('\n---\n') || ""
      ragSources = knowledge?.map((k: any) => ({ id: k.id, metadata: k.metadata })) || []
    }

    // 2.5 Summarization & Token limit
    let processedMessages = messages;
    if (messages.length > 12) {
      try {
        const summaryPrompt = [
          { role: 'system', content: 'Résume la conversation précédente en 2 phrases, en extrayant les points de blocage de l\'élève.' },
          ...messages.slice(0, -5)
        ];
        const summaryResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: summaryPrompt as any,
          max_tokens: 150
        });
        const summary = summaryResponse.choices[0].message.content;
        processedMessages = [
          { role: 'system', content: `Résumé de la conversation précédente : ${summary}` },
          ...messages.slice(-5)
        ];
      } catch (e) {
        console.error("Summarization failed", e);
        processedMessages = messages.slice(-10); // Fallback to last 10 messages
      }
    }

    // 3. System Prompt
    const systemPrompt = `
Tu es le Coach Maitris, l'assistant expert TEF IRN. Ton ton est bienveillant, encourageant et structuré.

INFOS ÉLÈVE:
- Nom: ${profile?.full_name || 'Étudiant'}
- Niveau: ${profile?.current_level || 'A2'} (Cible: ${profile?.goal_level || 'B1'})
- Crédits restants: ${profile?.ai_credits}
- Erreurs récentes: ${recentErrors?.map((e: any) => `${e.category} (${e.sub_category || ''})`).join(', ')}
- Progrès Parcours: ${parcoursProgress?.map((p: any) => `${p.parcours.title} (${p.progress_percentage}%)`).join(', ')}

CONNAISSANCES TEF (RAG):
${knowledgeContext}

OUTILS:
- generate_exercise: Obligatoire si l'élève demande un exercice. Structure JSON propre.
- correct_text: Utilise pour corriger une phrase ou un paragraphe.
- get_weak_points: Analyse les erreurs de l'élève pour lui donner un plan d'attaque.

CONSIGNES:
- Français exclusivement (sauf si l'élève est totalement bloqué).
- Si l'élève approche de 0 crédit (1-2), mentionne-le avec tact.
- Structure tes réponses avec du Markdown (gras, listes).
`;

    // 4. Persistence: Session
    let currentSessionId = sessionId
    if (!currentSessionId) {
      const { data: newSession } = await supabaseClient
        .from('chat_sessions')
        .insert({ user_id: user.id, title: lastUserMessage.substring(0, 40) || "Discussion Coach" })
        .select()
        .single()
      currentSessionId = newSession?.id
    }

    // Save user message (if first of session)
    if (lastUserMessage && !sessionId) {
       await supabaseClient.from('chat_messages').insert({
         session_id: currentSessionId,
         role: 'user',
         content: lastUserMessage
       })
    }

    // 5. OpenAI Call with Streaming
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, ...processedMessages],
      stream: true,
      tools: [
        {
          type: "function",
          function: {
            name: "generate_exercise",
            description: "Génère un exercice interactif adapté au niveau de l'élève.",
            parameters: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["qcm", "trous", "reformulage"] },
                title: { type: "string" },
                instructions: { type: "string" },
                questions: { type: "array", items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    options: { type: "array", items: { type: "string" } },
                    answer: { type: "string" },
                    explanation: { type: "string" }
                  }
                }}
              },
              required: ["type", "title", "questions"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "get_weak_points",
            description: "Analyse les erreurs passées et recommande des points à réviser.",
            parameters: { type: "object", properties: {} }
          }
        },
        {
          type: "function",
          function: {
            name: "correct_text",
            description: "Analyse et corrige une production écrite.",
            parameters: {
              type: "object",
              properties: {
                text: { type: "string" },
                subject: { type: "string" }
              },
              required: ["text"]
            }
          }
        }
      ] as any
    })

    const encoder = new TextEncoder()
    let fullAssistantResponse = ""
    let hasUsedTools = false
    let currentToolCalls: any[] = []

    const customStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || ""
            const deltaToolCalls = chunk.choices[0]?.delta?.tool_calls

            if (content) {
              fullAssistantResponse += content
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content, sessionId: currentSessionId, sources: ragSources.length > 0 ? ragSources : undefined })}\n\n`))
            }

            if (deltaToolCalls) {
              hasUsedTools = true
              deltaToolCalls.forEach((tc: any) => {
                if (tc.index !== undefined) {
                  if (!currentToolCalls[tc.index]) currentToolCalls[tc.index] = { id: tc.id, function: { name: "", arguments: "" } }
                  if (tc.id) currentToolCalls[tc.index].id = tc.id
                  if (tc.function?.name) currentToolCalls[tc.index].function.name = tc.function.name
                  if (tc.function?.arguments) currentToolCalls[tc.index].function.arguments += tc.function.arguments
                }
              })
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ tool_calls: deltaToolCalls, sessionId: currentSessionId })}\n\n`))
            }
          }

          // Persist Assistant Response
          if (fullAssistantResponse) {
            await supabaseClient.from('chat_messages').insert({
              session_id: currentSessionId,
              role: 'assistant',
              content: fullAssistantResponse
            })
          }

          // Process Tool Logic (e.g. Save Generated Exercise)
          if (hasUsedTools) {
             for (const tc of currentToolCalls.filter(x => x)) {
               if (tc.function.name === 'generate_exercise') {
                  try {
                    const args = JSON.parse(tc.function.arguments)
                    await supabaseClient.from('coach_generated_exercises').insert({
                      user_id: user.id,
                      session_id: currentSessionId,
                      type: args.type,
                      content: args
                    })
                  } catch (e) { console.error("Tool Args Error", e) }
               }
             }
          }

          // Deduct Credits
          const cost = hasUsedTools ? 3 : 1
          await supabaseClient.rpc('decrement_ai_credits', { user_id: user.id, amount: cost })

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (e) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Une erreur est survenue lors de la génération de la réponse." })}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(customStream, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
