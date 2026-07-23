import { NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';
import { createClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });
    }

    const { type, level } = await req.json(); // ex: type='qcm', level='B1'

    const openai = getOpenAIClient();
    if (!openai) throw new Error("OpenAI non configuré");

    const prompt = `
      Génère un exercice de type ${type} pour le niveau ${level} du TEF IRN.
      Format JSON strict :
      {
        "instructions": "consigne claire",
        "category": "grammaire|vocabulaire|conjugaison",
        "content": {
          "questions": ["phrase 1", "phrase 2"],
          "options": [["opt1", "opt2", "opt3", "opt4"], ["opt1", "opt2", "opt3", "opt4"]],
          "correct_answers": [0, 2]
        }
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const exerciseData = JSON.parse(response.choices[0].message.content || '{}');

    // Sauvegarder en base
    const { data, error } = await supabase.from('exercises').insert({
      type,
      level,
      instructions: exerciseData.instructions,
      content: exerciseData.content,
      is_ai_generated: true
    }).select().single();

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
