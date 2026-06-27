import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
  try {
    const { email, product } = await req.json();

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('merch_wishlist')
      .insert({ email, product: typeof product === 'string' ? product : null });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Wishlist error:", error);
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
