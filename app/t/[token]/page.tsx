import { notFound } from "next/navigation";
import { admin } from "@/lib/supabase";
import TicketQR from "./TicketQR";

export const dynamic = "force-dynamic";

// Re-opens a participant's QR ticket from the link in their reminder.
export default async function Ticket({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data } = await admin()
    .from("participants").select("name,events(title,starts_at,venue)").eq("qr_token", token).single();
  if (!data) notFound();
  const ev: any = Array.isArray(data.events) ? data.events[0] : data.events;

  return (
    <main>
      <div className="ticket">
        <TicketQR value={token} />
        <h2>{data.name}</h2>
        <p style={{ margin: 0, fontWeight: 600 }}>{ev?.title}</p>
        <p className="meta" style={{ margin: 0 }}>
          {new Date(ev?.starts_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}
          {ev?.venue ? `, ${ev.venue}` : ""}
        </p>
      </div>
    </main>
  );
}
