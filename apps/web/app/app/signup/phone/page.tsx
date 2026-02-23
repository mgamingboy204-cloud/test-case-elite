"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useMemo, useState } from "react";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";
import styles from "./phone.module.css";

const PHONE_STORAGE_KEY = "em_signup_phone";
const COUNTRY_STORAGE_KEY = "em_signup_country";
const COUNTRY_CODE = "+91";

export default function AppSignupPhonePage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    document.body.classList.add("app-entry-no-scroll");

    return () => {
      document.body.classList.remove("app-entry-no-scroll");
    };
  }, []);

  const cleanedPhone = useMemo(() => phone.replace(/\D/g, ""), [phone]);
  const isPhoneValid = cleanedPhone.length === 10;

  const handleContinue = async () => {
    if (!isPhoneValid || loading) return;

    setLoading(true);
    try {
      await apiFetch("/auth/otp/send", {
        method: "POST",
        body: { phone: cleanedPhone } as never,
        auth: "omit"
      });

      sessionStorage.setItem(PHONE_STORAGE_KEY, cleanedPhone);
      sessionStorage.setItem(COUNTRY_STORAGE_KEY, COUNTRY_CODE);
      router.push("/app/signup/verify");
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Could not send code", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`${styles.screen} entry-screen`} aria-label="Phone signup">
      <div className={styles.chrome}>
        <Link href="/app/get-started" className={styles.backButton} aria-label="Go back">
          ←
        </Link>
        <p className={styles.brand}>Elite Match</p>
        <span className={styles.rightSlot} aria-hidden="true" />
      </div>

      <section className={styles.content}>
        <h1 className={styles.title}>What&apos;s your number?</h1>
        <p className={styles.subtitle}>We&apos;ll text you a code to verify.</p>

        <div className={styles.phoneRow}>
          <span className={styles.countryPill}>{COUNTRY_CODE}</span>
          <input
            className={styles.phoneInput}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="9876543210"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            maxLength={10}
            aria-label="Phone number"
          />
        </div>

        <p className={styles.helper}>Standard SMS rates may apply.</p>
      </section>

      <section className={styles.bottom}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={handleContinue}
          disabled={!isPhoneValid || loading}
        >
          {loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
          {loading ? "Sending..." : "Continue"}
        </button>
        <p className={styles.terms}>By continuing, you agree to our Terms &amp; Privacy Policy.</p>
      </section>
    </main>
  );
}
