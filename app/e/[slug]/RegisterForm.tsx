"use client";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type Ev = { id: string; title: string; allow_solo_matching: boolean };

export default function RegisterForm({ event }: { event: Ev }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState<{ name: string; qr: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name")).trim();

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: event.id,
        name,
        email: String(f.get("email")).trim(),
        phone: String(f.get("phone") || "").trim() || null,
        college: String(f.get("college") || "").trim() || null,
        branch: String(f.get("branch") || "") || null,
        year: Number(f.get("year")) || null,
        skills: String(f.get("skills") || ""),
        lookingForTeam: f.get("solo") === "on",
      }),
    });

    const data = await res.json();
    setBusy(false);

    if (!res.ok) {
      setError(data.error || "Registration failed. Check your details and try again.");
      return;
    }

    setTicket({ name, qr: data.qr_token });
  }

  if (ticket)
    return (
      <div className="ticket">
        <QRCodeSVG value={ticket.qr} size={220} />
        <h2>{ticket.name}</h2>
        <p className="meta">Show this QR code at the entry desk. Screenshot it to keep it offline.</p>
      </div>
    );

  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="name">Full name</label>
      <input id="name" name="name" required autoComplete="name" />
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" required autoComplete="email" />
      <label htmlFor="phone">WhatsApp number</label>
      <input id="phone" name="phone" type="tel" placeholder="+91 98765 43210" autoComplete="tel" />
      <label htmlFor="college">College</label>
      <input id="college" name="college" required />
      <label htmlFor="branch">Branch</label>
      <select id="branch" name="branch" defaultValue="">
        <option value="" disabled>Select branch</option>
        {["CSE", "IT", "AI/ML", "ECE", "EEE", "Mechanical", "Civil", "Other"].map((b) => <option key={b}>{b}</option>)}
      </select>
      <label htmlFor="year">Year</label>
      <select id="year" name="year" defaultValue="1">
        {[1, 2, 3, 4].map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
      <label htmlFor="skills">Skills (comma separated)</label>
      <input id="skills" name="skills" placeholder="react, python, design" />
      {event.allow_solo_matching && (
        <div className="check">
          <input id="solo" name="solo" type="checkbox" />
          <label htmlFor="solo" style={{ margin: 0, fontWeight: 400 }}>Match me with a team based on my skills</label>
        </div>
      )}
      {error && <p className="err" role="alert">{error}</p>}
      <button disabled={busy}>{busy ? "Registering…" : "Register"}</button>
    </form>
  );
}
