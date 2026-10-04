-- Disposable database only. Changes roll back.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
('ffffffff-3000-4000-8000-000000000001','alex-expense@example.com','{"name":"Alex"}'),
('ffffffff-3000-4000-8000-000000000002','sam-expense@example.com','{"name":"Sam"}'),
('ffffffff-3000-4000-8000-000000000003','casey-expense@example.com','{"name":"Casey"}');
set local role authenticated;
select set_config('request.jwt.claim.sub','ffffffff-3000-4000-8000-000000000001',true);
select public.create_couple('Expense space') as space_id \gset
select invite_code as code from public.generate_couple_invite() \gset
select set_config('request.jwt.claim.sub','ffffffff-3000-4000-8000-000000000002',true);
select public.accept_couple_invite(:'code');
select set_config('request.jwt.claim.sub','ffffffff-3000-4000-8000-000000000001',true);
select public.create_expense('Dinner', 800, 'USD', 'Dining', '2026-10-03', '', 'ffffffff-3000-4000-8000-000000000001', 'shared', '[{"user_id":"ffffffff-3000-4000-8000-000000000001","amount":400},{"user_id":"ffffffff-3000-4000-8000-000000000002","amount":400}]'::jsonb) as expense_id \gset
select public.create_expense('Personal coffee', 30, 'USD', 'Dining', '2026-10-03', '', 'ffffffff-3000-4000-8000-000000000001', 'private', '[{"user_id":"ffffffff-3000-4000-8000-000000000001","amount":30}]'::jsonb) as personal_id \gset
do $$ begin
  if (select total_amount from public.get_expense_summary('2026-10-01', 'private') limit 1) <> 30 then raise exception 'Personal summary total is wrong'; end if;
end $$;
select count(*) as shared_split_count from public.expense_splits where expense_id = :'expense_id';
select set_config('request.jwt.claim.sub','ffffffff-3000-4000-8000-000000000002',true);
do $$ begin
  if (select count(*) from public.expenses) <> 1 then raise exception 'Partner can read a personal expense'; end if;
  if (select total_amount from public.get_expense_summary('2026-10-01', 'shared') limit 1) <> 800 then raise exception 'Summary total is wrong'; end if;
end $$;
select set_config('request.jwt.claim.sub','ffffffff-3000-4000-8000-000000000003',true);
do $$ begin
  if exists(select from public.expenses) or exists(select from public.expense_splits) then raise exception 'Unrelated user can read expense data'; end if;
end $$;
reset role;
set local role anon;
do $$ begin
  begin perform public.create_expense('No access', 1, 'USD', 'Other', current_date, '', null::uuid, 'private', '[]'::jsonb); raise exception 'Anon write unexpectedly succeeded'; exception when insufficient_privilege then null; end;
end $$;
rollback;
