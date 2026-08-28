import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

// Audit sécurité item 3/F (2026-08) : le mini-test gratuit affiche la
// correction question par question, en direct (voir exercice-gratuit/page.tsx).
// Comme /api/free-trial/questions ne renvoie plus correct_answer/explanation
// (item 3), cette route sert cette correction à la demande, une question à la
// fois, sans jamais renvoyer la liste complète des réponses d'un coup.
//
// Route publique par nature (mini-test = visiteurs non inscrits), comme
// /api/free-trial/questions. On revalide que la question appartient bien à
// une section CE/CO (QCM fermé) : EE/EO n'ont pas de correct_answer et ne
// passent jamais par cette route côté client.

interface GradeRequestBody {
  questionId?: string;
  userAnswer?: string;
}

export async function POST(req: Request) {
  try {
    const { questionId, userAnswer } = (await req.json()) as GradeRequestBody;

    if (!questionId || typeof questionId !== "string") {
      return NextResponse.json({ error: "questionId manquant" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: question, error } = await admin
      .from("exam_questions")
      .select("id, section, correct_answer, explanation")
      .eq("id", questionId)
      .in("section", ["CE", "CO"])
      .maybeSingle();

    if (error) {
      console.error("Free trial grade: question lookup error:", error);
      return NextResponse.json({ error: "Erreur lors de la correction" }, { status: 500 });
    }

    if (!question) {
      return NextResponse.json({ error: "Question introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      isCorrect: userAnswer === question.correct_answer,
      correctAnswer: question.correct_answer,
      explanation: question.explanation ?? undefined,
    });
  } catch (error: any) {
    console.error("Free trial grade API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
