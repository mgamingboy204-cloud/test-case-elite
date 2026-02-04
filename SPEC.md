\# Elite Match MVP — FINAL SPEC (Local-First, No Purchases)



> Single source of truth. Implement exactly. Do not ask questions.



---



\## 1) Goal



Build a \*\*local-first, production-structured MVP\*\* for a premium verified matchmaking platform.



\- Runs fully locally (no purchases, no external APIs)

\- Starts with \*\*one command\*\*

\- Frontend + Backend + DB + Tests included

\- No real SMS/payments/video (all mocked), but logic must be real



---



\## 2) Core principles (non-negotiable)



\- Not a chat app

\- Not a social network

\- Minimal data storage

\- Strict authorization

\- Explicit consent

\- Refunds based on \*\*events\*\*, not “feelings”



---



\## 3) Stack



\### Monorepo (npm workspaces)

/apps

/web → Next.js (App Router, TypeScript)

/api → Express + TypeScript

/packages

/shared → shared types + Zod schemas




\### Infra

\- DB: PostgreSQL via docker-compose

\- ORM: Prisma

\- Validation: Zod everywhere

\- Password hashing: bcrypt

\- Security: helmet, cors allowlist, rate limiting, audit logs



---



\## 4) Auth \& session (exact — do not guess)



\### Authentication

\- Phone required

\- Email optional

\- Password required

\- OTP verification required (mock locally)



\### Session (must use this)

\- Cookie-based sessions using `express-session` + `connect-pg-simple`

\- Cookie settings:

&nbsp; - httpOnly=true

&nbsp; - sameSite=lax

&nbsp; - secure=false (local dev)

&nbsp; - maxAge=7 days



\### CSRF rule (simple + consistent)

\- Use sameSite=lax

\- All state-changing API calls must include an `Authorization` header (value can be a constant like `Bearer dev` in web client) to reduce cross-site form risk.

\- Keep CORS strict (allow only web origin).



---



\## 5) User states \& authorization rules (must)



\### User status

\- PENDING (default)

\- APPROVED

\- REJECTED

\- BANNED



\### Role

\- USER

\- ADMIN



\### Authorization rules

\- All `/admin/\*` routes require role=ADMIN

\- Only users with status=APPROVED can browse/like/match/consent/refund-request

\- BANNED users can only login/logout (everything else blocked)

\- Phone unlock endpoint must verify:

&nbsp; - requester is part of the match

&nbsp; - both consents are YES

&nbsp; - PhoneExchangeEvent exists



---



\## 6) Verification (real-world intent, local mock)



Real meaning: verification is live video call.



MVP implementation:

\- Admin creates verification slots

\- User requests a slot

\- Admin marks verification request as VERIFIED (no video integration)



No:

\- video integration

\- ID uploads

\- recording



---



\## 7) Matching flow (strict)



1\) Browse profiles

2\) Like/Pass

3\) Mutual Like creates a Match

4\) Consent prompt inside match detail

5\) Each user responds YES/NO

6\) If both YES:

&nbsp;  - create PhoneExchangeEvent

&nbsp;  - phone numbers become visible via phone unlock endpoint



\### Definition (non-negotiable)

\*\*Successful Engagement = PhoneExchangeEvent exists\*\* (only this counts)



---



\## 8) Refund policy engine (exact logic)



Plan:

\- YEARLY only

\- amount = 100000

\- Payment is MOCK: admin marks paid (no gateway)



Refund eligibility after 90 days from paidAt ONLY if ALL true:

\- user is APPROVED and VERIFIED

\- user is active: no inactivity > 14 consecutive days

\- likes\_sent >= MIN\_LIKES\_FOR\_REFUND (config)

\- successful\_engagement\_count == 0



No refund if any PhoneExchangeEvent exists.



Activity definition:

\- `lastActiveAt` updates on every authenticated request (middleware)

\- likes\_sent counts only LIKE actions (not PASS)



Refund outcomes:

\- eligible → 80% refund placeholder (mark Payment REFUNDED + record RefundRequest APPROVED)

\- admin decision required approve/deny



---



\## 9) Data exposure rules (critical)



\- /profiles must NEVER include phone numbers or email

\- /matches must NEVER include phone numbers or email

\- Only `GET /phone-unlock/:matchId` can return phone numbers, only after conditions pass

\- Admin endpoints may show phone, but MUST NOT return passwordHash or OTP hashes



---



\## 10) OTP rules (mock)



\- OTP valid 5 minutes

\- Max 5 attempts

\- Store only hash (bcrypt) + expiresAt + attempts

\- Print OTP in API logs ONLY in development mode



---



\## 11) Rate limits (exact)



\- POST /auth/otp/send: 5 per hour per phone + per IP

\- POST /auth/login: 10 per 15 minutes per IP

\- POST /likes: 60 per minute per user



---



\## 12) Prisma data model (must match)



\- User

&nbsp; - id

&nbsp; - phone (unique)

&nbsp; - email? (unique nullable)

&nbsp; - passwordHash

&nbsp; - role (USER/ADMIN)

&nbsp; - status (PENDING/APPROVED/REJECTED/BANNED)

&nbsp; - createdAt

&nbsp; - lastActiveAt

&nbsp; - verifiedAt? (nullable timestamp)



\- Profile

&nbsp; - userId (unique)

&nbsp; - name

&nbsp; - gender

&nbsp; - age

&nbsp; - city

&nbsp; - profession

&nbsp; - bioShort

&nbsp; - preferences (json)



\- OtpCode

&nbsp; - phone

&nbsp; - codeHash

&nbsp; - expiresAt

&nbsp; - attempts

