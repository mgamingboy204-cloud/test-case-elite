"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";
import { getDefaultRoute } from "@/lib/onboarding";
import { useSession } from "@/lib/session";

const benefits = [
  "Unlimited swipes and likes",
  "See who liked you",
  "Priority in discovery feed",
  "Video verified badge",
  "Premium support",
  "Ad-free experience",
];

export default function PaymentPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { refresh } = useSession();
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
      const refreshedUser = await refresh();
      const nextRoute = getDefaultRoute(refreshedUser);
      setStep("done");
      addToast("Payment successful!", "success");
      if (nextRoute !== "/web/onboarding/profile") {
        addToast("Payment processed. Redirecting to your next required step.", "info");
      }
    } catch {
      addToast("Payment failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSetupProfile = async () => {
    const refreshedUser = await refresh();
    const nextRoute = getDefaultRoute(refreshedUser);

    if (nextRoute === "/web/onboarding/profile") {
      router.push("/web/onboarding/profile");
      return;
    }

    addToast("We are syncing your onboarding status. Taking you to the right step.", "info");
    router.replace(nextRoute);
  };

  return (
    <div className="fade-in" style={{ paddingBottom: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Membership</h1>
      <p style={{ color: "var(--muted)", fontSize: 15, marginBottom: 32 }}>
        Unlock the full Elite Match experience.
      </p>

      {step === "plan" && (
        <>
          <Card
            style={{
              padding: 28,
              marginBottom: 24,
              border: "1px solid color-mix(in srgb, var(--accent) 30%, var(--border))",
              background: "linear-gradient(145deg, color-mix(in srgb, var(--surface2) 88%, var(--accent) 12%), var(--panel))",
              boxShadow: "var(--shadow-lg)",
            }}
          >
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

            <div className="safe-bottom">
              <Button fullWidth size="lg" loading={loading} onClick={handleStartPayment}>
                Subscribe Now
              </Button>
            </div>
          </Card>
        </>
      )}

      {step === "confirm" && (
        <Card
          style={{
            padding: 28,
            textAlign: "center",
            border: "1px solid color-mix(in srgb, var(--accent) 24%, var(--border))",
            background: "linear-gradient(145deg, color-mix(in srgb, var(--surface2) 90%, var(--accent) 10%), var(--panel))",
            boxShadow: "var(--shadow-md)",
          }}
        >
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
            You will be charged <strong>$29.00</strong> for Elite Match Premium.
          </p>
          <div className="safe-bottom" style={{ display: "flex", gap: 12 }}>
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
        <Card
          style={{
            padding: 32,
            textAlign: "center",
            border: "1px solid color-mix(in srgb, var(--accent) 30%, var(--border))",
            background: "linear-gradient(145deg, color-mix(in srgb, var(--surface2) 88%, var(--accent) 12%), var(--panel))",
            boxShadow: "var(--shadow-lg)",
          }}
        >
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
          <div className="safe-bottom" style={{ marginTop: 24 }}>
            <Button
              size="lg"
              fullWidth
              onClick={handleSetupProfile}
              style={{ minHeight: 52, fontWeight: 700 }}
            >
              Set Up Your Profile
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
