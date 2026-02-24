import { getServerExperienceHint } from "@/app/_core/experience";
import PwaPage from "@/app/_ui/pwa/app/DiscoverPage";
import WebPage from "@/app/_ui/web/app/DiscoverPage";

export default async function DiscoverPage() {
  const experience = await getServerExperienceHint();
  return experience === "pwa" ? <PwaPage /> : <WebPage />;
}
