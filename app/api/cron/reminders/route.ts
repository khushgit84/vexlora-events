import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase";
import { buildMessage, Template } from "@/lib/reminders";
import { sendEmail, sendWhatsApp } from "@/lib/notify";

export const maxDuration = 60;

// Call every 5 minutes with header:  Authorization: Bearer <CRON_SECRET>
// Double-send safe: claims rows atomically before processing.
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = admin();
  const site = process.env.NEXT_PUBLIC_SITE_URL!;

  // Atomically claim up to 40 pending rows that are due.
  // Uses UPDATE ... WHERE status='pending' ... RETURNING to prevent
  // two overlapping cron runs from processing the same row.
  const { data: claimed, error: claimErr } = await db
    .from("reminders")
    .update({ status: "claimed" as any, claimed_at: new Date().toISOString() })
    .eq("status", "pending")
    .eq("unsubscribed", false)
    .lte("send_at", new Date().toISOString())
    .limit(40)
    .select("id,channel,template,participant_id,event_id");

  if (claimErr) {
    console.error("Claim error:", claimErr);
    return NextResponse.json({ error: "Claim failed" }, { status: 500 });
  }

  if (!claimed || claimed.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0 });
  }

  // Fetch participant + event data for each claimed row
  const participantIds = [...new Set(claimed.map((r) => r.participant_id))];
  const eventIds = [...new Set(claimed.map((r) => r.event_id))];

  const { data: participants } = await db
    .from("participants")
    .select("id,name,email,phone,qr_token")
    .in("id", participantIds);
  const pMap = new Map((participants ?? []).map((p) => [p.id, p]));

  const { data: events } = await db
    .from("events")
    .select("id,title,starts_at,venue")
    .in("id", eventIds);
  const eMap = new Map((events ?? []).map((e) => [e.id, e]));

  let sent = 0, failed = 0;
  for (const r of claimed) {
    const p = pMap.get(r.participant_id);
    const ev = eMap.get(r.event_id);
    if (!p || !ev) {
      await db.from("reminders").update({ status: "failed", error: "Missing participant or event" }).eq("id", r.id);
      failed++;
      continue;
    }
    try {
      const { subject, line } = buildMessage(r.template as Template, ev);
      const ticket = `${site}/t/${p.qr_token}`;
      const unsubUrl = `${site}/api/unsubscribe?id=${r.participant_id}&event=${r.event_id}`;
      if (r.channel === "email") {
        await sendEmail(p.email, subject,
          `<p>Hi ${p.name},</p><p>${line}</p><p><a href="${ticket}">Open your ticket</a></p>` +
          `<p style="font-size:12px;color:#999;margin-top:24px;"><a href="${unsubUrl}">Unsubscribe from reminders for this event</a></p>`
        );
      } else {
        await sendWhatsApp(p.phone!, p.name, line, ticket);
      }
      await db.from("reminders").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", r.id);
      sent++;
    } catch (e: any) {
      await db.from("reminders").update({ status: "failed", error: String(e?.message ?? e).slice(0, 200) }).eq("id", r.id);
      failed++;
    }
  }
  return NextResponse.json({ sent, failed });
}
