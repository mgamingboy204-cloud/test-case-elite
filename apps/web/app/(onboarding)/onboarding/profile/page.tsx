"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Modal } from "@/app/components/ui/Modal";
import { useToast } from "@/app/providers";
import { ApiError, apiFetch } from "@/lib/api";
import { getDefaultRoute } from "@/lib/onboarding";
import { useSession } from "@/lib/session";

const STORAGE_KEY = "em_onboarding_profile_v2";
const MIN_AGE = 18;
const MAX_AGE = 100;

type GenderOption = "MALE" | "FEMALE" | "NON_BINARY" | "OTHER";

type OnboardingDraft = {
  firstName: string;
  day: string;
  month: string;
  year: string;
  gender: GenderOption | "";
  showGender: boolean;
};

const INITIAL_DRAFT: OnboardingDraft = {
  firstName: "",
  day: "",
  month: "",
  year: "",
  gender: "",
  showGender: true
};

const GENDER_OPTIONS: { value: GenderOption; label: string; subtitle: string }[] = [
  { value: "MALE", label: "Man", subtitle: "He / Him" },
  { value: "FEMALE", label: "Woman", subtitle: "She / Her" },
  { value: "NON_BINARY", label: "Beyond Binary", subtitle: "They / Them" },
  { value: "OTHER", label: "Other", subtitle: "Tell us in your profile later" }
];

function calculateAge(year: number, month: number, day: number) {
  const now = new Date();
  let age = now.getFullYear() - year;
  const monthDelta = now.getMonth() + 1 - month;
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < day)) {
    age -= 1;
  }
  return age;
}

function parseBirthday(draft: OnboardingDraft) {
  const day = Number(draft.day);
  const month = Number(draft.month);
  const year = Number(draft.year);
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  const age = calculateAge(year, month, day);
  if (age < MIN_AGE || age > MAX_AGE) return null;
  return { day, month, year, age };
}

function isMobileViewport() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(max-width: 920px)").matches;
}

