import crypto from "crypto";
import { env } from "../config/env";
import { HttpError } from "../utils/httpErrors";

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

function requireRazorpayConfig() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new HttpError(503, { message: "Payment gateway is not configured." });
  }
  return {
    keyId: env.RAZORPAY_KEY_ID,
    keySecret: env.RAZORPAY_KEY_SECRET
  };
}

function authHeader(keyId: string, keySecret: string) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

export async function createRazorpayOrder(options: { amountInr: number; receipt: string }) {
  const cfg = requireRazorpayConfig();
  const amountPaise = Math.round(options.amountInr * 100);
  if (amountPaise <= 0) {
    throw new HttpError(400, { message: "Invalid payment amount." });
  }

  const response = await fetch(`${RAZORPAY_API_BASE}/orders`, {
    method: "POST",
    headers: {
      Authorization: authHeader(cfg.keyId, cfg.keySecret),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt: options.receipt,
      payment_capture: 1
    })
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new HttpError(502, { message: "Unable to create payment order." });
  }

  const body = (await response.json()) as { id: string; amount: number; currency: string; status: string };
  return {
    orderId: body.id,
    amountPaise: body.amount,
    currency: body.currency,
    status: body.status,
    keyId: cfg.keyId
  };
}

export function verifyRazorpaySignature(options: { orderId: string; paymentId: string; signature: string }) {
  const cfg = requireRazorpayConfig();
  const digest = crypto
    .createHmac("sha256", cfg.keySecret)
    .update(`${options.orderId}|${options.paymentId}`)
    .digest("hex");

  const signatureMatch = crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(options.signature));
  if (!signatureMatch) {
    throw new HttpError(400, { message: "Payment signature verification failed." });
  }
}
