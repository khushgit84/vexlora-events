"use client";
import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [college, setCollege] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const supabase = createBrowserSupabase();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setBusy(false); return; }
      // Redirect — middleware will handle the rest
      const params = new URLSearchParams(window.location.search);
      window.location.href = params.get("redirect") || "/dashboard";
    } else {
      if (!orgName.trim()) { setError("Organisation name is required"); setBusy(false); return; }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          data: { org_name: orgName.trim(), college: college.trim() },
        },
      });
      if (error) { setError(error.message); setBusy(false); return; }
      if (data.user && !data.session) {
        setMessage("Check your email for a confirmation link.");
      } else {
        window.location.href = "/dashboard";
      }
    }
    setBusy(false);
  }

  return (
    <main>
      <h1>{mode === "login" ? "Log in" : "Create an account"}</h1>
      <p className="meta">
        {mode === "login"
          ? "Sign in to manage your events."
          : "Set up your organisation and start creating events."}
      </p>
      <form onSubmit={handleSubmit}>
        {mode === "signup" && (
          <>
            <label htmlFor="orgName">Organisation or club name</label>
            <input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} required placeholder="TechSoc" />
            <label htmlFor="college">College (optional)</label>
            <input id="college" value={college} onChange={(e) => setCollege(e.target.value)} placeholder="IIIT Hyderabad" />
          </>
        )}
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} />
        {error && <p className="err" role="alert">{error}</p>}
        {message && <p className="meta" role="status" style={{ marginTop: 12, color: "var(--ok)" }}>{message}</p>}
        <button disabled={busy}>{busy ? "Working…" : mode === "login" ? "Log in" : "Create account"}</button>
      </form>
      <p style={{ textAlign: "center", marginTop: 16 }}>
        {mode === "login" ? (
          <>No account? <button type="button" onClick={() => setMode("signup")} style={{ background: "none", color: "var(--pop)", border: "none", cursor: "pointer", fontWeight: 600, width: "auto", margin: 0, padding: 0 }}>Sign up</button></>
        ) : (
          <>Already have an account? <button type="button" onClick={() => setMode("login")} style={{ background: "none", color: "var(--pop)", border: "none", cursor: "pointer", fontWeight: 600, width: "auto", margin: 0, padding: 0 }}>Log in</button></>
        )}
      </p>
    </main>
  );
}
