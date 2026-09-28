import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase";
import { requireEventOwner } from "@/lib/auth";
import { reportToken } from "@/lib/reportToken";

// POST { eventId } -> headline numbers + shareable sponsor report link
export async function POST(req: Request) {
  const { eventId } = await req.json();

  try {
    await requireEventOwner(eventId);
  } catch (res) {
    if (res instanceof Response) return NextResponse.json(JSON.parse(await res.text()), { status: res.status });
    return NextResponse.json({ error: "Auth failed" }, { status: 401 });
  }

  const db = admin();
  const { data: ev } = await db.from("events").select("title").eq("id", eventId).single();
  if (!ev) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const { data: s } = await db.from("sponsor_report").select("*").eq("event_id", eventId).single();
  const { count: certs } = await db
    .from("certificates").select("id", { count: "exact", head: true })
    .eq("event_id", eventId).not("sent_at", "is", null);

  return NextResponse.json({
    title: ev.title,
    registered: s?.registered ?? 0,
    attended: s?.attended ?? 0,
    certificates: certs ?? 0,
    reportUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/report/${eventId}?k=${reportToken(eventId)}`,
  });
}
