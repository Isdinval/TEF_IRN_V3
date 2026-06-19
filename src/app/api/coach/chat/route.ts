import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/coach-chat`;

    console.log('Proxying to Edge Function with body:', JSON.stringify(body).slice(0, 200) + '...');

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify(body),
    });

    let responseData;
    const responseText = await response.text();

    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { content: responseText };
    }

    if (!response.ok) {
      console.error('Edge Error:', response.status, responseData);
      return NextResponse.json({ error: responseData.error || 'Erreur Coach' }, { status: response.status });
    }

    // Format attendu par le frontend (très important)
    return NextResponse.json({
      content: responseData.content || responseData.message || "Réponse reçue",
      role: "assistant",
      id: Date.now().toString()
    });

  } catch (error: any) {
    console.error('Proxy Exception:', error);
    return NextResponse.json({ 
      error: 'Erreur de connexion au Coach',
      message: error.message 
    }, { status: 500 });
  }
}
