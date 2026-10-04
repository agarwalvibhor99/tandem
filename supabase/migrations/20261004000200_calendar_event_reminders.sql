begin;

alter table public.calendar_events
  add column if not exists reminder_offset_minutes integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'calendar_event_reminder_offset'
      and conrelid = 'public.calendar_events'::regclass
  ) then
    alter table public.calendar_events
      add constraint calendar_event_reminder_offset
      check (reminder_offset_minutes is null or reminder_offset_minutes in (0, 5, 10, 15, 30, 60, 1440));
  end if;
end $$;

grant insert (id, couple_id, title, start_at, end_at, visibility, location, notes, reminder_offset_minutes) on public.calendar_events to authenticated;
grant update (couple_id, title, start_at, end_at, visibility, location, notes, reminder_offset_minutes) on public.calendar_events to authenticated;

drop function if exists public.get_calendar_window(timestamptz,timestamptz);

create function public.get_calendar_window(window_start timestamptz, window_end timestamptz)
returns table (
  id uuid, couple_id uuid, owner_id uuid, title text, start_at timestamptz,
  end_at timestamptz, visibility text, location text, notes text,
  reminder_offset_minutes integer, created_at timestamptz, updated_at timestamptz
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
      case when e.visibility = 'private' and e.owner_id <> actor then null::integer else e.reminder_offset_minutes end,
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

commit;
