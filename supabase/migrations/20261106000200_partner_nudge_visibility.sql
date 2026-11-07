alter table public.partner_nudges
  add column if not exists status text not null default 'visible';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'partner_nudges_status_check'
      and conrelid = 'public.partner_nudges'::regclass
  ) then
    alter table public.partner_nudges
      add constraint partner_nudges_status_check check (status in ('visible', 'hidden'));
  end if;
end $$;

create index if not exists partner_nudges_couple_status_idx
  on public.partner_nudges(couple_id, status, created_at desc);

grant update (status) on public.partner_nudges to authenticated;

drop policy if exists "Couple members can update nudge status" on public.partner_nudges;
create policy "Couple members can update nudge status"
  on public.partner_nudges for update
  using (couple_id = private.current_couple_id())
  with check (couple_id = private.current_couple_id());

create or replace function private.broadcast_partner_nudge_status()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  perform realtime.broadcast_changes(
    'nudges:couple:' || new.couple_id::text,
    'nudge_updated',
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    new,
    old
  );
  return new;
end;
$$;

drop trigger if exists partner_nudges_status_broadcast on public.partner_nudges;
create trigger partner_nudges_status_broadcast
  after update of status on public.partner_nudges
  for each row execute function private.broadcast_partner_nudge_status();
