"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="grid two-column">
      <section className="card hero">
        <h2>Elite Match</h2>
        <p>
          Premium, verified introductions with consent-first phone exchange and concierge approval.
        </p>
        <div className="hero-actions">
          <Link className="primary-link" href="/login">
            Login
          </Link>
          <Link className="secondary-link" href="/signup">
            Sign Up
          </Link>
        </div>
        <p className="card-subtitle">Join now to unlock curated introductions.</p>
      </section>
      <section className="card">
        <h3>What you get</h3>
        <ul className="list">
          <li className="list-item">
            <span>01</span>
            <strong>Concierge verification and premium onboarding.</strong>
          </li>
          <li className="list-item">
            <span>02</span>
            <strong>Swipe-style discovery without distractions.</strong>
          </li>
          <li className="list-item">
            <span>03</span>
            <strong>Mutual consent before phone numbers are revealed.</strong>
          </li>
        </ul>
      </section>
    </div>
  );
}
