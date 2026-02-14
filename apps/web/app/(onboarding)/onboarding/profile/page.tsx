import { redirect } from "next/navigation";

export default function LegacyOnboardingProfilePage() {
  redirect("/onboarding/profile-setup");
}
