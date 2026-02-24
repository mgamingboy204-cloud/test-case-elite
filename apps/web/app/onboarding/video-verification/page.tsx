import { getServerExperienceHint } from "@/app/_core/experience";
import PwaPage from "@/app/_ui/pwa/onboarding/VideoVerificationPage";
import WebPage from "@/app/_ui/web/onboarding/VideoVerificationPage";

export default async function VideoVerificationPage() {
  const experience = await getServerExperienceHint();
  return experience === "pwa" ? <PwaPage /> : <WebPage />;
}
