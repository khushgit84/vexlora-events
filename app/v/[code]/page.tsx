import { admin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Verify({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { data } = await admin()
    .from("certificates")
    .select("pdf_url,participants(name,college),events(title,starts_at)")
    .eq("verify_code", code)
    .single();

  if (!data)
    return (
      <main>
        <h1>Certificate not found</h1>
        <p className="meta">No certificate matches this code. Check the ID printed on the certificate and try again.</p>
      </main>
    );

  const p: any = Array.isArray(data.participants) ? data.participants[0] : data.participants;
  const e: any = Array.isArray(data.events) ? data.events[0] : data.events;

  return (
    <main>
      <h1>Certificate verified</h1>
      <div className="result ok">
        {p?.name}{p?.college ? `, ${p.college}` : ""} took part in {e?.title} on{" "}
        {new Date(e?.starts_at).toLocaleDateString("en-IN", { dateStyle: "long" })}.
      </div>
      {data.pdf_url && <p><a href={data.pdf_url}>Download the certificate</a></p>}
    </main>
  );
}
