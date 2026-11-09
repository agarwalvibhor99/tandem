# Unified capture

The center create button is Tandem’s shared entry point. A user writes one short sentence, reviews what Tandem understood, and continues into the existing feature form. The feature form remains responsible for privacy, validation, expense splits, calendar conflicts, list choice, notifications, and saving.

## Current classifier

`lib/capture/classify.ts` is deterministic, instant, private, and available offline. It extracts explicit amounts and simple dates/times, then suggests one of: task, grocery, expense, event, or reminder. The user can always change the type before continuing.

This first layer should handle common commands such as:

- `Spent $24 on lunch`
- `Milk for the grocery list`
- `Dinner Friday at 7 PM`
- `Remind me to call Mom tomorrow at 3 PM`

## Optional AI classification

AI should only run after the user taps Continue and only when the local classifier reports low confidence. It should not run for each keystroke.

The production boundary should be a Supabase Edge Function. The mobile client sends the sentence, locale, and timezone; the function calls the model with a strict structured-output schema matching `CaptureSuggestion`; the client validates the response and shows the same review UI. The provider key stays in the Edge Function secret store and never ships in Expo.

Keep the deterministic classifier as the offline and failure fallback. Do not send partner names, calendar contents, expense history, or other private records for basic classification. If richer context is introduced later, require an explicit product/privacy decision and send only the minimum derived context.

## Build sequence

1. Measure corrections and abandoned captures locally without storing the sentence.
2. Add the Edge Function for low-confidence inputs.
3. Validate its response with Zod and fall back locally on timeout or invalid output.
4. Compare correction rate, latency, and cost before expanding AI usage.
5. Add direct one-tap saving only for cases whose defaults are unambiguous; keep review for shared visibility, splits, assignments, and conflicts.

## Improvement scope

### 1. Scored classification

Replace first-match rules with scores for every possible type. A sentence can contain several signals, so Tandem should compare candidates instead of allowing one keyword to decide everything. High-confidence results proceed to review, medium-confidence results emphasize alternatives, and low-confidence results ask one short clarification question.

### 2. Independent fact extraction

Extract facts before deciding the feature type: title, amount, currency, date, time, recurrence, person, quantity, category, location, visibility, and assignment. Feature-specific validation then determines which facts are required and which can safely be prefilled.

### 3. Clarification instead of guessing

Ask one focused question when the consequence matters. For example, `Call Mom tomorrow` could become a task, reminder, or event. Shared visibility, expense splits, assignments, and conflicting calendar times must never be silently inferred.

### 4. Compound and multi-item requests

Support requests such as `Milk, eggs and bread` as three proposed grocery items and `Dinner Friday, remind me an hour before` as an event with an alert. Present each proposed record separately so the user can remove or edit one before saving.

### 5. Context and localization

Use safe context such as the originating screen, locale, timezone, 12/24-hour preference, and default currency. Opening capture from a grocery list can preselect that list; opening from Money can gently favor expenses. Do not send private records merely to improve classification.

### 6. AI fallback

Use the Supabase Edge Function only for low-confidence, conversational, or compound requests. Require strict structured output, validate it with Zod, impose a short timeout, and fall back to local classification. Keep AI away from database writes.

### 7. Privacy-safe adaptation

Measure which predicted type users change without storing their sentence. Aggregate corrections can improve weights and vocabulary. Raw text collection should be off by default and require an explicit, documented product decision.

## How to test it

### Automated benchmark

`tests/capture-evaluation.test.mts` contains representative phrases and their expected intent and extracted fields. `lib/capture/evaluate.ts` reports:

- intent accuracy
- title extraction accuracy
- amount extraction accuracy
- date/time extraction accuracy
- high-confidence error rate
- exact failing examples and fields

Add examples when a real phrase is misclassified, then fix the classifier without reducing the existing scores. Keep separate benchmark groups for clear, ambiguous, adversarial, compound, locale-specific, and offline cases. Do not train or tune against the final holdout set.

### Manual workflow testing

For every supported type, test the full path from the center create button through the review screen and existing form. Verify correction, Back, offline behavior, keyboard and screen-reader use, malformed dates, missing partner, missing list, expense splits, event conflicts, and failed saves. Test on a small phone as well as web.

### AI evaluation

Before enabling an AI fallback, run the same frozen benchmark through local-only and hybrid classifiers. Compare accuracy, false confident results, latency, fallback frequency, and estimated cost. Add red-team cases containing prompt injection, private-looking text, unsupported requests, and malformed model output.

## How to measure production quality

Use a short-lived random capture-flow ID to connect events from one attempt. Do not attach the raw sentence. Useful events and properties are:

| Event | Safe properties |
| --- | --- |
| `capture_started` | originating screen |
| `capture_interpreted` | predicted type, confidence, local or AI, latency bucket |
| `capture_type_changed` | predicted type, selected type |
| `capture_clarified` | clarification category, never the answer text |
| `capture_review_opened` | selected type |
| `capture_saved` | final type, total duration bucket |
| `capture_abandoned` | last step, duration bucket |
| `capture_failed` | failure category, local or AI |

Primary product metrics:

- **Completion rate:** captures that produce a saved record.
- **Correction rate:** interpreted captures where the user changes the type.
- **High-confidence correction rate:** the most important classifier safety metric.
- **Time to review and time to save:** whether capture is actually faster than opening a form directly.
- **Abandonment by step:** where the flow creates friction.
- **Clarification rate:** how often Tandem cannot make a safe decision.
- **AI fallback rate and success rate:** how frequently AI is needed and whether it helps.
- **Latency:** local classification and AI response percentiles.
- **Cost per completed capture:** AI spend divided by successfully saved AI-assisted captures.

Suggested launch targets are at least 85% completion, under 10% overall type correction, under 3% high-confidence correction, local classification below 50 ms at p95, AI fallback below 20%, and AI response below 1.5 seconds at p95. Treat these as initial hypotheses and revise them using actual usability sessions.

Review metrics by type and confidence level. A single overall accuracy number can hide a poor grocery or reminder experience. Pair analytics with observed usability tests because a correct classification can still lead to a slow or confusing workflow.
