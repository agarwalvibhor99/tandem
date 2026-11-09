import assert from 'node:assert/strict';
import test from 'node:test';
import { chooseCaptureKind, classifyCapture } from '../lib/capture/classify.ts';

const now = new Date('2026-11-08T10:00:00-08:00');

test('capture classifies explicit expenses and extracts amount without putting it in the title', () => {
  const result = classifyCapture('Spent $24.50 on lunch', now);
  assert.equal(result.kind, 'expense');
  assert.equal(result.amount, '24.50');
  assert.equal(result.title, 'lunch');
  assert.equal(result.confidence, 'high');
});

test('capture classifies grocery intent and cleans the list command', () => {
  const result = classifyCapture('Add to the grocery list milk', now);
  assert.equal(result.kind, 'grocery');
  assert.equal(result.title, 'milk');
});

test('capture extracts tomorrow time for a reminder', () => {
  const result = classifyCapture('Remind me to call Mom tomorrow at 3:15 PM', now);
  assert.equal(result.kind, 'reminder');
  assert.equal(result.title, 'call Mom');
  assert.equal(result.scheduledAt, '2026-11-09T23:15:00.000Z');
});

test('capture recognizes a timed plan and uses tasks as the safe fallback', () => {
  assert.equal(classifyCapture('Dinner Friday at 7 PM', now).kind, 'event');
  assert.equal(classifyCapture('Replace the air filter', now).kind, 'task');
});

test('the user can always correct the suggested type', () => {
  const corrected = chooseCaptureKind(classifyCapture('Buy a birthday card', now), 'grocery');
  assert.equal(corrected.kind, 'grocery');
  assert.equal(corrected.confidence, 'high');
  assert.equal(corrected.rationale, 'Type chosen by you.');
});
