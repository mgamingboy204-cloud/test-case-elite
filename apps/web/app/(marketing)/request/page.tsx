import Link from "next/link";
import { MarketingContentPage } from "@/app/components/MarketingContentPage";
import { Button } from "@/app/components/ui/Button";

export default function RequestInvitationPage() {
  return (
    <MarketingContentPage
      title="Request Your Invitation"
      subtitle="Join a private network curated for intentional, high-quality connections."
    >
      <div className="marketing-panel" style={{ padding: 24 }}>
        <p className="marketing-kicker" style={{ marginBottom: 20 }}>
          Start your membership application in the app flow.
        </p>
        <Link href="/app/get-started">
          <Button className="marketing-rose-btn" size="lg">Continue to Get Started</Button>
        </Link>
      </div>
    </MarketingContentPage>
  );
}
