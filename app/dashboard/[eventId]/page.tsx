import { notFound, redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import { admin } from "@/lib/supabase";
import { reportToken } from "@/lib/reportToken";
import Link from "next/link";
import CopyButton from "./CopyButton";

export const dynamic = "force-dynamic";

export default async function EventDashboard({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = admin();
  const { data: ev } = await db
    .from("events")
    .select("*,organizations!inner(name,owner_id)")
    .eq("id", eventId)
    .single();
  if (!ev) notFound();

  const org: any = Array.isArray(ev.organizations) ? ev.organizations[0] : ev.organizations;
  if (org?.owner_id !== user.id) notFound();

  const { data: s } = await db.from("sponsor_report").select("*").eq("event_id", eventId).single();
  const { count: certs } = await db
    .from("certificates").select("id", { count: "exact", head: true })
    .eq("event_id", eventId).not("sent_at", "is", null);

  const reportUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/report/${eventId}?k=${reportToken(eventId)}`;
  const regUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/e/${ev.slug}`;
  const date = new Date(ev.starts_at).toLocaleDateString("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" });

  const stat = (n: number, label: string) => (
    <div style={{ background: "#fff", border: "1.5px solid var(--line)", borderRadius: 8, padding: 16 }}>
      <div style={{ fontSize: 32, fontWeight: 700 }}>{n}</div>
      <div className="meta" style={{ margin: 0 }}>{label}</div>
    </div>
  );

  return (
    <main style={{ maxWidth: 700 }}>
      <Link href="/dashboard" style={{ fontSize: 14, color: "var(--mute)" }}>← All events</Link>
      <h1 style={{ marginTop: 8 }}>{ev.title}</h1>
      <p className="meta">{date}{ev.venue ? ` · ${ev.venue}` : ""}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, margin: "16px 0 24px" }}>
        {stat(Number(s?.registered ?? 0), "Registered")}
        {stat(Number(s?.attended ?? 0), "Checked in")}
        {stat(certs ?? 0, "Certificates sent")}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        <Link href={`/dashboard/${eventId}/edit`} style={{ fontWeight: 600 }}>Edit event</Link>
        <Link href={`/dashboard/${eventId}/participants`} style={{ fontWeight: 600 }}>Participants &amp; CSV export</Link>
        <Link href={`/dashboard/${eventId}/teams`} style={{ fontWeight: 600 }}>Teams &amp; matching</Link>
        <Link href={`/checkin/${eventId}`} style={{ fontWeight: 600 }}>Open check-in desk</Link>
        <Link href={`/certificates/${eventId}`} style={{ fontWeight: 600 }}>Send certificates</Link>
        <Link href={`/reminders/${eventId}`} style={{ fontWeight: 600 }}>Reminders</Link>
        <a href={reportUrl} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>Open sponsor report</a>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <CopyButton label="Copy registration link" text={regUrl} />
        <CopyButton label="Copy sponsor report link" text={reportUrl} />
      </div>
    </main>
  );
}
