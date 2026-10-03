import assert from 'node:assert/strict';
import test from 'node:test';
import { createCoupleSchema, joinCoupleSchema, formatInviteCode } from '../lib/validation/couple.ts';
import { coupleErrorMessage } from '../lib/couples/errors.ts';

test('space names are trimmed and bounded', () => {
  assert.equal(createCoupleSchema.parse({ name: ' Our space ' }).name, 'Our space');
  for (const name of ['', '   ', 'a'.repeat(81)]) assert.equal(createCoupleSchema.safeParse({ name }).success, false);
});
test('invitation codes normalize pasted input without accepting partial codes', () => {
  assert.equal(joinCoupleSchema.parse({ code: ' abcd-1234 ef56-7890 ' }).code, 'ABCD1234EF567890');
  assert.equal(formatInviteCode('ABCD1234EF567890'), 'ABCD-1234-EF56-7890');
  for (const code of ['', 'ABCD1234', 'ZZZZ1234EF567890', 'ABCD1234EF567890AB']) assert.equal(joinCoupleSchema.safeParse({ code }).success, false);
});
test('database errors have safe actionable messages', () => {
  for (const message of ['INVALID_INVITE', 'INVITE_EXPIRED', 'INVITE_USED', 'SELF_INVITE', 'COUPLE_FULL', 'ALREADY_CONNECTED']) {
    assert.notEqual(coupleErrorMessage({ message }), coupleErrorMessage(null));
  }
  assert.equal(coupleErrorMessage({ message: 'private database details' }), coupleErrorMessage(null));
});
