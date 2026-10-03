import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createClient, type AuthChangeEvent, type Session } from '@supabase/supabase-js';

import { authErrorMessage } from '../lib/auth/errors.ts';
import { createSessionManager, type SessionSource } from '../lib/auth/session-manager.ts';
import { createChunkedStorage, type StorageDriver } from '../lib/supabase/chunked-storage.ts';
import { loginSchema, signUpSchema } from '../lib/validation/auth.ts';
import { createAuthService } from '../services/auth.ts';
import type { Database } from '../types/database.ts';

function memoryStorage() {
  const values = new Map<string, string>();
  const storage: StorageDriver = {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => { values.set(key, value); },
    removeItem: async (key) => { values.delete(key); },
  };
  return { storage, values };
}

const user = {
  id: 'b659762c-e8c9-465d-a0e3-7e49b9415f53', aud: 'authenticated', role: 'authenticated',
  email: 'alex@example.com', app_metadata: {}, user_metadata: { name: 'Alex' },
  created_at: '2026-10-02T00:00:00Z',
};
const token = [
  { alg: 'HS256', typ: 'JWT' },
  { sub: user.id, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 },
].map((part) => Buffer.from(JSON.stringify(part)).toString('base64url')).join('.') + '.test-signature';
const session: Session = {
  access_token: token, refresh_token: 'test-refresh-token', token_type: 'bearer',
  expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user,
};

test('forms validate names and email without trimming passwords or blocking legacy login', () => {
  assert.equal(signUpSchema.safeParse({ name: ' ', email: user.email, password: 'long password' }).success, false);
  assert.equal(signUpSchema.safeParse({ name: 'Alex', email: 'bad', password: 'long password' }).success, false);
  assert.equal(signUpSchema.safeParse({ name: 'Alex', email: user.email, password: 'short' }).success, false);
  assert.equal(signUpSchema.parse({ name: ' Alex ', email: ` ${user.email} `, password: '  long password  ' }).password, '  long password  ');
  assert.equal(loginSchema.safeParse({ email: user.email, password: 'older' }).success, true);
});

test('backend errors never expose raw backend messages', () => {
  assert.match(authErrorMessage({ code: 'invalid_credentials', message: 'SQL private detail' }), /don’t match/);
  assert.match(authErrorMessage({ code: 'email_not_confirmed' }), /confirm/);
  assert.match(authErrorMessage({ status: 429 }), /Too many/);
  assert.equal(authErrorMessage({ message: 'SQL private detail' }).includes('SQL'), false);
});

test('encrypted chunk adapter round trips large Unicode sessions and deletes all chunks', async () => {
  const { storage, values } = memoryStorage();
  const secure = createChunkedStorage(storage);
  const large = '🔐'.repeat(4000);
  await secure.setItem('session', large);
  assert.equal(await secure.getItem('session'), large);
  assert.ok([...values.values()].every((value) => Buffer.byteLength(value) < 2000));
  await secure.setItem('session', 'replacement');
  assert.equal(await secure.getItem('session'), 'replacement');
  assert.equal(values.size, 2);
  await secure.removeItem('session');
  assert.equal(await secure.getItem('session'), null);
  assert.equal(values.size, 0);
});

test('failed token writes preserve the previous session and missing chunks fail closed', async () => {
  const { storage, values } = memoryStorage();
  let fail = false;
  const secure = createChunkedStorage({
    ...storage,
    async setItem(key, value) {
      if (fail && key.endsWith('.1')) throw new Error('Storage unavailable');
      await storage.setItem(key, value);
    },
  });
  await secure.setItem('session', 'previous');
  fail = true;
  await assert.rejects(secure.setItem('session', 'x'.repeat(800)));
  assert.equal(await secure.getItem('session'), 'previous');
  const chunk = [...values.keys()].find((key) => key !== 'session');
  assert.ok(chunk);
  values.delete(chunk);
  await assert.rejects(secure.getItem('session'), /incomplete/);
});

