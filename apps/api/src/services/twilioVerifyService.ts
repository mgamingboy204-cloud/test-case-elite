import { env } from "../config/env";
import { HttpError } from "../utils/httpErrors";

const TWILIO_API_BASE = "https://verify.twilio.com/v2/Services";

function normalizeCountryCode(raw: string) {
  if (!raw) return "+91";
  return raw.startsWith("+") ? raw : `+${raw}`;
}

export function normalizePhoneForTwilio(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!/^\d{10}$/.test(digits)) {
    throw new HttpError(400, { message: "Phone number must be exactly 10 digits." });
  }
  return `${normalizeCountryCode(env.OTP_COUNTRY_CODE)}${digits}`;
}

function requireTwilioConfig() {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_VERIFY_SERVICE_SID) {
    throw new HttpError(503, { message: "OTP service is not configured." });
  }
  return {
    accountSid: env.TWILIO_ACCOUNT_SID,
    authToken: env.TWILIO_AUTH_TOKEN,
    verifyServiceSid: env.TWILIO_VERIFY_SERVICE_SID
  };
}

function authHeader(accountSid: string, authToken: string) {
  const token = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  return `Basic ${token}`;
}

export async function sendTwilioOtp(phone: string) {
  const cfg = requireTwilioConfig();
  const to = normalizePhoneForTwilio(phone);

  const response = await fetch(`${TWILIO_API_BASE}/${cfg.verifyServiceSid}/Verifications`, {
    method: "POST",
    headers: {
      Authorization: authHeader(cfg.accountSid, cfg.authToken),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({ To: to, Channel: "sms" })
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new HttpError(502, { message: "Failed to send OTP. Please try again shortly." });
  }
}

export async function verifyTwilioOtp(phone: string, code: string) {
  const cfg = requireTwilioConfig();
  const to = normalizePhoneForTwilio(phone);

  const response = await fetch(`${TWILIO_API_BASE}/${cfg.verifyServiceSid}/VerificationCheck`, {
    method: "POST",
    headers: {
      Authorization: authHeader(cfg.accountSid, cfg.authToken),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({ To: to, Code: code })
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new HttpError(502, { message: "OTP verification service failed. Please retry." });
  }

  const parsed = (await response.json()) as { status?: string; valid?: boolean };
  if (!parsed.valid || parsed.status !== "approved") {
    throw new HttpError(401, { message: "Invalid OTP. Please try again." });
  }
}
