import { redirect } from "next/navigation";

export default function AuthOtpSendRedirect() {
  redirect("/otp");
}
