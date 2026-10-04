-- Disposable database only. Test rows are rolled back.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
('eeeeeeee-4000-4000-8000-000000000001','alex-dates@example.com','{"name":"Alex"}'),
('eeeeeeee-4000-4000-8000-000000000002','sam-dates@example.com','{"name":"Sam"}'),
('eeeeeeee-4000-4000-8000-000000000003','casey-dates@example.com','{"name":"Casey"}');
set local role authenticated;
select set_config('request.jwt.claim.sub','eeeeeeee-4000-4000-8000-000000000001',true);
select public.create_couple('Date plans') as space_id \gset
select set_config('test.date_space', :'space_id', true);
select invite_code as code from public.generate_couple_invite() \gset
insert into public.date_ideas(couple_id,title,category,cost_level,duration_minutes)
values (:'space_id','Ramen and a waterfront walk','food',2,120);
select set_config('request.jwt.claim.sub','eeeeeeee-4000-4000-8000-000000000002',true);
select public.accept_couple_invite(:'code');
do $$ begin
  if (select count(*) from public.date_ideas) <> 1 then raise exception 'Partner cannot see shared idea'; end if;
end $$;
update public.date_ideas set status = 'done' where title = 'Ramen and a waterfront walk';
do $$ begin
  if (select status from public.date_ideas limit 1) <> 'done' then raise exception 'Partner cannot mark done'; end if;
end $$;
select set_config('request.jwt.claim.sub','eeeeeeee-4000-4000-8000-000000000003',true);
do $$ begin
  if exists(select from public.date_ideas) then raise exception 'Unrelated user can read date ideas'; end if;
end $$;
do $$ begin
  begin
    insert into public.date_ideas(couple_id,title,category,cost_level,duration_minutes)
    values (current_setting('test.date_space')::uuid,'Unrelated plan','food',1,60);
    raise exception 'Unrelated user could create an idea';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role anon;
do $$ begin
  begin perform 1 from public.date_ideas; raise exception 'Anonymous user can read date ideas';
  exception when insufficient_privilege then null; end;
end $$;
rollback;
