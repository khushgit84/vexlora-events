"use client";
import { use, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type Result = { status: string; message: string } | null;

export default function CheckIn({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const [count, setCount] = useState(0);
  const busy = useRef(false);

  useEffect(() => {
    if (!scanning) return;
    const scanner = new Html5Qrcode("reader");
    scanner
      .start({ facingMode: "environment" }, { fps: 10, qrbox: 240 }, async (qr) => {
        if (busy.current) return;
        busy.current = true;
        const res = await fetch("/api/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qr, eventId }),
        }).then((r) => r.json());
        setResult(res);
        if (res.status === "ok") setCount((c) => c + 1);
        setTimeout(() => { busy.current = false; }, 1500);
      }, () => {})
      .catch(() => setResult({ status: "error", message: "Camera permission denied" }));
    return () => { scanner.isScanning && scanner.stop().catch(() => {}); };
  }, [scanning, eventId]);

  if (!scanning)
    return (
      <main>
        <h1>Check-in desk</h1>
        <p className="meta">You are logged in. Point the camera at each participant&apos;s QR code.</p>
        <button onClick={() => setScanning(true)}>Start scanning</button>
      </main>
    );

  return (
    <main>
      <h1>{count} checked in</h1>
      <div id="reader" />
      {result && (
        <div className={`result ${result.status === "ok" ? "ok" : "bad"}`} role="status">
          {result.message}
        </div>
      )}
    </main>
  );
}
