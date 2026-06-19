import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export const runtime = 'edge';

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
    const { messages, sessionId, pageContext } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, current_level, goal_level')
        .eq('id', user.id)
        .single();

    let knowledgeContext = "";
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    if (lastUserMessage.length > 5) {
      try {
        const { data: knowledge } = await supabase.rpc('match_knowledge_for_coach', {
            query_text: lastUserMessage,
            match_count: 2
        });
        knowledgeContext = knowledge?.map((k: any) => `[${k.source}] ${k.content}`).join('\n---\n') || "";
      } catch (err) {
        console.error('RAG RPC error:', err);
      }
    }

    const systemPrompt = `Tu es le Coach Maitris, assistant IA expert TEF IRN.
Utilisateur: ${profile?.full_name || 'Étudiant'} (Niveau: ${profile?.current_level || 'A2'})
Page: ${pageContext || 'Dashboard'}
Context: ${knowledgeContext}

Consignes: Français bienveillant, concis (3-4 phrases), corrige les fautes.`;

    const openai = createOpenAI({ apiKey });

    const result = await streamText({
      model: openai('gpt-4o-mini') as any,
      system: systemPrompt,
      messages,
      onFinish: async ({ text }) => {
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
    });

    const response = result.toDataStreamResponse();
    response.headers.set('x-vercel-ai-data-stream', 'v1');
    return response;

  } catch (error: any) {
    console.error('FATAL:', error);
    return new Response(JSON.stringify({ error: 'Internal Error', message: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
    });
  }
}
