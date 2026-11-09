# classify-capture

This Edge Function is an optional AI fallback for ambiguous quick captures. It is not called for normal high-confidence local classifications.

## Required secrets

```text
GEMINI_API_KEY=your-server-side-key
GEMINI_MODEL=gemini-2.5-flash
```

The Gemini key must be stored as a Supabase secret. Never put it in Expo public environment variables.

## Request

Send an authenticated `POST` request with:

```json
{
  "text": "Dinner Friday at 7 PM",
  "timezone": "America/Los_Angeles",
  "locale": "en-US"
}
```

The function checks the logged-in user and reserves one daily quota slot before contacting Gemini. The limits are 25 AI requests per user per UTC day and 5,000 per project per UTC day. A `429` response means Gemini was not called.

The Expo app calls this function only when `EXPO_PUBLIC_CAPTURE_AI_ENABLED=true` and the local classifier is not high confidence. Keep this flag `false` until the migration, function deployment, secret, and manual smoke test are complete.

## Deploy

Run the rate-limit migration in Supabase SQL Editor first, then deploy the function with the Supabase CLI and set the secrets in the Supabase dashboard or CLI. The mobile app should continue using the local classifier whenever this function returns `429`, `503`, or `502`.
