# test-case-elite

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
