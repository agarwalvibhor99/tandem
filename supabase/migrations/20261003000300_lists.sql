begin;

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (name = btrim(name) and char_length(name) between 1 and 100),
  type text not null check (type in ('Groceries', 'Shopping', 'Packing', 'Custom')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lists_couple_created_idx on public.lists(couple_id, created_at desc);
alter table public.lists enable row level security;
revoke all on public.lists from public, anon, authenticated;
grant select on public.lists to authenticated;
grant insert (id, couple_id, name, type) on public.lists to authenticated;
create policy lists_read on public.lists for select to authenticated
  using (couple_id = (select private.current_couple_id()));
create policy lists_create on public.lists for insert to authenticated
  with check (created_by = (select auth.uid()) and couple_id = (select private.current_couple_id()));

create table public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (name = btrim(name) and char_length(name) between 1 and 160),
  quantity text check (quantity is null or (quantity = btrim(quantity) and char_length(quantity) between 1 and 40)),
  category text check (category is null or category in ('Produce','Dairy','Meat','Frozen','Pantry','Snacks','Household','Other')),
  notes text not null default '' check (char_length(notes) <= 2000),
  completed boolean not null default false,
  completed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unchecked_item_has_no_completer check (completed or completed_by is null)
);
create index list_items_list_completed_idx on public.list_items(list_id, completed, created_at, id);
alter table public.list_items enable row level security;
revoke all on public.list_items from public, anon, authenticated;
grant select, delete on public.list_items to authenticated;
grant insert (id, list_id, name, quantity, category, notes) on public.list_items to authenticated;
grant update (name, quantity, category, notes, completed) on public.list_items to authenticated;

create policy list_items_read on public.list_items for select to authenticated using (
  exists (select 1 from public.lists l where l.id = list_id and l.couple_id = (select private.current_couple_id()))
);
create policy list_items_create on public.list_items for insert to authenticated with check (
  created_by = (select auth.uid()) and
  exists (select 1 from public.lists l where l.id = list_id and l.couple_id = (select private.current_couple_id()))
);
create policy list_items_update on public.list_items for update to authenticated using (
  exists (select 1 from public.lists l where l.id = list_id and l.couple_id = (select private.current_couple_id()))
) with check (
  exists (select 1 from public.lists l where l.id = list_id and l.couple_id = (select private.current_couple_id()))
);
create policy list_items_delete on public.list_items for delete to authenticated using (
  exists (select 1 from public.lists l where l.id = list_id and l.couple_id = (select private.current_couple_id()))
);

create function private.validate_list_item() returns trigger
language plpgsql security definer set search_path = '' as $$
declare list_type text;
begin
  new.name := btrim(new.name);
  if new.quantity is not null then new.quantity := nullif(btrim(new.quantity), ''); end if;
  if tg_op = 'UPDATE' then
    if new.id <> old.id or new.list_id <> old.list_id or new.created_by <> old.created_by or new.created_at <> old.created_at then
      raise exception 'LIST_ITEM_IDENTITY_IMMUTABLE';
    end if;
    if new.completed is distinct from old.completed then
      new.completed_by := case when new.completed then auth.uid() else null end;
    else new.completed_by := old.completed_by;
    end if;
  else
    new.completed_by := null;
  end if;
  select type into list_type from public.lists where id = new.list_id for key share;
  if list_type is null then raise exception 'LIST_NOT_FOUND'; end if;
  if list_type <> 'Groceries' and new.category is not null then raise exception 'CATEGORY_ONLY_FOR_GROCERIES'; end if;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
create trigger validate_list_item before insert or update on public.list_items
  for each row execute function private.validate_list_item();
revoke all on function private.validate_list_item() from public, anon, authenticated;

-- Private couple signal only. No item names, notes, IDs, or row data are broadcast.
create function private.broadcast_list_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare audience uuid;
begin
  if tg_table_name = 'lists' then
    audience := case when tg_op = 'DELETE' then old.couple_id else new.couple_id end;
  else
    select couple_id into audience from public.lists
      where id = case when tg_op = 'DELETE' then old.list_id else new.list_id end;
  end if;
  if audience is not null then
    perform realtime.send('{}'::jsonb, 'lists_changed', 'lists:couple:' || audience::text, true);
  end if;
  return null;
end;
$$;
create trigger broadcast_list_change after insert or update or delete on public.lists
  for each row execute function private.broadcast_list_change();
create trigger broadcast_list_item_change after insert or update or delete on public.list_items
  for each row execute function private.broadcast_list_change();
revoke all on function private.broadcast_list_change() from public, anon, authenticated;

create policy lists_broadcast_read on realtime.messages for select to authenticated using (
  extension = 'broadcast' and topic = (select realtime.topic()) and
  (select realtime.topic()) = 'lists:couple:' || (select private.current_couple_id())::text
);

-- A single cheap aggregate for Today; no cross-couple arguments or row details.
create function public.remaining_grocery_items() returns integer
language sql stable security definer set search_path = '' as $$
  select count(*)::integer from public.list_items i join public.lists l on l.id = i.list_id
  where l.couple_id = (select private.current_couple_id()) and l.type = 'Groceries' and not i.completed;
$$;
revoke all on function public.remaining_grocery_items() from public, anon;
grant execute on function public.remaining_grocery_items() to authenticated;
commit;
