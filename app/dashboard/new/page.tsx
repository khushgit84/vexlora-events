"use client";
import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";

export default function NewEvent() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);

    const title = String(f.get("title")).trim();
    const slug = String(f.get("slug")).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

    if (!title || !slug) { setError("Title and slug are required."); setBusy(false); return; }

    const supabase = createBrowserSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not logged in"); setBusy(false); return; }

    // Get the user's org
    const { data: org } = await supabase.from("organizations").select("id").eq("owner_id", user.id).single();
    if (!org) { setError("No organisation found"); setBusy(false); return; }

    const startsAt = f.get("starts_at") ? new Date(String(f.get("starts_at"))).toISOString() : null;
    const endsAt = f.get("ends_at") ? new Date(String(f.get("ends_at"))).toISOString() : null;
    const closesAt = f.get("registration_closes_at") ? new Date(String(f.get("registration_closes_at"))).toISOString() : null;
    const maxP = Number(f.get("max_participants")) || null;
    const teamMax = Number(f.get("team_size_max")) || 1;

    if (!startsAt) { setError("Start date is required."); setBusy(false); return; }

    const { data: event, error: insertErr } = await supabase.from("events").insert({
      org_id: org.id,
      slug,
      title,
      description: String(f.get("description") || "").trim() || null,
      venue: String(f.get("venue") || "").trim() || null,
      starts_at: startsAt,
      ends_at: endsAt,
      registration_closes_at: closesAt,
      max_participants: maxP,
      team_size_max: teamMax,
      allow_solo_matching: f.get("allow_solo_matching") === "on",
    }).select("id").single();

    if (insertErr) {
      if (insertErr.code === "23505") setError("An event with this slug already exists.");
      else setError(insertErr.message ?? "Could not create event.");
      setBusy(false);
      return;
    }

    window.location.href = `/dashboard/${event!.id}`;
  }

  return (
    <main>
      <h1>Create event</h1>
      <form onSubmit={onSubmit}>
        <label htmlFor="title">Event title</label>
        <input id="title" name="title" required placeholder="Hack Night 2026" />

        <label htmlFor="slug">URL slug</label>
        <input id="slug" name="slug" required placeholder="hack-night-2026" pattern="[a-z0-9-]+" title="Lowercase letters, numbers and hyphens only" />

        <label htmlFor="description">Description (optional)</label>
        <textarea id="description" name="description" rows={3} style={{ width: "100%", padding: 12, border: "1.5px solid var(--line)", borderRadius: 8, font: "inherit", resize: "vertical" }} />

        <label htmlFor="venue">Venue</label>
        <input id="venue" name="venue" placeholder="Main Auditorium" />

        <label htmlFor="starts_at">Starts at</label>
        <input id="starts_at" name="starts_at" type="datetime-local" required />

        <label htmlFor="ends_at">Ends at (optional)</label>
        <input id="ends_at" name="ends_at" type="datetime-local" />

        <label htmlFor="registration_closes_at">Registration closes at (optional)</label>
        <input id="registration_closes_at" name="registration_closes_at" type="datetime-local" />

        <label htmlFor="max_participants">Max participants (leave blank for unlimited)</label>
        <input id="max_participants" name="max_participants" type="number" min="1" />

        <label htmlFor="team_size_max">Team size (1 = individual event)</label>
        <input id="team_size_max" name="team_size_max" type="number" min="1" defaultValue="1" />

        <div className="check">
          <input id="allow_solo_matching" name="allow_solo_matching" type="checkbox" />
          <label htmlFor="allow_solo_matching" style={{ margin: 0, fontWeight: 400 }}>Allow solo participants to be matched into teams</label>
        </div>

        {error && <p className="err" role="alert">{error}</p>}
        <button disabled={busy}>{busy ? "Creating…" : "Create event"}</button>
      </form>
    </main>
  );
}
