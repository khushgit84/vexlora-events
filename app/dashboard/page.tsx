import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get the user's org
  const { data: org } = await supabase
    .from("organizations")
    .select("id,name,college")
    .eq("owner_id", user.id)
    .single();

  if (!org) {
    return (
      <main>
        <h1>No organisation found</h1>
        <p className="meta">Your account does not have an organisation. Please sign up again or contact support.</p>
      </main>
    );
  }

  // Get all events for this org
  const { data: events } = await supabase
    .from("events")
    .select("id,slug,title,starts_at,venue,max_participants")
    .eq("org_id", org.id)
    .order("starts_at", { ascending: false });

  return (
    <main style={{ maxWidth: 700 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1>{org.name}</h1>
          {org.college && <p className="meta" style={{ margin: 0 }}>{org.college}</p>}
        </div>
        <Link href="/dashboard/new" style={{ display: "inline-block", background: "var(--pop)", color: "#fff", fontWeight: 700, padding: "12px 20px", borderRadius: 8, textDecoration: "none", fontSize: 14 }}>
          + New event
        </Link>
      </div>

      {(!events || events.length === 0) ? (
        <p style={{ marginTop: 32, color: "var(--mute)" }}>No events yet. Create your first one.</p>
      ) : (
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          {events.map((ev) => {
            const date = new Date(ev.starts_at).toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });
            const past = new Date(ev.starts_at) < new Date();
            return (
              <Link key={ev.id} href={`/dashboard/${ev.id}`} style={{ display: "block", background: "#fff", border: "1.5px solid var(--line)", borderRadius: 8, padding: 16, textDecoration: "none", color: "inherit" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{ev.title}</div>
                    <div className="meta" style={{ margin: 0 }}>
                      {date}{ev.venue ? ` · ${ev.venue}` : ""}
                    </div>
                  </div>
                  {past && <span style={{ fontSize: 12, color: "var(--mute)", border: "1px solid var(--line)", borderRadius: 4, padding: "2px 8px" }}>Past</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <form action="/api/auth/signout" method="POST" style={{ marginTop: 32 }}>
        <button type="submit" style={{ background: "var(--ink)", fontSize: 14, maxWidth: 160 }}>Log out</button>
      </form>
    </main>
  );
}
