-- Event-ops-in-a-box: Supabase / Postgres schema
-- Run in Supabase SQL editor. Safe to run once on a fresh project.

create extension if not exists "pgcrypto";

-- Organizers (clubs / E-Cells)
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  college text,
  owner_id uuid references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','event','club')),
  created_at timestamptz default now()
);

-- Events
create table events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  slug text unique not null,               -- public link: /e/<slug>
  title text not null,
  description text,
  venue text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  registration_closes_at timestamptz,
  max_participants int,
  team_size_min int default 1,
  team_size_max int default 1,
  allow_solo_matching boolean default false,
  certificate_template_url text,
  certificate_text text default 'for participating in {{event}}',
  created_at timestamptz default now()
);

-- Participants (one row per registration)
create table participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,                              -- WhatsApp number, E.164
  college text,
  branch text,
  year int,
  skills text[] default '{}',              -- used for team matching
  looking_for_team boolean default false,
  qr_token text unique default encode(gen_random_bytes(12), 'hex'),
  registered_at timestamptz default now(),
  unique (event_id, email)
);

-- Teams
create table teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text,
  created_at timestamptz default now()
);

create table team_members (
  team_id uuid references teams(id) on delete cascade,
  participant_id uuid references participants(id) on delete cascade,
  primary key (team_id, participant_id)
);

-- Check-ins (QR scan on event day)
create table checkins (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid unique not null references participants(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  checked_in_at timestamptz default now(),
  checked_in_by uuid references auth.users(id)
);

-- Certificates
create table certificates (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid unique not null references participants(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  verify_code text unique default encode(gen_random_bytes(6), 'hex'),
  pdf_url text,
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- Reminder queue (a cron / edge function picks up due rows)
create table reminders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  participant_id uuid references participants(id) on delete cascade,
  channel text not null check (channel in ('email','whatsapp')),
  template text not null,                  -- e.g. 'day_before', 'one_hour', 'thanks'
  send_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  error text,
  sent_at timestamptz
);
create index on reminders (status, send_at);
create index on participants (event_id);
create index on checkins (event_id);

-- Sponsor report: one row per event with headline numbers
create view sponsor_report as
select
  e.id as event_id,
  e.title,
  count(distinct p.id) as registered,
  count(distinct c.id) as attended,
  round(100.0 * count(distinct c.id) / nullif(count(distinct p.id), 0), 1) as attendance_pct,
  count(distinct p.college) as colleges_represented
from events e
left join participants p on p.event_id = e.id
left join checkins c on c.participant_id = p.id
group by e.id, e.title;

-- Breakdown views for the sponsor report page
create view sponsor_branch_breakdown as
select event_id, coalesce(branch,'Unknown') as branch, count(*) as n
from participants group by event_id, branch;

create view sponsor_college_breakdown as
select event_id, coalesce(college,'Unknown') as college, count(*) as n
from participants group by event_id, college;

create view sponsor_skill_breakdown as
select event_id, skill, count(*) as n
from participants, unnest(skills) as skill
group by event_id, skill;

-- Simple skill-based team matching: pairs solo participants into groups
-- by round-robin over skill diversity. Call: select match_solo_participants('<event_id>');
create or replace function match_solo_participants(p_event uuid)
returns int language plpgsql as $$
declare
  v_size int;
  v_team uuid;
  v_count int := 0;
  r record;
  v_in_team int := 0;
begin
  select team_size_max into v_size from events where id = p_event;
  if v_size is null or v_size < 2 then return 0; end if;

  for r in
    select p.id from participants p
    where p.event_id = p_event
      and p.looking_for_team
      and not exists (select 1 from team_members tm where tm.participant_id = p.id)
    order by array_length(p.skills,1) desc nulls last, p.registered_at
  loop
    if v_in_team = 0 or v_in_team >= v_size then
      insert into teams (event_id, name) values (p_event, 'Team ' || (v_count + 1))
      returning id into v_team;
      v_count := v_count + 1;
      v_in_team := 0;
    end if;
    insert into team_members (team_id, participant_id) values (v_team, r.id);
    v_in_team := v_in_team + 1;
  end loop;

  return v_count;
end $$;

-- Row Level Security: organizers manage only their own data
alter table organizations enable row level security;
alter table events enable row level security;
alter table participants enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table checkins enable row level security;
alter table certificates enable row level security;
alter table reminders enable row level security;

create policy org_owner on organizations
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy event_owner on events
  for all using (org_id in (select id from organizations where owner_id = auth.uid()));

-- Public can read events (for the registration page) and register
create policy event_public_read on events for select using (true);
create policy participant_public_insert on participants for insert with check (true);

create policy participant_owner_read on participants
  for select using (event_id in (
    select e.id from events e join organizations o on o.id = e.org_id
    where o.owner_id = auth.uid()));

create policy team_owner on teams
  for all using (event_id in (
    select e.id from events e join organizations o on o.id = e.org_id
    where o.owner_id = auth.uid()));

create policy team_member_owner on team_members
  for all using (team_id in (
    select t.id from teams t join events e on e.id = t.event_id
    join organizations o on o.id = e.org_id where o.owner_id = auth.uid()));

create policy checkin_owner on checkins
  for all using (event_id in (
    select e.id from events e join organizations o on o.id = e.org_id
    where o.owner_id = auth.uid()));

create policy cert_owner on certificates
  for all using (event_id in (
    select e.id from events e join organizations o on o.id = e.org_id
    where o.owner_id = auth.uid()));

-- Anyone can verify a certificate by code
create policy cert_public_verify on certificates for select using (true);

create policy reminder_owner on reminders
  for all using (event_id in (
    select e.id from events e join organizations o on o.id = e.org_id
    where o.owner_id = auth.uid()));
