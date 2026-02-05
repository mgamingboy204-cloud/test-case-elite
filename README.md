# test-case-elite

## JWT authentication

User authentication now relies on short-lived access tokens (JWT) sent via the `Authorization: Bearer <token>` header, with refresh tokens stored in an HTTP-only cookie to keep sessions resilient across mobile browsers. OTP verification and password login still work as before, but they now return an `accessToken` (also mirrored in the existing `token` field for compatibility). The frontend stores the access token locally and refreshes it by calling `POST /auth/token/refresh` when it receives a 401 response. The refresh endpoint issues a new access token and rotates the refresh cookie. Logout calls `POST /auth/logout` to clear the refresh cookie and session data.

**Required API env vars**
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `ACCESS_TOKEN_TTL_MINUTES` (default: 15)
- `REFRESH_TOKEN_TTL_DAYS` (default: 30)
