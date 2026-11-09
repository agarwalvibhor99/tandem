import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyCapture } from '../lib/capture/classify.ts';
import { evaluateCaptureCases, type CaptureEvaluationCase } from '../lib/capture/evaluate.ts';

const now = new Date('2026-11-08T10:00:00-08:00');
const benchmark: CaptureEvaluationCase[] = [
  { input: 'Spent $24.50 on lunch', expected: { kind: 'expense', title: 'lunch', amount: '24.50' } },
  { input: 'Paid 18.50 for parking', expected: { kind: 'expense', title: 'parking', amount: '18.50' } },
  { input: 'Add to the grocery list milk', expected: { kind: 'grocery', title: 'milk' } },
  { input: 'Pick up eggs', expected: { kind: 'grocery' } },
  { input: 'Dinner Friday at 7 PM', expected: { kind: 'event', title: 'Dinner', scheduledAt: '2026-11-14T03:00:00.000Z' } },
  { input: 'Dentist tomorrow at 3 PM', expected: { kind: 'event', title: 'Dentist', scheduledAt: '2026-11-09T23:00:00.000Z' } },
  { input: 'Remind me to call Mom tomorrow at 3:15 PM', expected: { kind: 'reminder', title: 'call Mom', scheduledAt: '2026-11-09T23:15:00.000Z' } },
  { input: 'Set a reminder to water plants next week', expected: { kind: 'reminder', title: 'water plants' } },
  { input: 'Replace the air filter', expected: { kind: 'task', title: 'Replace the air filter' } },
  { input: 'Buy a birthday card', expected: { kind: 'task' } },
  { input: 'Log an expense for $12 coffee', expected: { kind: 'expense', amount: '12.00' } },
];

test('capture benchmark protects the current intent and extraction baseline', () => {
  const result = evaluateCaptureCases(benchmark, (input) => classifyCapture(input, now));
  assert.equal(result.intentAccuracy, 1);
  assert.equal(result.titleAccuracy, 1);
  assert.equal(result.amountAccuracy, 1);
  assert.equal(result.scheduleAccuracy, 1);
  assert.equal(result.highConfidenceErrorRate, 0);
  assert.deepEqual(result.failures, []);
});

test('evaluation reports confidently wrong predictions separately', () => {
  const result = evaluateCaptureCases([{ input: 'ambiguous', expected: { kind: 'task' } }], () => ({ kind: 'expense', title: 'ambiguous', originalText: 'ambiguous', confidence: 'high', rationale: 'test' }));
  assert.equal(result.intentAccuracy, 0);
  assert.equal(result.highConfidenceErrorRate, 1);
  assert.equal(result.failures[0]?.field, 'kind');
});
