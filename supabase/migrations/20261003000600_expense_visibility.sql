begin;

alter table public.expenses add column visibility text not null default 'shared';
alter table public.expenses alter column couple_id drop not null;
alter table public.expenses add constraint expenses_visibility_check check (visibility in ('private', 'shared'));
alter table public.expenses add constraint expenses_visibility_scope check (
  (visibility = 'private' and couple_id is null and paid_by = created_by) or
  (visibility = 'shared' and couple_id is not null)
);
create index expenses_creator_date_idx on public.expenses(created_by, expense_date desc);

drop policy if exists expenses_read on public.expenses;
drop policy if exists expense_splits_read on public.expense_splits;
create policy expenses_read on public.expenses for select to authenticated using (
  (visibility = 'private' and created_by = (select auth.uid())) or
  (visibility = 'shared' and couple_id = (select private.current_couple_id()))
);
create policy expense_splits_read on public.expense_splits for select to authenticated using (
  exists (
    select 1 from public.expenses e
    where e.id = expense_id and (
      (e.visibility = 'private' and e.created_by = (select auth.uid())) or
      (e.visibility = 'shared' and e.couple_id = (select private.current_couple_id()))
    )
  )
);

drop function if exists public.create_expense(text,numeric,text,text,date,text,uuid,jsonb);
drop function if exists public.update_expense(uuid,text,numeric,text,text,date,text,uuid,jsonb);
drop function if exists public.delete_expense(uuid);
drop function if exists public.get_expense_summary(date);
drop function if exists private.validate_expense_splits(uuid,numeric,jsonb);
drop trigger if exists broadcast_expense_change on public.expenses;
drop trigger if exists broadcast_expense_split_change on public.expense_splits;
drop function if exists private.broadcast_expense_change();
drop policy if exists expenses_broadcast_read on realtime.messages;

