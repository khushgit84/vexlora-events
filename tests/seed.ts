import { createClient } from "@supabase/supabase-js";
import fs from "fs";

export const TEST_EMAIL = "e2e@vexlora.com";
export const TEST_PASSWORD = "password123";
export const EVENT_SLUG = "e2e-test-event";

export async function seedTestEvent() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Clear old data for idempotency
  const { data: users } = await admin.auth.admin.listUsers();
  const oldUser = users?.users.find((u) => u.email === TEST_EMAIL);
  if (oldUser) {
    await admin.from("participants").delete().neq("id", "00000000-0000-0000-0000-000000000000"); // clear all participants
    await admin.from("events").delete().eq("slug", EVENT_SLUG);
    await admin.from("organizations").delete().eq("owner_id", oldUser.id);
    await admin.auth.admin.deleteUser(oldUser.id);
  }

  // 2. Create user (auto-confirmed)
  const { data: { user }, error: userErr } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { org_name: "E2E Testing Org", college: "E2E College" },
  });
  if (userErr || !user) throw new Error("Could not create user: " + userErr?.message);

  // The database trigger (0004_org_on_signup.sql) should have created the org automatically
  // Let's verify and grab the org ID
  const { data: org, error: orgErr } = await admin.from("organizations").select("id").eq("owner_id", user.id).single();
  if (orgErr || !org) throw new Error("Org not created by trigger: " + orgErr?.message);

  // 3. Create an event
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const { data: event, error: evErr } = await admin.from("events").insert({
    org_id: org.id,
    title: "E2E Test Event",
    slug: EVENT_SLUG,
    venue: "Main Hall",
    starts_at: tomorrow.toISOString(),
    max_participants: 100,
  }).select("id").single();
  
  if (evErr || !event) throw new Error("Could not create event: " + evErr?.message);

  return { userId: user.id, orgId: org.id, eventId: event.id };
}
