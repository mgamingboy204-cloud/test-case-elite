import { getServerExperienceHint } from "@/app/_core/experience";
import PwaPage from "@/app/_ui/pwa/app/MatchesPage";
import WebPage from "@/app/_ui/web/app/MatchesPage";

export default async function MatchesPage() {
  const experience = await getServerExperienceHint();
  return experience === "pwa" ? <PwaPage /> : <WebPage />;
}
