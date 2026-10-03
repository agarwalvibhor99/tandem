begin;

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (title = btrim(title) and char_length(title) between 1 and 160),
  start_at timestamptz not null,
  end_at timestamptz not null,
  visibility text not null check (visibility in ('private', 'shared')),
  location text not null default '' check (char_length(location) <= 300),
  notes text not null default '' check (char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_event_time_order check (end_at > start_at),
  constraint calendar_event_space check (
    (visibility = 'private' and couple_id is null) or
    (visibility = 'shared' and couple_id is not null)
  )
);
create index calendar_events_owner_window_idx on public.calendar_events(owner_id, start_at, end_at);
create index calendar_events_shared_window_idx on public.calendar_events(couple_id, start_at, end_at) where visibility = 'shared';
create index calendar_events_end_idx on public.calendar_events(end_at);
alter table public.calendar_events enable row level security;
revoke all on public.calendar_events from public, anon, authenticated;
grant select, delete on public.calendar_events to authenticated;
grant insert (id, couple_id, title, start_at, end_at, visibility, location, notes) on public.calendar_events to authenticated;
grant update (couple_id, title, start_at, end_at, visibility, location, notes) on public.calendar_events to authenticated;

create policy calendar_events_read on public.calendar_events for select to authenticated using (
  owner_id = (select auth.uid()) or
  (visibility = 'shared' and couple_id = (select private.current_couple_id()))
);
create policy calendar_events_create on public.calendar_events for insert to authenticated with check (
  owner_id = (select auth.uid()) and
  ((visibility = 'private' and couple_id is null) or
   (visibility = 'shared' and couple_id = (select private.current_couple_id())))
);
create policy calendar_events_update on public.calendar_events for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()) and
    ((visibility = 'private' and couple_id is null) or
     (visibility = 'shared' and couple_id = (select private.current_couple_id()))));
create policy calendar_events_delete on public.calendar_events for delete to authenticated
  using (owner_id = (select auth.uid()));

create function private.validate_calendar_event() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.title := btrim(new.title);
  if tg_op = 'UPDATE' and
    (new.id <> old.id or new.owner_id <> old.owner_id or new.created_at <> old.created_at) then
    raise exception 'CALENDAR_IDENTITY_IMMUTABLE';
  end if;
  if new.visibility = 'shared' then
    perform 1 from public.couple_memberships where couple_id = new.couple_id and user_id = new.owner_id for key share;
    if not found then raise exception 'CALENDAR_MEMBERSHIP_REQUIRED'; end if;
  end if;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
create trigger validate_calendar_event before insert or update on public.calendar_events
  for each row execute function private.validate_calendar_event();
revoke all on function private.validate_calendar_event() from public, anon, authenticated;

-- This is the only route for a partner to see private time. The event ID and
-- every descriptive field are removed in the database before a row is returned.
create function public.get_calendar_window(window_start timestamptz, window_end timestamptz)
returns table (
  id uuid, couple_id uuid, owner_id uuid, title text, start_at timestamptz,
  end_at timestamptz, visibility text, location text, notes text,
  created_at timestamptz, updated_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
declare actor uuid := auth.uid(); space_id uuid := private.current_couple_id();
begin
  if actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if window_start is null or window_end is null or window_end <= window_start
     or window_end > window_start + interval '43 days' then
    raise exception 'INVALID_CALENDAR_WINDOW';
  end if;
  return query
    select
      case when e.visibility = 'private' and e.owner_id <> actor then null::uuid else e.id end,
      case when e.visibility = 'private' and e.owner_id <> actor then null::uuid else e.couple_id end,
      e.owner_id,
      case when e.visibility = 'private' and e.owner_id <> actor then 'Busy'::text else e.title end,
      e.start_at, e.end_at, e.visibility,
      case when e.visibility = 'private' and e.owner_id <> actor then null::text else e.location end,
      case when e.visibility = 'private' and e.owner_id <> actor then null::text else e.notes end,
      case when e.visibility = 'private' and e.owner_id <> actor then null::timestamptz else e.created_at end,
      case when e.visibility = 'private' and e.owner_id <> actor then null::timestamptz else e.updated_at end
    from public.calendar_events e
    where e.start_at < window_end and e.end_at > window_start and (
      e.owner_id = actor or
      (space_id is not null and (
        (e.visibility = 'shared' and e.couple_id = space_id) or
        (e.visibility = 'private' and exists (
          select 1 from public.couple_memberships m
          where m.couple_id = space_id and m.user_id = e.owner_id
        ))
      ))
    )
    order by e.start_at, e.end_at, e.id;
end;
$$;
revoke all on function public.get_calendar_window(timestamptz,timestamptz) from public, anon;
grant execute on function public.get_calendar_window(timestamptz,timestamptz) to authenticated;

-- No event body, ID, or private metadata is sent over Realtime.
create function private.broadcast_calendar_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare event_owner uuid; space_id uuid;
begin
  event_owner := case when tg_op = 'DELETE' then old.owner_id else new.owner_id end;
  perform realtime.send('{}'::jsonb, 'calendar_changed', 'calendar:user:' || event_owner::text, true);
  select couple_id into space_id from public.couple_memberships where user_id = event_owner;
  if space_id is not null then
    perform realtime.send('{}'::jsonb, 'calendar_changed', 'calendar:couple:' || space_id::text, true);
  end if;
  return null;
end;
$$;
create trigger broadcast_calendar_change after insert or update or delete on public.calendar_events
  for each row execute function private.broadcast_calendar_change();
revoke all on function private.broadcast_calendar_change() from public, anon, authenticated;
create policy calendar_broadcast_read on realtime.messages for select to authenticated using (
  extension = 'broadcast' and topic = (select realtime.topic()) and (
    (select realtime.topic()) = 'calendar:user:' || (select auth.uid())::text or
    (select realtime.topic()) = 'calendar:couple:' || (select private.current_couple_id())::text
  )
);
commit;
