import { createClient } from "@supabase/supabase-js";

// Lazy-init the anon client to avoid crashing at build time when env vars are missing.
let _supabase: ReturnType<typeof createClient> | null = null;
export function supabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _supabase;
}

// Server-only admin client. Never import this in a client component.
export const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
