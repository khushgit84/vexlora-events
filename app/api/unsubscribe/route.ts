import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase";

/**
 * GET /api/unsubscribe?id=<participant_id>&event=<event_id>
 * Marks all pending reminders for this participant+event as unsubscribed.
 * Returns a simple confirmation page.
 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const participantId = u.searchParams.get("id");
  const eventId = u.searchParams.get("event");

  if (!participantId || !eventId) {
    return new Response("<html><body><h1>Invalid link</h1></body></html>", {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  const db = admin();
  await db
    .from("reminders")
    .update({ unsubscribed: true })
    .eq("participant_id", participantId)
    .eq("event_id", eventId)
    .in("status", ["pending", "claimed"]);

  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribed</title>
<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f7f5f0;color:#14213d}
.card{text-align:center;padding:32px;max-width:400px}</style></head>
<body><div class="card"><h1>Unsubscribed</h1><p>You will not receive any more reminders for this event.</p></div></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}
