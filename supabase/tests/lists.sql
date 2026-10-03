-- Run against a disposable database after migrations. Every change rolls back.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
('aaaaaaaa-1000-4000-8000-000000000001','alex-lists@example.com','{"name":"Alex"}'),
('aaaaaaaa-1000-4000-8000-000000000002','sam-lists@example.com','{"name":"Sam"}'),
('aaaaaaaa-1000-4000-8000-000000000003','casey-lists@example.com','{"name":"Casey"}');
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
select set_config('request.jwt.claim.sub','aaaaaaaa-1000-4000-8000-000000000001',true);
select public.create_couple('Alex and Sam') as space_id \gset
select invite_code as code from public.generate_couple_invite() \gset
insert into public.lists(id,couple_id,name,type) values
('aaaaaaaa-2000-4000-8000-000000000001', :'space_id', 'Weekly groceries', 'Groceries');
insert into public.list_items(id,list_id,name,quantity,category) values
('aaaaaaaa-3000-4000-8000-000000000001','aaaaaaaa-2000-4000-8000-000000000001','Milk','2 cartons','Dairy');
do $$ begin
  if public.remaining_grocery_items() <> 1 then raise exception 'Wrong grocery count for creator'; end if;
end $$;
select pg_temp.expect_error($q$insert into public.list_items(list_id,name,category) values('aaaaaaaa-2000-4000-8000-000000000001','Juice','Invalid')$q$,'23514');
select pg_temp.expect_error($q$insert into public.list_items(list_id,name,completed_by) values('aaaaaaaa-2000-4000-8000-000000000001','Juice',auth.uid())$q$,'42501');
select pg_temp.expect_error($q$insert into public.lists(couple_id,name,type,created_by) values('aaaaaaaa-2000-4000-8000-000000000001','Forged','Custom','aaaaaaaa-1000-4000-8000-000000000002')$q$,'42501');
insert into public.lists(id,couple_id,name,type) values
('aaaaaaaa-2000-4000-8000-000000000002', :'space_id', 'Weekend bag', 'Packing');
select pg_temp.expect_error($q$insert into public.list_items(list_id,name,category) values('aaaaaaaa-2000-4000-8000-000000000002','Sunscreen','Other')$q$,'CATEGORY_ONLY_FOR_GROCERIES');
select set_config('request.jwt.claim.sub','aaaaaaaa-1000-4000-8000-000000000002',true);
select public.accept_couple_invite(:'code');
do $$ begin
  if (select count(*) from public.lists) <> 2 then raise exception 'Partner cannot read shared lists'; end if;
  if (select count(*) from public.list_items) <> 1 then raise exception 'Partner cannot read shared item'; end if;
end $$;
insert into public.list_items(id,list_id,name,category) values
('aaaaaaaa-3000-4000-8000-000000000002','aaaaaaaa-2000-4000-8000-000000000001','Bananas','Produce');
update public.list_items set completed = true where id='aaaaaaaa-3000-4000-8000-000000000001';
do $$ begin
  if (select completed_by from public.list_items where id='aaaaaaaa-3000-4000-8000-000000000001') <> auth.uid() then raise exception 'Partner completion attribution wrong'; end if;
  if public.remaining_grocery_items() <> 1 then raise exception 'Completed item still counted'; end if;
end $$;
update public.list_items set completed = false where id='aaaaaaaa-3000-4000-8000-000000000001';
do $$ begin
  if (select completed_by from public.list_items where id='aaaaaaaa-3000-4000-8000-000000000001') is not null then raise exception 'Reopen retained completer'; end if;
end $$;
delete from public.list_items where id='aaaaaaaa-3000-4000-8000-000000000002';
select set_config('realtime.topic','lists:couple:' || :'space_id',true);
do $$ begin
  if not exists(select from realtime.messages where topic=current_setting('realtime.topic') and event='lists_changed' and payload='{}'::jsonb and private) then raise exception 'Partner cannot receive list updates'; end if;
end $$;
select pg_temp.expect_error($q$update public.list_items set created_by=auth.uid() where id='aaaaaaaa-3000-4000-8000-000000000001'$q$,'42501');
select set_config('request.jwt.claim.sub','aaaaaaaa-1000-4000-8000-000000000003',true);
do $$ begin
  if exists(select from public.lists) or exists(select from public.list_items) then raise exception 'Unrelated user sees list data'; end if;
  if public.remaining_grocery_items() <> 0 then raise exception 'Unrelated user sees grocery count'; end if;
  update public.list_items set completed=true where id='aaaaaaaa-3000-4000-8000-000000000001';
  if found then raise exception 'Unrelated user changed item'; end if;
  delete from public.list_items where id='aaaaaaaa-3000-4000-8000-000000000001';
  if found then raise exception 'Unrelated user deleted item'; end if;
end $$;
select pg_temp.expect_error($q$insert into public.list_items(list_id,name) values('aaaaaaaa-2000-4000-8000-000000000001','Intruder')$q$,'42501');
select pg_temp.expect_error(format($q$insert into public.lists(couple_id,name,type) values(%L,'Intruder','Custom')$q$,:'space_id'),'42501');
select set_config('realtime.topic','lists:couple:' || :'space_id',true);
do $$ begin
  if exists(select from realtime.messages where topic=current_setting('realtime.topic')) then raise exception 'Unrelated user receives broadcast'; end if;
end $$;
select set_config('request.jwt.claim.sub','aaaaaaaa-1000-4000-8000-000000000001',true);
do $$ begin
  if (select count(*) from public.list_items) <> 1 then raise exception 'Creator cannot see partner changes'; end if;
  if public.remaining_grocery_items() <> 1 then raise exception 'Creator grocery count wrong'; end if;
  if not exists(select from realtime.messages where topic=current_setting('realtime.topic') and event='lists_changed' and payload='{}'::jsonb and private) then raise exception 'Couple broadcast missing or leaked content'; end if;
end $$;
reset role;
set local role anon;
select pg_temp.expect_error($q$select * from public.lists$q$,'42501');
select pg_temp.expect_error($q$select public.remaining_grocery_items()$q$,'42501');
reset role;
rollback;
