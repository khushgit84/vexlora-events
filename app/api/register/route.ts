import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase";

/**
 * POST /api/register
 * Registers a participant for an event using the server-side RPC that enforces
 * max_participants and registration_closes_at atomically.
 * Rate-limited by IP: max 10 registrations per minute.
 */

// Simple in-memory rate limiter
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60_000; // 1 minute

function checkRate(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRate(ip)) {
    return NextResponse.json({ error: "Too many registrations. Try again in a minute." }, { status: 429 });
  }

  const body = await req.json();
  const { eventId, name, email, phone, college, branch, year, skills, lookingForTeam } = body;

  if (!eventId || !name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }

  const db = admin();
  const { data, error } = await db.rpc("register_participant", {
    p_event_id: eventId,
    p_name: name.trim(),
    p_email: email.trim().toLowerCase(),
    p_phone: phone?.trim() || null,
    p_college: college?.trim() || null,
    p_branch: branch || null,
    p_year: year ? Number(year) : null,
    p_skills: (skills || "").split(",").map((s: string) => s.trim().toLowerCase()).filter(Boolean),
    p_looking_for_team: lookingForTeam ?? false,
  });

  if (error) {
    // Map Postgres error codes from our RPC to user-friendly messages
    if (error.message?.includes("Registration is closed")) {
      return NextResponse.json({ error: "Registration is closed." }, { status: 400 });
    }
    if (error.message?.includes("Event is full")) {
      return NextResponse.json({ error: "This event is full." }, { status: 400 });
    }
    if (error.code === "23505") {
      return NextResponse.json({ error: "This email is already registered for this event." }, { status: 409 });
    }
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed. Check your details and try again." }, { status: 500 });
  }

  // data is an array from the RPC (returns table)
  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ id: row.id, qr_token: row.qr_token });
}
