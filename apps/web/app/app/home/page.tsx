import { redirect } from "next/navigation";

import { appNavigate } from "@/lib/appNavigation";

export default function AppNativeHomePage() {
  redirect(appNavigate("/app/discover"));
}
