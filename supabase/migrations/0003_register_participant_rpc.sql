-- 0003_register_participant_rpc.sql
-- Server-side registration function that enforces max_participants and
-- registration_closes_at atomically. Clients call this instead of inserting directly.
-- Also updates the RLS policy: public users can no longer INSERT into participants
-- directly — they must go through this function (which runs as SECURITY DEFINER).

-- Remove the old blanket insert policy if it exists
drop policy if exists participant_public_insert on participants;

-- Create a server-side function for safe registration
create or replace function register_participant(
  p_event_id uuid,
  p_name text,
  p_email text,
  p_phone text default null,
  p_college text default null,
  p_branch text default null,
  p_year int default null,
  p_skills text[] default '{}',
  p_looking_for_team boolean default false,
  p_qr_token text default encode(gen_random_bytes(12), 'hex')
)
returns table(id uuid, qr_token text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_closes_at timestamptz;
  v_max int;
  v_current int;
  v_id uuid;
  v_token text;
begin
  -- Lock the event row to prevent races
  select e.registration_closes_at, e.max_participants
    into v_closes_at, v_max
    from events e where e.id = p_event_id
    for update;

  if not found then
    raise exception 'Event not found' using errcode = 'P0002';
  end if;

  if v_closes_at is not null and v_closes_at < now() then
    raise exception 'Registration is closed' using errcode = 'P0003';
  end if;

  if v_max is not null then
    select count(*) into v_current from participants where event_id = p_event_id;
    if v_current >= v_max then
      raise exception 'Event is full' using errcode = 'P0004';
    end if;
  end if;

  insert into participants (event_id, name, email, phone, college, branch, year, skills, looking_for_team, qr_token)
  values (p_event_id, p_name, p_email, p_phone, p_college, p_branch, p_year, p_skills, p_looking_for_team, p_qr_token)
  returning participants.id, participants.qr_token into v_id, v_token;

  return query select v_id, v_token;
end;
$$;
