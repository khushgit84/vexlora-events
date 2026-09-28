import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase";
import { requireEventOwner } from "@/lib/auth";

export async function POST(req: Request) {
  const { qr, eventId } = await req.json();

  let user;
  try {
    ({ user } = await requireEventOwner(eventId));
  } catch (res) {
    if (res instanceof Response) return NextResponse.json(JSON.parse(await res.text()), { status: res.status });
    return NextResponse.json({ status: "error", message: "Auth failed" }, { status: 401 });
  }

  const db = admin();
  const { data: p } = await db
    .from("participants")
    .select("id,name,college,event_id")
    .eq("qr_token", qr)
    .single();

  if (!p || p.event_id !== eventId)
    return NextResponse.json({ status: "invalid", message: "Ticket not found for this event" });

  const { error } = await db.from("checkins").insert({
    participant_id: p.id,
    event_id: eventId,
    checked_in_by: user.id,
  });
  if (error?.code === "23505")
    return NextResponse.json({ status: "duplicate", message: `${p.name} is already checked in` });
  if (error) return NextResponse.json({ status: "error", message: "Could not save check-in" }, { status: 500 });

  return NextResponse.json({ status: "ok", message: `${p.name}${p.college ? `, ${p.college}` : ""}` });
}
