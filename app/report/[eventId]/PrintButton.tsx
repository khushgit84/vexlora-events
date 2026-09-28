"use client";
export default function PrintButton() {
  return (
    <button className="noprint" onClick={() => window.print()} style={{ maxWidth: 240 }}>
      Save as PDF
    </button>
  );
}
