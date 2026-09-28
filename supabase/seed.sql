-- supabase/seed.sql
-- Seeds a test organization and event for development.
-- Run after migrations. The org has no owner_id because there's no auth user yet;
-- the organizer signup flow will claim it.

-- Note: In production, owner_id is set by the signup flow.
-- For local testing, you can update it manually after creating a user:
--   UPDATE organizations SET owner_id = '<your-auth-uid>' WHERE name = 'TechSoc';

insert into organizations (id, name, college) values
  ('a0000000-0000-0000-0000-000000000001', 'TechSoc', 'IIIT Hyderabad')
on conflict (id) do nothing;

insert into events (id, org_id, slug, title, description, venue, starts_at, ends_at, registration_closes_at, max_participants, allow_solo_matching, team_size_max) values
  ('e0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'test-hack',
   'Test Hackathon',
   'A 24-hour hackathon for builders and tinkerers. Build something cool.',
   'Main Auditorium',
   now() + interval '7 days',
   now() + interval '8 days',
   now() + interval '6 days',
   200,
   true,
   4)
on conflict (id) do nothing;
