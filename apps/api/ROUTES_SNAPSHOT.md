# API Routes Snapshot (pre-refactor)

This snapshot captures existing routes and their response shapes prior to refactor. All responses must remain identical after refactor.

## Auth
- `POST /auth/otp/send` → `{ ok: true }` or `{ error: string }`
- `POST /auth/otp/verify` →
  ```json
  {"ok": true, "user": {"id": "...", "phone": "...", "role": "...", "isAdmin": true, "onboardingStep": "...", "videoVerificationStatus": "...", "paymentStatus": "..."}}
  ```
  Errors: `{ error: string }`
- `POST /auth/register` → `{ phone: string, otpRequired: true }` or `{ error: string }`
- `POST /auth/login` → `{ otpRequired: true, phone: string }` or `{ id, phone, status, role, isAdmin, onboardingStep, otpRequired: false }` or `{ error: string }`
- `POST /auth/logout` → `{ ok: true }`
- `GET /me` → `{ id, phone, email, role, isAdmin, status, verifiedAt, phoneVerifiedAt, onboardingStep, videoVerificationStatus, paymentStatus, profileCompletedAt }`
- `GET /dev/whoami` (dev only) →
  ```json
  {"session": {"userId": "..." | null, "otpVerifiedPhone": "..." | null}, "user": {"id": "...", "phone": "...", "role": "..."} | null}
  ```

## Profile & Photos
- `GET /profile` → `{ profile, photos }`
- `PUT /profile` → `{ profile, requiresPhoto: boolean, onboardingStep }` or payment error:
  ```json
  {"error": "Payment required", "currentStep": "...", "requiredStep": "PAID", "redirectTo": "/onboarding/payment"}
  ```
- `POST /profile/complete` → `{ ok: true, onboardingStep }` or `{ error: string }` (payment required / profile missing / photo required)
- `GET /photos/me` → `{ photos }`
- `POST /photos/upload` → `{ photo }` or `{ error: string }`

## Discover & Likes
- `GET /profiles` → `{ profiles: [{ userId, name, gender, age, city, profession, bioShort, preferences, primaryPhotoUrl, photos }] }`
- `POST /likes` → `{ ok: true, matchId: string | null }` or `{ error: string }`
- `GET /likes/incoming` → `{ incoming }`

## Matches & Consent
- `GET /matches` → `{ matches }`
- `POST /consent/respond` → `{ ok: true }` or `{ error: string }`
- `GET /phone-unlock/:matchId` → `{ matchId, users: [{ id, phone }, { id, phone }] }` or `{ error: string }`

## Reports & Refunds
- `POST /reports` → report record
- `POST /refunds/request` → `{ refund, eligibility }` or `{ error: string }`
- `GET /refunds/me` → `{ refunds }`

## Admin
- `POST /admin/users/:id/approve` → `{ id, status }`
- `POST /admin/users/:id/reject` → `{ id, status }`
- `POST /admin/users/:id/ban` → `{ id, status }`
- `GET /admin/users` → `{ users }`
- `GET /admin/dashboard` → `{ totalUsers, activeUsers, pendingVerificationRequests }`
- `POST /admin/users/:id/deactivate` → `{ id, deactivatedAt }`
- `POST /admin/users/:id/delete` → `{ id, deleted: true }` or `{ error: string }`
- `GET /admin/reports` → `{ reports }`
- `GET /admin/refunds` → `{ refunds }`
- `POST /admin/refunds/:id/approve` → `{ refund, refundAmount }`
- `POST /admin/refunds/:id/deny` → `{ refund }`
- `GET /admin/verification-requests` → `{ requests }`
- `POST /admin/verification-requests/:id/start` → `{ request }`
- `POST /admin/verification-requests/:id/approve` → `{ request }`
- `POST /admin/verification-requests/:id/reject` → `{ request }`
- `POST /admin/dev/shift-payment-date` (dev only) → payment record or `{ error: string }`

## Verification Requests
- `POST /verification-requests` → `{ request }`
- `GET /verification-requests/me` → `{ request }`
- `GET /verification/status` → `{ request }`

## Payments
- `GET /payments/me` → `{ payment, paymentStatus }`
- `POST /payments/mock` → `{ error: "Use /payments/mock/start or /payments/mock/confirm." }`
- `POST /payments/mock/start` → `{ ok: true, paymentStatus: "PENDING" }` or `{ error: string }`
- `POST /payments/mock/confirm` → `{ payment, paymentStatus, onboardingStep }` or `{ error: string }`
