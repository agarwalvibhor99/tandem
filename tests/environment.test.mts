import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseSupabaseEnvironment } from '../lib/validation/environment.ts';

const valid = { url: 'https://project.supabase.co', publishableKey: 'sb_publishable_example-key' };

test('missing backend configuration is represented explicitly', () => {
  assert.equal(parseSupabaseEnvironment({}), null);
  assert.equal(parseSupabaseEnvironment({ url: ' ', publishableKey: '' }), null);
});

test('accepts complete public configuration and trims pasted whitespace', () => {
  assert.deepEqual(parseSupabaseEnvironment({
    url: ` ${valid.url} `,
    publishableKey: ` ${valid.publishableKey} `,
  }), valid);
});

test('rejects partial or malformed configuration', () => {
  assert.throws(() => parseSupabaseEnvironment({ url: valid.url }));
  assert.throws(() => parseSupabaseEnvironment({ publishableKey: valid.publishableKey }));
  assert.throws(
    () => parseSupabaseEnvironment({ ...valid, url: 'not-a-url' }),
    /Invalid Supabase configuration/,
  );
});

test('rejects secret keys and legacy JWTs without exposing their values', () => {
  for (const publishableKey of ['sb_secret_do-not-log-this', 'eyJhbGciOiJIUzI1NiJ9.example.signature']) {
    assert.throws(
      () => parseSupabaseEnvironment({ ...valid, publishableKey }),
      (error: unknown) => error instanceof Error && !error.message.includes(publishableKey),
    );
  }
});

test('requires HTTPS except for local loopback development', () => {
  assert.throws(() => parseSupabaseEnvironment({ ...valid, url: 'http://project.supabase.co' }));
  assert.throws(() => parseSupabaseEnvironment({ ...valid, url: 'ftp://project.supabase.co' }));
  for (const url of ['http://localhost:54321', 'http://127.0.0.1:54321', 'http://[::1]:54321']) {
    assert.equal(parseSupabaseEnvironment({ ...valid, url })?.url, url);
  }
});
