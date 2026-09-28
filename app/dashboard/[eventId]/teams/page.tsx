"use client";
import { use, useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";

type Team = { id: string; name: string | null; members: { id: string; name: string; skills: string[] }[] };

export default function Teams({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState("");

  async function loadTeams() {
    const supabase = createBrowserSupabase();
    const { data } = await supabase
      .from("teams")
      .select("id,name,team_members(participant_id,participants(id,name,skills))")
      .eq("event_id", eventId)
      .order("created_at");

    const mapped: Team[] = (data ?? []).map((t: any) => ({
      id: t.id,
      name: t.name,
      members: (t.team_members ?? []).map((tm: any) => {
        const p = Array.isArray(tm.participants) ? tm.participants[0] : tm.participants;
        return { id: p?.id ?? "", name: p?.name ?? "Unknown", skills: p?.skills ?? [] };
      }),
    }));
    setTeams(mapped);
    setLoading(false);
  }

  useEffect(() => { loadTeams(); }, [eventId]);

  async function runMatching() {
    setMatching(true);
    setMatchResult("");
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase.rpc("match_solo_participants", { p_event: eventId });
    if (error) {
      setMatchResult(`Error: ${error.message}`);
    } else {
      setMatchResult(`Created ${data} new team${data !== 1 ? "s" : ""}.`);
      await loadTeams();
    }
    setMatching(false);
  }

  if (loading) return <main><p className="meta">Loading…</p></main>;

  return (
    <main style={{ maxWidth: 700 }}>
      <h1>Teams</h1>
      <button onClick={runMatching} disabled={matching} style={{ marginBottom: 16 }}>
        {matching ? "Matching…" : "Run auto-matching for solo participants"}
      </button>
      {matchResult && <p role="status" className="meta" style={{ marginBottom: 16 }}>{matchResult}</p>}

      {teams.length === 0 ? (
        <p className="meta">No teams yet. Run auto-matching or wait for participants to register with &quot;match me with a team&quot; checked.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {teams.map((t) => (
            <div key={t.id} style={{ background: "#fff", border: "1.5px solid var(--line)", borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{t.name || "Unnamed team"}</div>
              {t.members.map((m) => (
                <div key={m.id} style={{ fontSize: 14, marginBottom: 4 }}>
                  {m.name}
                  {m.skills.length > 0 && (
                    <span style={{ color: "var(--mute)", marginLeft: 8 }}>{m.skills.join(", ")}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