&nbsp; - createdAt



\- Payment

&nbsp; - userId

&nbsp; - plan=YEARLY

&nbsp; - amount=100000

&nbsp; - status=PAID|REFUNDED|MOCK

&nbsp; - paidAt



\- Like

&nbsp; - fromUserId

&nbsp; - toUserId

&nbsp; - type=LIKE|PASS

&nbsp; - createdAt



\- Match

&nbsp; - userAId

&nbsp; - userBId

&nbsp; - createdAt

&nbsp; - unique constraint to avoid duplicates (normalized ordering)



\- Consent

&nbsp; - matchId

&nbsp; - userId

&nbsp; - response=YES|NO

&nbsp; - respondedAt

&nbsp; - unique(matchId,userId)



\- PhoneExchangeEvent

&nbsp; - matchId (unique)

&nbsp; - createdAt



\- Report

&nbsp; - reporterId

&nbsp; - reportedUserId

&nbsp; - reason

&nbsp; - details

&nbsp; - status=OPEN|RESOLVED

&nbsp; - createdAt



\- RefundRequest

&nbsp; - userId

&nbsp; - requestedAt

&nbsp; - status=PENDING|APPROVED|DENIED

&nbsp; - decisionAt?

&nbsp; - reason?

&nbsp; - eligibleAt

&nbsp; - computedEligibilitySnapshot (json)



\- VerificationSlot

&nbsp; - startAt

&nbsp; - endAt

&nbsp; - capacity

&nbsp; - createdBy (admin userId)

&nbsp; - createdAt



\- VerificationRequest

&nbsp; - userId

&nbsp; - slotId

&nbsp; - status=REQUESTED|CONFIRMED|COMPLETED|VERIFIED|REJECTED

&nbsp; - createdAt



\- AuditLog

&nbsp; - actorUserId?

&nbsp; - action

&nbsp; - targetType

&nbsp; - targetId

&nbsp; - metadata (json)

&nbsp; - createdAt



---



\## 13) API endpoints (complete)



\### Auth

\- POST /auth/register

\- POST /auth/login

\- POST /auth/logout

\- POST /auth/otp/send (MOCK: store hash + print OTP to logs)

\- POST /auth/otp/verify

\- GET  /me



\### Profile \& browse

\- PUT /profile

\- GET /profiles (pagination + minimal filters: gender, age range, city)



\### Matching

\- POST /likes (like/pass)

\- GET  /matches

\- POST /consent/respond (YES/NO)

\- GET  /phone-unlock/:matchId



\### Reports \& refunds

\- POST /reports

\- POST /refunds/request

\- GET  /refunds/me



\### Admin

\- GET  /admin/users?status=

\- POST /admin/users/:id/approve

\- POST /admin/users/:id/reject

\- POST /admin/users/:id/ban

\- GET  /admin/reports

\- GET  /admin/refunds

\- POST /admin/refunds/:id/approve (80% refund placeholder)

\- POST /admin/refunds/:id/deny

\- POST /admin/verification-slots (create slots)

\- GET  /admin/verification-requests

\- POST /admin/verification-requests/:id/mark-verified



\### Admin dev tools (required for acceptance)

\- POST /admin/dev/shift-payment-date { userId, daysBack }

&nbsp; - Only in NODE\_ENV=development

&nbsp; - Shifts Payment.paidAt backward for testing 90-day eligibility



---



\## 14) Web UI pages (must exist)



User:

\- Landing (pricing + policy summary)

\- Register / Login

\- OTP Verify

\- Profile Setup/Edit

\- Browse (cards + like/pass)

\- Matches List

\- Match Detail (consent + phone unlock)

\- Report form

\- Refund page (status + eligibility rules)

\- Verification scheduling page (choose slot, request)



Admin (/admin, guarded):

\- Users (approve/reject/ban/mark verified)

\- Refunds (approve/deny)

\- Reports list

\- Slots management

\- Verification requests



---



\## 15) Local developer experience (must)



\- One command from repo root: `npm run dev` runs web + api

\- Provide `.env.example` for web and api

\- `.env.local` files must be gitignored

\- Provide DB scripts:

&nbsp; - migrate

&nbsp; - seed



Seed must create:

\- Admin user:

&nbsp; - email: admin@example.com

&nbsp; - password: Admin@12345

&nbsp; - phone: 9999999999

\- At least 10 users who are APPROVED + VERIFIED with profiles and phones

\- Seed should also create a few mutual likes to quickly test match + consent + phone unlock



---



\## 16) Testing (minimum)



Add API tests (vitest or jest) for:

\- Refund eligibility logic (before 90 days vs after shifting paidAt)

\- Phone unlock authorization (must not return phone unless both consent YES and PhoneExchangeEvent exists)



---



\## 17) Acceptance checklist (must pass)



\- `docker compose up -d` starts Postgres

\- `npm install`

\- `npm run dev` runs both web and api

\- User flow:

&nbsp; - register → mock OTP from API logs → verify → profile → browse → like → mutual match → consent YES/YES → phone unlock shows phone

\- Admin flow:

&nbsp; - approve users, create slots, mark verified

\- Refund flow:

&nbsp; - Not eligible before 90 days

&nbsp; - Eligible after admin dev shift-payment-date tool

\- No endpoint leaks phone numbers without consent + PhoneExchangeEvent



---



\## 18) Codex instruction (use this exactly)



Read SPEC.md and generate the entire monorepo in this folder. Do not ask questions. Implement exactly. Include README, migrations, seed, tests. Ensure `npm install`, `npm run dev`, and `npm run test` work locally with the existing docker-compose Postgres. Do not hardcode secrets; provide .env.example files.



