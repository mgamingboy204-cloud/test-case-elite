import { apiRequestAuth } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export type PlanId = "ONE_MONTH" | "FIVE_MONTHS" | "TWELVE_MONTHS";
export type PaymentStatus = "NOT_STARTED" | "PENDING" | "PAID" | "FAILED" | "CANCELED";

export type PaymentOverview = {
  paymentStatus: PaymentStatus;
  onboardingStep: string;
  plans: Array<{
    plan: PlanId;
    amountInr: number;
    durationMonths: number;
    taxIncluded: boolean;
    autoRenew: boolean;
    renewalPolicy: "MANUAL_ONLY";
  }>;
};

export type PaymentInitResponse =
  | {
      paymentRef: string;
      gateway: "razorpay";
      razorpay: { keyId: string; orderId: string; amountPaise: number; currency: string };
    }
  | {
      paymentRef: string;
      gateway: "mock";
      mock: { orderId: string; paymentId: string; signature: string };
    };

export async function fetchPaymentOverview() {
  return apiRequestAuth<PaymentOverview>(API_ENDPOINTS.payments.overview);
}

export async function initiatePayment(tier: PlanId) {
  return apiRequestAuth<PaymentInitResponse>(API_ENDPOINTS.payments.initiate, {
    method: "POST",
    body: JSON.stringify({ tier })
  });
}

export async function verifyPayment(payload: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  return apiRequestAuth(API_ENDPOINTS.payments.verify, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function failPayment(reason?: string) {
  return apiRequestAuth(API_ENDPOINTS.payments.fail, {
    method: "POST",
    body: JSON.stringify({ reason })
  });
}

export async function completeMockPayment() {
  return apiRequestAuth(API_ENDPOINTS.payments.mockComplete, { method: "POST" });
}
