# Funnel Spec (Mobile PWA Canonical Flow)

## Canonical route map

1. **Get Started** → `/get-started`
2. **Create Account** → `/auth/signup`
3. **Phone entry** → `/auth/phone`
4. **OTP verify** → `/auth/otp`
5. **Video verification** → `/verification/video`
6. **Payment** → `/payment`
7. **Profile onboarding** → `/onboarding`
8. **Main app** → `/app` (entry), then app surfaces like discover/matches

## Backend gates used at each stage (existing fields only)

- **Phone verified gate**: `phoneVerifiedAt` and derived `onboardingStep` from backend auth resolution.
- **Video gate**: `videoVerificationStatus` (`APPROVED` required for payment) and `onboardingStep` (`VIDEO_VERIFIED`, `VIDEO_VERIFICATION_PENDING`).
- **Payment gate**: `paymentStatus` (`PAID` required for profile completion), `onboardingStep` (`PAYMENT_PENDING`, `PAID`).
- **Profile completion gate**: `profileCompletedAt` and `onboardingStep` (`PROFILE_PENDING`, `ACTIVE`).

## Endpoint contracts by stage

### OTP success
- `POST /auth/otp/send` (payload `{ phone }`)
- `POST /auth/otp/verify` (payload `{ phone, code, rememberMe }`)
- `GET /me` (via session refresh after verify)

**Saved data:** access token client-side + backend updates `phoneVerifiedAt`, `verifiedAt`, `onboardingStep`.

### Video verification
- `POST /verification-requests` (create request)
- `GET /me/verification-status` (poll status)
- Optional existing status endpoint: `GET /verification/status`

**Saved data:** backend updates `videoVerificationStatus` and `onboardingStep`.

### Payment
- `POST /payments/coupon/validate`
- `POST /payments/mock/start`
- `POST /payments/mock/confirm`
- Optional read: `GET /payments/me`

**Saved data:** backend updates `paymentStatus`, payment records, and `onboardingStep`.

### Profile onboarding
- `POST /photos/upload` (photo step)
- `PUT /profile` (batch profile fields)
- `POST /profile/complete`

**Saved data:** profile fields, `profileCompletedAt`, and `onboardingStep` transition to `ACTIVE`.

## Redirect and guard rules

Centralized frontend funnel guard should enforce:
- If unauthenticated, send to `/get-started`.
- If not phone verified / at earliest onboarding state, force OTP/phone flow.
- If video not approved, force `/verification/video`.
- If payment not paid, force `/payment`.
- If profile not complete, force `/onboarding`.
- If complete (`ACTIVE`/`profileCompletedAt`), allow app routes and keep onboarding/payment/video routes inaccessible (redirect to `/app`).

## Legacy / duplicate route inventory and handling

Legacy/duplicate routes found:
- `app/app/*` namespace duplicates many root routes (`/app/get-started`, `/app/signup/phone`, `/app/signup/verify`, `/app/onboarding/*`, `/app/discover`, etc.).
- Legacy aliases: `/verification`, `/payment`, `/browse`, `/auth` and old auth routes (`/login`, `/signup`, `/otp`).

Handling policy:
- Keep canonical paths above.
- Redirect legacy routes to canonical equivalents where historical/bookmarked references are likely.
- Remove duplicate navigations in new pushes/links by routing via centralized route constants.
