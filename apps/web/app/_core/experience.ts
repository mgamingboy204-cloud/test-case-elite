import { headers } from "next/headers";

export type ExperienceMode = "pwa" | "web";

export async function getServerExperienceHint(): Promise<ExperienceMode> {
  const h = await headers();
  const mobileHint = h.get("sec-ch-ua-mobile");
  const ua = (h.get("user-agent") || "").toLowerCase();

  const isMobileUA = /iphone|ipad|ipod|android|mobile/.test(ua);
  if (mobileHint === "?1" || isMobileUA) return "pwa";
  return "web";
}

export function getClientExperienceFromWindow(): ExperienceMode {
  if (typeof window === "undefined") return "web";
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  const standalone = window.matchMedia("(display-mode: standalone)").matches || iosStandalone;
  return standalone ? "pwa" : "web";
}
