# Routes Audit

## Before migration (observed)

| URL | Producing folder/file | Type | Notes |
|---|---|---|---|
| `/` | `apps/web/app/(marketing)/page.tsx` | DESKTOP | Root marketing homepage |
| `/login`, `/signup`, `/otp` | `apps/web/app/(auth)/*` | DESKTOP | Desktop auth |
| `/discover`, `/matches`, `/likes`, `/profile`, `/settings`, `/report`, `/refunds` | `apps/web/app/(app)/*` | DESKTOP | Desktop app shell |
| `/onboarding/*` | `apps/web/app/(onboarding)/onboarding/*` | DESKTOP | Desktop onboarding |
| `/app/*` (e.g. `/app/get-started`, `/app/login`, `/app/splash`, `/app/discover`, `/app/matches`) | `apps/web/app/app/*` | PWA | Installed PWA entry used `/app/splash` |
| `/auth`, `/verification`, `/payment`, `/browse` | `apps/web/app/{auth,verification,payment,browse}` | DESKTOP redirects | Legacy redirect pages |
| `/admin/*` | `apps/web/app/(admin)/admin/*` | ADMIN | Unchanged |

### Conflicts/duplicates found before moves
- Two separate product funnels existed at different URL bases (`/app/*` PWA and root-based desktop pages), creating duplicated concepts (`discover`, `matches`, `login`, etc.) with different shells.
- PWA URLs were not clean due to the literal `app/` segment.

## After migration (final)

| URL | Producing folder/file | Type |
|---|---|---|
| `/` | `apps/web/app/page.tsx` | PWA entry redirect (`/get-started`) |
| `/get-started`, `/splash`, `/login`, `/signup/phone`, `/signup/verify`, `/discover`, `/matches`, `/requests`, `/home` | `apps/web/app/(pwa)/*` | PWA |
| `/web` | `apps/web/app/web/(marketing)/page.tsx` | DESKTOP |
| `/web/login`, `/web/signup`, `/web/otp` | `apps/web/app/web/(auth)/*` | DESKTOP |
| `/web/discover`, `/web/matches`, `/web/likes`, `/web/profile`, `/web/settings`, `/web/report`, `/web/refunds` | `apps/web/app/web/(app)/*` | DESKTOP |
| `/web/onboarding/*` | `apps/web/app/web/(onboarding)/onboarding/*` | DESKTOP |
| `/web/{auth,browse,payment,verification,open-app}` | `apps/web/app/web/*` | DESKTOP redirects/utilities |
| `/admin/*` | `apps/web/app/(admin)/admin/*` | ADMIN (unchanged) |

### Compatibility redirects
- `/app` -> `/`
- `/app/:path*` -> `/:path*`

These preserve old PWA links while migrating to clean root PWA URLs.
