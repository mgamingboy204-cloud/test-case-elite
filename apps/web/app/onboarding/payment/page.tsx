import { getServerExperienceHint } from "@/app/_core/experience";
import PwaPage from "@/app/_ui/pwa/onboarding/PaymentPage";
import WebPage from "@/app/_ui/web/onboarding/PaymentPage";

export default async function OnboardingPaymentPage() {
  const experience = await getServerExperienceHint();
  return experience === "pwa" ? <PwaPage /> : <WebPage />;
}
