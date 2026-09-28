export type Template = "day_before" | "one_hour" | "thanks";
type Ev = { title: string; starts_at: string; venue: string | null };

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

export function buildMessage(t: Template, ev: Ev) {
  const where = ev.venue ? ` at ${ev.venue}` : "";
  switch (t) {
    case "day_before":
      return { subject: `Tomorrow: ${ev.title}`, line: `${ev.title} is tomorrow, ${fmt(ev.starts_at)}${where}. Bring your QR ticket for check-in.` };
    case "one_hour":
      return { subject: `Starting soon: ${ev.title}`, line: `${ev.title} starts in about an hour${where}. Keep your QR ticket ready.` };
    case "thanks":
      return { subject: `Thanks for joining ${ev.title}`, line: `Thanks for joining ${ev.title}! Certificates are emailed to everyone who checked in.` };
  }
}
