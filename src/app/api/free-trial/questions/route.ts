import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

// Niveau demandé par l'utilisateur -> examen source (cf. docs/tef-irn-reference.md,
// les 3 examens blancs couvrent A2-B1 / B1 / B1-B2, mapping 1:1 avec le sélecteur
// de niveau A2/B1/B2 du mini-test gratuit).
const LEVEL_TO_EXAM_SLUG: Record<string, string> = {
  A2: "exam-1",
  B1: "exam-2",
  B2: "exam-3",
};

// 2 questions par format, pour représenter la diversité réelle des épreuves
// TEF IRN dans le mini-test (cf. docs/tef-irn-reference.md pour la liste officielle).
const CE_FORMATS = ["article_presse", "court", "long_admin", "trous", "multi_texte"];
const CO_FORMATS = ["annonce", "chronique", "micro_trottoir", "repondeur"];
const QUESTIONS_PER_FORMAT = 2;

interface ExamQuestionRow {
  id: string;
  section: string;
  ce_format: string | null;
  co_format: string | null;
  question: string;
  texte: string | null;
  options: string[];
  correct_answer: string;
  audio_url: string | null;
  max_plays: number | null;
  transcription: string | null;
  highlight_gap: number | null;
  sub_texts: unknown;
  explanation: string | null;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Pioche N questions par format (sans doublon) à partir d'un pool de questions
// d'une même section (CE ou CO).
function pickPerFormat(
  rows: ExamQuestionRow[],
  formats: string[],
  formatKey: "ce_format" | "co_format"
): ExamQuestionRow[] {
  const picked: ExamQuestionRow[] = [];
  for (const format of formats) {
    const pool = rows.filter((row) => row[formatKey] === format);
    picked.push(...shuffle(pool).slice(0, QUESTIONS_PER_FORMAT));
  }
  return picked;
}

function toClientQuestion(row: ExamQuestionRow) {
  return {
    id: row.id,
    section: row.section,
    type: row.section === "CO" ? "audio" : "text",
    question: row.question,
    texte: row.texte ?? undefined,
    options: row.options,
    correctAnswer: row.correct_answer,
    audioUrl: row.audio_url ?? undefined,
    maxPlays: row.max_plays ?? undefined,
    transcription: row.transcription ?? undefined,
    ceFormat: row.ce_format ?? undefined,
    coFormat: row.co_format ?? undefined,
    highlightGap: row.highlight_gap ?? undefined,
    subTexts: row.sub_texts ?? undefined,
    explanation: row.explanation ?? undefined,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const level = searchParams.get("level");

  if (!level || !(level in LEVEL_TO_EXAM_SLUG)) {
    return NextResponse.json(
      { error: "Niveau invalide. Valeurs acceptées : A2, B1, B2." },
      { status: 400 }
    );
  }

  const examSlug = LEVEL_TO_EXAM_SLUG[level];
  const supabase = createAdminClient();

  const { data: exam, error: examError } = await supabase
    .from("exams")
    .select("id, slug, label, level")
    .eq("slug", examSlug)
    .single();

  if (examError || !exam) {
    console.error("Free trial: exam lookup error:", examError);
    return NextResponse.json({ error: "Examen introuvable" }, { status: 500 });
  }

  const { data: questions, error: questionsError } = await supabase
    .from("exam_questions")
    .select(
      "id, section, ce_format, co_format, question, texte, options, correct_answer, audio_url, max_plays, transcription, highlight_gap, sub_texts, explanation"
    )
    .eq("exam_id", exam.id)
    .in("section", ["CO", "CE"]);

  if (questionsError || !questions) {
    console.error("Free trial: questions fetch error:", questionsError);
    return NextResponse.json({ error: "Erreur lors de la récupération des questions" }, { status: 500 });
  }

  const coRows = questions.filter((q) => q.section === "CO");
  const ceRows = questions.filter((q) => q.section === "CE");

  const selectedCo = pickPerFormat(coRows, CO_FORMATS, "co_format");
  const selectedCe = pickPerFormat(ceRows, CE_FORMATS, "ce_format");

  // CO avant CE : on respecte l'ordre de passage réel du TEF IRN.
  const orderedQuestions = [...selectedCo, ...selectedCe].map(toClientQuestion);

  return NextResponse.json({
    level,
    examLabel: exam.label,
    questions: orderedQuestions,
  });
}
