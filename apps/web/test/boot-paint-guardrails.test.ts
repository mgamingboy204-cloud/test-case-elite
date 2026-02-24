import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const testDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(testDir, "../app");

describe("boot paint guardrails", () => {
  test("root layout keeps an always-on boot shell", () => {
    const source = readFileSync(resolve(appRoot, "layout.tsx"), "utf8");
    expect(source).toContain('className="boot-shell"');
    expect(source).toContain("suppressHydrationWarning");
  });

  test("pwa shell keeps only the minimal entry pages", () => {
    const pwaPage = readFileSync(resolve(appRoot, "pwa_app/page.tsx"), "utf8");
    const getStartedPage = readFileSync(resolve(appRoot, "pwa_app/get-started/page.tsx"), "utf8");
    expect(pwaPage).toContain("resolveSplashDestination");
    expect(pwaPage).toContain("SPLASH_SOFT_TIMEOUT_MS");
    expect(getStartedPage).toContain('href="/login"');
    expect(getStartedPage).toContain('href="/signup"');
  });
});
