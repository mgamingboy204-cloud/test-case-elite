process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
process.env.SESSION_SECRET = process.env.SESSION_SECRET ?? "test-session-secret";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "test-access-secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "test-refresh-secret";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://user:password@db.example.com:5432/elite_test";
process.env.WEB_ORIGIN = process.env.WEB_ORIGIN ?? "https://web.example.com";
process.env.ADMIN_ORIGIN = process.env.ADMIN_ORIGIN ?? "https://admin.example.com";
