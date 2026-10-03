-- Run in a disposable/development database after all migrations; rolls back.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
('bbbbbbbb-0000-4000-8000-000000000001','alex-tasks@example.com','{"name":"Alex"}'),
('bbbbbbbb-0000-4000-8000-000000000002','sam-tasks@example.com','{"name":"Sam"}'),
('bbbbbbbb-0000-4000-8000-000000000003','casey-tasks@example.com','{"name":"Casey"}');
create function pg_temp.expect_error(statement text, expected text) returns void language plpgsql as $$
begin
 begin execute statement;
 exception when others then
   if sqlerrm = expected or sqlstate = expected then return; end if;
   raise exception 'Expected %, got % (%)', expected, sqlerrm, sqlstate;
 end;
 raise exception 'Unexpectedly succeeded: %', statement;
end;
$$;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-0000-4000-8000-000000000001',true);
select public.create_couple('Alex and Sam tasks') as space_id \gset
select invite_code as code from public.generate_couple_invite() \gset
select set_config('request.jwt.claim.sub','bbbbbbbb-0000-4000-8000-000000000002',true);
select public.accept_couple_invite(:'code');
select set_config('request.jwt.claim.sub','bbbbbbbb-0000-4000-8000-000000000001',true);
insert into public.tasks(id,title,description,visibility,assigned_to) values
('cccccccc-0000-4000-8000-000000000001','Plan a surprise gift','Secret present details','private',auth.uid());
insert into public.tasks(id,title,couple_id,visibility,assigned_to,category,priority,due_at) values
('cccccccc-0000-4000-8000-000000000002','Book the car service',:'space_id','shared','bbbbbbbb-0000-4000-8000-000000000002','Errands','high',now()+interval '1 day');
select pg_temp.expect_error($q$insert into public.tasks(title,created_by) values('Forged creator','bbbbbbbb-0000-4000-8000-000000000002')$q$,'42501');
select pg_temp.expect_error($q$insert into public.tasks(title,visibility,assigned_to) values('Hidden assignment','private','bbbbbbbb-0000-4000-8000-000000000002')$q$,'23514');
select pg_temp.expect_error(format($q$insert into public.tasks(title,visibility,couple_id,assigned_to) values('Outsider assignment','shared',%L,'bbbbbbbb-0000-4000-8000-000000000003')$q$,:'space_id'),'TASK_INVALID_ASSIGNEE');
select pg_temp.expect_error($q$insert into public.tasks(title,visibility) values('No space','shared')$q$,'TASK_MEMBERSHIP_REQUIRED');
select pg_temp.expect_error($q$insert into public.tasks(title) values('   ')$q$,'23514');
select pg_temp.expect_error($q$insert into public.tasks(title,status) values('Wrong state','done')$q$,'23514');
select pg_temp.expect_error($q$insert into public.tasks(title,category) values('Wrong category','Work')$q$,'23514');
select pg_temp.expect_error($q$insert into public.tasks(title,priority) values('Wrong priority','urgent')$q$,'23514');

-- B can read and work on the shared task, but private task SELECT/UPDATE/DELETE return no rows.
select set_config('request.jwt.claim.sub','bbbbbbbb-0000-4000-8000-000000000002',true);
do $$ begin
 if exists(select from public.tasks where id='cccccccc-0000-4000-8000-000000000001') then raise exception 'B can read A private task'; end if;
 update public.tasks set title='Stolen' where id='cccccccc-0000-4000-8000-000000000001';
 if found then raise exception 'B can edit A private task'; end if;
 delete from public.tasks where id='cccccccc-0000-4000-8000-000000000001';
 if found then raise exception 'B can delete A private task'; end if;
 if (select count(*) from public.tasks where id='cccccccc-0000-4000-8000-000000000002') <> 1 then raise exception 'B cannot read shared task'; end if;
 update public.tasks set status='completed' where id='cccccccc-0000-4000-8000-000000000002';
 if (select completed_at from public.tasks where id='cccccccc-0000-4000-8000-000000000002') is null then raise exception 'Completion timestamp missing'; end if;
 update public.tasks set status='open',title='Book service for Saturday' where id='cccccccc-0000-4000-8000-000000000002';
 if (select completed_at from public.tasks where id='cccccccc-0000-4000-8000-000000000002') is not null then raise exception 'Reopen timestamp incorrect'; end if;
