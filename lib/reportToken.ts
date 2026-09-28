import { createHmac, timingSafeEqual } from "crypto";

// Unguessable per-event key, so sponsors can open the report link without logging in.
export const reportToken = (eventId: string) =>
  createHmac("sha256", process.env.REPORT_SECRET!).update(eventId).digest("hex").slice(0, 24);

export function validReportToken(eventId: string, token?: string) {
  if (!token) return false;
  const a = Buffer.from(reportToken(eventId));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
