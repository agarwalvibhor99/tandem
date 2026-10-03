# Authentication and connection backend

## Connect a development project

1. Copy `.env.example` to `.env.local`. Set your Supabase project HTTPS URL and
   `sb_publishable_...` key. Never put database passwords or service-role keys in
   Expo public variables.
2. Apply `migrations/20261002000100_profiles.sql` once using the Supabase SQL
   Editor (or your migration pipeline). The migration runs transactionally.
3. Enable the Email provider in Supabase Auth. Set minimum password length to
   **12** on the server to match the sign-up form. Enable email confirmation for
   production and configure an appropriate SMTP provider/delivery limits.
4. Set Auth's Site URL to your deployed web `/login` page; for local browser
   development use `http://localhost:8081/login`. This is the landing page after
   email verification. Keep redirect allowlists restricted to your own URLs.
5. Restart Expo after setting environment values. Rebuild an existing custom
   native development client to include `expo-secure-store` if necessary.

No remote project or migration is automatically created/applied by this code.
No credentials or test accounts are included.

## Email confirmation

With confirmation enabled, sign-up creates the Auth user and profile but does
not enter the app. The screen directs the user to open the confirmation email,
then log in. This works even if the email opens on a different device.

The client uses PKCE and does not auto-consume auth links. Opening the Supabase
confirmation URL verifies the email server-side; the app then uses password
login. Web auth-return parameters are removed from browser history. The app
does not claim an email has been verified based only on URL parameters.

Keep the default `{{ .ConfirmationURL }}` link in Supabase's confirmation email
template. Do not replace it with a link that only opens the app without verifying
the token. Duplicate sign-up requests may intentionally return the same neutral
confirmation message to avoid revealing whether an email already has an account.

With confirmation disabled in a development project, sign-up returns a session
and enters the app immediately. Password reset, OAuth, invitations, account
deletion UI, and automatic native email-link sign-in are outside this phase.

## Profile schema and security

`profiles.id` references `auth.users.id` and cascades on Auth user deletion.
Profiles have `name`, `email`, `avatar_url`, `timezone`, `created_at`, and
`updated_at`. The primary-key index is sufficient for current per-user lookups.

- Authenticated users can select only their own row.
- Authenticated users can update only their own `name`, `avatar_url`, and
  `timezone`. RLS checks the user ID both before and after a write.
- Clients cannot insert/delete profiles or change identity, email, or timestamps.
- The privileged Auth insert trigger creates the profile atomically. It accepts
  a name and timezone as profile data, never as authorization metadata.
- Invalid name/timezone metadata aborts signup rather than leaving an orphaned
  Auth user. Existing email users are backfilled when the migration is applied.
- A separate Auth email-change trigger keeps profile email synchronized.
- Trigger functions have fixed empty search paths, qualified object names, and
  revoked public execution privileges; they are in a non-API `private` schema.
- There is no partner/shared access and no profile realtime publication.

This phase supports email/password accounts. Phone-only accounts would require
a deliberate migration of the required email field before enabling that provider.

## Verification

`npm run check` runs TypeScript, ESLint, and automated tests. The tests cover:

- Input validation and safe user-facing errors.
- Large Unicode session persistence and removal, interrupted storage writes.
- Session restore, retry, auth-event races, and cache isolation across accounts.
- Real Supabase SDK calls against controlled HTTP fixtures for confirmation,
  sign-up, login, invalid credentials, restoration, and logout.

`tests/profiles.sql` exercises triggers, owner reads/updates, cross-user denial,
anonymous denial, restricted columns, constraints, and deletion cleanup. Run it
with `psql -v ON_ERROR_STOP=1` against a development database after the migration.
The test inserts temporary users inside a transaction and rolls everything back.
Do not run test scripts in a production project.

For a disposable standalone PostgreSQL instance, apply these files in order:

```text
tests/sql/auth-fixture.sql                 (repository root; test-only Auth stand-in)
supabase/migrations/20261002000100_profiles.sql
supabase/tests/profiles.sql
```

The Auth fixture must NEVER be applied to a Supabase project. It only supplies
the roles, minimal `auth.users` table, and JWT-user-ID function needed to exercise
the real PostgreSQL policies in isolation. It does not emulate the Auth service.

### Live acceptance checks (require project configuration)

