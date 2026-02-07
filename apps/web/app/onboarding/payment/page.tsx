"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../../lib/api";
import { queryKeys } from "../../../lib/queryKeys";
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
type PaymentStatusResponse = {
  paymentStatus?: "NOT_STARTED" | "PENDING" | "COMPLETED" | "FAILED" | null;
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
                  {couponState === "validating" ? "Checking" : "Apply"}
                </button>
              )}
            </div>
            {couponMessage ? <p className={`coupon-message ${couponState}`}>{couponMessage}</p> : null}
          </>
        ) : null}
      </div>

      <div className="summary-table">
        <div>
          <span>Subtotal</span>
          <span>{formatCurrency(subtotalAmount)}</span>
        </div>
        <div>
          <span>Discount</span>
          <span>-{formatCurrency(discountAmount)}</span>
        </div>
        <div className="summary-total">
          <span>Total due</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
      </div>

      {children}

      {message ? <p className={`message ${status}`}>{message}</p> : null}
      {isMobile ? <div className="mobile-cta-spacer" /> : null}
    </section>
  );
}

export default function PaymentPage() {
  const router = useRouter();
  const { refresh } = useSession();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showBenefits, setShowBenefits] = useState(true);
  const [showCoupon, setShowCoupon] = useState(false);
  const [couponState, setCouponState] = useState<CouponState>("idle");
  const [couponMessage, setCouponMessage] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponDetails | null>(null);
  const [confirming, setConfirming] = useState(false);

  const paymentQuery = useQuery<PaymentStatusResponse>({
    queryKey: queryKeys.paymentStatus,
    queryFn: () => apiFetch<PaymentStatusResponse>("/payments/me"),
    staleTime: 5000,
    refetchInterval: (result) => {
      if (!result || typeof result !== "object" || !("data" in result)) return false;
      const data = (result as { data?: PaymentStatusResponse }).data;
      const statusValue = data?.paymentStatus ?? null;
      const statusValue = result.data?.paymentStatus ?? null;
      if (!statusValue || statusValue === "NOT_STARTED" || statusValue === "PENDING") {
        return 8000;
      }
      return false;
    }
  });

  const startMutation = useMutation({
    mutationFn: (payload: { couponCode?: string }) =>
      apiFetch<PaymentInitiationResponse>("/payments/mock/start", {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    onSuccess: async (data) => {
      setPaymentStatus(data.paymentStatus);
      setStatus("success");
      setMessage("Payment initiated. Confirm to continue.");
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentStatus });
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
      if (data.paymentLink) {
        window.location.assign(data.paymentLink);
      } else if (data.orderId) {
        openRazorpayCheckout(data.orderId);
      }
      await refresh();
    },
    onError: (error) => {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to start payment.");
    },
    onSettled: () => {
      setConfirming(false);
    }
  });

  const confirmMutation = useMutation({
    mutationFn: () => apiFetch<{ paymentStatus: string }>("/payments/mock/confirm", { method: "POST" }),
    onSuccess: async (data) => {
      setPaymentStatus(data.paymentStatus);
      setStatus("success");
      setMessage("Payment confirmed. Continue to profile setup.");
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentStatus });
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
      await refresh();
    },
    onError: (error) => {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to confirm payment.");
    }
  });

  const couponMutation = useMutation({
    mutationFn: (payload: { code: string }) =>
      apiFetch<CouponValidationResponse>("/payments/coupon/validate", {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    onError: (error) => {
      setAppliedCoupon(null);
      setCouponState("invalid");
      setCouponMessage(error instanceof Error ? error.message : "Unable to validate coupon.");
    }
  });

  const mockProceedMutation = useMutation({
    mutationFn: () => apiFetch<{ paymentStatus: string }>("/payments/mock/confirm", { method: "POST" }),
    onSuccess: async (data) => {
      setPaymentStatus(data.paymentStatus);
      setStatus("success");
      setMessage("Mock proceed complete. Continue to profile setup.");
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentStatus });
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
      await refresh();
    },
    onError: (error) => {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to mock proceed.");
    }
  });

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

  useEffect(() => {
    if (!paymentQuery.data) return;
    setPaymentStatus(paymentQuery.data.paymentStatus ?? null);
  }, [paymentQuery.data]);

  useEffect(() => {
    if (!paymentQuery.isError) return;
    setStatus("error");
    setMessage(paymentQuery.error instanceof Error ? paymentQuery.error.message : "Unable to load payment status.");
  }, [paymentQuery.isError, paymentQuery.error]);

  function formatCurrency(value: number) {
    return currencyFormatter.format(value);
  }

  function startPayment() {
    setStatus("loading");
    setMessage("Starting payment...");
    const payload = appliedCoupon?.code ? { couponCode: appliedCoupon.code } : {};
    startMutation.mutate(payload);
  }

  function confirmPayment() {
    setStatus("loading");
    setMessage("Confirming payment...");
    confirmMutation.mutate();
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
    const response = await couponMutation.mutateAsync({ code: normalized });
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
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponState("idle");
    setCouponMessage("");
  }

  function handleMockProceed() {
    setStatus("loading");
    setMessage("Mock proceed enabled. Completing payment step...");
    mockProceedMutation.mutate();
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
          ? "Continue to profile"
          : isFailed
            ? "Retry payment"
            : "Check status";

  function handlePrimaryAction() {
    if (isPaid) {
      router.push("/onboarding/profile");
      return;
    }
    if (isNotStarted) {
      if (isMobile) {
        setConfirming((prev) => !prev);
        return;
      }
      startPayment();
      return;
    }
    if (isPending || isFailed) {
      confirmPayment();
    }
  }

  return (
    <div className="payment-shell">
      <div className="payment-header">
        <span className="mobile-gate-step">Step 3 of 3</span>
        <h2>Secure your membership</h2>
        <p className="text-muted">One annual membership unlocks curated introductions and concierge support.</p>
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
          onCouponChange={setCouponCode}
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
          <button className="primary" onClick={handlePrimaryAction} disabled={isActionLoading}>
            {isActionLoading ? "Working..." : primaryCtaLabel}
          </button>
          {showMobileConfirm ? (
            <div className="confirm-panel">
              <p className="card-subtitle">Confirm once you’re ready to proceed.</p>
              <button className="primary" onClick={startPayment} disabled={isActionLoading}>
                {isActionLoading ? "Starting..." : "Proceed to payment"}
              </button>
            </div>
          ) : null}
          {ENABLE_MOCK_PROCEED ? (
            <button className="secondary" onClick={handleMockProceed} disabled={isActionLoading}>
              Mock proceed
            </button>
          ) : null}
        </CheckoutCard>
      </div>
    </div>
  );
}
