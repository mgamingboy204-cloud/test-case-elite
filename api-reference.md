# API Reference

## Project Backend Summary
- Express API mounts all route modules at root (no `/api` prefix), so paths in this document are final mounted paths.
- Auth uses JWT Bearer access tokens (`Authorization: Bearer <token>`) plus refresh token cookie/body flow.
- Most product features require both `requireAuth` and `requireActive` (user onboarding step must be `ACTIVE`).
- Core frontend domains present: auth, profile, photos, discover, likes, matches/consent, verification, notifications, payments, refunds, reports, admin.
- Matching is mutual-like based; consent flow can unlock phone numbers only after both users respond `YES`.
- Verification is admin-driven (request → in-progress with meet URL/link → approved/rejected), and this updates user onboarding state.
- Storage supports local file uploads (`/uploads/...`) and Supabase Storage public URLs.
- No websocket/socket.io/SSE implementation found in `apps/api/src`; notifications are fetched via REST.

## 1. Route Groups

### auth
- POST /auth/otp/send — send OTP to phone for sign-in/signup verification flow. (public)
- POST /auth/otp/verify — verify OTP and return access token + user payload. (public)
- POST /auth/register — create pending user registration and require OTP verification. (public)
- POST /auth/signup/start — begin signup OTP flow. (public)
- POST /auth/signup/verify — verify signup OTP and issue short-lived signup token. (public)
- POST /auth/signup/complete — finalize signup with signup token + password; returns access token. (public)
- POST /auth/login — password login; may trigger OTP requirement depending on account state. (public)
- POST /auth/token/refresh — rotate/refresh access token using refresh token (cookie or request body). (public)
- POST /auth/logout — clear refresh cookie/session token state. (public)
- GET /debug/cookies — development-only cookie debug endpoint. (public, non-production only)

### users
- GET /me — current authenticated user profile summary. (auth required)
- GET /dev/whoami — development-only session/auth debug info. (public, development only)

### profile
- GET /profile — fetch current user profile + photos + user state. (auth required)
- PUT /profile — upsert/update profile fields. (auth required)
- POST /profile/complete — mark profile completion and advance onboarding if eligible. (auth required)

### photos
- GET /photos/me — list current user photos. (auth required)
- POST /photos/upload — upload profile photo via `dataUrl`; replaces prior photo set. (auth required)

### discover
- GET /profiles — paginated profile discovery list with optional city filter. (auth required, active user required)
- GET /discover — cursor-based discovery feed (`city`, `intent`, `cursor`, `limit`). (auth required, active user required)
- GET /discover/feed — alias of `/discover` feed behavior. (auth required, active user required)
- GET /profiles/:userId — detailed profile view for a target user. (auth required, active user required)

### likes
- POST /likes — create LIKE/PASS action with idempotent `actionId`; can create match if reciprocal like exists. (auth required, active user required)
- GET /likes/incoming — list users who liked current user (excluding already matched users). (auth required, active user required)
- GET /likes/outgoing — list users current user has liked. (auth required, active user required)

### matches-consent
- GET /matches — list match cards with consent and phone-exchange status. (auth required, active user required)
- POST /consent/respond — submit consent YES/NO for match phone exchange. (auth required, active user required)
- GET /phone-unlock/:matchId — return both users’ phones once consent is complete. (auth required, active user required)

### verification
- POST /verification-requests — create (or reuse active) verification request. (auth required)
- GET /verification-requests/me — get latest verification request object. (auth required)
- GET /verification/status — get verification request with expired-link guard behavior. (auth required)
- GET /me/verification-status — lightweight current user verification status + meet URL when valid. (auth required)

### notifications
- GET /notifications — list notifications and unread count. (auth required)

### payments
- GET /payments/me — current user latest paid payment + onboarding payment status. (auth required)
- POST /payments/coupon/validate — validate coupon code format and return mock discount response. (auth required)
- POST /payments/mock — unsupported placeholder; points clients to mock start/confirm endpoints. (auth required)
- POST /payments/mock/start — begin mock payment state (`PENDING`). (auth required)
- POST /payments/mock/confirm — confirm mock payment (`PAID`) and update onboarding/payment states. (auth required)

