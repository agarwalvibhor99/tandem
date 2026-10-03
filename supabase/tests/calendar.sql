-- Disposable database only. Changes roll back.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
('ffffffff-1000-4000-8000-000000000001','alex-calendar@example.com','{"name":"Alex"}'),
('ffffffff-1000-4000-8000-000000000002','sam-calendar@example.com','{"name":"Sam"}'),
('ffffffff-1000-4000-8000-000000000003','casey-calendar@example.com','{"name":"Casey"}');
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
select set_config('request.jwt.claim.sub','ffffffff-1000-4000-8000-000000000001',true);
select public.create_couple('Calendar space') as space_id \gset
select invite_code as code from public.generate_couple_invite() \gset
insert into public.calendar_events(id,title,start_at,end_at,visibility,location,notes) values
('ffffffff-2000-4000-8000-000000000001','Private appointment','2026-10-03 09:00+00','2026-10-03 10:00+00','private','Secret office','Sensitive private notes');
insert into public.calendar_events(id,couple_id,title,start_at,end_at,visibility,location,notes) values
('ffffffff-2000-4000-8000-000000000002',:'space_id','Dinner','2026-10-03 18:00+00','2026-10-03 20:00+00','shared','Ramen place','Book a table');
do $$ begin
  if (select count(*) from public.get_calendar_window('2026-10-03 00:00+00','2026-10-04 00:00+00')) <> 2 then raise exception 'Owner window incomplete'; end if;
  if not exists(select 1 from public.get_calendar_window('2026-10-03 00:00+00','2026-10-04 00:00+00') where title='Private appointment' and location='Secret office' and notes='Sensitive private notes') then raise exception 'Owner private details missing'; end if;
end $$;
select pg_temp.expect_error($q$insert into public.calendar_events(title,start_at,end_at,visibility) values('Invalid','2026-10-03 10:00+00','2026-10-03 09:00+00','private')$q$,'23514');
select pg_temp.expect_error($q$insert into public.calendar_events(title,start_at,end_at,visibility,couple_id) values('No space','2026-10-03 10:00+00','2026-10-03 11:00+00','private','ffffffff-2000-4000-8000-000000000002')$q$,'42501');
select pg_temp.expect_error($q$insert into public.calendar_events(title,start_at,end_at,visibility,owner_id) values('Forged','2026-10-03 10:00+00','2026-10-03 11:00+00','private','ffffffff-1000-4000-8000-000000000002')$q$,'42501');
select pg_temp.expect_error($q$select * from public.get_calendar_window('2026-10-03 00:00+00','2027-01-03 00:00+00')$q$,'INVALID_CALENDAR_WINDOW');
select set_config('request.jwt.claim.sub','ffffffff-1000-4000-8000-000000000002',true);
select public.accept_couple_invite(:'code');
do $$ declare masked record;
begin
  if (select count(*) from public.calendar_events) <> 1 then raise exception 'Partner direct table read leaked private event'; end if;
  select * into masked from public.get_calendar_window('2026-10-03 00:00+00','2026-10-04 00:00+00') where visibility='private';
  if not found or masked.title <> 'Busy' or masked.id is not null or masked.location is not null or masked.notes is not null or masked.created_at is not null or masked.updated_at is not null or masked.couple_id is not null then
    raise exception 'Partner private event was not fully masked';
  end if;
  if masked.owner_id <> 'ffffffff-1000-4000-8000-000000000001' or masked.start_at <> '2026-10-03 09:00+00' then raise exception 'Busy window missing'; end if;
  if not exists(select 1 from public.get_calendar_window('2026-10-03 00:00+00','2026-10-04 00:00+00') where title='Dinner' and location='Ramen place' and notes='Book a table') then raise exception 'Shared details hidden'; end if;
  update public.calendar_events set title='Stolen' where id='ffffffff-2000-4000-8000-000000000001';
  if found then raise exception 'Partner edited private event'; end if;
  update public.calendar_events set title='Changed dinner' where id='ffffffff-2000-4000-8000-000000000002';
  if found then raise exception 'Partner edited event owned by A'; end if;
end $$;
select set_config('realtime.topic','calendar:couple:' || :'space_id',true);
do $$ begin
  if not exists(select 1 from realtime.messages where topic=current_setting('realtime.topic') and event='calendar_changed' and payload='{}'::jsonb and private) then raise exception 'Partner lacks empty calendar signal'; end if;
end $$;
select set_config('request.jwt.claim.sub','ffffffff-1000-4000-8000-000000000001',true);
update public.calendar_events set visibility='private', couple_id=null where id='ffffffff-2000-4000-8000-000000000002';
select set_config('request.jwt.claim.sub','ffffffff-1000-4000-8000-000000000002',true);
do $$ begin
  if exists(select from public.calendar_events) then raise exception 'Former shared detail remains directly readable'; end if;
  if not exists(select 1 from public.get_calendar_window('2026-10-03 00:00+00','2026-10-04 00:00+00') where title='Busy' and start_at='2026-10-03 18:00+00' and id is null) then raise exception 'Former shared event did not become Busy'; end if;
end $$;
select set_config('request.jwt.claim.sub','ffffffff-1000-4000-8000-000000000003',true);
do $$ begin
  if exists(select from public.calendar_events) then raise exception 'Unrelated user sees calendar table'; end if;
  if exists(select from public.get_calendar_window('2026-10-03 00:00+00','2026-10-04 00:00+00')) then raise exception 'Unrelated user sees calendar window'; end if;
  if exists(select from realtime.messages where topic=current_setting('realtime.topic')) then raise exception 'Unrelated user receives calendar signal'; end if;
end $$;
select pg_temp.expect_error(format($q$insert into public.calendar_events(couple_id,title,start_at,end_at,visibility) values(%L,'Intruder','2026-10-03 10:00+00','2026-10-03 11:00+00','shared')$q$,:'space_id'),'CALENDAR_MEMBERSHIP_REQUIRED');
insert into public.calendar_events(title,start_at,end_at,visibility) values('My private event','2026-10-03 11:00+00','2026-10-03 12:00+00','private');
do $$ begin
  if (select count(*) from public.get_calendar_window('2026-10-03 00:00+00','2026-10-04 00:00+00')) <> 1 then raise exception 'Solo private event unavailable'; end if;
end $$;
reset role;
set local role anon;
select pg_temp.expect_error($q$select * from public.calendar_events$q$,'42501');
select pg_temp.expect_error($q$select * from public.get_calendar_window('2026-10-03 00:00+00','2026-10-04 00:00+00')$q$,'42501');
reset role;
rollback;
