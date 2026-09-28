import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import { admin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboard() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  // Protect route: Only allow the designated super admin email
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@vexlora.com";
  if (!user || user.email !== superAdminEmail) {
    redirect("/dashboard");
  }

  const db = admin(); // Use service role to bypass RLS and read everything

  // Fetch platform stats
  const { count: orgCount } = await db.from("organizations").select("*", { count: "exact", head: true });
  const { count: eventCount } = await db.from("events").select("*", { count: "exact", head: true });
  const { count: participantCount } = await db.from("participants").select("*", { count: "exact", head: true });

  // Fetch all organizations
  const { data: orgs } = await db.from("organizations").select("*, events(id)").order("created_at", { ascending: false });
  
  // Fetch users to map emails
  const { data: authUsers } = await db.auth.admin.listUsers();
  const userMap = new Map(authUsers.users.map(u => [u.id, u.email]));

  return (
    <main style={{ maxWidth: 900, padding: "40px 20px" }}>
      <h1>Platform Super Admin</h1>
      <p className="meta">Welcome back, Boss. Here is what is happening across Vexlora Events.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, margin: "32px 0" }}>
        <div style={{ background: "#fff", border: "1.5px solid var(--line)", borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 36, fontWeight: 800 }}>{orgCount ?? 0}</div>
          <div className="meta" style={{ margin: 0 }}>Total Organizations</div>
        </div>
        <div style={{ background: "#fff", border: "1.5px solid var(--line)", borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 36, fontWeight: 800 }}>{eventCount ?? 0}</div>
          <div className="meta" style={{ margin: 0 }}>Total Events Hosted</div>
        </div>
        <div style={{ background: "#fff", border: "1.5px solid var(--line)", borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 36, fontWeight: 800 }}>{participantCount ?? 0}</div>
          <div className="meta" style={{ margin: 0 }}>Total Students Registered</div>
        </div>
      </div>

      <h2>All Organizations</h2>
      <div style={{ background: "#fff", border: "1.5px solid var(--line)", borderRadius: 12, overflow: "hidden", marginTop: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1.5px solid var(--line)", background: "var(--paper)" }}>
              <th style={{ padding: "12px 16px" }}>Organization Name</th>
              <th style={{ padding: "12px 16px" }}>Owner Email</th>
              <th style={{ padding: "12px 16px" }}>Events</th>
              <th style={{ padding: "12px 16px" }}>Joined Date</th>
            </tr>
          </thead>
          <tbody>
            {orgs?.map((o) => (
              <tr key={o.id} style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: "12px 16px", fontWeight: 600 }}>{o.name}</td>
                <td style={{ padding: "12px 16px", color: "var(--mute)" }}>{userMap.get(o.owner_id) || "Unknown"}</td>
                <td style={{ padding: "12px 16px" }}>{o.events?.length || 0}</td>
                <td style={{ padding: "12px 16px", fontSize: 14 }}>{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {(!orgs || orgs.length === 0) && (
              <tr><td colSpan={4} style={{ padding: 20, textAlign: "center", color: "var(--mute)" }}>No organizations yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
