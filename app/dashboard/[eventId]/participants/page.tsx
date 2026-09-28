"use client";
import { use, useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";

type Participant = {
  id: string; name: string; email: string; phone: string | null;
  college: string | null; branch: string | null; year: number | null;
  skills: string[]; looking_for_team: boolean; registered_at: string;
};

export default function Participants({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const [rows, setRows] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createBrowserSupabase();
      const { data } = await supabase
        .from("participants")
        .select("id,name,email,phone,college,branch,year,skills,looking_for_team,registered_at")
        .eq("event_id", eventId)
        .order("registered_at", { ascending: false });
      setRows((data as Participant[]) ?? []);
      setLoading(false);
    })();
  }, [eventId]);

  const filtered = rows.filter((p) => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || (p.college || "").toLowerCase().includes(q);
  });

  function downloadCSV() {
    const headers = ["Name", "Email", "Phone", "College", "Branch", "Year", "Skills", "Looking for Team", "Registered"];
    const csvRows = [headers.join(",")];
    for (const p of rows) {
      csvRows.push([
        `"${p.name}"`, `"${p.email}"`, `"${p.phone ?? ""}"`, `"${p.college ?? ""}"`,
        `"${p.branch ?? ""}"`, p.year ?? "", `"${(p.skills || []).join("; ")}"`,
        p.looking_for_team ? "Yes" : "No",
        new Date(p.registered_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      ].join(","));
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `participants-${eventId.slice(0, 8)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  if (loading) return <main><p className="meta">Loading…</p></main>;

  return (
    <main style={{ maxWidth: 900 }}>
      <h1>{rows.length} Participant{rows.length !== 1 ? "s" : ""}</h1>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          placeholder="Search name, email or college"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
          aria-label="Search participants"
        />
        <button onClick={downloadCSV} style={{ width: "auto", padding: "10px 16px", fontSize: 14, background: "var(--ink)" }}>
          Export CSV
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--ink)", textAlign: "left" }}>
              <th style={{ padding: 8 }}>Name</th>
              <th style={{ padding: 8 }}>Email</th>
              <th style={{ padding: 8 }}>College</th>
              <th style={{ padding: 8 }}>Branch</th>
              <th style={{ padding: 8 }}>Year</th>
              <th style={{ padding: 8 }}>Team?</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: 8 }}>{p.name}</td>
                <td style={{ padding: 8, color: "var(--mute)" }}>{p.email}</td>
                <td style={{ padding: 8 }}>{p.college ?? "—"}</td>
                <td style={{ padding: 8 }}>{p.branch ?? "—"}</td>
                <td style={{ padding: 8 }}>{p.year ?? "—"}</td>
                <td style={{ padding: 8 }}>{p.looking_for_team ? "✓" : ""}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 16, textAlign: "center", color: "var(--mute)" }}>No participants found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
