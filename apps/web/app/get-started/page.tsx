import { getServerExperienceHint } from "@/app/_core/experience";
import PwaPage from "@/app/_ui/pwa/entry/GetStartedPage";
import WebPage from "@/app/_ui/web/entry/GetStartedPage";

export default async function GetStartedPage() {
  const experience = await getServerExperienceHint();
  return experience === "pwa" ? <PwaPage /> : <WebPage />;
}
