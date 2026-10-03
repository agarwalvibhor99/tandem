-- Disposable/development database only. Fixtures and mutations are rolled back.
begin;
insert into auth.users(id, email, raw_user_meta_data) values
('aaaaaaaa-0000-4000-8000-000000000001', 'alex-couple@example.com', '{"name":"Alex"}'),
('aaaaaaaa-0000-4000-8000-000000000002', 'sam-couple@example.com', '{"name":"Sam"}'),
('aaaaaaaa-0000-4000-8000-000000000003', 'casey-couple@example.com', '{"name":"Casey"}');
create function pg_temp.expect_error(statement text, expected text) returns void language plpgsql as $$
begin
  begin execute statement;
  exception when others then
    if sqlerrm = expected or sqlstate = expected then return; end if;
    raise exception 'Expected %, got % (%)', expected, sqlerrm, sqlstate;
  end;
  raise exception 'Statement unexpectedly succeeded: %', statement;
end;
$$;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000001', true);
select pg_temp.expect_error($q$select public.create_couple(' ')$q$, 'INVALID_SPACE_NAME');
update public.profiles set couple_onboarding_skipped_at = now() where id = auth.uid();
select public.create_couple('Alex and Sam') as space_id \gset
select pg_temp.expect_error($q$select public.create_couple('Duplicate')$q$, 'ALREADY_CONNECTED');
select invite_code as old_code from public.generate_couple_invite() \gset
select invite_code as code from public.generate_couple_invite() \gset
select pg_temp.expect_error(format('select public.accept_couple_invite(%L)', :'code'), 'SELF_INVITE');
select pg_temp.expect_error($q$insert into public.couple_memberships(couple_id, user_id, role) values(gen_random_uuid(), auth.uid(), 'owner')$q$, '42501');
select pg_temp.expect_error($q$update public.couple_memberships set role='owner'$q$, '42501');
select pg_temp.expect_error($q$delete from public.couple_memberships$q$, '42501');
select pg_temp.expect_error($q$update public.couple_invites set accepted_at=null$q$, '42501');
select pg_temp.expect_error($q$insert into public.couples(name) values('Forged')$q$, '42501');

select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000003', true);
do $$ begin
  update public.profiles set couple_onboarding_skipped_at = null where id = 'aaaaaaaa-0000-4000-8000-000000000001';
  if found then raise exception 'C can modify A onboarding preference'; end if;
  if exists(select from public.couples) or exists(select from public.couple_memberships) or exists(select from public.couple_invites) or exists(select from public.get_couple_members()) then raise exception 'C can access unrelated data'; end if;
end $$;
select pg_temp.expect_error($q$select public.accept_couple_invite('0000000000000000')$q$, 'INVALID_INVITE');
select pg_temp.expect_error(format('select public.accept_couple_invite(%L)', :'old_code'), 'INVITE_EXPIRED');
select pg_temp.expect_error($q$select public.generate_couple_invite()$q$, 'NO_COUPLE');

select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000002', true);
-- Lower case, separators and surrounding spaces are accepted server-side too.
select public.accept_couple_invite(' ' || lower(substr(:'code',1,8)) || '-' || lower(substr(:'code',9)) || ' ') = :'space_id'::uuid as same_space \gset
\if :same_space
\else
  \quit 1
\endif
select pg_temp.expect_error(format('select public.accept_couple_invite(%L)', :'code'), 'ALREADY_CONNECTED');
do $$ begin
  if (select count(*) from public.couples) <> 1 or (select count(*) from public.couple_memberships) <> 2 then raise exception 'B cannot resolve shared space'; end if;
  if (select count(*) from public.get_couple_members()) <> 2 then raise exception 'B cannot read member display names'; end if;
  if (select count(*) from public.profiles) <> 1 then raise exception 'Partner private profile exposed'; end if;
  if exists(select from public.couple_invites) then raise exception 'B can read A invitation codes'; end if;
end $$;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000001', true);
do $$ begin
  if (select count(*) from public.couple_memberships) <> 2 or (select count(*) from public.get_couple_members()) <> 2 then raise exception 'A cannot see connection'; end if;
end $$;
select pg_temp.expect_error($q$select public.generate_couple_invite()$q$, 'COUPLE_FULL');
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000003', true);
select pg_temp.expect_error(format('select public.accept_couple_invite(%L)', :'code'), 'INVITE_USED');
do $$ begin
  if exists(select from public.couples) or exists(select from public.couple_memberships) or exists(select from public.get_couple_members()) then raise exception 'C can see connected couple'; end if;
end $$;
reset role;
-- Defensive full-space check, even if an unaccepted invitation remains.
update public.couple_invites set accepted_at=null, expires_at=now()+interval '1 hour' where invite_code=:'code';
set local role authenticated;
select pg_temp.expect_error(format('select public.accept_couple_invite(%L)', :'code'), 'COUPLE_FULL');
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.expect_error($q$select public.create_couple('No identity')$q$, 'AUTH_REQUIRED');
select pg_temp.expect_error($q$select public.generate_couple_invite()$q$, 'AUTH_REQUIRED');
select pg_temp.expect_error($q$select public.accept_couple_invite('anything')$q$, 'AUTH_REQUIRED');
reset role;
set local role anon;
select pg_temp.expect_error($q$select * from public.couples$q$, '42501');
select pg_temp.expect_error($q$select * from public.couple_memberships$q$, '42501');
select pg_temp.expect_error($q$select * from public.couple_invites$q$, '42501');
select pg_temp.expect_error($q$select public.create_couple('Anonymous')$q$, '42501');
select pg_temp.expect_error($q$select public.get_couple_members()$q$, '42501');
reset role;
rollback;
