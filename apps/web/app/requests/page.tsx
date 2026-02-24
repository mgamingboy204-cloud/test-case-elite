import { getServerExperienceHint } from "@/app/_core/experience";
import PwaPage from "@/app/_ui/pwa/app/RequestsPage";
import WebPage from "@/app/_ui/web/app/RequestsPage";

export default async function RequestsPage() {
  const experience = await getServerExperienceHint();
  return experience === "pwa" ? <PwaPage /> : <WebPage />;
}
