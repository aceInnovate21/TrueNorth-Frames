-- ─────────────────────────────────────────────────────────────────────────────
-- 031_auth_user_trigger.sql
--
-- Creates a Postgres trigger on auth.users that automatically inserts a row
-- into public.users the moment Supabase creates any new auth user.
--
-- This makes the FK violation on photographer_profiles / client_profiles
-- structurally impossible — public.users is always guaranteed to exist
-- before any onboarding API route runs.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _role text;
  _full_name text;
begin
  -- Pull role + full_name from auth metadata if present
  _role      := coalesce(new.raw_user_meta_data->>'role', null);
  _full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  -- Only insert if role is one we recognise (email/password signup sets it).
  -- Google OAuth users may not have a role yet — they pick it on role-select.
  -- We still insert a placeholder so the FK is satisfied; onboarding upserts
  -- the real role when the user completes their profile.
  insert into public.users (id, email, role, full_name, account_status, is_verified)
  values (
    new.id,
    new.email,
    case when _role in ('client', 'photographer', 'admin') then _role::user_role else 'client' end,
    _full_name,
    'active',
    false
  )
  on conflict (id) do nothing;  -- safe to call multiple times

  return new;
end;
$$;

-- Drop existing trigger if it exists, then recreate
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();