create function private.validate_expense_splits(p_couple_id uuid, p_amount numeric, p_splits jsonb, p_visibility text, p_actor uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare split_total numeric; split_count integer; member_count integer;
begin
  if p_splits is null or jsonb_typeof(p_splits) <> 'array' then raise exception 'INVALID_EXPENSE_SPLITS'; end if;
  if exists (select 1 from jsonb_array_elements(p_splits) part where part->>'user_id' is null or part->>'amount' is null or scale((part->>'amount')::numeric) > 2) then raise exception 'INVALID_EXPENSE_SPLITS'; end if;
  select count(*), coalesce(sum((part->>'amount')::numeric), 0) into split_count, split_total from jsonb_array_elements(p_splits) part;
  if split_total <> p_amount then raise exception 'EXPENSE_SPLITS_MUST_MATCH_TOTAL'; end if;
  if p_visibility = 'private' then
    if split_count <> 1 or (select (part->>'user_id')::uuid from jsonb_array_elements(p_splits) part limit 1) <> p_actor then raise exception 'EXPENSE_PRIVATE_OWNER_REQUIRED'; end if;
    return;
  end if;
  if p_couple_id is null then raise exception 'COUPLE_REQUIRED'; end if;
  select count(*) into member_count from public.couple_memberships where couple_id = p_couple_id;
  if split_count <> member_count or split_count < 2 then raise exception 'EXPENSE_SPLITS_MUST_MATCH_MEMBERS'; end if;
  if exists (
    select 1 from jsonb_array_elements(p_splits) part
    where (part->>'user_id')::uuid not in (select user_id from public.couple_memberships where couple_id = p_couple_id)
      or (part->>'amount')::numeric < 0
  ) then raise exception 'EXPENSE_SPLIT_MEMBER_REQUIRED'; end if;
  if (select count(distinct (part->>'user_id')::uuid) from jsonb_array_elements(p_splits) part) <> split_count then raise exception 'EXPENSE_SPLIT_MEMBER_REQUIRED'; end if;
exception when invalid_text_representation or numeric_value_out_of_range then
  raise exception 'INVALID_EXPENSE_SPLITS';
end;
$$;

create function public.create_expense(
  p_title text, p_amount numeric, p_currency text, p_category text,
  p_expense_date date, p_notes text, p_paid_by uuid, p_visibility text, p_splits jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); space_id uuid := private.current_couple_id(); expense_id uuid;
begin
  if actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_visibility not in ('private', 'shared') then raise exception 'INVALID_EXPENSE_VISIBILITY'; end if;
  if p_visibility = 'private' then space_id := null; elsif space_id is null then raise exception 'COUPLE_REQUIRED'; end if;
  if p_paid_by <> actor and p_visibility = 'private' then raise exception 'EXPENSE_PRIVATE_OWNER_REQUIRED'; end if;
  if p_visibility = 'shared' and p_paid_by not in (select user_id from public.couple_memberships where couple_id = space_id) then raise exception 'EXPENSE_MEMBER_REQUIRED'; end if;
  if p_title is null or btrim(p_title) = '' or char_length(btrim(p_title)) > 160 then raise exception 'INVALID_EXPENSE_TITLE'; end if;
  if p_amount is null or scale(p_amount) > 2 or p_amount <= 0 or p_amount > 100000000 then raise exception 'INVALID_EXPENSE_AMOUNT'; end if;
  if p_currency is null or p_currency !~ '^[A-Z]{3}$' then raise exception 'INVALID_EXPENSE_CURRENCY'; end if;
  if p_category not in ('Groceries','Dining','Household','Travel','Entertainment','Transportation','Utilities','Shopping','Other') then raise exception 'INVALID_EXPENSE_CATEGORY'; end if;
  perform private.validate_expense_splits(space_id, p_amount, p_splits, p_visibility, actor);
  insert into public.expenses (couple_id, created_by, paid_by, title, amount, currency, category, expense_date, notes, visibility)
    values (space_id, actor, p_paid_by, btrim(p_title), p_amount, p_currency, p_category, p_expense_date, coalesce(p_notes, ''), p_visibility) returning id into expense_id;
  insert into public.expense_splits (expense_id, user_id, amount)
    select expense_id, (part->>'user_id')::uuid, (part->>'amount')::numeric from jsonb_array_elements(p_splits) part;
  return expense_id;
end;
$$;

create function public.update_expense(
  p_expense_id uuid, p_title text, p_amount numeric, p_currency text, p_category text,
  p_expense_date date, p_notes text, p_paid_by uuid, p_visibility text, p_splits jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); space_id uuid := private.current_couple_id(); saved_id uuid; creator_id uuid;
begin
  if actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_visibility not in ('private', 'shared') then raise exception 'INVALID_EXPENSE_VISIBILITY'; end if;
  select id, created_by into saved_id, creator_id from public.expenses where id = p_expense_id and (
    (visibility = 'private' and created_by = actor) or (visibility = 'shared' and couple_id = space_id)
  ) for update;
  if saved_id is null then raise exception 'EXPENSE_NOT_FOUND'; end if;
  if p_visibility = 'private' then
    if creator_id <> actor then raise exception 'EXPENSE_PRIVATE_OWNER_REQUIRED'; end if;
    space_id := null;
  elsif space_id is null then raise exception 'COUPLE_REQUIRED';
  end if;
  if p_paid_by <> actor and p_visibility = 'private' then raise exception 'EXPENSE_PRIVATE_OWNER_REQUIRED'; end if;
  if p_visibility = 'shared' and p_paid_by not in (select user_id from public.couple_memberships where couple_id = space_id) then raise exception 'EXPENSE_MEMBER_REQUIRED'; end if;
  if p_title is null or btrim(p_title) = '' or char_length(btrim(p_title)) > 160 then raise exception 'INVALID_EXPENSE_TITLE'; end if;
  if p_amount is null or scale(p_amount) > 2 or p_amount <= 0 or p_amount > 100000000 then raise exception 'INVALID_EXPENSE_AMOUNT'; end if;
  if p_currency is null or p_currency !~ '^[A-Z]{3}$' then raise exception 'INVALID_EXPENSE_CURRENCY'; end if;
  if p_category not in ('Groceries','Dining','Household','Travel','Entertainment','Transportation','Utilities','Shopping','Other') then raise exception 'INVALID_EXPENSE_CATEGORY'; end if;
  perform private.validate_expense_splits(space_id, p_amount, p_splits, p_visibility, actor);
  update public.expenses set couple_id = space_id, paid_by = p_paid_by, title = btrim(p_title), amount = p_amount, currency = p_currency,
    category = p_category, expense_date = p_expense_date, notes = coalesce(p_notes, ''), visibility = p_visibility, updated_at = clock_timestamp()
    where id = saved_id;
  delete from public.expense_splits where expense_splits.expense_id = saved_id;
  insert into public.expense_splits (expense_id, user_id, amount)
    select saved_id, (part->>'user_id')::uuid, (part->>'amount')::numeric from jsonb_array_elements(p_splits) part;
  return saved_id;
end;
$$;

create function public.delete_expense(p_expense_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.expenses where id = p_expense_id and ((visibility = 'private' and created_by = auth.uid()) or (visibility = 'shared' and couple_id = private.current_couple_id()))) then raise exception 'EXPENSE_NOT_FOUND'; end if;
  delete from public.expenses where id = p_expense_id;
end;
$$;

create function public.get_expense_summary(month_start date, p_visibility text)
returns table (user_id uuid, paid_amount numeric, share_amount numeric, net_amount numeric, total_amount numeric)
language plpgsql stable security definer set search_path = '' as $$
declare actor uuid := auth.uid(); space_id uuid := private.current_couple_id();
begin
  if actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_visibility not in ('private', 'shared') then raise exception 'INVALID_EXPENSE_VISIBILITY'; end if;
  if p_visibility = 'private' then space_id := null; end if;
  return query
    with scoped_expenses as (
      select e.id, e.amount, e.paid_by
      from public.expenses e
      where e.expense_date >= month_start and e.expense_date < (month_start + interval '1 month')::date
        and ((p_visibility = 'private' and e.visibility = 'private' and e.created_by = actor)
          or (p_visibility = 'shared' and e.visibility = 'shared' and e.couple_id = space_id))
    ), members as (
      select actor as user_id where p_visibility = 'private'
      union all
      select m.user_id from public.couple_memberships m where p_visibility = 'shared' and m.couple_id = space_id
    ), totals as (select coalesce(sum(amount), 0)::numeric as total_amount from scoped_expenses)
    select m.user_id,
      coalesce(sum(se.amount) filter (where se.paid_by = m.user_id), 0)::numeric,
      coalesce(sum(s.amount), 0)::numeric,
      (coalesce(sum(se.amount) filter (where se.paid_by = m.user_id), 0) - coalesce(sum(s.amount), 0))::numeric,
      totals.total_amount
    from members m cross join totals
    left join scoped_expenses se on true
    left join public.expense_splits s on s.expense_id = se.id and s.user_id = m.user_id
    group by m.user_id, totals.total_amount;
end;
$$;

revoke all on function private.validate_expense_splits(uuid,numeric,jsonb,text,uuid) from public, anon, authenticated;
revoke all on function public.create_expense(text,numeric,text,text,date,text,uuid,text,jsonb) from public, anon;
revoke all on function public.update_expense(uuid,text,numeric,text,text,date,text,uuid,text,jsonb) from public, anon;
revoke all on function public.delete_expense(uuid) from public, anon;
revoke all on function public.get_expense_summary(date,text) from public, anon;
grant execute on function public.create_expense(text,numeric,text,text,date,text,uuid,text,jsonb) to authenticated;
grant execute on function public.update_expense(uuid,text,numeric,text,text,date,text,uuid,text,jsonb) to authenticated;
grant execute on function public.delete_expense(uuid) to authenticated;
grant execute on function public.get_expense_summary(date,text) to authenticated;

create function private.broadcast_expense_change() returns trigger language plpgsql security definer set search_path = '' as $$
declare expense_visibility text; space_id uuid; owner_id uuid;
begin
  if tg_table_name = 'expenses' then
    expense_visibility := case when tg_op = 'DELETE' then old.visibility else new.visibility end;
    space_id := case when tg_op = 'DELETE' then old.couple_id else new.couple_id end;
    owner_id := case when tg_op = 'DELETE' then old.created_by else new.created_by end;
  else
    select visibility, couple_id, created_by into expense_visibility, space_id, owner_id from public.expenses where id = case when tg_op = 'DELETE' then old.expense_id else new.expense_id end;
  end if;
  if expense_visibility = 'shared' and space_id is not null then perform realtime.send('{}'::jsonb, 'expenses_changed', 'expenses:couple:' || space_id::text, true); end if;
  if expense_visibility = 'private' and owner_id is not null then perform realtime.send('{}'::jsonb, 'expenses_changed', 'expenses:user:' || owner_id::text, true); end if;
  return null;
end;
$$;
create trigger broadcast_expense_change after insert or update or delete on public.expenses for each row execute function private.broadcast_expense_change();
create trigger broadcast_expense_split_change after insert or update or delete on public.expense_splits for each row execute function private.broadcast_expense_change();
revoke all on function private.broadcast_expense_change() from public, anon, authenticated;
create policy expenses_broadcast_read on realtime.messages for select to authenticated using (
  extension = 'broadcast' and topic = (select realtime.topic()) and (
    (select realtime.topic()) = 'expenses:user:' || (select auth.uid())::text or
    (select realtime.topic()) = 'expenses:couple:' || (select private.current_couple_id())::text
  )
);

commit;