test('a late restore cannot override logout or an account switch', async () => {
  let finish: ((value: { data: { session: Session }; error: null }) => void) | undefined;
  let event: ((event: AuthChangeEvent, session: Session | null) => void) | undefined;
  let cleared = 0;
  const source: SessionSource = {
    getSession: () => new Promise((resolve) => { finish = resolve; }),
    onAuthStateChange(callback) { event = callback; return { data: { subscription: { unsubscribe() { event = undefined; } } } }; },
  };
  const manager = createSessionManager(source, () => cleared++);
  const stop = manager.start();
  event?.('SIGNED_IN', session);
  assert.equal(manager.getSnapshot().status, 'signedIn');
  event?.('SIGNED_OUT', null);
  finish?.({ data: { session }, error: null });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(manager.getSnapshot().status, 'signedOut');
  assert.equal(cleared, 2);
  event?.('SIGNED_IN', session);
  event?.('TOKEN_REFRESHED', { ...session, access_token: 'refreshed' });
  assert.equal(cleared, 3, 'same-account refresh must not clear the cache');
  event?.('SIGNED_IN', { ...session, user: { ...user, id: 'another-account' } });
  assert.equal(cleared, 4);
  stop();
  assert.equal(event, undefined);
});

test('restore errors fail closed and retry can recover', async () => {
  let failure = true;
  const source: SessionSource = {
    async getSession() { return { data: { session: failure ? null : session }, error: failure ? new Error('offline') : null }; },
    onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; },
  };
  const manager = createSessionManager(source, () => {});
  const stop = manager.start();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(manager.getSnapshot().status, 'error');
  failure = false;
  await manager.restore();
  assert.equal(manager.getSnapshot().status, 'signedIn');
  stop();
});

test('Supabase SDK integration: confirmation, login errors, login, persisted reopen, logout', async () => {
  const { storage, values } = memoryStorage();
  const requests: { path: string; body: Record<string, unknown> }[] = [];
  const fetchStub: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) as Record<string, unknown> : {};
    requests.push({ path: url.pathname, body });
    if (url.pathname.endsWith('/signup')) return Response.json(user);
    if (url.pathname.endsWith('/token')) {
      if (body.password === 'incorrect') return Response.json({ error_code: 'invalid_credentials', msg: 'Invalid login credentials' }, { status: 400 });
      return Response.json(session);
    }
    if (url.pathname.endsWith('/logout')) return new Response(null, { status: 204 });
    throw new Error(`Unexpected test request: ${url.pathname}`);
  };
  const options = { auth: { storage, persistSession: true, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'sdk-test' }, global: { fetch: fetchStub } };
  const client = createClient<Database>('https://auth-test.example', 'sb_publishable_test', options);
  const service = createAuthService(client);
  assert.equal(await service.signUp({ name: 'Alex', email: user.email, password: 'a long password' }), 'confirmEmail');
  assert.equal((requests[0]?.body.data as Record<string, unknown>).name, 'Alex');
  assert.equal((await client.auth.getSession()).data.session, null);
  await assert.rejects(service.login({ email: user.email, password: 'incorrect' }));
  await service.login({ email: user.email, password: 'a long password' });
  assert.equal((await client.auth.getSession()).data.session?.user.id, user.id);
  assert.ok(values.get('sdk-test'));

  const reopened = createClient<Database>('https://auth-test.example', 'sb_publishable_test', options);
  const restored = createSessionManager(reopened.auth, () => {});
  const stop = restored.start();
  await restored.restore();
  assert.equal(restored.getSnapshot().status, 'signedIn');
  await createAuthService(reopened).logout();
  assert.equal(restored.getSnapshot().status, 'signedOut');
  assert.equal(values.get('sdk-test'), undefined);
  stop();
  await client.auth.stopAutoRefresh();
  await reopened.auth.stopAutoRefresh();
});

test('sign-up with confirmation disabled returns an authenticated session', async () => {
  const { storage } = memoryStorage();
  const client = createClient<Database>('https://signup-test.example', 'sb_publishable_test', {
    auth: { storage, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async () => Response.json(session) },
  });
  assert.equal(await createAuthService(client).signUp({ name: 'Alex', email: user.email, password: 'a long password' }), 'signedIn');
  assert.equal((await client.auth.getSession()).data.session?.user.id, user.id);
  await client.auth.stopAutoRefresh();
});
