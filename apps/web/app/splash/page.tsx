import { getServerExperienceHint } from "@/app/_core/experience";
import PwaPage from "@/app/_ui/pwa/entry/SplashPage";
import WebPage from "@/app/_ui/web/entry/SplashPage";

export default async function SplashPage() {
  const experience = await getServerExperienceHint();
  return experience === "pwa" ? <PwaPage /> : <WebPage />;
}
