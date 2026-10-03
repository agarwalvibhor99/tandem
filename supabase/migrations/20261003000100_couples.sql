begin;

-- This preference affects onboarding only, never authorization.
alter table public.profiles add column couple_onboarding_skipped_at timestamptz;
grant update (couple_onboarding_skipped_at) on public.profiles to authenticated;

create table public.couples (
  id uuid primary key default gen_random_uuid(),
  name text not null check (name = btrim(name) and char_length(name) between 1 and 80),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.couple_memberships (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (couple_id, user_id)
);
create table public.couple_invites (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  invite_code text not null unique check (invite_code ~ '^[A-F0-9]{16}$'),
  created_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create index couple_invites_couple_created_idx on public.couple_invites(couple_id, created_at desc);
create index couples_created_by_idx on public.couples(created_by);
create index couple_invites_created_by_idx on public.couple_invites(created_by);

alter table public.couples enable row level security;
alter table public.couple_memberships enable row level security;
alter table public.couple_invites enable row level security;
revoke all on public.couples, public.couple_memberships, public.couple_invites from public, anon, authenticated;
grant select on public.couples, public.couple_memberships, public.couple_invites to authenticated;

-- No caller-controlled identity; bypasses recursive membership RLS only.
create function private.current_couple_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select couple_id from public.couple_memberships where user_id = (select auth.uid());
$$;
revoke all on function private.current_couple_id() from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.current_couple_id() to authenticated;

create policy own_couple_read on public.couples for select to authenticated
  using (id = (select private.current_couple_id()));
create policy own_couple_members_read on public.couple_memberships for select to authenticated
  using (couple_id = (select private.current_couple_id()));
create policy own_invites_read on public.couple_invites for select to authenticated
  using (created_by = (select auth.uid()) and couple_id = (select private.current_couple_id()));

-- Also protects privileged imports. Locking the parent serializes concurrent joins.
create function private.limit_couple_members() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.couples where id = new.couple_id for update;
  if (select count(*) from public.couple_memberships where couple_id = new.couple_id and id <> new.id) >= 2 then
    raise exception 'COUPLE_FULL';
  end if;
  return new;
end;
$$;
create trigger couple_members_limit before insert or update on public.couple_memberships
for each row execute function private.limit_couple_members();
revoke all on function private.limit_couple_members() from public, anon, authenticated;

create function public.create_couple(space_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); space_id uuid;
begin
  if actor is null then raise exception 'AUTH_REQUIRED'; end if;
  -- Serialize create/join for this user, including requests from multiple devices.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text, 0));
  if exists (select 1 from public.couple_memberships where user_id = actor) then raise exception 'ALREADY_CONNECTED'; end if;
  if space_name is null or char_length(btrim(space_name)) not between 1 and 80 then raise exception 'INVALID_SPACE_NAME'; end if;
  insert into public.couples(name, created_by) values (btrim(space_name), actor) returning id into space_id;
  insert into public.couple_memberships(couple_id, user_id, role) values (space_id, actor, 'owner');
  return space_id;
end;
$$;

create function public.generate_couple_invite() returns public.couple_invites
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); space_id uuid; result public.couple_invites;
begin
  if actor is null then raise exception 'AUTH_REQUIRED'; end if;
  select couple_id into space_id from public.couple_memberships where user_id = actor;
  if space_id is null then raise exception 'NO_COUPLE'; end if;
  perform 1 from public.couples where id = space_id for update;
  if (select count(*) from public.couple_memberships where couple_id = space_id) >= 2 then raise exception 'COUPLE_FULL'; end if;
  -- Any remaining member may invite if the other account was deleted.
  update public.couple_invites set expires_at = least(expires_at, clock_timestamp())
    where couple_id = space_id and accepted_at is null;
  insert into public.couple_invites(couple_id, invite_code, created_by, expires_at)
    values (space_id, upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8) || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)), actor, clock_timestamp() + interval '24 hours')
    returning * into result;
  return result;
end;
$$;

create function public.accept_couple_invite(code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); invitation public.couple_invites; normalized text;
begin
  if actor is null then raise exception 'AUTH_REQUIRED'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text, 0));
  normalized := upper(regexp_replace(code, '[[:space:]-]', '', 'g'));
  select * into invitation from public.couple_invites where invite_code = normalized;
  if not found then raise exception 'INVALID_INVITE'; end if;
  -- All invite mutations take the parent lock first, then reread current state.
  perform 1 from public.couples where id = invitation.couple_id for update;
  select * into invitation from public.couple_invites where id = invitation.id;
  if invitation.created_by = actor then raise exception 'SELF_INVITE'; end if;
  if exists (select 1 from public.couple_memberships where user_id = actor) then raise exception 'ALREADY_CONNECTED'; end if;
  if invitation.accepted_at is not null then raise exception 'INVITE_USED'; end if;
  if invitation.expires_at <= clock_timestamp() then raise exception 'INVITE_EXPIRED'; end if;
  if (select count(*) from public.couple_memberships where couple_id = invitation.couple_id) >= 2 then raise exception 'COUPLE_FULL'; end if;
  insert into public.couple_memberships(couple_id, user_id, role) values (invitation.couple_id, actor, 'member');
  update public.couple_invites set accepted_at = clock_timestamp() where id = invitation.id;
  return invitation.couple_id;
end;
$$;

-- Deliberately excludes profile email, timezone, and other private fields.
create function public.get_couple_members()
returns table (id uuid, couple_id uuid, user_id uuid, role text, joined_at timestamptz, name text)
language sql stable security definer set search_path = '' as $$
  select m.id, m.couple_id, m.user_id, m.role, m.joined_at, p.name
  from public.couple_memberships m join public.profiles p on p.id = m.user_id
  where m.couple_id = private.current_couple_id() order by m.joined_at, m.id;
$$;

revoke all on function public.create_couple(text), public.generate_couple_invite(), public.accept_couple_invite(text), public.get_couple_members() from public, anon, authenticated;
grant execute on function public.create_couple(text), public.generate_couple_invite(), public.accept_couple_invite(text), public.get_couple_members() to authenticated;
commit;
