"use client";

import Link from "next/link";
import MarketingShell from "./components/MarketingShell";

export default function HomePage() {
  return (
    <MarketingShell>
      <section className="marketing-hero">
        <div className="marketing-hero__content">
          <span className="marketing-hero__tag">PREMIUM INTRODUCTIONS</span>
          <h1>
            Elite matches.
            <br />
            Real intentions.
          </h1>
          <p>
            A premium dating experience built for people who value privacy, verification, and meaningful
            connections.
          </p>
          <div className="marketing-hero__actions">
            <Link className="btn" href="/signup">
              Create account
            </Link>
            <Link className="btn btn-ghost" href="/learn">
              Learn more
            </Link>
          </div>
        </div>
        <div className="marketing-hero__media" aria-hidden="true" />
      </section>

      <section className="marketing-features">
        {[
          {
            title: "Verified community",
            body: "Profiles go through concierge verification to reduce fake accounts and build trust."
          },
          {
            title: "Intent-first matching",
            body: "Choose dating or friends mode and connect with people who share your goals."
          },
          {
            title: "Privacy & control",
            body: "Manage visibility, data sharing, and notifications with confidence."
          },
          {
            title: "Premium experience",
            body: "Thoughtful design, curated introductions, and zero clutter."
          }
        ].map((item) => (
          <div key={item.title} className="ui-card ui-card--outline marketing-feature-card">
            <h3>{item.title}</h3>
            <p className="text-muted">{item.body}</p>
          </div>
        ))}
      </section>
    </MarketingShell>
  );
}
