begin;

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  paid_by uuid not null references auth.users(id) on delete cascade,
  title text not null check (title = btrim(title) and char_length(title) between 1 and 160),
  amount numeric(12,2) not null check (amount > 0 and amount <= 100000000),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  category text not null check (category in ('Groceries','Dining','Household','Travel','Entertainment','Transportation','Utilities','Shopping','Other')),
  expense_date date not null default current_date,
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index expenses_couple_date_idx on public.expenses(couple_id, expense_date desc, created_at desc);
create index expenses_paid_by_idx on public.expenses(paid_by, expense_date desc);

create table public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  unique (expense_id, user_id)
);
create index expense_splits_expense_idx on public.expense_splits(expense_id, user_id);

alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
revoke all on public.expenses, public.expense_splits from public, anon, authenticated;
grant select on public.expenses, public.expense_splits to authenticated;

create policy expenses_read on public.expenses for select to authenticated
  using (couple_id = (select private.current_couple_id()));
create policy expense_splits_read on public.expense_splits for select to authenticated
  using (exists (
    select 1 from public.expenses e
    where e.id = expense_id and e.couple_id = (select private.current_couple_id())
  ));

create function private.validate_expense_splits(p_couple_id uuid, p_amount numeric, p_splits jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare split_total numeric; split_count integer; member_count integer;
begin
  if p_splits is null or jsonb_typeof(p_splits) <> 'array' then raise exception 'INVALID_EXPENSE_SPLITS'; end if;
  if exists (select 1 from jsonb_array_elements(p_splits) part where part->>'user_id' is null or part->>'amount' is null or scale((part->>'amount')::numeric) > 2) then raise exception 'INVALID_EXPENSE_SPLITS'; end if;
  select count(*) into member_count from public.couple_memberships where couple_id = p_couple_id;
  select count(*), coalesce(sum((part->>'amount')::numeric), 0)
    into split_count, split_total
    from jsonb_array_elements(p_splits) part;
  if split_count <> member_count or split_count < 1 or split_total <> p_amount then raise exception 'EXPENSE_SPLITS_MUST_MATCH_TOTAL'; end if;
  if exists (
    select 1 from jsonb_array_elements(p_splits) part
    where (part->>'user_id')::uuid not in (select user_id from public.couple_memberships where couple_id = p_couple_id)
      or (part->>'amount')::numeric < 0
  ) then raise exception 'EXPENSE_SPLIT_MEMBER_REQUIRED'; end if;
  if (select count(distinct (part->>'user_id')::uuid) from jsonb_array_elements(p_splits) part) <> split_count then
    raise exception 'EXPENSE_SPLIT_MEMBER_REQUIRED';
  end if;
exception when invalid_text_representation or numeric_value_out_of_range then
  raise exception 'INVALID_EXPENSE_SPLITS';
end;
$$;

create function public.create_expense(
  p_title text, p_amount numeric, p_currency text, p_category text,
  p_expense_date date, p_notes text, p_paid_by uuid, p_splits jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); space_id uuid := private.current_couple_id(); expense_id uuid;
begin
  if actor is null or space_id is null then raise exception 'COUPLE_REQUIRED'; end if;
  if p_paid_by not in (select user_id from public.couple_memberships where couple_id = space_id) then raise exception 'EXPENSE_MEMBER_REQUIRED'; end if;
  if p_title is null or btrim(p_title) = '' or char_length(btrim(p_title)) > 160 then raise exception 'INVALID_EXPENSE_TITLE'; end if;
  if p_amount is null or scale(p_amount) > 2 or p_amount <= 0 or p_amount > 100000000 then raise exception 'INVALID_EXPENSE_AMOUNT'; end if;
  if p_currency is null or p_currency !~ '^[A-Z]{3}$' then raise exception 'INVALID_EXPENSE_CURRENCY'; end if;
  if p_category not in ('Groceries','Dining','Household','Travel','Entertainment','Transportation','Utilities','Shopping','Other') then raise exception 'INVALID_EXPENSE_CATEGORY'; end if;
  perform private.validate_expense_splits(space_id, p_amount, p_splits);
  insert into public.expenses (couple_id, created_by, paid_by, title, amount, currency, category, expense_date, notes)
    values (space_id, actor, p_paid_by, btrim(p_title), p_amount, p_currency, p_category, p_expense_date, coalesce(p_notes, '')) returning id into expense_id;
  insert into public.expense_splits (expense_id, user_id, amount)
    select expense_id, (part->>'user_id')::uuid, (part->>'amount')::numeric from jsonb_array_elements(p_splits) part;
  return expense_id;
end;
$$;

create function public.update_expense(
  p_expense_id uuid, p_title text, p_amount numeric, p_currency text, p_category text,
  p_expense_date date, p_notes text, p_paid_by uuid, p_splits jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); space_id uuid := private.current_couple_id(); saved_id uuid;
begin
  if actor is null or space_id is null then raise exception 'COUPLE_REQUIRED'; end if;
  select id into saved_id from public.expenses where id = p_expense_id and couple_id = space_id for update;
  if saved_id is null then raise exception 'EXPENSE_NOT_FOUND'; end if;
  if p_paid_by not in (select user_id from public.couple_memberships where couple_id = space_id) then raise exception 'EXPENSE_MEMBER_REQUIRED'; end if;
  if p_title is null or btrim(p_title) = '' or char_length(btrim(p_title)) > 160 then raise exception 'INVALID_EXPENSE_TITLE'; end if;
  if p_amount is null or scale(p_amount) > 2 or p_amount <= 0 or p_amount > 100000000 then raise exception 'INVALID_EXPENSE_AMOUNT'; end if;
  if p_currency is null or p_currency !~ '^[A-Z]{3}$' then raise exception 'INVALID_EXPENSE_CURRENCY'; end if;
  if p_category not in ('Groceries','Dining','Household','Travel','Entertainment','Transportation','Utilities','Shopping','Other') then raise exception 'INVALID_EXPENSE_CATEGORY'; end if;
  perform private.validate_expense_splits(space_id, p_amount, p_splits);
  update public.expenses set paid_by = p_paid_by, title = btrim(p_title), amount = p_amount, currency = p_currency,
    category = p_category, expense_date = p_expense_date, notes = coalesce(p_notes, ''), updated_at = clock_timestamp()
    where id = saved_id;
  delete from public.expense_splits where expense_splits.expense_id = saved_id;
  insert into public.expense_splits (expense_id, user_id, amount)
    select saved_id, (part->>'user_id')::uuid, (part->>'amount')::numeric from jsonb_array_elements(p_splits) part;
  return saved_id;
end;
$$;

create function public.delete_expense(p_expense_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.expenses where id = p_expense_id and couple_id = private.current_couple_id()) then raise exception 'EXPENSE_NOT_FOUND'; end if;
  delete from public.expenses where id = p_expense_id;
end;
$$;

create function public.get_expense_summary(month_start date)
returns table (user_id uuid, paid_amount numeric, share_amount numeric, net_amount numeric, total_amount numeric)
language sql stable security definer set search_path = '' as $$
  with space as (select private.current_couple_id() as id),
  month_expenses as (
    select e.id, e.amount, e.paid_by
    from public.expenses e, space s
    where e.couple_id = s.id and e.expense_date >= month_start and e.expense_date < (month_start + interval '1 month')::date
  ), totals as (select coalesce(sum(amount), 0)::numeric as total_amount from month_expenses)
  select m.user_id,
    coalesce(sum(me.amount) filter (where me.paid_by = m.user_id), 0)::numeric as paid_amount,
    coalesce(sum(s.amount), 0)::numeric as share_amount,
    (coalesce(sum(me.amount) filter (where me.paid_by = m.user_id), 0) - coalesce(sum(s.amount), 0))::numeric as net_amount,
    totals.total_amount
  from public.couple_memberships m
  cross join totals
  left join month_expenses me on true
  left join public.expense_splits s on s.expense_id = me.id and s.user_id = m.user_id
  where m.couple_id = (select id from space)
  group by m.user_id, totals.total_amount;
$$;

revoke all on function private.validate_expense_splits(uuid,numeric,jsonb) from public, anon, authenticated;
revoke all on function public.create_expense(text,numeric,text,text,date,text,uuid,jsonb) from public, anon;
revoke all on function public.update_expense(uuid,text,numeric,text,text,date,text,uuid,jsonb) from public, anon;
revoke all on function public.delete_expense(uuid) from public, anon;
revoke all on function public.get_expense_summary(date) from public, anon;
grant execute on function public.create_expense(text,numeric,text,text,date,text,uuid,jsonb) to authenticated;
grant execute on function public.update_expense(uuid,text,numeric,text,text,date,text,uuid,jsonb) to authenticated;
grant execute on function public.delete_expense(uuid) to authenticated;
grant execute on function public.get_expense_summary(date) to authenticated;

create function private.broadcast_expense_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare space_id uuid;
begin
  if tg_table_name = 'expenses' then
    space_id := case when tg_op = 'DELETE' then old.couple_id else new.couple_id end;
  else
    select couple_id into space_id from public.expenses where id = case when tg_op = 'DELETE' then old.expense_id else new.expense_id end;
  end if;
  if space_id is not null then perform realtime.send('{}'::jsonb, 'expenses_changed', 'expenses:couple:' || space_id::text, true); end if;
  return null;
end;
$$;
create trigger broadcast_expense_change after insert or update or delete on public.expenses for each row execute function private.broadcast_expense_change();
create trigger broadcast_expense_split_change after insert or update or delete on public.expense_splits for each row execute function private.broadcast_expense_change();
revoke all on function private.broadcast_expense_change() from public, anon, authenticated;
create policy expenses_broadcast_read on realtime.messages for select to authenticated using (
  extension = 'broadcast' and topic = (select realtime.topic()) and
  (select realtime.topic()) = 'expenses:couple:' || (select private.current_couple_id())::text
);

commit;
