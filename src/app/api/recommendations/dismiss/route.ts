import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { recommendationId } = await req.json();
    if (!recommendationId) {
      return NextResponse.json({ error: "recommendationId manquant" }, { status: 400 });
    }

    const { error } = await supabase
      .from('recommendations')
      .update({ status: 'dismissed' })
      .eq('id', recommendationId)
      .eq('user_id', user.id); // défense en profondeur : ne peut dismiss que ses propres recos

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Dismiss recommendation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
