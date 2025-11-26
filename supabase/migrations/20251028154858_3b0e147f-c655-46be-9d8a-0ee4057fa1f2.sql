-- Fix type casting issue between user_role and app_role
-- The profiles table uses user_role, but user_roles table uses app_role
-- We need to make the cast work properly

create or replace function sync_user_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from user_roles where user_id = new.id;
  -- Cast user_role to text first, then to app_role
  insert into user_roles(user_id, role) 
  values (new.id, (new.role::text)::app_role)
  on conflict (user_id, role) do nothing;
  return new;
end; $$;

drop trigger if exists trg_sync_user_role on profiles;
create trigger trg_sync_user_role after insert or update on profiles
for each row execute procedure sync_user_role();