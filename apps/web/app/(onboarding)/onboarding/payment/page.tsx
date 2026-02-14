"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";

const benefits = [
  "Unlimited swipes and likes",
  "See who liked you",
  "Priority in discovery feed",
  "Video verified badge",
  "Premium support",
  "Ad-free experience",
];

export default function PaymentPage() {
  const { addToast } = useToast();
  const [coupon, setCoupon] = useState("");
  const [couponValid, setCouponValid] = useState<boolean | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [step, setStep] = useState<"plan" | "confirm" | "done">("plan");
  const [loading, setLoading] = useState(false);

  const handleValidateCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponLoading(true);
    try {
      await apiFetch("/payments/coupon/validate", {
        method: "POST",
        body: { code: coupon } as never,
      });
      setCouponValid(true);
      addToast("Coupon applied!", "success");
    } catch {
      setCouponValid(false);
      addToast("Invalid coupon code", "error");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleStartPayment = async () => {
    setLoading(true);
    try {
      await apiFetch("/payments/mock/start", { method: "POST" });
      setStep("confirm");
    } catch {
      addToast("Payment initialization failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      await apiFetch("/payments/mock/confirm", { method: "POST" });
      setStep("done");
      addToast("Payment successful!", "success");
    } catch {
      addToast("Payment failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <h1 style={{ marginBottom: 8 }}>Membership</h1>
      <p style={{ color: "var(--muted)", fontSize: 15, marginBottom: 32 }}>
        Unlock the full Private Club experience.
      </p>

      {step === "plan" && (
        <>
          <Card style={{ padding: 28, marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>Premium Plan</h3>
                <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
                  Monthly membership
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: "var(--primary)" }}>
                  $29
                  <span style={{ fontSize: 14, fontWeight: 400, color: "var(--muted)" }}>
                    /mo
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {benefits.map((b) => (
                <div key={b} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ color: "var(--success)", fontWeight: 700 }}>{"\u2713"}</span>
                  <span style={{ fontSize: 14 }}>{b}</span>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <Input
                  placeholder="Coupon code"
                  value={coupon}
                  onChange={(e) => {
                    setCoupon(e.target.value);
                    setCouponValid(null);
                  }}
                  wrapperStyle={{ flex: 1 }}
                  style={{
                    borderColor:
                      couponValid === true
                        ? "var(--success)"
                        : couponValid === false
                        ? "var(--danger)"
                        : undefined,
                  }}
                />
                <Button
                  variant="secondary"
                  loading={couponLoading}
                  onClick={handleValidateCoupon}
                  style={{ flexShrink: 0 }}
                >
                  Apply
                </Button>
              </div>
              {couponValid !== null && (
                <span
                  style={{
                    fontSize: 13,
                    color: couponValid ? "var(--success)" : "var(--danger)",
                    marginTop: 6,
                    display: "block",
                  }}
                >
                  {couponValid ? "Coupon applied successfully!" : "Invalid coupon code"}
                </span>
              )}
            </div>

            <Button fullWidth size="lg" loading={loading} onClick={handleStartPayment}>
              Subscribe Now
            </Button>
          </Card>
        </>
      )}

      {step === "confirm" && (
        <Card style={{ padding: 28, textAlign: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--warning-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: 28,
              color: "var(--warning)",
            }}
          >
            $
          </div>
          <h3 style={{ marginBottom: 8 }}>Confirm Payment</h3>
          <p style={{ color: "var(--muted)", fontSize: 15, marginBottom: 24 }}>
            You will be charged <strong>$29.00</strong> for Private Club Premium.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <Button variant="secondary" fullWidth onClick={() => setStep("plan")}>
              Back
            </Button>
            <Button fullWidth loading={loading} onClick={handleConfirmPayment}>
              Confirm
            </Button>
          </div>
        </Card>
      )}

      {step === "done" && (
        <Card style={{ padding: 32, textAlign: "center" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "var(--success-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: 32,
              color: "var(--success)",
            }}
          >
            {"\u2713"}
          </div>
          <h2 style={{ marginBottom: 8 }}>Welcome to Premium!</h2>
          <p style={{ color: "var(--muted)", fontSize: 15, marginBottom: 8 }}>
            Your membership is now active.
          </p>
          <Badge variant="success">Active</Badge>
          <div style={{ marginTop: 24 }}>
            <Link href="/onboarding/profile-setup">
              <Button size="lg" fullWidth>
                Set Up Your Profile
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