end $$;
select pg_temp.expect_error($q$update public.tasks set visibility='private',couple_id=null,assigned_to=null where id='cccccccc-0000-4000-8000-000000000002'$q$,'TASK_CREATOR_ONLY');
select pg_temp.expect_error($q$update public.tasks set created_by=auth.uid() where id='cccccccc-0000-4000-8000-000000000002'$q$,'42501');
select pg_temp.expect_error($q$update public.tasks set completed_at=now() where id='cccccccc-0000-4000-8000-000000000002'$q$,'42501');
select pg_temp.expect_error($q$update public.tasks set updated_at=now() where id='cccccccc-0000-4000-8000-000000000002'$q$,'42501');

-- Unrelated C cannot read, modify, create in, or subscribe to the couple.
select set_config('request.jwt.claim.sub','bbbbbbbb-0000-4000-8000-000000000003',true);
do $$ begin
 if exists(select from public.tasks) then raise exception 'C can read other users tasks'; end if;
 update public.tasks set status='completed' where id='cccccccc-0000-4000-8000-000000000002';
 if found then raise exception 'C can complete shared task'; end if;
 delete from public.tasks where id='cccccccc-0000-4000-8000-000000000002';
 if found then raise exception 'C can delete shared task'; end if;
end $$;
select pg_temp.expect_error(format($q$insert into public.tasks(title,visibility,couple_id) values('Intruder','shared',%L)$q$,:'space_id'),'TASK_MEMBERSHIP_REQUIRED');
-- Solo users retain fully functional private tasks.
insert into public.tasks(title,visibility,status) values('Call the dentist','private','completed');
do $$ begin
 if (select count(*) from public.tasks) <> 1 then raise exception 'Solo task unavailable'; end if;
end $$;

-- Only creator can change visibility. Previously shared content disappears for B.
select set_config('request.jwt.claim.sub','bbbbbbbb-0000-4000-8000-000000000001',true);
update public.tasks set visibility='private',couple_id=null,assigned_to=auth.uid() where id='cccccccc-0000-4000-8000-000000000002';
select set_config('request.jwt.claim.sub','bbbbbbbb-0000-4000-8000-000000000002',true);
do $$ begin
 if exists(select from public.tasks) then raise exception 'B retains task after privatization'; end if;
end $$;
select set_config('request.jwt.claim.sub','bbbbbbbb-0000-4000-8000-000000000001',true);
update public.tasks set visibility='shared',couple_id=:'space_id',assigned_to=null where id='cccccccc-0000-4000-8000-000000000002';
select set_config('request.jwt.claim.sub','bbbbbbbb-0000-4000-8000-000000000002',true);
-- Stale versions cannot overwrite a partner's newer edit (same predicate as SDK).
select updated_at as version from public.tasks where id='cccccccc-0000-4000-8000-000000000002' \gset
update public.tasks set title='Book the garage' where id='cccccccc-0000-4000-8000-000000000002';
update public.tasks set title='Stale overwrite' where id='cccccccc-0000-4000-8000-000000000002' and updated_at=:'version';
do $$ begin
 if (select title from public.tasks where id='cccccccc-0000-4000-8000-000000000002') <> 'Book the garage' then raise exception 'Stale update won'; end if;
end $$;
delete from public.tasks where id='cccccccc-0000-4000-8000-000000000002';
reset role;
set local role anon;
select pg_temp.expect_error($q$select * from public.tasks$q$,'42501');
select pg_temp.expect_error($q$insert into public.tasks(title) values('Anonymous')$q$,'42501');
reset role;
rollback;
