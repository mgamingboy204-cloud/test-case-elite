# DEV NOTES — Mobile-Native Onboarding

## OTP redirect hook location
- OTP verification success paths use `getDefaultRoute(user)` after `/auth/otp/verify` and `/me` refresh in:
  - `apps/web/app/app/signup/verify/page.tsx`
  - `apps/web/app/(auth)/otp/page.tsx`
  - `apps/web/app/(auth)/signup/page.tsx`
  - `apps/web/app/(auth)/login/page.tsx`
- `apps/web/lib/onboarding.ts` now maps `PHONE_VERIFIED` to `/onboarding/start`, guaranteeing onboarding start after successful OTP for users at that step.

## Viewport + scroll locking approach
- Global viewport uses `viewportFit=cover`, `maximumScale=1`, `userScalable=false` in `apps/web/app/layout.tsx`.
- Added mobile interaction script to reduce accidental double-tap zoom behavior.
- Global shell lock in `apps/web/app/globals.css`:
  - `body` overflow hidden + overscroll lock.
  - `.site-main`, `.onboarding-shell`, `.onboarding-screen` fixed to `100dvh`/`100vh` with overflow hidden.
  - Scroll allowed only in `.onboarding-scroll-area` with `overscroll-behavior: contain` and `-webkit-overflow-scrolling: touch`.
- `apps/web/app/(onboarding)/layout.tsx` applies no-body-scroll class during onboarding lifecycle.

## ONBOARDING FIELD MAP
Derived from:
- Prisma schema (`User`, `Profile`, onboarding enums)
- Shared `ProfileSchema` validation
- Profile service completion requirements (`/profile`, `/profile/complete`, photo requirement)
- Existing onboarding route contract (`onboardingStep` routing)

```json
[
  {
    "stepId": "welcome",
    "uiLabel": "House Rules Agreement",
    "backendFieldName": "houseRulesAcceptedAt",
    "dataType": "boolean",
    "required": true,
    "validationRules": ["Must explicitly agree to continue"],
    "updateEndpoint": "client-only",
    "supportedByBackend": false,
    "submitMode": "batch"
  },
  {
    "stepId": "photo",
    "uiLabel": "Profile Photo",
    "backendFieldName": "photo.url",
    "dataType": "image",
    "required": true,
    "validationRules": ["Upload image via /photos/upload", "At least one photo required for /profile/complete"],
    "updateEndpoint": "POST /photos/upload",
    "supportedByBackend": true,
    "submitMode": "per-step"
  },
  {
    "stepId": "displayName",
    "uiLabel": "Display Name",
    "backendFieldName": "displayName (maps to profile.name)",
    "dataType": "string",
    "required": true,
    "validationRules": ["min length 1", "ProfileSchema requires displayName or name"],
    "updateEndpoint": "PUT /profile",
    "supportedByBackend": true,
    "submitMode": "batch"
  },
  {
    "stepId": "gender",
    "uiLabel": "Gender",
    "backendFieldName": "gender",
    "dataType": "enum",
    "required": true,
    "validationRules": ["MALE | FEMALE | NON_BINARY | OTHER"],
    "updateEndpoint": "PUT /profile",
    "supportedByBackend": true,
    "submitMode": "batch"
  },
  {
    "stepId": "age",
    "uiLabel": "Age",
    "backendFieldName": "age",
    "dataType": "number",
    "required": true,
    "validationRules": ["int", "minimum 18"],
    "updateEndpoint": "PUT /profile",
    "supportedByBackend": true,
    "submitMode": "batch"
  },
  {
    "stepId": "city",
    "uiLabel": "City",
    "backendFieldName": "city",
    "dataType": "string",
    "required": true,
    "validationRules": ["min length 1"],
    "updateEndpoint": "PUT /profile",
    "supportedByBackend": true,
    "submitMode": "batch"
  },
  {
    "stepId": "profession",
    "uiLabel": "Profession",
    "backendFieldName": "profession",
    "dataType": "string",
    "required": true,
    "validationRules": ["min length 1"],
    "updateEndpoint": "PUT /profile",
    "supportedByBackend": true,
    "submitMode": "batch"
  },
  {
    "stepId": "bioShort",
    "uiLabel": "Short Bio",
    "backendFieldName": "bioShort",
    "dataType": "string",
    "required": true,
    "validationRules": ["min length 1 (schema)", "UI floor >= 10 chars"],
    "updateEndpoint": "PUT /profile",
    "supportedByBackend": true,
    "submitMode": "batch"
  },
  {
    "stepId": "intent",
    "uiLabel": "Intent",
    "backendFieldName": "intent",
    "dataType": "enum",
    "required": false,
    "validationRules": ["dating | friends | all", "default dating"],
    "updateEndpoint": "PUT /profile",
    "supportedByBackend": true,
    "submitMode": "batch"
  }
]
```

## Submission strategy
- Backend `/profile` uses `PUT` with `ProfileSchema` requiring a full valid payload (partial per-step update is not supported by contract).
- Therefore onboarding uses local `profileDraft` (`localStorage`) through steps and submits once at final step.
- Photo remains uploaded per-step via existing `/photos/upload` endpoint.

## Reused vs newly created
- Reused:
  - Existing API endpoints (`/auth/otp/verify`, `/profile`, `/profile/complete`, `/photos/upload`)
  - Existing onboarding route guard and step concept (`onboardingStep`).
- Newly created:
  - Config-driven onboarding field source: `apps/web/lib/onboardingFlow.ts`
  - Start screen route: `/onboarding/start`
  - Mobile-shell CSS rules and onboarding fixed-CTA screen structure.
