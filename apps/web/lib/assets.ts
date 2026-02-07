import { API_URL } from "./apiClient";

export function getAssetUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${normalized}`;
}
