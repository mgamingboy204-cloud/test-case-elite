"use client";

import MarketingShell from "../components/MarketingShell";
import PageHeader from "../components/ui/PageHeader";

export default function TermsPage() {
  return (
    <MarketingShell>
      <section className="marketing-page">
        <PageHeader
          title="Terms"
          subtitle="Clear expectations for a respectful, trusted community."
          variant="marketing"
        />
        <div className="marketing-page__content">
          <div className="ui-card">
            <h3>Community standards</h3>
            <p className="text-muted">
              ELITE MATCH is built around mutual respect and authenticity.
            </p>
            <ul>
              <li>Keep profiles accurate and up to date.</li>
              <li>Respect boundaries and communicate thoughtfully.</li>
              <li>No harassment, spam, or impersonation.</li>
            </ul>
          </div>
          <div className="ui-card ui-card--muted">
            <h3>Account responsibilities</h3>
            <p className="text-muted">Protect access and notify us of any concerns.</p>
            <ul>
              <li>Keep login credentials secure.</li>
              <li>Report suspicious activity promptly.</li>
              <li>Review updates to these terms as they evolve.</li>
            </ul>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