### refunds
- POST /refunds/request — create refund request with computed eligibility snapshot. (auth required, active user required)
- GET /refunds/me — list current user refund requests. (auth required, active user required)

### reports
- POST /reports — submit report against another user. (auth required, active user required)

### admin
- POST /admin/users/:id/approve — approve user account. (auth required, admin required)
- POST /admin/users/:id/reject — reject user account. (auth required, admin required)
- POST /admin/users/:id/ban — ban user account. (auth required, admin required)
- GET /admin/users — list users (optional status filter). (auth required, admin required)
- GET /admin/dashboard — admin dashboard counts. (auth required, admin required)
- POST /admin/users/:id/deactivate — soft-deactivate user account. (auth required, admin required)
- POST /admin/users/:id/delete — hard-delete user and related graph data. (auth required, admin required)
- GET /admin/reports — list submitted reports. (auth required, admin required)
- GET /admin/refunds — list refund requests. (auth required, admin required)
- POST /admin/refunds/:id/approve — approve refund and mark payments refunded. (auth required, admin required)
- POST /admin/refunds/:id/deny — deny refund request. (auth required, admin required)
- GET /admin/verification-requests — list verification requests (optional status filter). (auth required, admin required)
- POST /admin/verification-requests/:id/start — move verification request to in-progress with meet link. (auth required, admin required)
- POST /admin/verification-requests/:id/approve — complete/approve verification request. (auth required, admin required)
- POST /admin/verification-requests/:id/reject — reject verification request with reason. (auth required, admin required)
- POST /admin/verifications/:userId/meet-link — set/update meet link by user. (auth required, admin required)
- POST /admin/verifications/:userId/approve — approve verification by user. (auth required, admin required)
- POST /admin/verifications/:userId/reject — reject verification by user with reason. (auth required, admin required)
- POST /admin/dev/shift-payment-date — development/testing helper to move payment date back. (auth required, admin required; non-production only)

### health
- GET / — basic API liveness `{ ok: true }`. (public)
- GET /health — health endpoint handler. (public)
- GET /_version — deployment/version marker metadata. (public)
- GET /_debug/auth — auth middleware check endpoint. (auth required)

## 2. Controllers / Handler Mapping

### auth
- POST /auth/otp/send → authController.sendOtp
- POST /auth/otp/verify → authController.verifyOtp
- POST /auth/register → authController.register
- POST /auth/signup/start → authController.signupStart
- POST /auth/signup/verify → authController.signupVerify
- POST /auth/signup/complete → authController.signupComplete
- POST /auth/login → authController.login
- POST /auth/token/refresh → authController.refreshAccessToken
- POST /auth/logout → authController.logout
- GET /debug/cookies → authController.debugCookies

### users
- GET /me → authController.whoAmI
- GET /dev/whoami → authController.devWhoAmI

### profile
- GET /profile → profileController.getProfileHandler
- PUT /profile → profileController.updateProfileHandler
- POST /profile/complete → profileController.completeProfileHandler

### photos
- GET /photos/me → photoController.listPhotosHandler
- POST /photos/upload → photoController.uploadPhotoHandler

### discover
- GET /profiles → discoverController.discoverProfiles
- GET /discover → discoverController.discoverFeed
- GET /discover/feed → discoverController.discoverFeed
- GET /profiles/:userId → discoverController.discoverProfileDetail

### likes
- POST /likes → likeController.createLikeHandler
- GET /likes/incoming → likeController.incomingLikesHandler
- GET /likes/outgoing → likeController.outgoingLikesHandler

### matches-consent
- GET /matches → matchController.listMatchesHandler
- POST /consent/respond → matchController.respondConsentHandler
- GET /phone-unlock/:matchId → matchController.phoneUnlockHandler

### verification
- POST /verification-requests → verificationController.createVerificationRequestHandler
- GET /verification-requests/me → verificationController.getMyVerificationRequestHandler
- GET /verification/status → verificationController.getVerificationStatusHandler
- GET /me/verification-status → verificationController.getMyVerificationStatusHandler

