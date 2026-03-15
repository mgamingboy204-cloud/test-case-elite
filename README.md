# VAEL

## JWT authentication

User authentication now relies on short-lived access tokens (JWT) sent via the `Authorization: Bearer <token>` header, with refresh tokens stored in an HTTP-only cookie to keep sessions resilient across mobile browsers. OTP verification and password login still work as before, but they now return an `accessToken` (also mirrored in the existing `token` field for compatibility). The frontend stores the access token locally and refreshes it by calling `POST /auth/token/refresh` when it receives a 401 response. The refresh endpoint issues a new access token and rotates the refresh cookie. Logout calls `POST /auth/logout` to clear the refresh cookie and session data.

**Required API env vars**
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `ACCESS_TOKEN_TTL_MINUTES` (default: 60)
- `ACCESS_TOKEN_TTL_MINUTES_SHORT` (default: 30)
- `REFRESH_TOKEN_TTL_DAYS` (default: 30)
- `REFRESH_TOKEN_TTL_DAYS_SHORT` (default: 7)
- `STORAGE_PROVIDER` (local | supabase)
- `SUPABASE_URL` (required when using supabase storage)
- `SUPABASE_SERVICE_ROLE_KEY` (required when using supabase storage)

## Developer notes

- Profile photos are limited to **5MB** and support **JPEG, PNG, or WebP** only. Uploads overwrite the existing profile photo. 【F:apps/api/src/services/photoService.ts†L7-L147】
- `STORAGE_PROVIDER` controls where profile photos are stored (`local` for development, `supabase` recommended for production). 【F:apps/api/src/config/env.ts†L8-L67】
- Remember-me sessions change token lifetimes: 60-minute access + 30-day refresh when enabled, 30-minute access + 7-day refresh otherwise. 【F:apps/api/src/utils/jwt.ts†L9-L34】



## PWA verification (apps/web)

**Chrome DevTools checks**
- Run the web app in Chrome and open DevTools → **Application** → **Manifest** to verify the manifest loads and icons render.
- In DevTools → **Application** → **Service Workers**, confirm the service worker is active and the app can be installed.

**Clear service worker cache during debugging**
- DevTools → **Application** → **Service Workers** → **Unregister**.
- DevTools → **Application** → **Storage** → **Clear site data** to remove caches and storage entries.

**Known iOS limitations**
- iOS PWAs do not support all Web Push features and may pause background sync.
- Home screen PWAs can be evicted under storage pressure; users may need to re-open to restore caches.

**Branding note**
- Placeholder PWA icons live in `apps/web/public/icons` and should be replaced with final brand assets before launch.

## Codex execution protocol for large feature requests

When handing a broad product spec to Codex (or any code-generation assistant), provide **repo execution constraints first** so implementation stays aligned with the existing architecture and avoids duplicate pages/components.

### Why this matters

Product specs explain *what to build*, but they rarely define *how to extend the current repo safely*. Without execution constraints, assistants often:
- create duplicate routes or parallel folder structures,
- introduce mock APIs where real contracts already exist,
- rebuild completed UI instead of wiring unfinished logic,
- diverge from current auth/data-fetching patterns.

### Recommended two-part prompt sequence

1. **Execution prompt (repo discipline first)**
2. **Business/product spec (feature intent second)**

Use this execution prompt before sharing any large PRD/spec:

```md
You are working inside an existing production-style repo.
Your job is to analyze the current repository first, then finish the missing parts by extending the existing codebase, not by rebuilding or duplicating it.

Mandatory rules:
1. Do a full repo scan first.
2. Identify app structure, routing, shared UI, layouts, auth flow, API layer, backend schema, unfinished pages, and dead/duplicate files.
3. Before writing code, produce an implementation map:
   - what already exists
   - what is broken
   - what is incomplete
   - exact files to edit
   - truly necessary new files
4. Reuse existing folders/components/hooks/services/naming/architecture.
5. Do not create duplicate pages, APIs, schemas, or parallel structures.
6. Do not redesign completed pages unless required for integration or bug fixes.
7. Preserve existing visual style/layout system.
8. Extend existing frontend/backend contracts instead of replacing them.
9. Prefer editing existing files over creating new ones.
10. If a new file is required, place it in the most natural existing location.
11. Remove/avoid mock logic where real logic already exists.
12. Keep type safety, route guards, loading/empty/error states intact.
13. Integrate unfinished features into current app structure (no side builds).
14. After implementation, report:
    - files changed
    - files created
    - why each change was necessary
    - assumptions
    - blockers

Key objective:
Complete missing product flows using the current repo as source of truth.
Do not rebuild from scratch.
Do not duplicate existing features.
```

### Suggested phased delivery

