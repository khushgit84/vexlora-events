"use client";
import { use, useState } from "react";

export default function SendCertificates({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const [includeAll, setIncludeAll] = useState(false);
  const [log, setLog] = useState("");
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    let sent = 0, failed = 0, remaining = 1;
    while (remaining > 0) {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, includeAll }),
      });
      const d = await res.json();
      if (!res.ok) { setLog(d.error ?? "Something went wrong"); break; }
      sent += d.sent; failed += d.failed; remaining = d.remaining;
      setLog(`Sent ${sent}. Failed ${failed}. Remaining ${remaining}.`);
      if (d.sent === 0 && d.failed === 0) break;
    }
    setRunning(false);
  }

  return (
    <main>
      <h1>Send certificates</h1>
      <div className="check">
        <input id="all" type="checkbox" checked={includeAll} onChange={(e) => setIncludeAll(e.target.checked)} />
        <label htmlFor="all" style={{ margin: 0, fontWeight: 400 }}>Include people who did not check in</label>
      </div>
      <button onClick={run} disabled={running}>{running ? "Sending…" : "Generate and email certificates"}</button>
      {log && <p role="status" className="meta" style={{ marginTop: 16 }}>{log}</p>}
    </main>
  );
}
