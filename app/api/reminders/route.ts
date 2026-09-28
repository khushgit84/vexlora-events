import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase";
import { requireEventOwner } from "@/lib/auth";

const HOUR = 3600_000;

// POST { eventId } -> queues day_before, one_hour and thanks reminders. Safe to re-run:
// it only adds rows that are missing (useful after late registrations).
// GET ?eventId= -> counts by status
export async function POST(req: Request) {
  const { eventId } = await req.json();

  try {
    await requireEventOwner(eventId);
  } catch (res) {
    if (res instanceof Response) return NextResponse.json(JSON.parse(await res.text()), { status: res.status });
    return NextResponse.json({ error: "Auth failed" }, { status: 401 });
  }

  const db = admin();
  const { data: ev } = await db.from("events").select("starts_at,ends_at").eq("id", eventId).single();
  if (!ev) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const start = new Date(ev.starts_at).getTime();
  const end = ev.ends_at ? new Date(ev.ends_at).getTime() : start + 4 * HOUR;
  const plan = [
    { template: "day_before", at: start - 24 * HOUR },
    { template: "one_hour", at: start - HOUR },
    { template: "thanks", at: end + HOUR },
  ].filter((p) => p.at > Date.now()); // never queue something already in the past

  const { data: people } = await db.from("participants").select("id,phone").eq("event_id", eventId);
  const { data: existing } = await db.from("reminders").select("participant_id,channel,template").eq("event_id", eventId);
  const have = new Set((existing ?? []).map((r) => `${r.participant_id}|${r.channel}|${r.template}`));

  const rows: object[] = [];
  for (const p of people ?? []) {
    for (const step of plan) {
      const channels = p.phone ? ["email", "whatsapp"] : ["email"];
      for (const channel of channels) {
        if (have.has(`${p.id}|${channel}|${step.template}`)) continue;
        rows.push({ event_id: eventId, participant_id: p.id, channel, template: step.template, send_at: new Date(step.at).toISOString() });
      }
    }
  }
  for (let i = 0; i < rows.length; i += 500) await db.from("reminders").insert(rows.slice(i, i + 500));
  return NextResponse.json({ queued: rows.length });
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const eventId = u.searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 });

  try {
    await requireEventOwner(eventId);
  } catch (res) {
    if (res instanceof Response) return NextResponse.json(JSON.parse(await res.text()), { status: res.status });
    return NextResponse.json({ error: "Auth failed" }, { status: 401 });
  }

  const db = admin();
  const count = async (status: string) =>
    (await db.from("reminders").select("id", { count: "exact", head: true }).eq("event_id", eventId).eq("status", status)).count ?? 0;
  return NextResponse.json({ pending: await count("pending"), sent: await count("sent"), failed: await count("failed") });
}
