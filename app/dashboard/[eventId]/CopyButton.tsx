"use client";
import { useState } from "react";

export default function CopyButton({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ background: "var(--ink)", fontSize: 14, width: "auto", padding: "10px 16px" }}
    >
      {copied ? "Copied!" : label}
    </button>
  );
}
