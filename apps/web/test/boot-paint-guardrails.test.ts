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

  test("legacy pwa redirects do not render null", () => {
    const phonePage = readFileSync(resolve(appRoot, "pwa_app/signup/phone/page.tsx"), "utf8");
    const verifyPage = readFileSync(resolve(appRoot, "pwa_app/signup/verify/page.tsx"), "utf8");
    expect(phonePage).not.toContain("return null");
    expect(verifyPage).not.toContain("return null");
  });
});
