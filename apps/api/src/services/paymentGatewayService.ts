import crypto from "crypto";
import { env } from "../config/env";
import { HttpError } from "../utils/httpErrors";
import { createRazorpayOrder, verifyRazorpaySignature } from "./razorpayService";

type PaymentProviderInitiateResult =
  | {
      gateway: "razorpay";
      paymentRef: string;
      razorpay: { keyId: string; orderId: string; amountPaise: number; currency: string };
      nextAction: "OPEN_CHECKOUT";
    }
  | {
      gateway: "mock";
      paymentRef: string;
      mock: { orderId: string; paymentId: string; signature: string };
      nextAction: "VERIFY_MOCK_PAYMENT";
    };

const MOCK_PAYMENT_ID_PREFIX = "pay_mock";

function buildMockSignature(orderId: string, paymentId: string) {
  return crypto.createHmac("sha256", env.SESSION_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
}

export async function initiatePaymentGatewayOrder(options: { amountInr: number; receipt: string }): Promise<PaymentProviderInitiateResult> {
  if (env.PAYMENT_PROVIDER === "razorpay") {
    const razorpayOrder = await createRazorpayOrder(options);
    return {
      gateway: "razorpay",
      paymentRef: razorpayOrder.orderId,
      nextAction: "OPEN_CHECKOUT",
      razorpay: {
        keyId: razorpayOrder.keyId,
        orderId: razorpayOrder.orderId,
        amountPaise: razorpayOrder.amountPaise,
        currency: razorpayOrder.currency
      }
    };
  }

  const paymentId = `${MOCK_PAYMENT_ID_PREFIX}_${crypto.randomBytes(8).toString("hex")}`;
  const signature = buildMockSignature(options.receipt, paymentId);
  return {
    gateway: "mock",
    paymentRef: options.receipt,
    nextAction: "VERIFY_MOCK_PAYMENT",
    mock: {
      orderId: options.receipt,
      paymentId,
      signature
    }
  };
}

export function verifyPaymentGatewaySignature(options: { orderId: string; paymentId: string; signature: string }) {
  if (env.PAYMENT_PROVIDER === "razorpay") {
    verifyRazorpaySignature(options);
    return;
  }

  const digest = buildMockSignature(options.orderId, options.paymentId);
  if (!crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(options.signature))) {
    throw new HttpError(400, { message: "Payment signature verification failed." });
  }
}

export function getPaymentProviderMode() {
  return env.PAYMENT_PROVIDER;
}
