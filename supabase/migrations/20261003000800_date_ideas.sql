begin;

create table public.date_ideas (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  title text not null check (title = btrim(title) and char_length(title) between 1 and 160),
  category text not null check (category in ('food', 'outdoor', 'entertainment', 'trip', 'at_home', 'activity', 'other')),
  cost_level smallint not null check (cost_level between 1 and 4),
  duration_minutes integer not null check (duration_minutes between 30 and 1440),
  location text not null default '' check (location = btrim(location) and char_length(location) <= 300),
  notes text not null default '' check (notes = btrim(notes) and char_length(notes) <= 2000),
  status text not null default 'want_to_do' check (status in ('want_to_do', 'planned', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index date_ideas_couple_status_idx on public.date_ideas(couple_id, status, created_at desc);

alter table public.date_ideas enable row level security;
revoke all on public.date_ideas from public, anon, authenticated;
grant select on public.date_ideas to authenticated;
grant insert (couple_id, title, category, cost_level, duration_minutes, location, notes, status) on public.date_ideas to authenticated;
grant update (title, category, cost_level, duration_minutes, location, notes, status) on public.date_ideas to authenticated;

create policy date_ideas_read on public.date_ideas for select to authenticated
  using (couple_id = (select private.current_couple_id()));
create policy date_ideas_create on public.date_ideas for insert to authenticated
  with check (created_by = (select auth.uid()) and couple_id = (select private.current_couple_id()));
create policy date_ideas_update on public.date_ideas for update to authenticated
  using (couple_id = (select private.current_couple_id()))
  with check (couple_id = (select private.current_couple_id()));

create function private.validate_date_idea() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.title := btrim(new.title);
  new.location := btrim(new.location);
  new.notes := btrim(new.notes);
  -- Clients cannot write created_by (column grants); allow FK SET NULL when its
  -- Auth account is removed so the partner keeps the shared idea.
  if tg_op = 'UPDATE' and (new.id <> old.id or new.couple_id <> old.couple_id or
      new.created_at <> old.created_at) then
    raise exception 'DATE_IDEA_IDENTITY_IMMUTABLE';
  end if;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
create trigger validate_date_idea before insert or update on public.date_ideas
  for each row execute function private.validate_date_idea();
revoke all on function private.validate_date_idea() from public, anon, authenticated;

create function private.broadcast_date_idea_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform realtime.send('{}'::jsonb, 'date_ideas_changed', 'dates:couple:' ||
    case when tg_op = 'DELETE' then old.couple_id else new.couple_id end::text, true);
  return null;
end;
$$;
create trigger broadcast_date_idea_change after insert or update or delete on public.date_ideas
  for each row execute function private.broadcast_date_idea_change();
revoke all on function private.broadcast_date_idea_change() from public, anon, authenticated;
create policy date_ideas_broadcast_read on realtime.messages for select to authenticated using (
  extension = 'broadcast' and topic = (select realtime.topic()) and
  (select realtime.topic()) = 'dates:couple:' || (select private.current_couple_id())::text
);

commit;