1. Open `/calendar` while signed out: Welcome must appear with no app tabs.
2. Sign up with a controlled email and name; confirm the email if required.
   Verify one profile with the same UUID as the Auth user.
3. Log in; verify Today and the profile under More. Invalid credentials should
   show a friendly error without exposing backend detail.
4. Reload the browser, or fully close/reopen the native app: the session restores
   before protected content renders. Visit `/login` while signed in: enter Today.
5. Log out from More: return to Welcome. Reload and try a protected deep link:
   stay signed out. A different account must never see the previous profile.
6. Test session expiry/refresh, lost connectivity, and background/foreground
   transitions on both native platforms. Logout is scoped to this device; the
   server may take until token expiry to reject an already-issued access token.

During implementation, the SQL migration and policies were executed on isolated
PostgreSQL 16. Live Supabase email delivery and device session persistence are
separate verification steps, not implied by mocked integration tests.

## Phase 3: partner connection

### Apply the new backend migration

1. Open the **same Supabase project** used by Tandem.
2. Choose **SQL Editor → New query**.
3. Open `supabase/migrations/20261003000100_couples.sql` in this repository.
   Copy the **entire file**, paste it into the query, and click **Run** once.
   The earlier profiles migration must already be applied. Do not rerun it.
4. In Table Editor, confirm `couples`, `couple_memberships`, and `couple_invites`
   exist, with RLS enabled. `profiles` also gains `couple_onboarding_skipped_at`.
5. Refresh Tandem. On Today choose **Create your shared space** or **Join with a
   code**. Setup remains available from More after skipping.

No extra environment variables, dependencies, realtime publication, or Auth
provider changes are required. The migration has been tested locally; it is not
automatically applied to your hosted project.

### Membership and privacy

- Membership rows represent current membership; there are no hardcoded partner
  columns. A unique user ID permits one space per account in this MVP.
- The two-member cap is enforced under a parent-row lock, including concurrent
  joins. Per-user transaction locks serialize simultaneous create/join requests.
- Members may read their space and its memberships. All direct client mutations
  of the three tables are denied, including a user's own membership. Only
  authenticated, checked database functions create spaces and accept invites.
- Invite codes contain 64 random bits, expire after 24 hours, and can be used
  once. Issuing another code expires existing unused codes. Only the creator can
  read the code; invite lookup happens inside the acceptance function.
- `get_couple_members()` exposes member names and membership fields only. It
  takes no user or couple ID. Profile emails and other profile fields remain
  owner-only. The previous statement that there is no shared profile access
  still applies to direct table reads; this function provides the narrow name
  projection needed for connection UI.
- The remaining member can generate another invite after a partner's Auth
  account is deleted. A user with an existing space cannot join another one.
  Leaving, switching spaces, and account-deletion UI are outside this phase.
- Skip is an owner-only profile preference, not a permission. Optional setup is
  offered on Today and never gates personal tabs. Errors loading a shared space
  do not block access to personal screens.
- Connection status polls every three seconds only on a focused connection
  surface while waiting, pauses in the background, and stops after connection.
  Invite codes are never broadcast through realtime.

### Verification and acceptance

After applying both migrations to a disposable/development database, run
`supabase/tests/profiles.sql` and `supabase/tests/couples.sql` with
`psql -v ON_ERROR_STOP=1`. They roll back their test data. The latter exercises
A → invitation → B → same space, C isolation, safe member names, direct-write
and anonymous denial, and all specified invitation error cases.

`tests/sql/couple-concurrency.py` is specifically configured for the local
throwaway PostgreSQL socket used during development. It tests simultaneous
joins and duplicate creates and removes its generated fixtures. Do not point
it at production. `npm run check` also covers validation/error mapping and
existing authentication regressions.

For live UI acceptance, use two different accounts on separate browsers/devices
(two tabs in the same browser share a session):

1. A creates a space and generates a code. Reload: the same code is shown.
2. B enters the code. B sees Partner connected; A's waiting screen updates.
3. On both accounts, More shows the same space and the two names.
4. C can see neither space nor members. Invalid, expired, used, and full-space
   codes display helpful errors; entering one's own code is rejected.
5. On a fresh account, Skip for now hides the setup prompt across reopen/login.
   More still offers connection setup, and all personal tabs remain accessible.
6. Log out and open `/join-space` directly: return to Welcome. Repeat reopen,
   background/foreground, sharing, and large-text checks on iOS and Android.

