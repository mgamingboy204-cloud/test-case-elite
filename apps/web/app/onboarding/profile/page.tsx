import { getServerExperienceHint } from "@/app/_core/experience";
import PwaPage from "@/app/_ui/pwa/onboarding/ProfilePage";
import WebPage from "@/app/_ui/web/onboarding/ProfilePage";

export default async function OnboardingProfilePage() {
  const experience = await getServerExperienceHint();
  return experience === "pwa" ? <PwaPage /> : <WebPage />;
}
