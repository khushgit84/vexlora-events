"use client";
import { useState } from "react";

export default function CopyButton({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);

  const copyText = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-secure origins (like testing on local network IP)
        const el = document.createElement("textarea");
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <button
      onClick={copyText}
      style={{ background: "var(--ink)", fontSize: 14, width: "auto", padding: "10px 16px" }}
    >
      {copied ? "Copied!" : label}
    </button>
  );
}
