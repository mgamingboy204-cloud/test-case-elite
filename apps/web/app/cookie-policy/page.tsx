"use client";

import MarketingShell from "../components/MarketingShell";
import PageHeader from "../components/ui/PageHeader";

export default function CookiePolicyPage() {
  return (
    <MarketingShell>
      <section className="marketing-page">
        <PageHeader
          title="Cookie Policy"
          subtitle="Simple, transparent details about how we use cookies."
          variant="marketing"
        />
        <div className="marketing-page__content">
          <div className="ui-card">
            <h3>Essential cookies</h3>
            <p className="text-muted">
              We use essential cookies to keep your session secure and make the site function correctly.
            </p>
            <ul>
              <li>Authentication and session continuity.</li>
              <li>Security and fraud prevention.</li>
              <li>Performance monitoring to improve reliability.</li>
            </ul>
          </div>
          <div className="ui-card ui-card--muted">
            <h3>Your preferences</h3>
            <p className="text-muted">You can manage your settings from your browser at any time.</p>
            <ul>
              <li>Review cookie settings in your browser.</li>
              <li>Opt out of non-essential analytics.</li>
              <li>Contact support with questions.</li>
            </ul>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
