import { getServerExperienceHint } from "@/app/_core/experience";
import PwaLoginPage from "@/app/_ui/pwa/auth/LoginPage";
import WebLoginPage from "@/app/_ui/web/auth/LoginPage";

export default async function LoginPage() {
  const experience = await getServerExperienceHint();
  return experience === "pwa" ? <PwaLoginPage /> : <WebLoginPage />;
}
