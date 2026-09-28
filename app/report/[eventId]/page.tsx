import { notFound } from "next/navigation";
import { admin } from "@/lib/supabase";
import { validReportToken } from "@/lib/reportToken";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

type Row = { label: string; n: number };

function Bars({ title, rows }: { title: string; rows: Row[] }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <section style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: 20, margin: "0 0 12px" }}>{title}</h2>
      {rows.map((r) => (
        <div key={r.label} style={{ display: "grid", gridTemplateColumns: "150px 1fr 40px", gap: 12, alignItems: "center", margin: "6px 0" }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
          <div style={{ background: "var(--line)", borderRadius: 4, height: 14 }}>
            <div style={{ width: `${(r.n / max) * 100}%`, background: "var(--pop)", height: 14, borderRadius: 4 }} />
          </div>
          <span style={{ textAlign: "right" }}>{r.n}</span>
        </div>
      ))}
    </section>
  );
}

export default async function Report({
  params, searchParams,
}: { params: Promise<{ eventId: string }>; searchParams: Promise<{ k?: string }> }) {
  const { eventId } = await params;
  const { k } = await searchParams;
  if (!validReportToken(eventId, k)) notFound();

  const db = admin();
  const [{ data: ev }, { data: s }, { data: branches }, { data: colleges }, { data: skills }, { data: years }] =
    await Promise.all([
      db.from("events").select("title,starts_at,venue,organizations(name)").eq("id", eventId).single(),
      db.from("sponsor_report").select("*").eq("event_id", eventId).single(),
      db.from("sponsor_branch_breakdown").select("branch,n").eq("event_id", eventId).order("n", { ascending: false }),
      db.from("sponsor_college_breakdown").select("college,n").eq("event_id", eventId).order("n", { ascending: false }).limit(10),
      db.from("sponsor_skill_breakdown").select("skill,n").eq("event_id", eventId).order("n", { ascending: false }).limit(10),
      db.from("participants").select("year").eq("event_id", eventId),
    ]);
  if (!ev) notFound();

  const org: any = Array.isArray(ev.organizations) ? ev.organizations[0] : ev.organizations;
  const yearCounts = new Map<string, number>();
  (years ?? []).forEach((y) => {
    const key = y.year ? `Year ${y.year}` : "Unknown";
    yearCounts.set(key, (yearCounts.get(key) ?? 0) + 1);
  });

  const stat = (v: string | number, label: string) => (
    <div>
      <div style={{ fontSize: 40, fontWeight: 700, lineHeight: 1 }}>{v}</div>
      <div className="meta" style={{ margin: "4px 0 0" }}>{label}</div>
    </div>
  );

  return (
    <main style={{ maxWidth: 780 }}>
      <style>{`@media print{.noprint{display:none}body{background:#fff}}`}</style>
      <p className="meta" style={{ margin: 0 }}>Sponsor report, {org?.name}</p>
      <h1>{ev.title}</h1>
      <p className="meta">
        {new Date(ev.starts_at).toLocaleDateString("en-IN", { dateStyle: "long" })}
        {ev.venue ? `, ${ev.venue}` : ""}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 24, padding: "24px 0", borderTop: "2px solid var(--ink)", borderBottom: "2px solid var(--ink)" }}>
        {stat(s?.registered ?? 0, "Students registered")}
        {stat(s?.attended ?? 0, "Attended in person")}
        {stat(`${s?.attendance_pct ?? 0}%`, "Attendance rate")}
        {stat(s?.colleges_represented ?? 0, "Colleges represented")}
      </div>

      <Bars title="Branches" rows={(branches ?? []).map((r) => ({ label: r.branch, n: r.n }))} />
      <Bars title="Year of study" rows={[...yearCounts].sort().map(([label, n]) => ({ label, n }))} />
      <Bars title="Top colleges" rows={(colleges ?? []).map((r) => ({ label: r.college, n: r.n }))} />
      <Bars title="Skills in the room" rows={(skills ?? []).map((r) => ({ label: r.skill, n: r.n }))} />

      <div style={{ marginTop: 40 }}><PrintButton /></div>
    </main>
  );
}
