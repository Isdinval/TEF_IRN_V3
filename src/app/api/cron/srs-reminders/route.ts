import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

const RESEND_API_URL = "https://api.resend.com/emails";
const BANNER_URL =
  "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/email_template_images/banniere_template_article.png";

function buildReminderEmail(dueExercises: number, dueVocab: number) {
  const parts: string[] = [];
  if (dueExercises > 0) parts.push(`${dueExercises} exercice${dueExercises > 1 ? "s" : ""}`);
  if (dueVocab > 0) parts.push(`${dueVocab} carte${dueVocab > 1 ? "s" : ""} de vocabulaire`);
  const subject = `${parts.join(" et ")} à réviser sur LlamaKusi`;

  const exerciseBlock =
    dueExercises > 0
      ? `
    <tr>
      <td style="padding:0 32px 8px;">
        <p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:#333333;">
          <strong>${dueExercises} exercice${dueExercises > 1 ? "s" : ""}</strong> ${dueExercises > 1 ? "sont prêts" : "est prêt"} à être révisé${dueExercises > 1 ? "s" : ""}.
        </p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/tef-irn/practice?mode=review"
           style="display:inline-block;padding:10px 20px;margin-bottom:20px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">
          Réviser mes exercices
        </a>
      </td>
    </tr>`
      : "";

  const vocabBlock =
    dueVocab > 0
      ? `
    <tr>
      <td style="padding:0 32px 8px;">
        <p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:#333333;">
          <strong>${dueVocab} carte${dueVocab > 1 ? "s" : ""} de vocabulaire</strong> ${dueVocab > 1 ? "sont prêtes" : "est prête"} à être révisée${dueVocab > 1 ? "s" : ""}.
        </p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/tef-irn/vocab?review=true"
           style="display:inline-block;padding:10px 20px;margin-bottom:20px;background-color:#16a34a;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">
          Réviser mon vocabulaire
        </a>
      </td>
    </tr>`
      : "";

  const html = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
          <tr>
            <td>
              <img src="${BANNER_URL}" alt="LlamaKusi" width="560" style="display:block;width:100%;max-width:560px;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 8px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#111111;">Bonjour 👋,</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#333333;">
                Chez <strong>LlamaKusi</strong>, on garde un œil sur votre planning de révision pour que rien ne s'accumule avant votre TEF IRN.
                Petit point du jour :
              </p>
            </td>
          </tr>
          ${exerciseBlock}
          ${vocabBlock}
          <tr>
            <td style="padding:8px 32px 24px;">
              <p style="margin:0;font-size:14px;line-height:1.5;color:#555555;">
                À bientôt, et bon courage pour la suite !<br/>
                L'équipe LlamaKusi 🦙
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #eeeeee;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#999999;">
                Vous recevez cet email car les rappels de révision sont activés dans vos préférences LlamaKusi.
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/tef-irn/settings" style="color:#999999;">Gérer mes notifications</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;

  return { subject, html };
}

// Vercel Cron déclenche uniquement des requêtes GET.
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Resend not configured" }, { status: 500 });
  }

  const supabase = createAdminClient();
  const { data: reminders, error } = await supabase.rpc("get_due_srs_reminders");

  if (error) {
    console.error("get_due_srs_reminders error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const reminder of reminders ?? []) {
    const { subject, html } = buildReminderEmail(
      reminder.due_exercises_count,
      reminder.due_vocab_count
    );

    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: [reminder.email],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      failed++;
      const errText = await res.text();
      console.error("Resend error for", reminder.user_id, errText);
      errors.push(errText);
      continue;
    }

    sent++;
    await supabase
      .from("user_preferences")
      .update({ last_srs_reminder_at: new Date().toISOString() })
      .eq("user_id", reminder.user_id);
  }

  return NextResponse.json({ sent, failed, total: reminders?.length ?? 0, errors });
}
