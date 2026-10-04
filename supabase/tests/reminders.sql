-- Disposable database only. Changes roll back.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
('ffffffff-4000-4000-8000-000000000001','alex-reminder@example.com','{"name":"Alex"}'),
('ffffffff-4000-4000-8000-000000000002','sam-reminder@example.com','{"name":"Sam"}'),
('ffffffff-4000-4000-8000-000000000003','casey-reminder@example.com','{"name":"Casey"}');
create function pg_temp.expect_error(statement text, expected text) returns void language plpgsql as $$
begin
  begin execute statement;
  exception when others then
    if sqlstate = expected or sqlerrm = expected then return; end if;
    raise exception 'Expected %, got % (%)', expected, sqlerrm, sqlstate;
  end;
  raise exception 'Unexpectedly succeeded: %', statement;
end;
$$;
set local role authenticated;
select set_config('request.jwt.claim.sub','ffffffff-4000-4000-8000-000000000001',true);
select public.create_couple('Reminder space') as space_id \gset
select invite_code as code from public.generate_couple_invite() \gset
insert into public.reminders(title, notes, remind_at, visibility, recurrence)
values ('Personal check-in', 'Only Alex sees this', '2026-10-05 09:00+00', 'private', 'none');
select set_config('request.jwt.claim.sub','ffffffff-4000-4000-8000-000000000002',true);
select public.accept_couple_invite(:'code');
select set_config('request.jwt.claim.sub','ffffffff-4000-4000-8000-000000000001',true);
insert into public.reminders(couple_id, assigned_to, title, remind_at, visibility, recurrence)
values (:'space_id', 'ffffffff-4000-4000-8000-000000000002', 'Shared bins', '2026-10-05 19:00+00', 'shared', 'weekly');
do $$ begin
  if (select count(*) from public.reminders) <> 2 then raise exception 'Owner cannot read both reminders'; end if;
end $$;
select pg_temp.expect_error(format($q$insert into public.reminders(couple_id, assigned_to, title, remind_at, visibility) values(%L,%L,'Bad assignment','2026-10-05 19:00+00','shared')$q$,:'space_id','ffffffff-4000-4000-8000-000000000003'),'REMINDER_INVALID_ASSIGNEE');
select set_config('request.jwt.claim.sub','ffffffff-4000-4000-8000-000000000002',true);
do $$ begin
  if (select count(*) from public.reminders) <> 1 then raise exception 'Partner can read a private reminder'; end if;
end $$;
update public.reminders set completed = true where title = 'Shared bins';
select set_config('request.jwt.claim.sub','ffffffff-4000-4000-8000-000000000003',true);
do $$ begin
  if exists(select from public.reminders) then raise exception 'Unrelated user can read reminders'; end if;
end $$;
reset role;
set local role anon;
select pg_temp.expect_error($q$select * from public.reminders$q$,'42501');
rollback;