export default function ProfileWizardPage() {
  const router = useRouter();
  const { refresh, user } = useSession();
  const { addToast } = useToast();
  const firstNameInputRef = useRef<HTMLInputElement | null>(null);
  const [isMobile, setIsMobile] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [draft, setDraft] = useState<OnboardingDraft>(INITIAL_DRAFT);

  useEffect(() => {
    setIsMobile(isMobileViewport());
    const media = window.matchMedia("(max-width: 920px)");
    const handler = () => setIsMobile(media.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const loadExisting = async () => {
      try {
        const response = await apiFetch<{
          profile?: { age?: number; gender?: GenderOption; city?: string; profession?: string; bioShort?: string; intent?: string; name?: string } | null;
          user?: { firstName?: string | null; displayName?: string | null; gender?: GenderOption | null } | null;
        }>("/profile");

        let initial = { ...INITIAL_DRAFT };
        try {
          const persisted = window.localStorage.getItem(STORAGE_KEY);
          if (persisted) {
            initial = { ...initial, ...(JSON.parse(persisted) as OnboardingDraft) };
          }
        } catch {
          // no-op
        }

        const sourceName = response.user?.firstName || response.user?.displayName || response.profile?.name || "";
        if (!initial.firstName && sourceName) {
          initial.firstName = String(sourceName).trim().split(" ")[0] ?? "";
        }

        if (!initial.gender && (response.user?.gender || response.profile?.gender)) {
          initial.gender = (response.user?.gender || response.profile?.gender || "") as GenderOption;
        }

        if ((!initial.day || !initial.month || !initial.year) && response.profile?.age) {
          const now = new Date();
          const syntheticYear = now.getFullYear() - response.profile.age;
          initial.day = "01";
          initial.month = "01";
          initial.year = String(syntheticYear);
        }

        setDraft(initial);
      } catch {
        // keep defaults
      }
    };

    void loadExisting();
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  const birthday = useMemo(() => parseBirthday(draft), [draft]);

  const canContinue =
    stepIndex === 0
      ? draft.firstName.trim().length > 0
      : stepIndex === 1
        ? Boolean(birthday)
        : Boolean(draft.gender);

  const handleExit = async () => {
    if (document.referrer && document.referrer.startsWith(window.location.origin)) {
      router.back();
      return;
    }

    const refreshedUser = await refresh();
    if (refreshedUser?.paymentStatus === "PAID") {
      router.replace("/discover");
      return;
    }

    const fallback = getDefaultRoute(refreshedUser);
    router.replace(fallback === "/onboarding/profile" ? "/" : fallback);
  };

  const handleNext = async () => {
    if (!canContinue || saving) return;

    if (stepIndex === 0) {
      setShowWelcome(true);
      return;
    }

    if (stepIndex < 2) {
      setStepIndex((prev) => prev + 1);
      return;
    }

    if (!birthday) return;

    setSaving(true);
    try {
      await apiFetch("/profile", {
        method: "PUT",
        body: {
          displayName: draft.firstName.trim(),
          firstName: draft.firstName.trim(),
          gender: draft.gender,
          age: birthday.age,
          city: "Unknown",
          profession: "Not set",
          bioShort: draft.showGender ? "Ready to meet people." : "",
          intent: "dating"
        } as never
      });

      await apiFetch("/profile/complete", { method: "POST" });
      window.localStorage.removeItem(STORAGE_KEY);
      const refreshedUser = await refresh();
      router.replace(getDefaultRoute(refreshedUser));
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to save profile. Please try again.";
      addToast(message, "error");
      setSaving(false);
    }
  };

  const title = stepIndex === 0 ? "What should we call you?" : stepIndex === 1 ? "Your b-day?" : "How do you identify?";
  const subtitle =
    stepIndex === 0
      ? "This is how your profile starts."
      : stepIndex === 1
        ? "Your profile shows your age, not your birth date."
        : "Choose what feels right. You can change this later.";

  return (
    <div className={isMobile ? "onboarding-native" : "onboarding-desktop"}>
      <div className="onboarding-surface">
        <button type="button" className="onboarding-close" onClick={handleExit} aria-label="Exit onboarding">
          ✕
        </button>

        <section className="onboarding-head">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </section>

        <section className="onboarding-body" key={stepIndex}>
          {stepIndex === 0 && (
            <Input
              ref={firstNameInputRef}
              placeholder="First name"
              value={draft.firstName}
              autoFocus
              maxLength={32}
              onChange={(event) => setDraft((prev) => ({ ...prev, firstName: event.target.value }))}
            />
          )}

          {stepIndex === 1 && (
            <div className="birthday-row">
              <Input
                inputMode="numeric"
                placeholder="DD"
                maxLength={2}
                value={draft.day}
                onChange={(event) => setDraft((prev) => ({ ...prev, day: event.target.value.replace(/\D/g, "") }))}
              />
              <Input
                inputMode="numeric"
                placeholder="MM"
                maxLength={2}
                value={draft.month}
                onChange={(event) => setDraft((prev) => ({ ...prev, month: event.target.value.replace(/\D/g, "") }))}
              />
              <Input
                inputMode="numeric"
                placeholder="YYYY"
                maxLength={4}
                value={draft.year}
                onChange={(event) => setDraft((prev) => ({ ...prev, year: event.target.value.replace(/\D/g, "") }))}
              />
            </div>
          )}

          {stepIndex === 2 && (
            <div className="gender-list">
              {GENDER_OPTIONS.map((option) => {
                const active = draft.gender === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={active ? "gender-card active" : "gender-card"}
                    onClick={() => setDraft((prev) => ({ ...prev, gender: option.value }))}
                  >
                    <strong>{option.label}</strong>
                    <span>{option.subtitle}</span>
                  </button>
                );
              })}
              <label className="gender-checkbox">
                <input
                  type="checkbox"
                  checked={draft.showGender}
                  onChange={(event) => setDraft((prev) => ({ ...prev, showGender: event.target.checked }))}
                />
                Show gender on profile
              </label>
            </div>
          )}
        </section>

        <footer className="onboarding-footer safe-bottom safe-x">
          <Button fullWidth size="lg" onClick={handleNext} disabled={!canContinue} loading={saving} style={{ borderRadius: 999 }}>
            Next
          </Button>
        </footer>
      </div>

      <Modal open={showWelcome} onClose={() => setShowWelcome(false)} title={`Welcome, ${draft.firstName.trim()}!`}>
        <div style={{ display: "grid", gap: 12 }}>
          <Button
            fullWidth
            onClick={() => {
              setShowWelcome(false);
              setStepIndex(1);
            }}
          >
            Let&apos;s go
          </Button>
          <Button
            fullWidth
            variant="secondary"
            onClick={() => {
              setShowWelcome(false);
              setStepIndex(0);
              setTimeout(() => firstNameInputRef.current?.focus(), 10);
            }}
          >
            Edit name
          </Button>
        </div>
      </Modal>

      <style jsx>{`
        .onboarding-native {
          min-height: 100svh;
          min-height: 100dvh;
          height: 100dvh;
          overflow: hidden;
          overscroll-behavior: none;
          background: linear-gradient(180deg, var(--bg), color-mix(in srgb, var(--surface2) 74%, var(--bg)));
        }

        .onboarding-desktop {
          min-height: 100dvh;
          padding: 30px 20px;
          display: grid;
          place-items: center;
          background: linear-gradient(180deg, var(--bg), color-mix(in srgb, var(--surface2) 74%, var(--bg)));
        }

        .onboarding-surface {
          position: relative;
          min-height: 100dvh;
          display: grid;
          grid-template-rows: auto auto 1fr auto;
          background: color-mix(in srgb, var(--surface) 94%, var(--bg));
          border: 1px solid color-mix(in srgb, var(--accent) 18%, var(--border));
          box-shadow: var(--shadow-md);
        }

        .onboarding-desktop .onboarding-surface {
          width: min(560px, 100%);
          min-height: 720px;
          border-radius: 28px;
          overflow: hidden;
        }

        .onboarding-close {
          position: absolute;
          top: max(16px, var(--sat));
          left: max(12px, var(--sal));
          width: 42px;
          height: 42px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: color-mix(in srgb, var(--surface2) 88%, var(--pearl-panel));
        }

        .onboarding-head {
          padding: max(74px, calc(var(--sat) + 58px)) max(20px, var(--sal)) 18px;
        }

        .onboarding-head p { color: var(--muted); margin-top: 8px; }

        .onboarding-body {
          padding: 8px max(20px, var(--sal));
          display: grid;
          align-content: start;
          gap: 14px;
          animation: stepIn 220ms ease;
        }

        .birthday-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1.4fr;
          gap: 10px;
        }

        .gender-list { display: grid; gap: 10px; }

        .gender-card {
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 14px;
          text-align: left;
          background: color-mix(in srgb, var(--surface2) 82%, var(--surface));
          display: grid;
          gap: 2px;
        }

        .gender-card span { color: var(--muted); font-size: 13px; }
        .gender-card.active {
          border-color: color-mix(in srgb, var(--accent) 58%, var(--border));
          background: color-mix(in srgb, var(--accent) 18%, var(--surface));
        }

        .gender-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
          color: var(--text-secondary);
        }

        .onboarding-footer {
          position: sticky;
          bottom: 0;
          padding-top: 8px;
          background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--surface) 95%, var(--bg)) 40%);
        }

        @keyframes stepIn {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
