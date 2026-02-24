"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { Button } from "@/app/components/ui/Button";
import { useToast } from "@/app/providers";
import { INITIAL_PROFILE_DRAFT } from "@/lib/onboardingFlow";
import { appPathFor } from "@/lib/appNavigation";

const DRAFT_KEY = "em_onboarding_profile_draft";

export default function OnboardingStartPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const pathname = usePathname();
  const rules = useMemo(
    () => [
      "Keep interactions respectful and authentic.",
      "Only upload photos you own and that clearly show you.",
      "Elite Match reviews reports and removes abusive behavior."
    ],
    []
  );

  const handleAgree = () => {
    if (typeof window !== "undefined") {
      const nextDraft = { ...INITIAL_PROFILE_DRAFT, houseRulesAccepted: true };
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(nextDraft));
    }
    addToast("Great. Let’s build your profile.", "success");
    router.push(appPathFor(pathname, "/onboarding"));
  };

  return (
    <div className="onboarding-screen">
      <header className="onboarding-topbar">
        <button className="onboarding-icon-btn" onClick={() => router.back()} aria-label="Go back">
          ←
        </button>
        <div className="onboarding-progress-track"><div className="onboarding-progress-fill" style={{ width: "8%" }} /></div>
        <span className="onboarding-skip-placeholder" />
      </header>

      <section className="onboarding-scroll-area onboarding-content-stack">
        <h1>Welcome to Elite Match</h1>
        <p className="onboarding-muted">Before we continue, please confirm our house rules.</p>
        <ul className="onboarding-list">
          {rules.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <footer className="onboarding-cta-shell">
        <Button fullWidth size="lg" onClick={handleAgree} className="onboarding-cta-btn">
          I Agree
        </Button>
      </footer>
    </div>
  );
}
