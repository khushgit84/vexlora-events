-- 0004_org_on_signup.sql
-- Automatically creates an organization when a user signs up,
-- using the org_name and college from their auth metadata.

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into organizations (name, college, owner_id)
  values (
    coalesce(new.raw_user_meta_data->>'org_name', 'My Organisation'),
    nullif(new.raw_user_meta_data->>'college', ''),
    new.id
  );
  return new;
end;
$$;

-- Trigger on auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
