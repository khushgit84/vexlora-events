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
        
        <div style={{ display: "flex", alignItems: "center", margin: "24px 0" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--line)" }}></div>
          <span style={{ padding: "0 12px", color: "var(--mute)", fontSize: 14 }}>OR</span>
          <div style={{ flex: 1, height: "1px", background: "var(--line)" }}></div>
        </div>

        <button 
          type="button" 
          onClick={async () => {
            setBusy(true);
            const supabase = createBrowserSupabase();
            const { error } = await supabase.auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
              }
            });
            if (error) setError(error.message);
            setBusy(false);
          }}
          disabled={busy}
          style={{ background: "#fff", color: "var(--ink)", border: "1.5px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
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
