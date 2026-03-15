import bcrypt from "bcrypt";
import { env } from "../config/env";
import { HttpError } from "../utils/httpErrors";
import { sendTwilioOtp, verifyTwilioOtp } from "./twilioVerifyService";

const MOCK_OTP_CODE = "123456";

type OtpProvider = {
  issueOtp: (phone: string) => Promise<{ codeHash: string }>;
  verifyOtp: (options: { phone: string; code: string; codeHash: string }) => Promise<void>;
};

const mockOtpProvider: OtpProvider = {
  async issueOtp() {
    const codeHash = await bcrypt.hash(MOCK_OTP_CODE, 10);
    return { codeHash };
  },
  async verifyOtp(options) {
    const matches = await bcrypt.compare(options.code, options.codeHash);
    if (!matches) {
      throw new HttpError(401, { message: "Invalid OTP. Please try again." });
    }
  }
};

const twilioOtpProvider: OtpProvider = {
  async issueOtp(phone) {
    const codeHash = await bcrypt.hash(`${Date.now()}-${phone}`, 10);
    await sendTwilioOtp(phone);
    return { codeHash };
  },
  async verifyOtp(options) {
    await verifyTwilioOtp(options.phone, options.code);
  }
};

function resolveOtpProvider(): OtpProvider {
  if (env.OTP_PROVIDER === "twilio") {
    return twilioOtpProvider;
  }
  return mockOtpProvider;
}

export async function issueOtpFromProvider(phone: string) {
  return resolveOtpProvider().issueOtp(phone);
}

export async function verifyOtpFromProvider(options: { phone: string; code: string; codeHash: string }) {
  await resolveOtpProvider().verifyOtp(options);
}

export function getOtpProviderMode() {
  return env.OTP_PROVIDER;
}
