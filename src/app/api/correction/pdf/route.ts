import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { jsPDF } from 'jspdf';
import { ExerciseAttempt, WritingFeedback, LegacyFeedback } from '@/types/writing';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { attemptId } = await req.json();

    const { data: attempt, error } = await supabase
      .from('exercise_attempts')
      .select('*, exercise:exercises(*)')
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .single();

    if (error || !attempt) {
      return NextResponse.json({ error: 'Correction non trouvée' }, { status: 404 });
    }

    const typedAttempt = attempt as unknown as ExerciseAttempt;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(0, 38, 84); // French blue
    doc.text('MAITRIS - COACH IA TEF IRN', margin, y);
    y += 10;

    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text('RAPPORT DE CORRECTION DÉTAILLÉ', margin, y);
    y += 15;

    // Date and Info
    doc.setFontSize(10);
    doc.text(`Date : ${new Date(typedAttempt.created_at).toLocaleDateString('fr-FR')}`, margin, y);
    doc.text(`Score : ${typedAttempt.score}/100`, pageWidth - 60, y);
    y += 10;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 15;

    // Subject
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('SUJET :', margin, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    const subject = typedAttempt.answers.subject || typedAttempt.exercise?.instructions || 'Sujet libre';
    const splitSubject = doc.splitTextToSize(subject, pageWidth - margin * 2);
    doc.text(splitSubject, margin, y);
    y += (splitSubject.length * 6) + 10;

    // User Text
    doc.setFont('helvetica', 'bold');
    doc.text('VOTRE RÉDACTION :', margin, y);
    y += 7;
    doc.setFont('helvetica', 'italic');
    const userText = typedAttempt.answers.text;
    const splitUserText = doc.splitTextToSize(userText, pageWidth - margin * 2);
    doc.text(splitUserText, margin, y);
    y += (splitUserText.length * 6) + 15;

    // Feedback
    const feedback = typedAttempt.answers.feedback;
    if (feedback) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(79, 70, 229); // Indigo
      doc.text('ANALYSE DU COACH IA', margin, y);
      y += 10;

      // Comment
      doc.setFontSize(11);
      doc.setTextColor(50, 50, 50);
      doc.setFont('helvetica', 'italic');
      const comment = (feedback as WritingFeedback).conseil_general || (feedback as LegacyFeedback).comment || "";
      const splitComment = doc.splitTextToSize(comment, pageWidth - margin * 2);
      doc.text(splitComment, margin, y);
      y += (splitComment.length * 6) + 15;

      // Annotations/Errors
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('CORRECTIONS DÉTAILLÉES :', margin, y);
      y += 10;

      const errors = (feedback as WritingFeedback).liste_des_erreurs || (feedback as LegacyFeedback).annotations || [];
      errors.forEach((err: any, index: number) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }

        const original = err.texte_original || err.original_fragment;
        const correction = err.texte_corrige || err.correction;
        const explanation = err.explication || err.explanation;
        const type = err.type_erreur || err.type || 'erreur';

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(150, 0, 0);
        doc.text(`#${index + 1} [${type.toUpperCase()}]`, margin, y);
        y += 6;

        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text('Original : ', margin, y);
        doc.setTextColor(150, 50, 50);
        const splitOrig = doc.splitTextToSize(original, pageWidth - margin * 2 - 20);
        doc.text(splitOrig, margin + 20, y);
        y += (splitOrig.length * 6);

        doc.setTextColor(0, 0, 0);
        doc.text('Correction : ', margin, y);
        doc.setTextColor(0, 100, 0);
        const splitCorr = doc.splitTextToSize(correction, pageWidth - margin * 2 - 20);
        doc.text(splitCorr, margin + 25, y);
        y += (splitCorr.length * 6);

        doc.setTextColor(80, 80, 80);
        doc.setFontSize(9);
        const splitExpl = doc.splitTextToSize(explanation, pageWidth - margin * 2);
        doc.text(splitExpl, margin, y);
        y += (splitExpl.length * 5) + 8;
        doc.setFontSize(11);
      });

      // Improved version
      if (y > 240) { doc.addPage(); y = 20; }
      y += 5;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('VERSION AMÉLIORÉE :', margin, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      const improved = (feedback as WritingFeedback).texte_corrige_complet || (feedback as LegacyFeedback).improved || "";
      const splitImproved = doc.splitTextToSize(improved, pageWidth - margin * 2);
      doc.text(splitImproved, margin, y);
    }

    const pdfBase64 = doc.output('datauristring');
    return NextResponse.json({ pdf: pdfBase64 });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Erreur lors de la génération du PDF' }, { status: 500 });
  }
}
