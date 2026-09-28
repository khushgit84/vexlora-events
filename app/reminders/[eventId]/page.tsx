"use client";
import { use, useState } from "react";

export default function Reminders({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const [msg, setMsg] = useState("");
  const headers = { "Content-Type": "application/json" };

  async function schedule() {
    const r = await fetch("/api/reminders", { method: "POST", headers, body: JSON.stringify({ eventId }) });
    const d = await r.json();
    setMsg(r.ok ? `Queued ${d.queued} new reminders.` : d.error);
  }
  async function status() {
    const r = await fetch(`/api/reminders?eventId=${eventId}`);
    const d = await r.json();
    setMsg(r.ok ? `Pending ${d.pending}. Sent ${d.sent}. Failed ${d.failed}.` : d.error);
  }

  return (
    <main>
      <h1>Reminders</h1>
      <p className="meta">Sends a day-before, a one-hour-before and a thank-you message by email, plus WhatsApp when the participant gave a number.</p>
      <button onClick={schedule}>Schedule reminders</button>
      <button onClick={status} style={{ background: "var(--ink)", marginTop: 12 }}>Check status</button>
      {msg && <p role="status" className="meta" style={{ marginTop: 16 }}>{msg}</p>}
    </main>
  );
}
