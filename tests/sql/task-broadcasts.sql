-- ONLY for the standalone realtime-fixture.sql: captures the actual trigger's emissions.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
('dddddddd-0000-4000-8000-000000000001','alex-broadcast@example.com','{"name":"Alex"}'),
('dddddddd-0000-4000-8000-000000000002','sam-broadcast@example.com','{"name":"Sam"}'),
('dddddddd-0000-4000-8000-000000000003','casey-broadcast@example.com','{"name":"Casey"}');
set local role authenticated;
select set_config('request.jwt.claim.sub','dddddddd-0000-4000-8000-000000000001',true);
select public.create_couple('Broadcast space') as space_id \gset
select invite_code as code from public.generate_couple_invite() \gset
select set_config('request.jwt.claim.sub','dddddddd-0000-4000-8000-000000000002',true);
select public.accept_couple_invite(:'code');
select set_config('request.jwt.claim.sub','dddddddd-0000-4000-8000-000000000001',true);
insert into public.tasks(id,title,description) values('eeeeeeee-0000-4000-8000-000000000001','Surprise gift','Never broadcast this');
reset role;
do $$ begin
 if (select count(*) from realtime.messages) <> 1 then raise exception 'Private task has multiple audiences'; end if;
 if exists(select from realtime.messages where topic <> 'tasks:user:dddddddd-0000-4000-8000-000000000001' or payload <> '{}'::jsonb or not private) then raise exception 'Private content broadcast'; end if;
end $$;
truncate realtime.messages;
set local role authenticated;
update public.tasks set visibility='shared',couple_id=:'space_id' where id='eeeeeeee-0000-4000-8000-000000000001';
reset role;
do $$ begin
 if (select count(*) from realtime.messages) <> 2 then raise exception 'Sharing did not notify both audiences'; end if;
 if exists(select from realtime.messages where payload <> '{}'::jsonb or not private or event <> 'tasks_changed') then raise exception 'Broadcast contains row content'; end if;
end $$;
-- Partner may receive the couple signal, never the creator's private channel.
set local role authenticated;
select set_config('request.jwt.claim.sub','dddddddd-0000-4000-8000-000000000002',true);
select set_config('realtime.topic','tasks:couple:' || :'space_id',true);
do $$ begin
 if (select count(*) from realtime.messages) <> 1 then raise exception 'Partner cannot receive couple broadcast'; end if;
end $$;
select set_config('realtime.topic','tasks:user:dddddddd-0000-4000-8000-000000000001',true);
do $$ begin
 if exists(select from realtime.messages) then raise exception 'Partner can receive private channel'; end if;
end $$;
select set_config('request.jwt.claim.sub','dddddddd-0000-4000-8000-000000000003',true);
select set_config('realtime.topic','tasks:couple:' || :'space_id',true);
do $$ begin
 if exists(select from realtime.messages) then raise exception 'Unrelated user can receive couple broadcast'; end if;
 begin
  insert into realtime.messages(topic,event,payload,private) values(current_setting('realtime.topic'),'tasks_changed','{}',true);
  raise exception 'Client can forge a task broadcast';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
truncate realtime.messages;
set local role authenticated;
select set_config('request.jwt.claim.sub','dddddddd-0000-4000-8000-000000000001',true);
update public.tasks set visibility='private',couple_id=null where id='eeeeeeee-0000-4000-8000-000000000001';
reset role;
do $$ begin
 if (select count(*) from realtime.messages where topic like 'tasks:couple:%') <> 1 then raise exception 'Former audience not notified of privatization'; end if;
 if exists(select from realtime.messages where payload <> '{}'::jsonb) then raise exception 'Private data exposed on privatization'; end if;
end $$;
truncate realtime.messages;
set local role authenticated;
update public.tasks set description='A new secret' where id='eeeeeeee-0000-4000-8000-000000000001';
reset role;
do $$ begin
 if exists(select from realtime.messages where topic like 'tasks:couple:%') then raise exception 'Later private edit broadcast to partner'; end if;
end $$;
truncate realtime.messages;
set local role authenticated;
update public.tasks set visibility='shared',couple_id=:'space_id' where id='eeeeeeee-0000-4000-8000-000000000001';
reset role;
truncate realtime.messages;
set local role authenticated;
delete from public.tasks where id='eeeeeeee-0000-4000-8000-000000000001';
reset role;
do $$ begin
 if (select count(*) from realtime.messages where topic like 'tasks:couple:%') <> 1 then raise exception 'Shared deletion not broadcast'; end if;
 if exists(select from realtime.messages where payload <> '{}'::jsonb) then raise exception 'Deletion payload leaks data'; end if;
end $$;
rollback;