### notifications
- GET /notifications → notificationController.listNotificationsHandler

### payments
- GET /payments/me → paymentController.getMyPaymentHandler
- POST /payments/coupon/validate → paymentController.validateCouponHandler
- POST /payments/mock → paymentController.mockPaymentUnsupported
- POST /payments/mock/start → paymentController.startMockPaymentHandler
- POST /payments/mock/confirm → paymentController.confirmMockPaymentHandler

### refunds
- POST /refunds/request → refundController.requestRefundHandler
- GET /refunds/me → refundController.listRefundsHandler

### reports
- POST /reports → reportController.createReportHandler

### admin
- POST /admin/users/:id/approve → adminController.approveUserHandler
- POST /admin/users/:id/reject → adminController.rejectUserHandler
- POST /admin/users/:id/ban → adminController.banUserHandler
- GET /admin/users → adminController.listUsersHandler
- GET /admin/dashboard → adminController.dashboardHandler
- POST /admin/users/:id/deactivate → adminController.deactivateUserHandler
- POST /admin/users/:id/delete → adminController.deleteUserHandler
- GET /admin/reports → adminController.listReportsHandler
- GET /admin/refunds → adminController.listRefundsHandler
- POST /admin/refunds/:id/approve → adminController.approveRefundHandler
- POST /admin/refunds/:id/deny → adminController.denyRefundHandler
- GET /admin/verification-requests → adminController.listVerificationRequestsHandler
- POST /admin/verification-requests/:id/start → adminController.startVerificationRequestHandler
- POST /admin/verification-requests/:id/approve → adminController.approveVerificationRequestHandler
- POST /admin/verification-requests/:id/reject → adminController.rejectVerificationRequestHandler
- POST /admin/verifications/:userId/meet-link → adminController.setVerificationMeetLinkHandler
- POST /admin/verifications/:userId/approve → adminController.approveVerificationForUserHandler
- POST /admin/verifications/:userId/reject → adminController.rejectVerificationForUserHandler
- POST /admin/dev/shift-payment-date → adminController.shiftPaymentDateHandler

### health
- GET /health → healthController.healthHandler

## 3. Important Models

### User
Key fields:
- id
- phone
- email
- firstName
- lastName
- displayName
- gender
- role / isAdmin
- status (`PENDING | APPROVED | REJECTED | BANNED`)
- onboardingStep (`PHONE_VERIFIED` → ... → `ACTIVE`)
- videoVerificationStatus
- paymentStatus
- verifiedAt
- profileCompletedAt
- deactivatedAt / deletedAt

Purpose:
Primary identity, authorization, onboarding gating, and account-state driver for conditional frontend navigation.

### Profile
Key fields:
- userId
- name
- gender
- age
- city
- profession
- bioShort
- intent

Purpose:
Main discovery/member-card payload and editable profile form source.

### Photo
Key fields:
- id
- userId
- url
- createdAt

Purpose:
Profile media rendering in cards, profile pages, and notifications.

### Like
Key fields:
- actionId
- actorUserId
- targetUserId
- action (`LIKE` or `PASS`)
- createdAt

Purpose:
Feeds swipe/decision state, incoming/outgoing lists, and match creation trigger.

### Match
Key fields:
- id
- userAId
- userBId
- createdAt

Purpose:
Backs matches list and consent/phone unlock workflow.

### Consent
Key fields:
- matchId
- userId
- response (`YES` or `NO`)
- respondedAt

Purpose:
Drives “phone exchange ready” state in match UI.

### PhoneExchangeEvent
Key fields:
- matchId
- createdAt

Purpose:
Binary signal that both users consented and phone unlock is available.

### VerificationRequest
Key fields:
- id
- userId
- status (`REQUESTED | IN_PROGRESS | COMPLETED | REJECTED`)
- meetUrl / verificationLink
- linkExpiresAt
- reason
- createdAt / updatedAt / completedAt

Purpose:
Supports verification request timeline and “join verification call” screens.

