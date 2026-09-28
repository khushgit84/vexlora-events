"use client";
import { use, useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";

export default function EditEvent({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createBrowserSupabase();
      const { data } = await supabase.from("events").select("*").eq("id", eventId).single();
      setEvent(data);
      setLoading(false);
    })();
  }, [eventId]);

  if (loading) return <main><p className="meta">Loading…</p></main>;
  if (!event) return <main><h1>Event not found</h1></main>;

  const toLocal = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toISOString().slice(0, 16);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    const f = new FormData(e.currentTarget);

    const startsAt = f.get("starts_at") ? new Date(String(f.get("starts_at"))).toISOString() : event.starts_at;
    const endsAt = f.get("ends_at") ? new Date(String(f.get("ends_at"))).toISOString() : null;
    const closesAt = f.get("registration_closes_at") ? new Date(String(f.get("registration_closes_at"))).toISOString() : null;

    const supabase = createBrowserSupabase();
    const { error: updateErr } = await supabase.from("events").update({
      title: String(f.get("title")).trim(),
      slug: String(f.get("slug")).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"),
      description: String(f.get("description") || "").trim() || null,
      venue: String(f.get("venue") || "").trim() || null,
      starts_at: startsAt,
      ends_at: endsAt,
      registration_closes_at: closesAt,
      max_participants: Number(f.get("max_participants")) || null,
      team_size_max: Number(f.get("team_size_max")) || 1,
      allow_solo_matching: f.get("allow_solo_matching") === "on",
      certificate_text: String(f.get("certificate_text") || "").trim() || null,
      certificate_template_url: String(f.get("certificate_template_url") || "").trim() || null,
    }).eq("id", eventId);

    setBusy(false);
    if (updateErr) { setError(updateErr.message); return; }
    setSuccess("Event updated.");
  }

  return (
    <main>
      <h1>Edit event</h1>
      <form onSubmit={onSubmit}>
        <label htmlFor="title">Event title</label>
        <input id="title" name="title" required defaultValue={event.title} />

        <label htmlFor="slug">URL slug</label>
        <input id="slug" name="slug" required defaultValue={event.slug} />

        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={3} defaultValue={event.description ?? ""} style={{ width: "100%", padding: 12, border: "1.5px solid var(--line)", borderRadius: 8, font: "inherit", resize: "vertical" }} />

        <label htmlFor="venue">Venue</label>
        <input id="venue" name="venue" defaultValue={event.venue ?? ""} />

        <label htmlFor="starts_at">Starts at</label>
        <input id="starts_at" name="starts_at" type="datetime-local" required defaultValue={toLocal(event.starts_at)} />

        <label htmlFor="ends_at">Ends at</label>
        <input id="ends_at" name="ends_at" type="datetime-local" defaultValue={toLocal(event.ends_at)} />

        <label htmlFor="registration_closes_at">Registration closes at</label>
        <input id="registration_closes_at" name="registration_closes_at" type="datetime-local" defaultValue={toLocal(event.registration_closes_at)} />

        <label htmlFor="max_participants">Max participants</label>
        <input id="max_participants" name="max_participants" type="number" min="1" defaultValue={event.max_participants ?? ""} />

        <label htmlFor="team_size_max">Team size</label>
        <input id="team_size_max" name="team_size_max" type="number" min="1" defaultValue={event.team_size_max ?? 1} />

        <div className="check">
          <input id="allow_solo_matching" name="allow_solo_matching" type="checkbox" defaultChecked={event.allow_solo_matching} />
          <label htmlFor="allow_solo_matching" style={{ margin: 0, fontWeight: 400 }}>Allow solo team matching</label>
        </div>

        <label htmlFor="certificate_text">Certificate text</label>
        <input id="certificate_text" name="certificate_text" defaultValue={event.certificate_text ?? ""} placeholder="for participating in {{event}}" />

        <label htmlFor="certificate_template_url">Certificate template URL (optional)</label>
        <input id="certificate_template_url" name="certificate_template_url" type="url" defaultValue={event.certificate_template_url ?? ""} placeholder="https://..." />

        {error && <p className="err" role="alert">{error}</p>}
        {success && <p style={{ color: "var(--ok)", fontWeight: 600, marginTop: 12 }}>{success}</p>}
        <button disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
      </form>
    </main>
  );
}
