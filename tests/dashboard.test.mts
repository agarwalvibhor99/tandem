import assert from 'node:assert/strict';
import test from 'node:test';
import { createClient } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/react-query';
import { createTaskApi } from '../lib/tasks/api.ts';
import { dashboardGreeting } from '../lib/dashboard/greeting.ts';
import type { Database } from '../types/database.ts';

test('shared dashboard count is exact, RLS-scoped, open only, and fetches no task bodies', async () => {
  let request: URL | undefined;
  let method: string | undefined;
  const client = createClient<Database>('https://tasks.example.test', 'test-public-key', { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: async (input, init) => {
    request = new URL(String(input)); method = init?.method;
    return new Response(null, { headers: { 'content-range': '0-0/137' } });
  } } });
  assert.equal(await createTaskApi(client).countShared(), 137);
  assert.equal(method, 'HEAD');
  assert.equal(request!.searchParams.get('visibility'), 'eq.shared');
  assert.equal(request!.searchParams.get('status'), 'eq.open');
  assert.equal(request!.searchParams.get('select'), 'id');
});
test('missing count fails explicitly instead of showing a misleading zero', async () => {
  const client = createClient<Database>('https://tasks.example.test', 'test-public-key', { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: async () => new Response(null) } });
  await assert.rejects(createTaskApi(client).countShared(), /Task count unavailable/);
});
test('canonical query keys share in-flight work and fresh results', async () => {
  const client = new QueryClient();
  let requests = 0;
  const options = { queryKey: ['tasks', 'user-a', 'list', 'Today', '2026-10-04T00:00:00Z'], queryFn: async () => { requests++; return []; }, staleTime: 30_000 };
  await Promise.all([client.fetchQuery(options), client.fetchQuery(options)]);
  await client.fetchQuery(options);
  assert.equal(requests, 1);
  client.clear();
});
test('greeting handles missing profiles and daypart boundaries', () => {
  assert.equal(dashboardGreeting(undefined, 8), 'Good morning');
  assert.equal(dashboardGreeting('  Sam Rivera ', 11), 'Good morning, Sam');
  assert.equal(dashboardGreeting('Sam', 12), 'Good afternoon, Sam');
  assert.equal(dashboardGreeting('Sam', 18), 'Good evening, Sam');
  assert.equal(dashboardGreeting('   ', 20), 'Good evening');
});
