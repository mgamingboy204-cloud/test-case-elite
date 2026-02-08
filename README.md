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
