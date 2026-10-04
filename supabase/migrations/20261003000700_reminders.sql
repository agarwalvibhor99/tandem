begin;

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  assigned_to uuid references auth.users(id) on delete set null,
  title text not null check (title = btrim(title) and char_length(title) between 1 and 160),
  notes text not null default '' check (char_length(notes) <= 2000),
  remind_at timestamptz not null,
  visibility text not null default 'private' check (visibility in ('private', 'shared')),
  recurrence text not null default 'none' check (recurrence in ('none', 'daily', 'weekly', 'monthly')),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reminder_visibility_scope check (
    (visibility = 'private' and couple_id is null and assigned_to is null) or
    (visibility = 'shared' and couple_id is not null)
  )
);
create index reminders_private_due_idx on public.reminders(created_by, completed, remind_at, id) where visibility = 'private';
create index reminders_shared_due_idx on public.reminders(couple_id, completed, remind_at, id) where visibility = 'shared';
create index reminders_assignee_idx on public.reminders(assigned_to, completed, remind_at);

alter table public.reminders enable row level security;
revoke all on public.reminders from public, anon, authenticated;
grant select, delete on public.reminders to authenticated;
grant insert (id, couple_id, assigned_to, title, notes, remind_at, visibility, recurrence) on public.reminders to authenticated;
grant update (couple_id, assigned_to, title, notes, remind_at, visibility, recurrence, completed) on public.reminders to authenticated;

create policy reminders_read on public.reminders for select to authenticated using (
  (visibility = 'private' and created_by = (select auth.uid())) or
  (visibility = 'shared' and couple_id = (select private.current_couple_id()))
);
create policy reminders_create on public.reminders for insert to authenticated with check (
  created_by = (select auth.uid()) and (
    (visibility = 'private' and couple_id is null and assigned_to is null) or
    (visibility = 'shared' and couple_id = (select private.current_couple_id()))
  )
);
create policy reminders_update on public.reminders for update to authenticated using (
  (visibility = 'private' and created_by = (select auth.uid())) or
  (visibility = 'shared' and couple_id = (select private.current_couple_id()))
) with check (
  (visibility = 'private' and created_by = (select auth.uid()) and couple_id is null and assigned_to is null) or
  (visibility = 'shared' and couple_id = (select private.current_couple_id()))
);
create policy reminders_delete on public.reminders for delete to authenticated using (
  (visibility = 'private' and created_by = (select auth.uid())) or
  (visibility = 'shared' and couple_id = (select private.current_couple_id()))
);

create function private.validate_reminder() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.title := btrim(new.title);
  if tg_op = 'UPDATE' then
    if new.id <> old.id or new.created_by <> old.created_by or new.created_at <> old.created_at then raise exception 'REMINDER_IDENTITY_IMMUTABLE'; end if;
    if (new.visibility <> old.visibility or new.couple_id is distinct from old.couple_id) and auth.uid() is distinct from old.created_by then raise exception 'REMINDER_CREATOR_ONLY'; end if;
  end if;
  if new.visibility = 'shared' then
    perform 1 from public.couple_memberships where couple_id = new.couple_id and user_id = new.created_by for key share;
    if not found then raise exception 'REMINDER_MEMBERSHIP_REQUIRED'; end if;
    if new.assigned_to is not null then
      perform 1 from public.couple_memberships where couple_id = new.couple_id and user_id = new.assigned_to for key share;
      if not found then raise exception 'REMINDER_INVALID_ASSIGNEE'; end if;
    end if;
  else
    new.couple_id := null;
    new.assigned_to := null;
  end if;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
create trigger validate_reminder before insert or update on public.reminders for each row execute function private.validate_reminder();
revoke all on function private.validate_reminder() from public, anon, authenticated;

create function private.broadcast_reminder_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare audience text; audiences text[] := array[]::text[];
begin
  if tg_op <> 'INSERT' then
    audiences := array_append(audiences, 'reminders:user:' || old.created_by::text);
    if old.visibility = 'shared' then audiences := array_append(audiences, 'reminders:couple:' || old.couple_id::text); end if;
  end if;
  if tg_op <> 'DELETE' then
    audiences := array_append(audiences, 'reminders:user:' || new.created_by::text);
    if new.visibility = 'shared' then audiences := array_append(audiences, 'reminders:couple:' || new.couple_id::text); end if;
  end if;
  for audience in select distinct unnest(audiences) loop
    perform realtime.send('{}'::jsonb, 'reminders_changed', audience, true);
  end loop;
  return null;
end;
$$;
create trigger broadcast_reminder_change after insert or update or delete on public.reminders for each row execute function private.broadcast_reminder_change();
revoke all on function private.broadcast_reminder_change() from public, anon, authenticated;
create policy reminders_broadcast_read on realtime.messages for select to authenticated using (
  extension = 'broadcast' and topic = (select realtime.topic()) and (
    (select realtime.topic()) = 'reminders:user:' || (select auth.uid())::text or
    (select realtime.topic()) = 'reminders:couple:' || (select private.current_couple_id())::text
  )
);

commit;
