begin;
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  assigned_to uuid references auth.users(id) on delete set null,
  title text not null check (title = btrim(title) and char_length(title) between 1 and 160),
  description text not null default '' check (char_length(description) <= 4000),
  due_at timestamptz,
  status text not null default 'open' check (status in ('open', 'completed')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  category text not null default 'Other' check (category in ('Home', 'Errands', 'Bills', 'Shopping', 'Planning', 'Personal', 'Other')),
  visibility text not null default 'private' check (visibility in ('private', 'shared')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint task_visibility_space check (
    (visibility = 'private' and couple_id is null and (assigned_to is null or assigned_to = created_by))
    or (visibility = 'shared' and couple_id is not null)
  ),
  constraint task_completion_consistent check ((status = 'open' and completed_at is null) or (status = 'completed' and completed_at is not null))
);
create index tasks_private_creator_status_due_idx on public.tasks(created_by, status, due_at, id) where visibility = 'private';
create index tasks_shared_couple_status_due_idx on public.tasks(couple_id, status, due_at, id) where visibility = 'shared';
create index tasks_assigned_status_idx on public.tasks(assigned_to, status);
create index tasks_creator_idx on public.tasks(created_by);
create index tasks_completed_idx on public.tasks(completed_at desc, id) where status = 'completed';
alter table public.tasks enable row level security;
revoke all on public.tasks from public, anon, authenticated;
grant select, delete on public.tasks to authenticated;
grant insert (id, couple_id, assigned_to, title, description, due_at, status, priority, category, visibility) on public.tasks to authenticated;
grant update (couple_id, assigned_to, title, description, due_at, status, priority, category, visibility) on public.tasks to authenticated;

create policy tasks_read on public.tasks for select to authenticated using (
  (visibility = 'private' and created_by = (select auth.uid()))
  or (visibility = 'shared' and couple_id = (select private.current_couple_id()))
);
create policy tasks_create on public.tasks for insert to authenticated with check (
  created_by = (select auth.uid()) and (
    (visibility = 'private' and couple_id is null)
    or (visibility = 'shared' and couple_id = (select private.current_couple_id()))
  )
);
create policy tasks_update on public.tasks for update to authenticated using (
  (visibility = 'private' and created_by = (select auth.uid()))
  or (visibility = 'shared' and couple_id = (select private.current_couple_id()))
) with check (
  (visibility = 'private' and created_by = (select auth.uid()))
  or (visibility = 'shared' and couple_id = (select private.current_couple_id()))
);
create policy tasks_delete on public.tasks for delete to authenticated using (
  (visibility = 'private' and created_by = (select auth.uid()))
  or (visibility = 'shared' and couple_id = (select private.current_couple_id()))
);

create function private.validate_task() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.title := btrim(new.title);
  if tg_op = 'UPDATE' then
    if new.created_by <> old.created_by or new.id <> old.id or new.created_at <> old.created_at then
      raise exception 'TASK_IDENTITY_IMMUTABLE';
    end if;
    if (new.visibility <> old.visibility or new.couple_id is distinct from old.couple_id)
       and auth.uid() is distinct from old.created_by then raise exception 'TASK_CREATOR_ONLY'; end if;
  end if;
  if new.visibility = 'shared' then
    -- Locks membership against concurrent removal while validating assignment.
    perform 1 from public.couple_memberships where couple_id = new.couple_id and user_id = new.created_by for key share;
    if not found then raise exception 'TASK_MEMBERSHIP_REQUIRED'; end if;
    if new.assigned_to is not null then
      perform 1 from public.couple_memberships where couple_id = new.couple_id and user_id = new.assigned_to for key share;
      if not found then raise exception 'TASK_INVALID_ASSIGNEE'; end if;
    end if;
  end if;
  new.updated_at := clock_timestamp();
  if new.status = 'open' then new.completed_at := null;
  elsif tg_op = 'INSERT' then new.completed_at := clock_timestamp();
  elsif old.status <> 'completed' then new.completed_at := clock_timestamp();
  else new.completed_at := old.completed_at;
  end if;
  return new;
end;
$$;
create trigger validate_task before insert or update on public.tasks for each row execute function private.validate_task();
revoke all on function private.validate_task() from public, anon, authenticated;

-- Private Broadcast: send no row content, IDs, titles, or old private values.
-- Includes the OLD audience on shared -> private and delete so stale UI is removed.
create function private.broadcast_task_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare audience text; audiences text[] := array[]::text[];
begin
  if tg_op <> 'INSERT' then
    audiences := array_append(audiences, 'tasks:user:' || old.created_by::text);
    if old.visibility = 'shared' then audiences := array_append(audiences, 'tasks:couple:' || old.couple_id::text); end if;
  end if;
  if tg_op <> 'DELETE' then
    audiences := array_append(audiences, 'tasks:user:' || new.created_by::text);
    if new.visibility = 'shared' then audiences := array_append(audiences, 'tasks:couple:' || new.couple_id::text); end if;
  end if;
  for audience in select distinct unnest(audiences) loop
    perform realtime.send('{}'::jsonb, 'tasks_changed', audience, true);
  end loop;
  return null;
end;
$$;
create trigger broadcast_task_change after insert or update or delete on public.tasks for each row execute function private.broadcast_task_change();
revoke all on function private.broadcast_task_change() from public, anon, authenticated;

-- Supabase owns realtime.messages and enables RLS. Do not change its ownership.
create policy tasks_broadcast_read on realtime.messages for select to authenticated using (
  extension = 'broadcast' and topic = (select realtime.topic()) and (
    (select realtime.topic()) = 'tasks:user:' || (select auth.uid())::text
    or (select realtime.topic()) = 'tasks:couple:' || (select private.current_couple_id())::text
  )
);
-- No INSERT policy: clients may receive task events, never forge them.
commit;
