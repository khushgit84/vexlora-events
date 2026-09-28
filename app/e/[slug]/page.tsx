import { notFound } from "next/navigation";
import { admin } from "@/lib/supabase";
import RegisterForm from "./RegisterForm";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = admin();
  const { data: event } = await db.from("events").select("*").eq("slug", slug).single();
  if (!event) notFound();

  const when = new Date(event.starts_at).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Kolkata" });
  const closed = event.registration_closes_at && new Date(event.registration_closes_at) < new Date();

  // Check capacity
  let spotsLeft: number | null = null;
  if (event.max_participants) {
    const { count } = await db.from("participants").select("id", { count: "exact", head: true }).eq("event_id", event.id);
    spotsLeft = event.max_participants - (count ?? 0);
  }
  const full = spotsLeft !== null && spotsLeft <= 0;

  return (
    <main>
      <h1>{event.title}</h1>
      <p className="meta">{when}{event.venue ? `, ${event.venue}` : ""}</p>
      {event.description && <p>{event.description}</p>}
      {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 20 && (
        <p style={{ color: "var(--pop)", fontWeight: 600 }}>{spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left</p>
      )}
      {closed ? (
        <p className="err">Registration is closed.</p>
      ) : full ? (
        <p className="err">This event is full.</p>
      ) : (
        <RegisterForm event={event} />
      )}
    </main>
  );
}