### Payment
Key fields:
- id
- userId
- plan
- amount
- status (`PAID | REFUNDED | MOCK`)
- paidAt

Purpose:
Supports payment status UX and refund eligibility logic.

### RefundRequest
Key fields:
- id
- userId
- status (`PENDING | APPROVED | DENIED`)
- requestedAt / decisionAt
- reason
- eligibleAt
- computedEligibilitySnapshot (JSON)

Purpose:
Supports refund request submission/history and admin review.

### Report
Key fields:
- reporterId
- reportedUserId
- reason
- details
- status
- createdAt

Purpose:
Safety/moderation reporting surfaces for users and admin tools.

### Notification
Key fields:
- id
- type (`NEW_LIKE | NEW_MATCH | VIDEO_VERIFICATION_UPDATE`)
- userId
- actorUserId
- matchId
- metadata
- createdAt
- isRead

Purpose:
Drives notification center feed and unread badge counts.

## 4. Relationships That Matter to Frontend
- User has one Profile.
- User has many Photos.
- Like connects actor user → target user.
- Mutual LIKE can create one Match between two users.
- Match has many Consent records (one per participant) and optional PhoneExchangeEvent.
- User has many Notifications; some reference actor user and/or match.
- User has many VerificationRequests over time.
- User has many Payments and RefundRequests.
- Report connects reporter user → reported user.

## 5. Special Systems
- authentication
  - where: `/auth/*` routes + `requireAuth` middleware + JWT utils.
  - frontend needs: login/signup/OTP screens, token refresh logic, protected route guards.

- refresh tokens
  - where: `/auth/token/refresh`, refresh cookie `em_refresh`, JWT refresh token signing/verify.
  - frontend needs: silent refresh interceptor and logout handling when refresh fails.

- role-based access
  - where: `requireAdmin` middleware, `/admin/*` routes.
  - frontend needs: admin-only navigation and permission-gated actions.

- admin moderation
  - where: `/admin/users/*`, `/admin/reports`, `/admin/refunds`.
  - frontend needs: user moderation dashboard, report queue, refund decisions.

- profile approval
  - where: user `status` (`APPROVED/REJECTED/BANNED`) and admin approve/reject/ban endpoints.
  - frontend needs: status badges, blocked-state UX, admin status controls.

- photo review
  - Not found.

- verification
  - where: `/verification-requests*`, `/verification/status`, admin verification endpoints, `videoVerificationStatus` fields.
  - frontend needs: request/start verification flow, verification status screen, join-call CTA, admin review screens.

- premium / subscription tiers
  - where: payment/refund endpoints with single plan (`YEARLY`) and coupon mock validation.
  - frontend needs: payment step UI, coupon input, payment status view, refund request flow.

- reporting system
  - where: `POST /reports` and admin `GET /admin/reports`.
  - frontend needs: report modal/form + admin report management list.

- blocking system
  - Not found.

- notifications
  - where: `GET /notifications` and notification writes in like/admin verification services.
  - frontend needs: notifications list, unread badge, deep links to match/profile/verification.

- search / filters
  - where: discovery query params (`city`, `intent`, pagination/cursor options).
  - frontend needs: city/intent filters and paginated or cursor feed UI.

- recommendation / discover feed
  - where: `GET /discover`, `GET /discover/feed`, discover service filtering by activity/matches/intent.
  - frontend needs: discover feed/card stack and profile detail transitions.

- matches / likes / pass flow
  - where: `POST /likes` + `/likes/incoming` + `/likes/outgoing` + `/matches` + consent endpoints.
  - frontend needs: swipe/like/pass actions, incoming likes tab, matches tab, consent prompt, phone unlock screen.

## 6. Storage
- provider
  - local filesystem (`STORAGE_PROVIDER=local`) and Supabase Storage (`STORAGE_PROVIDER=supabase`).

- what is stored there
  - profile photos only (bucket `profile-photos` for Supabase, `uploads/profiles/...` locally).

- where uploads are handled
  - `POST /photos/upload` → `photoController.uploadPhotoHandler` → `photoService.uploadPhoto`.

