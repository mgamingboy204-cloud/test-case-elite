"use client";

import MarketingShell from "../components/MarketingShell";
import PageHeader from "../components/ui/PageHeader";

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <section className="marketing-page">
        <PageHeader
          title="Privacy"
          subtitle="We prioritize transparency and control over your data."
          variant="marketing"
        />
        <div className="marketing-page__content">
          <div className="ui-card">
            <h3>What we collect</h3>
            <p className="text-muted">
              We collect only what is required to operate the service and improve matchmaking quality.
            </p>
            <ul>
              <li>Profile details you submit during onboarding.</li>
              <li>Verification status and support history.</li>
              <li>Basic usage analytics to improve the experience.</li>
            </ul>
          </div>
          <div className="ui-card ui-card--muted">
            <h3>Your choices</h3>
            <p className="text-muted">Manage visibility and request updates at any time.</p>
            <ul>
              <li>Update or delete profile information from settings.</li>
              <li>Control what appears on your public profile.</li>
              <li>Request data access via support.</li>
            </ul>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
