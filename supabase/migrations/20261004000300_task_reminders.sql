begin;

alter table public.tasks
  add column if not exists reminder_offset_minutes integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'task_reminder_offset'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint task_reminder_offset
      check (reminder_offset_minutes is null or reminder_offset_minutes in (0, 5, 10, 15, 30, 60, 1440));
  end if;
end $$;

grant insert (id, couple_id, assigned_to, title, description, due_at, status, priority, category, visibility, reminder_offset_minutes) on public.tasks to authenticated;
grant update (couple_id, assigned_to, title, description, due_at, status, priority, category, visibility, reminder_offset_minutes) on public.tasks to authenticated;

commit;
