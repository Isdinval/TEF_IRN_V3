import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

const RESEND_API_URL = "https://api.resend.com/emails";

function buildReminderEmail(dueCount: number) {
  const subject = `${dueCount} carte${dueCount > 1 ? "s" : ""} à réviser sur LlamaKusi`;
  const html = `
    <p>Bonjour,</p>
    <p>Vous avez <strong>${dueCount} carte${dueCount > 1 ? "s" : ""}</strong> de révision prête${dueCount > 1 ? "s" : ""} sur LlamaKusi.</p>
    <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/tef-irn/vocab">Réviser maintenant</a></p>
    <p style="font-size:12px;color:#888;">
      Vous ne souhaitez plus recevoir ces rappels ?
      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/tef-irn/settings">Gérer mes notifications</a>
    </p>
  `;
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

  for (const reminder of reminders ?? []) {
    const { subject, html } = buildReminderEmail(reminder.due_count);

    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: reminder.email,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      failed++;
      console.error("Resend error for", reminder.user_id, await res.text());
      continue;
    }

    sent++;
    await supabase
      .from("user_preferences")
      .update({ last_srs_reminder_at: new Date().toISOString() })
      .eq("user_id", reminder.user_id);
  }

  return NextResponse.json({ sent, failed, total: reminders?.length ?? 0 });
}
