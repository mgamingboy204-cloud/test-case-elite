"use client";

import MarketingShell from "../components/MarketingShell";
import PageHeader from "../components/ui/PageHeader";

export default function SafetyPage() {
  return (
    <MarketingShell>
      <section className="marketing-page">
        <PageHeader
          title="Safety by design"
          subtitle="Layered verification and proactive controls keep your experience secure."
          variant="marketing"
        />
        <div className="marketing-page__content">
          <div className="ui-card">
            <h3>Verification standards</h3>
            <p className="text-muted">
              We require identity and video verification before members unlock introductions.
            </p>
            <ul>
              <li>Live concierge checks for authenticity.</li>
              <li>Profile media reviewed before approval.</li>
              <li>Verified badges highlight trusted members.</li>
            </ul>
          </div>
          <div className="ui-card ui-card--muted">
            <h3>Privacy controls</h3>
            <p className="text-muted">Manage what you share and who can reach you.</p>
            <ul>
              <li>Block and report options with fast review.</li>
              <li>Flexible visibility for photos and details.</li>
              <li>Session security with secure, HTTP-only cookies.</li>
            </ul>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
