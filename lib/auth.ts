import { createServerSupabase } from "./supabase-server";

/**
 * Verifies the current user owns the event (via their organization).
 * Returns { user, orgId } on success, or throws a Response to return as-is.
 */
export async function requireEventOwner(eventId: string) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Response(JSON.stringify({ error: "Not logged in" }), { status: 401, headers: { "Content-Type": "application/json" } });

  // Check that this user's org owns the event
  const { data: event } = await supabase
    .from("events")
    .select("org_id, organizations!inner(owner_id)")
    .eq("id", eventId)
    .single();

  if (!event) throw new Response(JSON.stringify({ error: "Event not found" }), { status: 404, headers: { "Content-Type": "application/json" } });

  const org: any = Array.isArray(event.organizations) ? event.organizations[0] : event.organizations;
  if (org?.owner_id !== user.id)
    throw new Response(JSON.stringify({ error: "You do not own this event" }), { status: 403, headers: { "Content-Type": "application/json" } });

  return { user, orgId: event.org_id };
}

/**
 * Returns the logged-in user or null.
 */
export async function getUser() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
