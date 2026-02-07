"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import { useSession } from "../../../lib/session";

const SUBTOTAL_AMOUNT = 99999;
const MAX_COUPON_LENGTH = 24;
const ENABLE_MOCK_PROCEED = true;

type Status = "idle" | "loading" | "success" | "error";
type CouponState = "idle" | "validating" | "applied" | "invalid";
type CouponDetails = {
  code: string;
  discountType: "PERCENT" | "FLAT";
  discountValue: number;
  message?: string;
};
type PaymentInitiationResponse = {
  paymentStatus: string;
  paymentLink?: string;
  orderId?: string;
};
type CouponValidationResponse = {
  valid: boolean;
  code?: string;
  discountType?: "PERCENT" | "FLAT";
  discountValue?: number;
  message?: string;
};

type StatusDetails = { label: string; message: string; tone: string };

type MembershipPlanCardProps = {
  subtotalAmount: number;
  formatCurrency: (value: number) => string;
  isMobile: boolean;
  showBenefits: boolean;
  onToggleBenefits: () => void;
};

function MembershipPlanCard({
  subtotalAmount,
  formatCurrency,
  isMobile,
  showBenefits,
  onToggleBenefits
}: MembershipPlanCardProps) {
  return (
    <section className="card payment-plan">
      <div className="plan-header">
        <div>
          <p className="plan-name">Elite Match Annual</p>
          <p className="plan-price">
            {formatCurrency(subtotalAmount)}
            <span className="plan-cycle">/year</span>
          </p>
          <p className="text-muted">One membership covers personalized matching and ongoing concierge care.</p>
        </div>
      </div>
      <div className="plan-section-header">
        <h3>What you get</h3>
        {isMobile ? (
          <button
            type="button"
            className="text-button benefits-toggle"
            aria-expanded={showBenefits}
            onClick={onToggleBenefits}
          >
            {showBenefits ? "Hide" : "Show"}
          </button>
        ) : null}
      </div>
      {showBenefits ? (
        <ul className="plan-benefits" id="plan-benefits">
          <li>
            <span className="benefit-icon">◆</span>
            Priority access to curated, compatible matches.
          </li>
          <li>
            <span className="benefit-icon">◆</span>
            Dedicated concierge verification and availability support.
          </li>
          <li>
            <span className="benefit-icon">◆</span>
            Exclusive weekly introductions with feedback loops.
          </li>
          <li>
            <span className="benefit-icon">◆</span>
            Private profile placement and matchmaking insights.
          </li>
          <li>
            <span className="benefit-icon">◆</span>
            Personal strategy sessions with your concierge.
          </li>
        </ul>
      ) : null}
      <div className="trust-row">
        <span>Secure checkout</span>
        <span>Encrypted payments</span>
        <span>Concierge support</span>
      </div>
    </section>
  );
}

type CheckoutCardProps = {
  statusDetails: StatusDetails;
  couponState: CouponState;
  couponMessage: string;
  couponCode: string;
  maxCouponLength: number;
  appliedCoupon: CouponDetails | null;
  onCouponChange: (value: string) => void;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
  isActionLoading: boolean;
  isCouponOpen: boolean;
  onToggleCoupon: () => void;
  discountAmount: number;
  totalAmount: number;
  subtotalAmount: number;
  formatCurrency: (value: number) => string;
  children: ReactNode;
  message: string;
  status: Status;
  isMobile: boolean;
};

