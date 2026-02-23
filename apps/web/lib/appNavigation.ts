const APP_ROOT_PATH = "/app";

export function appNavigate(path: string): string {
  if (path.startsWith(APP_ROOT_PATH)) {
    return path;
  }

  if (process.env.NODE_ENV !== "production") {
    throw new Error(`appNavigate only accepts /app routes. Received: ${path}`);
  }

  return APP_ROOT_PATH;
}
