"use client";

import MarketingShell from "../components/MarketingShell";
import PageHeader from "../components/ui/PageHeader";

export default function FaqPage() {
  return (
    <MarketingShell>
      <section className="marketing-page">
        <PageHeader
          title="Frequently asked questions"
          subtitle="Answers to the most common questions from new members."
          variant="marketing"
        />
        <div className="marketing-page__content">
          <div className="ui-card">
            <h3>How long does verification take?</h3>
            <p className="text-muted">
              Most verifications are completed within one to two business days.
            </p>
          </div>
          <div className="ui-card ui-card--muted">
            <h3>Can I change my intent?</h3>
            <p className="text-muted">
              Yes. Update your intent any time from your profile preferences.
            </p>
          </div>
          <div className="ui-card">
            <h3>How do I contact support?</h3>
            <p className="text-muted">
              Visit the support page to reach our concierge team.
            </p>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
