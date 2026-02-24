import { getServerExperienceHint } from "@/app/_core/experience";
import PwaSignupPage from "@/app/_ui/pwa/auth/SignupPage";
import WebSignupPage from "@/app/_ui/web/auth/SignupPage";

export default async function SignupPage() {
  const experience = await getServerExperienceHint();
  return experience === "pwa" ? <PwaSignupPage /> : <WebSignupPage />;
}
