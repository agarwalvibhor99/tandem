begin;

create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  email text not null check (char_length(email) between 3 and 254),
  avatar_url text check (avatar_url is null or (char_length(avatar_url) <= 2048 and avatar_url ~ '^https://')),
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Privileges and RLS are both required. Auth owns identity/email/timestamps.
revoke all on table public.profiles from public, anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (name, avatar_url, timezone) on table public.profiles to authenticated;

create policy profiles_read_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create function private.validate_profile()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.name := btrim(new.name);
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'Invalid profile timezone' using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create trigger profiles_validate_before_write
before insert or update on public.profiles
for each row execute function private.validate_profile();

-- A trigger creates the profile in the same transaction as the Auth user.
-- This also works when email confirmation prevents an immediate client session.
create function private.create_user_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name, email, timezone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'timezone', 'UTC')
  );
  return new;
end;
$$;

create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function private.create_user_profile();

-- Email is a synchronized Auth field, not an independently editable claim.
create function private.sync_profile_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_email_changed_sync_profile
after update of email on auth.users
for each row when (old.email is distinct from new.email)
execute function private.sync_profile_email();

revoke all on function private.validate_profile() from public, anon, authenticated;
revoke all on function private.create_user_profile() from public, anon, authenticated;
revoke all on function private.sync_profile_email() from public, anon, authenticated;

-- Support email/password users created before this migration was applied.
insert into public.profiles (id, name, email, timezone)
select
  u.id,
  left(coalesce(nullif(btrim(u.raw_user_meta_data ->> 'name'), ''), 'Tandem member'), 80),
  u.email,
  case when exists (
    select 1 from pg_catalog.pg_timezone_names t where t.name = u.raw_user_meta_data ->> 'timezone'
  ) then u.raw_user_meta_data ->> 'timezone' else 'UTC' end
from auth.users u
where u.email is not null
on conflict (id) do nothing;

commit;
