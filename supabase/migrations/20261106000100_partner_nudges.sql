begin;

create table public.partner_nudges (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null check (type in ('rose', 'heart', 'coffee')),
  created_at timestamptz not null default now()
);

create index partner_nudges_couple_created_idx on public.partner_nudges(couple_id, created_at desc);

alter table public.partner_nudges enable row level security;
revoke all on public.partner_nudges from public, anon, authenticated;
grant select, insert on public.partner_nudges to authenticated;

create policy partner_nudges_read on public.partner_nudges for select to authenticated using (
  couple_id = (select private.current_couple_id())
);

create policy partner_nudges_create on public.partner_nudges for insert to authenticated with check (
  created_by = (select auth.uid()) and couple_id = (select private.current_couple_id())
);

create function private.broadcast_partner_nudge() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform realtime.send('{}'::jsonb, 'nudge_created', 'nudges:couple:' || new.couple_id::text, true);
  return new;
end;
$$;

create trigger broadcast_partner_nudge after insert on public.partner_nudges for each row execute function private.broadcast_partner_nudge();
revoke all on function private.broadcast_partner_nudge() from public, anon, authenticated;

create policy partner_nudges_broadcast_read on realtime.messages for select to authenticated using (
  extension = 'broadcast' and topic = (select realtime.topic()) and
  (select realtime.topic()) = 'nudges:couple:' || (select private.current_couple_id())::text
);

commit;