function CheckoutCard({
  statusDetails,
  couponState,
  couponMessage,
  couponCode,
  maxCouponLength,
  appliedCoupon,
  onCouponChange,
  onApplyCoupon,
  onRemoveCoupon,
  isActionLoading,
  isCouponOpen,
  onToggleCoupon,
  discountAmount,
  totalAmount,
  subtotalAmount,
  formatCurrency,
  children,
  message,
  status,
  isMobile
}: CheckoutCardProps) {
  return (
    <section className="card payment-checkout">
      <div className="status-banner">
        <div>
          <p className="status-label">Payment status</p>
          <p className="status-message">{statusDetails.message}</p>
        </div>
        <span className={`status-pill status-${statusDetails.tone}`}>{statusDetails.label}</span>
      </div>

      <div className="coupon-section">
        <div className="coupon-header">
          <div>
            <h3>Coupon</h3>
            {couponState === "applied" && appliedCoupon ? (
              <span className="coupon-applied">Applied: {appliedCoupon.code}</span>
            ) : null}
          </div>
          <button type="button" className="text-button" onClick={onToggleCoupon} aria-expanded={isCouponOpen}>
            {isCouponOpen ? "Hide" : "Add"}
          </button>
        </div>
        {isCouponOpen ? (
          <>
            <label className="input-label" htmlFor="coupon-code">
              Enter coupon code
            </label>
            <div className="coupon-row">
              <input
                id="coupon-code"
                type="text"
                name="coupon"
                placeholder="Enter code"
                value={couponCode}
                maxLength={maxCouponLength}
                onChange={(event) => onCouponChange(event.target.value)}
                disabled={couponState === "validating" || isActionLoading}
              />
              {couponState === "applied" ? (
                <button type="button" className="secondary" onClick={onRemoveCoupon} disabled={isActionLoading}>
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  className="secondary"
                  onClick={onApplyCoupon}
                  disabled={couponState === "validating" || isActionLoading}
                >
                  {couponState === "validating" ? "Applying..." : "Apply"}
                </button>
              )}
            </div>
            {couponMessage ? <p className={`coupon-message ${couponState}`}>{couponMessage}</p> : null}
          </>
        ) : null}
      </div>

      <div className="price-breakdown">
        <div className="price-row">
          <span>Subtotal</span>
          <strong>{formatCurrency(subtotalAmount)}</strong>
        </div>
        {appliedCoupon ? (
          <div className="price-row discount">
            <span>Discount {appliedCoupon.discountType === "PERCENT" ? `(${appliedCoupon.discountValue}%)` : ""}</span>
            <strong>-{formatCurrency(discountAmount)}</strong>
          </div>
        ) : null}
        <div className="price-row total">
          <span>Total</span>
          <strong>{formatCurrency(totalAmount)}</strong>
        </div>
      </div>

      <div className="checkout-actions">{children}</div>

      {message ? <p className={`message ${status}`}>{message}</p> : null}
    </section>
  );
}

type MobileStickyCheckoutBarProps = {
  totalAmount: number;
  formatCurrency: (value: number) => string;
  primaryLabel: string;
  onPrimaryAction: () => void;
  isActionLoading: boolean;
};

function MobileStickyCheckoutBar({
  totalAmount,
  formatCurrency,
  primaryLabel,
  onPrimaryAction,
  isActionLoading
}: MobileStickyCheckoutBarProps) {
  return (
    <div className="mobile-sticky-bar">
      <div>
        <p className="sticky-label">Total</p>
        <strong className="sticky-amount">{formatCurrency(totalAmount)}</strong>
      </div>
      <button className="primary-cta" onClick={onPrimaryAction} disabled={isActionLoading}>
        {isActionLoading ? "Processing..." : primaryLabel}
      </button>
    </div>
  );
}

