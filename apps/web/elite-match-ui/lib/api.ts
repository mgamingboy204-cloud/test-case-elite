/* API wrapper stub. Replace with real implementation. */

interface ApiFetchOptions extends RequestInit {
  auth?: "omit" | "include";
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { auth = "include", ...fetchOptions } = options;

  const url = `${API_BASE}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (auth === "include") {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("em_token")
        : null;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(url, {
    ...fetchOptions,
    headers,
    body: fetchOptions.body ? JSON.stringify(fetchOptions.body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || "Something went wrong");
  }

  return res.json() as Promise<T>;
}
