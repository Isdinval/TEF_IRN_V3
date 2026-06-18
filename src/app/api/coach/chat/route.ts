import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/coach-chat`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(errorJson, { status: response.status });
      } catch {
        return new Response(errorText, { status: response.status });
      }
    }

    // Forward the stream with appropriate headers for Vercel AI SDK
    return new Response(response.body, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'text/plain; charset=utf-8',
        'x-vercel-ai-data-stream': 'v1',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Coach API Proxy Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