TypeScript, lint, automated tests, SQL/RLS tests, concurrency tests, and bundle
exports are local verification. Live Supabase and physical-device acceptance
remain separate checks after deployment.

## Phase 4: Tasks

### Backend setup

1. After the profiles and couples migrations, open **SQL Editor → New query**.
2. Paste the entire `supabase/migrations/20261003000200_tasks.sql` and run it
   **once**. This creates `tasks`, its policies, server validation, and private
   Realtime broadcast authorization. It does not modify existing couple data.
3. Under **Realtime → Settings**, disable **Allow public access** to enforce
   private channels for this app. Do not add `tasks` to the Postgres Changes
   publication: this implementation uses private database Broadcast instead.
4. Refresh Tandem. Tasks work privately even without a space or partner. A space
   with one member supports shared tasks; assignment to the partner appears
   after that partner joins.

Reference: [Supabase Realtime authorization](https://supabase.com/docs/guides/realtime/authorization).
No dependencies or additional environment variables are needed.

### Task behavior

- New tasks default to **Private**. Shared visibility is an explicit choice.
- Private rows have no `couple_id`; only their creator may read/change/delete
  them, and they can only be assigned to the creator or nobody.
- Both current members may read/edit/complete/reopen/delete shared tasks.
  Assignment changes responsibility, not permissions. Only the creator can
  change a task's visibility. Sharing again requires current membership.
- The database checks assignment against actual membership. Clients cannot
  forge ownership, timestamps, or completion dates. `completed_at` is maintained
  by a trigger. Writes use the last `updated_at` as a precondition to prevent
  silent overwrites from stale screens.
- Today = open tasks due today or overdue. Upcoming = open tasks due later or
  with no date. Mine = private tasks plus shared tasks assigned to you. Partner
  = shared tasks assigned to the other member. Shared = all open shared tasks.
  Completed = all visible completed tasks.
- Dates are selected by calendar day, stored as local noon in `due_at`, and
  displayed/filtered in the viewing device's local timezone. This phase has no
  due-time picker or reminders. Changing timezone can change the displayed day
  for very distant timezones; use a separate date-only domain field if future
  product requirements require a timezone-independent day.
- Lists fetch 30 rows at a time, with explicit Load more. Today previews up to
  three due tasks. No task recurrence or notifications are implemented here.
- Completion uses a pending-mutation overlay. Failure removes only that overlay,
  so one failed checkbox cannot roll back another task's successful completion.
  Successful results are retained even if refreshing afterwards fails. Offline
  writes fail visibly; they are not silently queued for later.

### Realtime and privacy

Database triggers broadcast an empty refresh signal to the creator's private
channel and, only for shared tasks, the couple channel. **No task title,
notes, ID, assignee, or row content is broadcast.** The old audience is notified
when a task becomes private or is deleted; subsequent private edits go only to
its creator. Recipients fetch data through task RLS. A previously shared task
cannot retroactively be made unknown to a partner who already read it.

The signed-in app owns one pair of scoped subscriptions (one for a solo user),
removes them on logout/account/space changes, batches notifications, and refreshes
on reconnect/foreground. A foreground 30-second refresh reconciles missed
messages. Failed sockets have a visible status rather than appearing live.
Clients have no broadcast-send policy. Do not add permissive catch-all policies
on `realtime.messages`; policies are ORed and could weaken topic authorization.

Auth user deletion cascades tasks created by that user; assignee deletion clears
assignment. Couple deletion cascades shared tasks. There is no account/space
removal UI in this phase. Retention rules should be revisited before adding one.

### Verification

`npm run check` covers all filters, date boundaries/DST, input validation, real
Supabase query/mutation builders against controlled HTTP fixtures, concurrent
optimistic success/failure, and the real Supabase Realtime SDK against an
in-memory WebSocket transport (private topics, refresh batching, channel errors,
and cleanup). Existing auth/connection tests remain included.

`supabase/tests/tasks.sql` runs on a disposable/development database after all
migrations, using A and B in one space and unrelated C. It checks private reads,
updates and deletion, shared editing/completion/reopening/deletion, assignment,
visibility changes, protected fields, malformed data, solo usage and stale writes.
Test records roll back.

For standalone PostgreSQL only, load `tests/sql/realtime-fixture.sql` before the
Tasks migration. Then `tests/sql/task-broadcasts.sql` checks the real trigger's
routing, empty payloads, private/shared transitions, delete events, recipient
policies and client-send denial. These two fixture files MUST NOT be applied to
Supabase: they stand in for its managed realtime schema, not its hosted service.

Live acceptance after applying the migration (separate browsers/devices for A/B):

1. A creates a private gift task. B must not see it in any filter or by its URL.
2. A creates a shared task assigned to B. B sees it under Partner's opposite
   view (Mine); A sees it under Partner. Both see it under Shared.
3. Edit title, notes, priority, category, due date and assignment; verify the
   other screen updates without a reload. Verify changes to Private remove
   access on B's list and detail screen.
4. Complete/reopen from the checkbox; verify immediate UI changes, timestamps,
   Completed filtering and partner updates. Disconnect the network and try a
   completion: the change must roll back with an error.
5. Open an edit form on both devices; save on one, then attempt the stale save
   on the other. Load the latest version rather than overwrite silently.
6. Delete a disposable task using its confirmation; verify removal on both
   devices. Test a solo account and an unrelated third account as well.
7. Background/reopen, reconnect, and log out/in as another user; verify scoped
   subscriptions and account cache isolation. Test large text and the date
   picker on iOS and Android.

Local database/SDK tests are not a claim of hosted Supabase transport or physical
mobile-device verification. The live checks require this migration to be applied.

### Phase 4 verification recorded

The migration was applied to the hosted development project. In the running web
app, a temporary task was created privately, changed to shared, edited (title,
notes, category, priority, responsibility and date), completed, reopened, and
removed with approval. Two authenticated tabs on the same account received the
edits/completion/deletion without a reload. The stale-edit warning, Completed
filter, Today preview, phone-width layout and date picker were also verified.
The test task was removed. Cross-user isolation was tested in PostgreSQL with
three identities; a live second-partner account and physical-device checks are
still separate acceptance steps.

## Shared Lists

Apply `migrations/20261003000300_lists.sql` after the couples and tasks migrations.
It creates `lists`, `list_items`, the scoped `remaining_grocery_items()` aggregate,
and private couple-only realtime change signals. The hosted development project
has this migration applied. Only members of the current couple can read or write
its lists/items; anonymous and unrelated accounts cannot. Clients cannot forge
creator, completion attribution or timestamps. Categories apply only to
Groceries; quantity is optional free text such as “2 cartons.” Lists are shared
spaces only in this phase; personal Tasks remain available without a space.

`supabase/tests/lists.sql` runs transactionally in a disposable database after
all migrations. It checks A/B sharing, C isolation, completion and grocery
counts, category rules, protected columns and realtime topic access. Local
PostgreSQL uses `tests/sql/realtime-fixture.sql`; never apply that fixture to
hosted Supabase. The live web flow was verified for creating a Groceries list,
adding and editing Milk, checking/reopening it, and seeing Today update in a
second tab without refreshing. A distinct partner account, native devices and
offline recovery still need end-to-end acceptance checks.

## Calendar and availability

Apply `migrations/20261003000400_calendar.sql` after the earlier migrations.
It creates `calendar_events` with owner-only details for private events and
full details for shared events. A private event has no `couple_id`; when a
partner joins, `get_calendar_window()` can show its time as **Busy** without
returning its ID, title, location, notes, or timestamps. Direct table RLS never
exposes private partner rows. The RPC accepts only bounded windows (at most 43
days). No external calendar provider or calendar permission is used.

The owner may create, edit, or delete either event type. A partner may read
shared details and private Busy intervals, but cannot edit another person's
events. Private realtime broadcasts contain only an empty change signal on
scoped user/couple topics; every update is refetched through the masked RPC.
`supabase/tests/calendar.sql` tests owner, partner, unrelated and anonymous
access, masking, unauthorized writes, realtime topic privacy, and switching
an event from shared to private. The SQL test runs transactionally in a
disposable database with the standalone realtime fixture. Never apply fixture
files to hosted Supabase.

Day, Week and simplified Month use the same authorized calendar query. The
free-time utility clips and merges both partners' busy intervals, then returns
gaps of at least 30 minutes. Today shows the longest remaining gap between
8 AM and 10 PM only when both members are connected and calendar data exists;
the card explicitly notes that its result is based on events added to Tandem.
An external provider can later be added behind the calendar service as another
source of busy intervals without changing the UI or weakening event RLS.
