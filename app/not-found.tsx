import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ maxWidth: 480, margin: "80px auto", padding: "0 20px", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: 12 }}>Page not found</h1>
      <p style={{ color: "#5b6478", marginBottom: 24 }}>
        The link you followed doesn&apos;t match anything on Vexlora Events.
      </p>
      <Link href="/" style={{ fontWeight: 600 }}>Back to home</Link>
    </div>
  );
}
