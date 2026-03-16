# Premium Private Club — Repository Implementation Map

This document maps the current codebase to the requested product spec and defines a safe, no-duplication execution plan.

## 1) Monorepo structure

- `apps/web`: Next.js App Router frontend (marketing, auth, onboarding, member app, employee/admin console).
- `apps/api`: Express + Prisma backend (auth, verification, payment, onboarding, discover, likes, matches, operations).
- `packages/shared`: shared TypeScript helpers/types used by app packages.

## 2) Route + page coverage (frontend)

### Marketing
- Landing: `apps/web/app/(marketing)/page.tsx`
- Apply/contact/privacy/terms pages exist in `(marketing)` route group.
- PWA install integration exists via:
  - `apps/web/components/pwa/pwa-install-button.tsx`
  - `apps/web/hooks/usePwaInstall.ts`

### Auth
- Sign-up and sign-in flows with phone/OTP/password pages exist under `apps/web/app/(auth)`.
- Auth session context exists in `apps/web/contexts/AuthContext.tsx`.

### Onboarding
- Verification page: `apps/web/app/(app)/onboarding/verification/page.tsx`
- Payment page: `apps/web/app/(app)/onboarding/payment/page.tsx`
- Profile wizard + photos pages exist in onboarding routes.

### Main member app
- Discover / Likes / Matches / Alerts / Profile pages exist under `apps/web/app/(app)/(main)`.
- Route guarding utility exists: `apps/web/lib/navigationGuard.ts`.

### Employee + Admin console
- Employee verification and agent pages exist under `apps/web/app/(console)/verify/page.tsx` and `apps/web/app/(console)/agent/page.tsx`.
- Admin dashboard page exists at `apps/web/app/(console)/admin/page.tsx`.

## 3) API + backend coverage

### Existing modules (high-level)
- Auth/session: `authController`, `authService`, auth middleware, JWT utilities.
- Video verification and employee workflows: `verification*`, `employeeService`.
- Payment/subscription: `payment*`, provider adapters (`mock` + `razorpay`).
- Onboarding/profile/photos: `profile*`, `photo*`, onboarding middleware.
- Discovery/likes/matches: `discover*`, `like*`, `match*`.
- Interaction operations:
  - Offline meet coordination: `offlineMeet*`
  - Online meet coordination: `onlineMeet*`
  - Social exchange: `socialExchange*`
  - Phone exchange support in schema/routes/services.
- Notifications/alerts and admin reporting routes/services exist.

### Data model coverage
Prisma schema already includes models/enums for:
- User lifecycle, onboarding, verification, payments/subscription.
- Likes, matches, consent types, unmatch-related state.
- Offline/online coordination case flows.
- Social exchange and phone exchange temporary/consent states.
- Employee assignment and workload relationships.

## 4) Gaps to close for "exact product" finish

1. **Hardening + consistency pass**
   - Ensure all mandatory transitions are strictly enforced end-to-end (API + UI).
   - Normalize loading/empty/error UX across discover/likes/matches/alerts.
2. **Operations reliability**
   - Tighten timeout/cooldown edge cases for offline/online/social flows.
   - Add idempotency checks and retries where external coordination is involved.
3. **Admin metrics fidelity**
   - Verify each founder KPI is backed by one source-of-truth query.
4. **Test completeness**
   - Expand unit/integration coverage for auth middleware, verification, payment gating, and case-flow transitions.

## 5) Recommended phased execution (no-duplication)

### Phase A — Foundations
- Stabilize auth + onboarding guards + transition safety.
- Add defensive middleware logic and contract tests.

### Phase B — Member core polish
- Discover/likes/matches: data state consistency and UX fallback quality.
- Ensure mutual-like and unmatch lifecycle is robust.

### Phase C — Concierge operations
- Complete offline/online/social/phone flow edge-cases with strict deadlines/cooldowns.
- Improve worker action audit and status progression integrity.

### Phase D — Founder/admin readiness
- Validate dashboard KPIs and employee workload balancing logic.
- Add operational queue visibility and exception metrics.

### Phase E — Release hardening
- End-to-end checks, migration verification, and deployment runbook.

## 6) File targeting strategy for next implementation passes

- **Edit-first policy:** prefer existing controllers/services/pages; do not create parallel route trees.
- Backend focus files likely to evolve:
  - `apps/api/src/services/*Service.ts`
  - `apps/api/src/controllers/*Controller.ts`
  - `apps/api/src/middlewares/*.ts`
- Frontend focus files likely to evolve:
  - `apps/web/app/(app)/**/page.tsx`
  - `apps/web/lib/*.ts`
  - `apps/web/contexts/AuthContext.tsx`

This plan intentionally extends the current architecture and avoids creating duplicate "v2" implementations.
