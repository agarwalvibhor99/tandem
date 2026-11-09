import type { CaptureKind, CaptureSuggestion } from '@/types/capture';

export type CaptureEvaluationCase = {
  input: string;
  expected: {
    kind: CaptureKind;
    title?: string;
    amount?: string;
    scheduledAt?: string;
  };
};

export type CaptureEvaluation = {
  total: number;
  intentAccuracy: number;
  titleAccuracy: number | null;
  amountAccuracy: number | null;
  scheduleAccuracy: number | null;
  highConfidenceErrorRate: number;
  failures: { input: string; field: 'kind' | 'title' | 'amount' | 'scheduledAt'; expected: string; actual: string }[];
};

function ratio(correct: number, total: number) {
  return total === 0 ? null : correct / total;
}

export function evaluateCaptureCases(cases: CaptureEvaluationCase[], classify: (input: string) => CaptureSuggestion): CaptureEvaluation {
  const failures: CaptureEvaluation['failures'] = [];
  let intentCorrect = 0;
  let titleCorrect = 0;
  let titleTotal = 0;
  let amountCorrect = 0;
  let amountTotal = 0;
  let scheduleCorrect = 0;
  let scheduleTotal = 0;
  let highConfidenceErrors = 0;

  for (const testCase of cases) {
    const actual = classify(testCase.input);
    if (actual.kind === testCase.expected.kind) intentCorrect += 1;
    else {
      failures.push({ input: testCase.input, field: 'kind', expected: testCase.expected.kind, actual: actual.kind });
      if (actual.confidence === 'high') highConfidenceErrors += 1;
    }
    if (testCase.expected.title !== undefined) {
      titleTotal += 1;
      if (actual.title === testCase.expected.title) titleCorrect += 1;
      else failures.push({ input: testCase.input, field: 'title', expected: testCase.expected.title, actual: actual.title });
    }
    if (testCase.expected.amount !== undefined) {
      amountTotal += 1;
      if (actual.amount === testCase.expected.amount) amountCorrect += 1;
      else failures.push({ input: testCase.input, field: 'amount', expected: testCase.expected.amount, actual: actual.amount ?? 'missing' });
    }
    if (testCase.expected.scheduledAt !== undefined) {
      scheduleTotal += 1;
      if (actual.scheduledAt === testCase.expected.scheduledAt) scheduleCorrect += 1;
      else failures.push({ input: testCase.input, field: 'scheduledAt', expected: testCase.expected.scheduledAt, actual: actual.scheduledAt ?? 'missing' });
    }
  }

  return {
    total: cases.length,
    intentAccuracy: cases.length === 0 ? 1 : intentCorrect / cases.length,
    titleAccuracy: ratio(titleCorrect, titleTotal),
    amountAccuracy: ratio(amountCorrect, amountTotal),
    scheduleAccuracy: ratio(scheduleCorrect, scheduleTotal),
    highConfidenceErrorRate: cases.length === 0 ? 0 : highConfidenceErrors / cases.length,
    failures,
  };
}
