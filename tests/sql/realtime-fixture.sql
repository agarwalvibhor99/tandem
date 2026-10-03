-- DISPOSABLE STANDALONE POSTGRES ONLY. Never apply to hosted Supabase.
-- Captures database broadcasts so SQL tests can assert routing and payload privacy.
create schema realtime;
create table realtime.messages (
 id uuid primary key default gen_random_uuid(), topic text not null,
 extension text not null default 'broadcast', event text, payload jsonb, private boolean
);
alter table realtime.messages enable row level security;
grant usage on schema realtime to authenticated, anon;
grant select, insert on realtime.messages to authenticated;
create function realtime.topic() returns text language sql stable as $$
 select nullif(current_setting('realtime.topic', true), '');
$$;
create function realtime.send(payload jsonb, event text, topic text, private boolean default true)
returns void language sql security definer set search_path = '' as $$
 insert into realtime.messages(payload,event,topic,private) values(payload,event,topic,private);
$$;
revoke all on function realtime.send(jsonb,text,text,boolean) from public, anon, authenticated;