- signed URL / public URL behavior
  - Supabase flow uses `getPublicUrl` (public URL, not signed URL).
  - Local flow exposes static files via `app.use("/uploads", express.static(...))`.

## 7. Realtime
- technology
  - none found (no websocket/socket.io/SSE server setup in `apps/api/src`).

- related features
  - notifications and match updates are REST-polled/fetched endpoints.

- relevant events/channels
  - none.

## 8. Auth Surface for Frontend
- login endpoint
  - `POST /auth/login`.
- register endpoint
  - `POST /auth/register` (plus signup triplet: `/auth/signup/start`, `/auth/signup/verify`, `/auth/signup/complete`).
- refresh endpoint
  - `POST /auth/token/refresh`.
- logout endpoint
  - `POST /auth/logout`.
- current-user endpoint
  - `GET /me`.
- token type if obvious
  - JWT access token in Bearer header; JWT refresh token in cookie `em_refresh` (or request body fallback).
- where auth middleware is applied
  - `requireAuth` on `/me`, profile/photo/discover/likes/matches/verification/notifications/payments/refunds/reports/admin routes, and `/_debug/auth`.

## 9. Frontend Screen Mapping
- Auth (Login / OTP / Signup)
  - uses: POST /auth/login, POST /auth/otp/send, POST /auth/otp/verify, POST /auth/signup/start, POST /auth/signup/verify, POST /auth/signup/complete, POST /auth/register

- Session Management
  - uses: POST /auth/token/refresh, POST /auth/logout, GET /me

- Onboarding: Verification Request
  - uses: POST /verification-requests, GET /verification/status, GET /me/verification-status

- Onboarding: Payment
  - uses: POST /payments/coupon/validate, POST /payments/mock/start, POST /payments/mock/confirm, GET /payments/me

- Onboarding/Profile Completion
  - uses: GET /profile, PUT /profile, POST /profile/complete, POST /photos/upload, GET /photos/me

- Discover Feed
  - uses: GET /discover (or GET /discover/feed), GET /profiles/:userId, POST /likes

- Likes Inbox / Sent Likes
  - uses: GET /likes/incoming, GET /likes/outgoing

- Matches
  - uses: GET /matches, POST /consent/respond, GET /phone-unlock/:matchId

- Notifications Center
  - uses: GET /notifications

- Report User
  - uses: POST /reports

- Refunds
  - uses: POST /refunds/request, GET /refunds/me

- Admin Dashboard & Operations
  - uses: GET /admin/dashboard, GET /admin/users, POST /admin/users/:id/approve, POST /admin/users/:id/reject, POST /admin/users/:id/ban, POST /admin/users/:id/deactivate, POST /admin/users/:id/delete, GET /admin/reports, GET /admin/refunds, POST /admin/refunds/:id/approve, POST /admin/refunds/:id/deny, GET /admin/verification-requests, POST /admin/verification-requests/:id/start, POST /admin/verification-requests/:id/approve, POST /admin/verification-requests/:id/reject, POST /admin/verifications/:userId/meet-link, POST /admin/verifications/:userId/approve, POST /admin/verifications/:userId/reject

## 10. Gaps / Warnings
- Duplicate discovery endpoints exist (`GET /discover` and `GET /discover/feed`) mapped to the same handler; frontend should standardize on one path to reduce integration drift.
- Route file includes `GET /profiles` and `GET /profiles/:userId` in same group; valid, but frontend route naming can be confusing against profile self endpoints (`/profile`).
- `POST /payments/mock` intentionally returns 404 with guidance string (not a functional action endpoint).
- Admin endpoints use both request-centric (`/admin/verification-requests/:id/*`) and user-centric (`/admin/verifications/:userId/*`) patterns for similar actions; frontend/admin tooling should choose one canonical flow. Needs verification.
- No explicit endpoint to mark notifications as read/unread was found; UI can display but cannot persist read-state changes via current public routes.
- No blocking/muting system routes were found; if product requires block user behavior, backend support appears missing.
