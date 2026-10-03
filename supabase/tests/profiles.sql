-- Run after the migration in a disposable database or development Supabase.
-- All test records are rolled back. Any failed assertion stops the test.
begin;

insert into auth.users (id, email, raw_user_meta_data) values
('9bdad066-5043-4424-b16b-d52704b29a01', 'alex@example.com', '{"name":"Alex","timezone":"America/Los_Angeles"}'),
('9bdad066-5043-4424-b16b-d52704b29a02', 'sam@example.com', '{"name":"Sam","timezone":"UTC"}');

do $$ begin
  if (select count(*) from public.profiles where id in ('9bdad066-5043-4424-b16b-d52704b29a01', '9bdad066-5043-4424-b16b-d52704b29a02')) <> 2 then
    raise exception 'Signup did not create both profiles';
  end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '9bdad066-5043-4424-b16b-d52704b29a01', true);

do $$ begin
  if (select count(*) from public.profiles) <> 1 then raise exception 'User can see unrelated profiles'; end if;
  update public.profiles set name = 'Alexandra', timezone = 'Europe/London' where id = '9bdad066-5043-4424-b16b-d52704b29a01';
  if not found then raise exception 'Owner cannot update profile'; end if;
  update public.profiles set name = 'Not allowed' where id = '9bdad066-5043-4424-b16b-d52704b29a02';
  if found then raise exception 'Cross-user update allowed'; end if;

  begin
    update public.profiles set email = 'forged@example.com' where id = auth.uid();
    raise exception 'Client email update allowed';
  exception when insufficient_privilege then null; end;
  begin
    update public.profiles set id = '9bdad066-5043-4424-b16b-d52704b29a02' where id = auth.uid();
    raise exception 'Client identity update allowed';
  exception when insufficient_privilege then null; end;
  begin
    update public.profiles set created_at = now() where id = auth.uid();
    raise exception 'Client timestamp update allowed';
  exception when insufficient_privilege then null; end;
  begin
    update public.profiles set name = '' where id = auth.uid();
    raise exception 'Empty profile name accepted';
  exception when check_violation then null; end;
  begin
    update public.profiles set timezone = 'Not/A_Timezone' where id = auth.uid();
    raise exception 'Invalid timezone accepted';
  exception when check_violation then null; end;
  begin
    insert into public.profiles (id, name, email) values (auth.uid(), 'Forged', 'forged@example.com');
    raise exception 'Client profile insert allowed';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.profiles where id = auth.uid();
    raise exception 'Client profile delete allowed';
  exception when insufficient_privilege then null; end;
end $$;

reset role;
update auth.users set email = 'alexandra@example.com' where id = '9bdad066-5043-4424-b16b-d52704b29a01';
do $$ begin
  if (select email from public.profiles where id = '9bdad066-5043-4424-b16b-d52704b29a01') <> 'alexandra@example.com' then
    raise exception 'Auth email was not synchronized';
  end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  if (select count(*) from public.profiles) <> 0 then raise exception 'Missing identity can read profiles'; end if;
end $$;

reset role;
set local role anon;
do $$ begin
  begin
    perform * from public.profiles;
    raise exception 'Anonymous profile read allowed';
  exception when insufficient_privilege then null; end;
end $$;

reset role;
delete from auth.users where id = '9bdad066-5043-4424-b16b-d52704b29a02';
do $$ begin
  if exists (select 1 from public.profiles where id = '9bdad066-5043-4424-b16b-d52704b29a02') then
    raise exception 'Profile did not cascade on account deletion';
  end if;
  begin
    insert into auth.users(id, email, raw_user_meta_data) values
      ('9bdad066-5043-4424-b16b-d52704b29a03', 'invalid@example.com', '{"name":""}');
    raise exception 'Invalid signup metadata accepted';
  exception when check_violation then null; end;
  if exists (select 1 from auth.users where id = '9bdad066-5043-4424-b16b-d52704b29a03') then
    raise exception 'Invalid signup left an orphaned user';
  end if;
end $$;

rollback;
