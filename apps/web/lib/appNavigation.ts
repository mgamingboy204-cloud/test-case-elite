const APP_ROOT_PATH = "/app";

export function appAuthRedirect(): string {
  return "/app/login";
}

export function appNavigate(path: string): string {
  if (path.startsWith(APP_ROOT_PATH)) {
    return path;
  }

  if (process.env.NODE_ENV !== "production") {
    throw new Error(`appNavigate only accepts /app routes. Received: ${path}`);
  }

  return APP_ROOT_PATH;
}

export function appPathFor(pathname: string | null, path: string): string {
  if (pathname?.startsWith("/app")) {
    return appNavigate(`/app${path}`);
  }

  return path;
}
