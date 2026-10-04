begin;

create or replace function private.validate_calendar_event() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.title := btrim(new.title);
  if tg_op = 'UPDATE' and
    (new.id <> old.id or new.owner_id <> old.owner_id or new.created_at <> old.created_at) then
    raise exception 'CALENDAR_IDENTITY_IMMUTABLE';
  end if;
  if new.start_at < now() then
    raise exception 'CALENDAR_START_IN_PAST';
  end if;
  if new.visibility = 'shared' then
    perform 1 from public.couple_memberships where couple_id = new.couple_id and user_id = new.owner_id for key share;
    if not found then raise exception 'CALENDAR_MEMBERSHIP_REQUIRED'; end if;

    perform 1
    from public.calendar_events e
    where e.id <> new.id
      and e.start_at < new.end_at
      and e.end_at > new.start_at
      and (
        (e.visibility = 'shared' and e.couple_id = new.couple_id) or
        exists (
          select 1 from public.couple_memberships m
          where m.couple_id = new.couple_id and m.user_id = e.owner_id
        )
      )
    limit 1;
    if found then raise exception 'CALENDAR_CONFLICT'; end if;
  else
    perform 1
    from public.calendar_events e
    where e.id <> new.id
      and e.start_at < new.end_at
      and e.end_at > new.start_at
      and (
        e.owner_id = new.owner_id or
        (
          e.visibility = 'shared' and exists (
            select 1 from public.couple_memberships m
            where m.couple_id = e.couple_id and m.user_id = new.owner_id
          )
        )
      )
    limit 1;
    if found then raise exception 'CALENDAR_CONFLICT'; end if;
  end if;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
revoke all on function private.validate_calendar_event() from public, anon, authenticated;

commit;
