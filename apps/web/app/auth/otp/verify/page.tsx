import { redirect } from "next/navigation";

export default function AuthOtpVerifyRedirect() {
  redirect("/otp");
}
