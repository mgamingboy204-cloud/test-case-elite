import { API_URL } from "./apiClient";

const imageExtensionPattern = /\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i;

export function getAssetUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${normalized}`;
}

export function isValidImageUrl(url?: string | null) {
  if (!url) return false;
  if (!/^https?:\/\//i.test(url)) return false;
  return imageExtensionPattern.test(url);
}
