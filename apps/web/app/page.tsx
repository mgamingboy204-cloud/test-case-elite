"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="public-shell">
      <nav className="landing-nav">
        <Link href="/" className="rail-brand">
          ELITE MATCH
        </Link>
        <div className="landing-links">
          <Link href="/safety">Safety</Link>
          <Link href="/support">Support</Link>
        </div>
        <Link className="btn btn-secondary" href="/login">
          Log in
        </Link>
      </nav>

      <section className="landing-hero">
        <div className="hero-content">
          <h1>Elite matches. Real intentions.</h1>
          <p>
            A premium dating experience built for people who value privacy, verification, and meaningful connections.
          </p>
          <div className="hero-actions">
            <Link className="btn" href="/signup">
              Create account
            </Link>
            <Link className="hero-link" href="/login">
              Already a member? Log in
            </Link>
          </div>
        </div>
        <div className="hero-media" aria-hidden="true" />
      </section>

      <section className="feature-grid">
        {[
          {
            title: "Verified community",
            body: "Profiles go through verification to reduce fake accounts and build trust."
          },
          {
            title: "Serious & friends modes",
            body: "Choose what you’re here for — dating or genuine friendships — and match with clarity."
          },
          {
            title: "Privacy-first",
            body: "Your data stays protected. Control what you share and when."
          },
          {
            title: "Premium experience",
            body: "Clean design, fast experience, no clutter."
          },
          {
            title: "Real-time updates",
            body: "Likes, matches, and verification updates stay in sync."
          }
        ].map((item) => (
          <div key={item.title} className="ui-card ui-card--outline">
            <h3>{item.title}</h3>
            <p className="text-muted">{item.body}</p>
          </div>
        ))}
      </section>

      <footer className="site-footer">
        <div className="landing-links">
          <Link href="/safety">Safety</Link>
          <Link href="/support">Support</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
        <span>© ELITE MATCH. All rights reserved.</span>
      </footer>
    </div>
  );
}