To reduce hallucination and integration risk, enforce staged execution:

1. **Stage 1 — Discovery & map**
   - Scan repo, map existing features/routes, identify missing flows and duplication risks.
2. **Stage 2 — Foundation**
   - Stabilize auth, onboarding guards, shared API contracts, route protection, data-fetch patterns, and shared types.
3. **Stage 3 — Feature groups**
   - Implement in sequence (e.g., verification → payment → onboarding → discover → likes → matches → employee panel → admin panel).

### Additional constraints that prevent repo drift

- Treat current UI as locked unless integration requires small edits.
- Never create `v2`, `new`, `fixed`, `final`, or `updated` duplicate folders.
- Search for equivalent components/services before adding anything.
- Follow existing TypeScript types and import paths.
- Keep current auth strategy unless an explicit blocker requires change.
- If a feature is not clearly mappable, implement the smallest possible version that fits existing architecture.

## Can Codex finish this full app spec without duplication?

Yes—**but only if you force staged execution** instead of asking for “build everything” in one pass.

For a spec as large as this one, the safest approach is:

1. Ask Codex to do repo discovery and produce a file-by-file implementation map.
2. Approve that map.
3. Execute in bounded phases (auth/verification, payment/onboarding, discovery/likes/matches, employee/admin).
4. Require each phase to include tests, route checks, and a duplication audit.

If you give one giant prompt, most assistants (including strong ones) can still drift into duplicate routes/components or partially mismatched backend contracts.

### Copy/paste control prompt (use before your product spec)

```md
You are working in an existing monorepo. Do NOT rebuild. Extend only what exists.

Hard constraints:
- Scan the full repo first and list exact existing routes/pages/services/db models.
- Output a “no-duplication plan” before coding:
  - files to edit
  - new files (only if required)
  - duplicate-risk checks
- Reuse existing layouts/components/hooks/api clients.
- Do not create parallel folders, alternate route trees, or replacement auth/payment systems.
- Preserve current UI style and page structure unless integration requires minimal edits.
- After each phase, run tests and print a changed-files summary.

Delivery order:
1) Discovery report + architecture map
2) Verification + payment flow wiring
3) Onboarding guards + discover/likes/matches integration
4) Employee console flows
5) Admin dashboard metrics + operational queues

At the end of each phase, include:
- What was reused
- What was newly created and why
- Any blockers/assumptions
- Commands run + results
```

### Practical recommendation

Treat your long business spec as the **vision document**, and combine it with this **execution-control prompt** for each phase. That is the best way to get Codex to scan your current codebase, keep your existing UI/layouts, and avoid duplicate implementations.

## Ready-to-use prompt for your "Premium Private Club" repo

If you want Codex to actually complete this project from your existing pieces **without duplicating UI/routes**, use this exact sequence.

### Step A: Give this control prompt first

```md
You are implementing features in an existing monorepo. Do not rebuild completed UI.

Non-negotiable rules:
1. Scan full repo before coding.
2. Produce a repo map with:
   - existing pages/routes
   - existing API endpoints/controllers/services
   - existing DB models/migrations
   - existing guards/middleware/auth/session logic
   - unfinished gaps vs requested product spec
3. Produce a no-duplication file plan:
   - files to EDIT
   - files to CREATE (only if unavoidable)
   - why each new file is necessary
4. Keep current UI layout/structure/style; only integration edits allowed.
5. Never create alternate route trees, duplicate components, or parallel auth/payment systems.
6. Reuse current services/types/hooks/components first.
7. Implement in phases and commit after each phase.
8. After each phase run tests/lint/typecheck and show commands + result.
9. If blocked, stop and report blocker + smallest safe fallback.
```

### Step B: Then give your business spec

Paste your full Premium Private Club specification after Step A (the long one you shared).

### Step C: Force delivery in phase tickets (recommended)

Use separate prompts, one by one:

1. **Phase 1 (Discovery only):**
   - output architecture map + file plan + duplication risks
   - no code changes yet
2. **Phase 2 (Critical flow wiring):**
   - auth/sign-in reliability
   - verification gating
   - payment gating
   - onboarding completion guard
3. **Phase 3 (Member core):**
   - discover/likes/matches backend integration
   - loading/empty/error states polish
4. **Phase 4 (Operations):**
   - employee verification page + match handler workflow
5. **Phase 5 (Founder/admin):**
   - admin dashboard metrics + workload views + queues

### Step D: Add acceptance checks to every phase

Require these outputs each time:
- changed files list
- why each change was needed
- commands run (tests/lint/typecheck/build)
- duplication audit (confirm no duplicate routes/components/services added)

This process gives you the highest chance that Codex scans the repo, reuses your current UI structure, and completes missing parts safely instead of generating duplicate implementations.
