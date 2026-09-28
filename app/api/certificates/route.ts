import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase";
import { requireEventOwner } from "@/lib/auth";
import { makeCertificate } from "@/lib/certificate";
import { sendCertificateEmail } from "@/lib/mail";

export const maxDuration = 60;

type P = { id: string; name: string; email: string };

// POST { eventId, limit?, includeAll? }
// Processes one batch. Call repeatedly until `remaining` is 0.
export async function POST(req: Request) {
  const { eventId, limit = 15, includeAll = false } = await req.json();

  try {
    await requireEventOwner(eventId);
  } catch (res) {
    if (res instanceof Response) return NextResponse.json(JSON.parse(await res.text()), { status: res.status });
    return NextResponse.json({ error: "Auth failed" }, { status: 401 });
  }

  const db = admin();
  const site = process.env.NEXT_PUBLIC_SITE_URL!;

  const { data: ev } = await db
    .from("events")
    .select("title,starts_at,certificate_text,certificate_template_url,organizations(name)")
    .eq("id", eventId)
    .single();
  if (!ev) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  const orgRaw: any = ev.organizations;
  const orgName = (Array.isArray(orgRaw) ? orgRaw[0]?.name : orgRaw?.name) ?? "the organisers";
  const date = new Date(ev.starts_at).toLocaleDateString("en-IN", { dateStyle: "long" });

  // Who should get a certificate: checked-in people, or everyone registered.
  let pool: P[] = [];
  if (includeAll) {
    const { data } = await db.from("participants").select("id,name,email").eq("event_id", eventId);
    pool = data ?? [];
  } else {
    const { data } = await db.from("checkins").select("participants(id,name,email)").eq("event_id", eventId);
    pool = (data ?? []).map((r: any) => (Array.isArray(r.participants) ? r.participants[0] : r.participants)).filter(Boolean);
  }

  const { data: done } = await db
    .from("certificates").select("participant_id").eq("event_id", eventId).not("sent_at", "is", null);
  const doneIds = new Set((done ?? []).map((d) => d.participant_id));
  const todo = pool.filter((p) => !doneIds.has(p.id));

  let sent = 0, failed = 0;
  for (const p of todo.slice(0, limit)) {
    try {
      const { data: cert, error } = await db
        .from("certificates")
        .upsert({ participant_id: p.id, event_id: eventId }, { onConflict: "participant_id" })
        .select("verify_code").single();
      if (error || !cert) throw error;

      const certText = ev.certificate_text || "for participating in {{event}}";
      const pdf = await makeCertificate({
        name: p.name, eventTitle: ev.title, orgName, date,
        code: cert.verify_code, verifyUrl: `${site}/v/${cert.verify_code}`,
        certificateText: certText,
        templateUrl: ev.certificate_template_url || undefined,
      });

      const path = `${eventId}/${cert.verify_code}.pdf`;
      const up = await db.storage.from("certificates").upload(path, pdf, { contentType: "application/pdf", upsert: true });
      if (up.error) throw up.error;
      const pdfUrl = db.storage.from("certificates").getPublicUrl(path).data.publicUrl;
      await db.from("certificates").update({ pdf_url: pdfUrl }).eq("participant_id", p.id);

      const ok = await sendCertificateEmail({ to: p.email, name: p.name, eventTitle: ev.title, pdfUrl, pdf });
      if (!ok) throw new Error("email failed");
      await db.from("certificates").update({ sent_at: new Date().toISOString() }).eq("participant_id", p.id);
      sent++;
    } catch (e) {
      console.error(`Certificate error for ${p.email}:`, e);
      failed++;
    }
  }

  const remaining = Math.max(0, todo.length - sent - failed);
  return NextResponse.json({ sent, failed, remaining, total: pool.length });
}