export default function PaymentPage() {
  const { refresh } = useSession();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponState, setCouponState] = useState<CouponState>("idle");
  const [couponMessage, setCouponMessage] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponDetails | null>(null);
  const [showBenefits, setShowBenefits] = useState(true);
  const [showCoupon, setShowCoupon] = useState(false);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
      }),
    []
  );

  useEffect(() => {
    void loadPayment();
  }, []);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setShowBenefits(true);
      setShowCoupon(false);
    } else {
      setShowBenefits(true);
      setShowCoupon(false);
    }
  }, [isMobile]);

  function formatCurrency(value: number) {
    return currencyFormatter.format(value);
  }

  async function loadPayment() {
    try {
      const data = await apiFetch<{ paymentStatus?: string }>("/payments/me");
      setPaymentStatus(data.paymentStatus ?? null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load payment status.");
      setStatus("error");
    }
  }

  async function startPayment() {
    setStatus("loading");
    setMessage("Starting payment...");
    try {
      const payload = appliedCoupon?.code ? { couponCode: appliedCoupon.code } : {};
      const data = await apiFetch<PaymentInitiationResponse>("/payments/mock/start", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setPaymentStatus(data.paymentStatus);
      setStatus("success");
      setMessage("Payment initiated. Confirm to continue.");
      if (data.paymentLink) {
        window.location.assign(data.paymentLink);
      } else if (data.orderId) {
        openRazorpayCheckout(data.orderId);
      }
      await refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to start payment.");
    } finally {
      setConfirming(false);
    }
  }

  async function confirmPayment() {
    setStatus("loading");
    setMessage("Confirming payment...");
    try {
      const data = await apiFetch<{ paymentStatus: string }>("/payments/mock/confirm", { method: "POST" });
      setPaymentStatus(data.paymentStatus);
      setStatus("success");
      setMessage("Payment confirmed. Continue to profile setup.");
      await refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to confirm payment.");
    }
  }

  async function applyCoupon() {
    const normalized = couponCode.trim().toUpperCase();
    if (!normalized) {
      setCouponState("invalid");
      setCouponMessage("Enter a coupon code to apply.");
      return;
    }
    if (normalized.length > MAX_COUPON_LENGTH) {
      setCouponState("invalid");
      setCouponMessage("Coupon code is too long.");
      return;
    }
    setCouponState("validating");
    setCouponMessage("Validating coupon...");
    try {
      const response = await apiFetch<CouponValidationResponse>("/payments/coupon/validate", {
        method: "POST",
        body: JSON.stringify({ code: normalized })
      });
      if (response.valid && response.discountType && typeof response.discountValue === "number") {
        setAppliedCoupon({
          code: response.code ?? normalized,
          discountType: response.discountType,
          discountValue: response.discountValue,
          message: response.message
        });
        setCouponState("applied");
        setCouponMessage(response.message ?? "Coupon applied.");
      } else {
        setAppliedCoupon(null);
        setCouponState("invalid");
        setCouponMessage(response.message ?? "Coupon not valid.");
      }
    } catch (error) {
      setAppliedCoupon(null);
      setCouponState("invalid");
      setCouponMessage(error instanceof Error ? error.message : "Unable to validate coupon.");
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponState("idle");
    setCouponMessage("");
  }

  async function handleMockProceed() {
    setStatus("loading");
    setMessage("Mock proceed enabled. Completing payment step...");
    try {
      const data = await apiFetch<{ paymentStatus: string }>("/payments/mock/confirm", { method: "POST" });
      setPaymentStatus(data.paymentStatus);
      setStatus("success");
      setMessage("Mock proceed complete. Continue to profile setup.");
      await refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to mock proceed.");
    }
  }

  function openRazorpayCheckout(orderId: string) {
    setMessage(`Razorpay checkout stub ready for order ${orderId}.`);
  }

  const normalizedStatus = paymentStatus === "COMPLETED" ? "PAID" : paymentStatus ?? "NOT_STARTED";
  const statusConfig: Record<string, StatusDetails> = {
    NOT_STARTED: {
      label: "Not started",
      message: "Start your payment to secure Elite Match access.",
      tone: "neutral"
    },
    PENDING: {
      label: "Pending",
      message: "Payment initiated. Confirm once you’ve completed the transfer.",
      tone: "warning"
    },
    PAID: {
      label: "Paid",
      message: "Payment received. Continue to profile setup.",
      tone: "success"
    },
    FAILED: {
      label: "Failed",
      message: "Payment failed. Retry to complete your membership.",
      tone: "danger"
    }
  };

  const statusDetails =
    statusConfig[normalizedStatus] ?? {
      label: normalizedStatus,
      message: "We’re verifying your payment status.",
      tone: "neutral"
    };

  const discountAmount = appliedCoupon
    ? appliedCoupon.discountType === "PERCENT"
      ? Math.round((SUBTOTAL_AMOUNT * appliedCoupon.discountValue) / 100)
      : Math.min(appliedCoupon.discountValue, SUBTOTAL_AMOUNT)
    : 0;
  const totalAmount = Math.max(SUBTOTAL_AMOUNT - discountAmount, 0);
  const isActionLoading = status === "loading";
  const showMobileConfirm = isMobile && confirming && normalizedStatus === "NOT_STARTED";
  const isNotStarted = normalizedStatus === "NOT_STARTED";
  const isPending = normalizedStatus === "PENDING";
  const isPaid = normalizedStatus === "PAID";
  const isFailed = normalizedStatus === "FAILED";
  const benefitsExpanded = isMobile ? showBenefits : true;
  const couponExpanded = showCoupon;

  const primaryCtaLabel = showMobileConfirm
    ? "Confirm & proceed"
    : isNotStarted
      ? "Start payment"
      : isPending
        ? "Confirm payment"
        : isPaid
          ? "Continue to profile setup"
          : "Retry payment";
  const primaryCtaAction = showMobileConfirm
    ? startPayment
    : isNotStarted
      ? () => setConfirming(true)
      : isPending
        ? confirmPayment
        : isPaid
          ? () => router.push("/onboarding/profile")
          : startPayment;

  return (
    <div className="payment-shell premium-payment">
      <div className="payment-container">
        <div className="payment-hero">
          <div>
            <span className="verification-pill">Membership payment</span>
            <h1>Elite Match Membership</h1>
            <p className="text-muted">
              A concierge-grade membership designed for intentional matchmaking, private introductions, and priority
              support.
            </p>
          </div>
          <span className={`status-chip status-${statusDetails.tone}`}>{statusDetails.label}</span>
        </div>

        <div className="payment-grid">
          <MembershipPlanCard
            subtotalAmount={SUBTOTAL_AMOUNT}
            formatCurrency={formatCurrency}
            isMobile={isMobile}
            showBenefits={benefitsExpanded}
            onToggleBenefits={() => setShowBenefits((prev) => !prev)}
          />

          <CheckoutCard
            statusDetails={statusDetails}
            couponState={couponState}
            couponMessage={couponMessage}
            couponCode={couponCode}
            maxCouponLength={MAX_COUPON_LENGTH}
            appliedCoupon={appliedCoupon}
            onCouponChange={(value) => {
              const nextValue = value.toUpperCase();
              setCouponCode(nextValue);
              if (couponState === "applied") {
                setCouponState("idle");
                setAppliedCoupon(null);
                setCouponMessage("");
              }
            }}
            onApplyCoupon={applyCoupon}
            onRemoveCoupon={removeCoupon}
            isActionLoading={isActionLoading}
            isCouponOpen={couponExpanded}
            onToggleCoupon={() => setShowCoupon((prev) => !prev)}
            discountAmount={discountAmount}
            totalAmount={totalAmount}
            subtotalAmount={SUBTOTAL_AMOUNT}
            formatCurrency={formatCurrency}
            message={message}
            status={status}
            isMobile={isMobile}
          >
            {isNotStarted ? (
              <>
                <button
                  className="primary-cta"
                  onClick={isMobile ? () => setConfirming(true) : startPayment}
                  disabled={isActionLoading}
                >
                  {isActionLoading ? "Processing..." : "Start payment"}
                </button>
                {showMobileConfirm ? (
                  <button onClick={startPayment} disabled={isActionLoading} className="primary-confirm">
                    Confirm &amp; proceed
                  </button>
                ) : null}
              </>
            ) : isPending ? (
              <button className="primary-cta" onClick={confirmPayment} disabled={isActionLoading}>
                {isActionLoading ? "Confirming..." : "Confirm payment"}
              </button>
            ) : isPaid ? (
              <button className="primary-cta" onClick={() => router.push("/onboarding/profile")} disabled={isActionLoading}>
                Continue to profile setup
              </button>
            ) : isFailed ? (
              <button className="primary-cta" onClick={startPayment} disabled={isActionLoading}>
                Retry payment
              </button>
            ) : null}

            {ENABLE_MOCK_PROCEED ? (
              <button type="button" className="mock-proceed" onClick={handleMockProceed} disabled={isActionLoading}>
                Mock Proceed (temp)
              </button>
            ) : null}
          </CheckoutCard>
        </div>
      </div>
      {isMobile ? null : (
        <MobileStickyCheckoutBar
          totalAmount={totalAmount}
          formatCurrency={formatCurrency}
          primaryLabel={primaryCtaLabel}
          onPrimaryAction={primaryCtaAction}
          isActionLoading={isActionLoading}
        />
      )}
    </div>
  );
}
