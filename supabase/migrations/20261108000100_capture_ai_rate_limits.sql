begin;

-- Private counters are never exposed through the public API. The function below
-- is the only way the authenticated Edge Function can reserve an AI request.
create table private.capture_ai_usage (
  usage_day date not null,
  scope text not null,
  user_id uuid not null default '00000000-0000-0000-0000-000000000000',
  used_count integer not null default 0 check (used_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (usage_day, scope, user_id)
);

alter table private.capture_ai_usage enable row level security;

revoke all on private.capture_ai_usage from public, anon, authenticated;

create or replace function public.consume_capture_ai_quota()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  today date := current_date;
  user_reserved boolean := false;
  project_reserved boolean := false;
begin
  if actor is null then
    return false;
  end if;

  -- Per-user limit: 25 AI-assisted captures per UTC day.
  insert into private.capture_ai_usage (usage_day, scope, user_id, used_count)
    values (today, 'user', actor, 1)
  on conflict (usage_day, scope, user_id) do update
    set used_count = private.capture_ai_usage.used_count + 1,
        updated_at = clock_timestamp()
    where private.capture_ai_usage.used_count < 25
  returning true into user_reserved;

  if not coalesce(user_reserved, false) then
    return false;
  end if;

  -- Project circuit breaker: 5,000 AI-assisted captures per UTC day.
  insert into private.capture_ai_usage (usage_day, scope, user_id, used_count)
    values (today, 'project', '00000000-0000-0000-0000-000000000000', 1)
  on conflict (usage_day, scope, user_id) do update
    set used_count = private.capture_ai_usage.used_count + 1,
        updated_at = clock_timestamp()
    where private.capture_ai_usage.used_count < 5000
  returning true into project_reserved;

  if not coalesce(project_reserved, false) then
    -- Give the user's slot back if the project breaker was reached.
    update private.capture_ai_usage
      set used_count = greatest(used_count - 1, 0), updated_at = clock_timestamp()
      where usage_day = today and scope = 'user' and user_id = actor;
    return false;
  end if;

  return true;
end;
$$;

revoke all on function public.consume_capture_ai_quota() from public, anon;
grant execute on function public.consume_capture_ai_quota() to authenticated;

commit;
