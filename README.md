# Tandem

A mobile-first shared life-management app for couples. `PRODUCT.md` is the
product source of truth; `AGENTS.md` describes engineering expectations.

## Current phase

Authentication, optional couple connections, private/shared tasks, and the Today
dashboard are implemented. Today shows your greeting, date, partner status, task
previews, and open shared-task count. Calendar, groceries, money, date ideas,
events, expenses, and reminders remain clearly marked coming-soon placeholders.
Without Supabase configuration, the auth screens remain viewable but submissions
are disabled. See `supabase/README.md` to configure the backend and verify live flows.

## Run locally

Use Node.js 22.13 or newer within the Node 22 LTS line (`nvm use`) and npm.

```sh
npm ci
npm start
```

Open the project with an Expo Go version compatible with SDK 57, or a development
build. For platform-specific startup:

```sh
npm run ios      # Requires Xcode and an installed iOS simulator
npm run android  # Requires an Android emulator or connected device
npm run web      # Browser preview
```

## Environment

Copy `.env.example` to `.env.local` and fill in the
Supabase project URL and **publishable** key (`sb_publishable_...`). Both values
must be provided together. Use HTTPS; HTTP is accepted only for loopback
development URLs. Restart/reload the app after changing environment values.

`EXPO_PUBLIC_*` values are embedded in the app and are not secrets. Never put a
service-role key, secret key, database password, or other server credential in
them. This foundation deliberately accepts only the modern publishable-key
format. Environment files are ignored by Git except `.env.example`.

`getSupabaseClient()` validates configuration on first use and creates a single
client. Missing/invalid configuration produces an actionable developer error
without logging the supplied values. The auth provider initializes it after mount.
Sessions persist in Expo SecureStore on native and localStorage on web. Native
tokens are chunked to respect platform storage limits; no plaintext native
storage is used. Native refresh follows foreground/background state. Web refresh
uses the SDK's visibility handling. The auth subscription is cleaned up on unmount.

## Structure

```text
app/                   Expo Router routes and layouts
  (auth)/              Welcome, Login, Sign Up (signed-out users only)
  (tabs)/              Today dashboard (/), Calendar, Tasks, Lists, More
  (connection)/        Create a space, invite, join, connected
  task/                Create, detail, and edit tasks
components/
  ui/                  Text, Button, Surface, Screen, FormField, Notice
  auth/                Shared auth navigation/configuration messages
  dashboard/           Reusable, presentational dashboard cards and quick actions
  tasks/               Task forms, cards, checkbox and feedback
  couples/             Connection entry points
  app-providers.tsx    Root query and auth providers
  feature-placeholder.tsx
constants/             Reusable visual tokens
hooks/                 Feature hooks, dashboard orchestration, query lifecycle
providers/             Auth lifecycle and scoped task realtime subscriptions
lib/
  auth/                Session ordering, error mapping, confirmation handling
  supabase/            Lazy, typed client and platform session storage
  queries/             Query client configuration
  dashboard/           Greeting and explicit placeholder definitions
  tasks/               Task API, filters, dates, optimistic updates and realtime
  validation/          Environment and auth form schemas
services/              Supabase auth, connection, and task operations
types/                 Domain models and migration-matched database types
tests/                 Validation, session, storage, SDK integration tests
supabase/              Migrations, RLS tests, backend setup instructions
assets/                Expo starter launcher artwork (temporary)
```

Route files should remain thin. Future feature hooks own fetching/mutations;
domain logic belongs in testable utilities rather than screen components.
Forms use React Hook Form and Zod; dates and day boundaries use date-fns.

## Design system

`constants/theme.ts` defines spacing, typography, semantic colors, radii,
shadows, and layout dimensions. The initial theme is light, with warm neutral
surfaces and a restrained green accent. UI primitives use system fonts, respect
text scaling, and provide accessible labels and minimum button touch targets.
Screens scroll on small devices and constrain content width on larger screens.
The tab bar accounts for the device's bottom safe area.

## State and backend boundaries

- One TanStack Query client per mounted app; no persistent cache yet.
- Native focus and network signals are connected, with listener cleanup.
- Queries have a short freshness window and one retry; mutations do not retry
  automatically. Features must implement rollback for optimistic changes.
- Auth state is distinct from query state. Private query caches are cleared on
  logout and identity changes. A late restore cannot overwrite a newer auth event.
- Profiles remain owner-only. Couple membership, invitation functions, and task
  RLS enforce access in PostgreSQL. Shared member names use a restricted function.
- Task realtime sends empty, private refresh signals; clients fetch row data
  through RLS. Regenerate `types/database.ts` after schema migrations.
- Route guards provide UX protection; database RLS remains the security boundary.

## Checks

```sh
npm run typecheck
npm run lint
npm test               # Uses Node's built-in test runner; no added test framework
npm run export         # Bundles iOS, Android, and static web routes
npx expo install --check
npx expo-doctor
```

The SDK integration tests use simulated HTTP responses, not a live Supabase
project. SQL tests execute actual PostgreSQL RLS and triggers; instructions are
in `supabase/README.md`. Live email delivery, token refresh, and device keychain
behavior still require a configured development backend and physical/simulator
testing. Native bundles verify compilation, not device behavior.

Before store distribution, replace the temporary Expo launcher artwork and
set the actual iOS bundle identifier, Android package, and signing/build setup.

### Dependency audit

The initial SDK 57 dependency audit reports 29 advisories (19 high, 10 moderate)
in the dependency tree, primarily inherited through Expo/React Native tooling.
The affected leaf packages include `braces`, `node-forge`, `uuid`, and Router's
`decode-uri-component`. The audit's proposed fixes require incompatible major
downgrades; they have not been forced or hidden with unverified overrides.
Recheck `npm audit` and upstream SDK patches before a production release.

## Today dashboard

`useTodayDashboard` is the single data-orchestration entry point. Child cards
receive data and callbacks; they never fetch. Profile, couple, membership, and
Today/Upcoming task data use the existing query keys, so visiting Tasks or More
reuses cached data and in-flight work. Each task preview shows at most three
items from a bounded task page. The shared count is one exact HEAD request for
open shared rows, not the length of a preview or an unbounded download. It is
skipped when the user has no space.

Task previews and the count stop active fetching when the screen loses focus.
They share the existing task invalidation/realtime strategy. While a space has
only one member, the focused dashboard checks membership every 30 seconds;
that check stops when connected or backgrounded. Refresh Today retries all
relevant sections. Failed counts show an unavailable state instead of zero.

New tasks still default to private. The dashboard uses existing RLS and requires
no new migration, dependency, or backend configuration. Unfinished cards have an
explicit `kind: 'placeholder'` model and Coming soon labels. Only Add Task is
enabled among quick actions. There are no fabricated balances, availability,
grocery counts, or saved date ideas.

Dashboard checks cover greeting boundaries, exact count-only requests, missing
counts and cache deduplication. Existing filter, optimistic mutation, auth,
realtime and database tests remain applicable. Browser checks cover phone-width
layout, the disconnected empty state, disabled future actions, Add Task routing,
and navigation to task filters. Native bundles do not replace device testing.
