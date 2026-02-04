# Elite Match MVP

Local-first monorepo with Next.js web app, Express API, and PostgreSQL.

## Prerequisites

- Node.js 18+
- Docker

## Quick start

```bash
npm install
docker compose up -d
npm run db:migrate
npm run dev
```

Web runs on http://localhost:3000 and API on http://localhost:4000.
`npm run dev` launches the web app, API, and shared package watcher together.

## Onboarding flow (state machine)

Onboarding is enforced by the API and UI. Users are redirected to the next required step on login and refresh.

1. **PHONE_VERIFIED** → OTP verification completes.
2. **VIDEO_VERIFICATION_PENDING** → request concierge verification and wait for a Google Meet link.
3. **VIDEO_VERIFIED** → move to payment.
4. **PAYMENT_PENDING** → start mock payment.
5. **PAID** → proceed to profile setup.
6. **PROFILE_PENDING** → complete profile + upload at least one photo.
7. **ACTIVE** → access the full app shell.

## Local flow (demo)

1. Sign up at `/signup` with phone, email (optional), and password.
2. Verify OTP; you'll be redirected to `/onboarding/video-verification`.
3. Request concierge verification and wait for a Google Meet link.
4. Open the admin portal in another browser to send the Meet link and approve/reject.
5. Complete mock payment at `/onboarding/payment`.
6. Complete profile setup and upload at least one photo at `/onboarding/profile`.
7. Enter `/app` to Discover, Matches, and Requests.

## Testing

```bash
npm run test
```

## Environment variables

Copy the examples:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Required values:

- `DATABASE_URL`: Postgres connection string for the API
- `SESSION_SECRET`: session encryption secret for the API
- `WEB_ORIGIN`: allowed web origin for the API
- `NEXT_PUBLIC_API_BASE_URL`: API base URL for the web app

## Manual seed / cleanup

Seed data is **off by default**. To create the bootstrap admin user and 10 verified demo users:

```bash
RUN_SEED=true npm run db:seed -w apps/api
```

Default admin credentials:

- Phone: `9999999999`
- Email: `admin@example.com`
- Password: `Admin@12345`

To purge prior demo users:

```bash
RUN_SEED_CLEANUP=true npm run db:cleanup -w apps/api
```

To reset the dev database:

```bash
RESET_DEV_DB=true npm run db:reset:dev -w apps/api
```

## Concierge verification demo (Google Meet)

1. Login as a user, request verification on `/onboarding/video-verification`.
2. Open the admin portal at `/admin` in another browser.
3. Paste a Google Meet link to start the request, then approve/reject.
4. The user advances automatically to the next onboarding step.
"# test-case-elite" 
