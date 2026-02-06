"use client";

import MarketingShell from "../components/MarketingShell";
import PageHeader from "../components/ui/PageHeader";

export default function ContactPage() {
  return (
    <MarketingShell>
      <section className="marketing-page">
        <PageHeader
          title="Contact"
          subtitle="Get in touch with the ELITE MATCH concierge team."
          variant="marketing"
        />
        <div className="marketing-page__content">
          <div className="ui-card">
            <h3>Support channels</h3>
            <p className="text-muted">
              We respond quickly to onboarding, verification, and account requests.
            </p>
            <ul>
              <li>Concierge support within one business day.</li>
              <li>Dedicated verification assistance.</li>
              <li>Profile and membership guidance.</li>
            </ul>
          </div>
          <div className="ui-card ui-card--muted">
            <h3>Before you reach out</h3>
            <p className="text-muted">You may find answers in our FAQ or Learn resources.</p>
            <ul>
              <li>Review common questions in the FAQ.</li>
              <li>Visit Learn for onboarding steps.</li>
              <li>Check Safety for trust and verification details.</li>
            </ul>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
