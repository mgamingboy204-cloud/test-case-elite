export function getDatabaseInfo(databaseUrl: string) {
  try {
    const url = new URL(databaseUrl);
    return {
      host: url.host,
      database: url.pathname.replace(/^\//, "") || "unknown"
    };
  } catch {
    return { host: "unknown", database: "unknown" };
  }
}
