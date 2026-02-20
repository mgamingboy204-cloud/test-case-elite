"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Inter, Playfair_Display } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    // Prevent the "bounce" effect common in PWAs
    document.body.style.overscrollBehavior = "none";
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={`pwa-wrapper ${inter.variable} ${playfair.variable}`}>
      
      {/* HEADER: Fixes the hardware collision (Battery/Notch) */}
      <header className={`pwa-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <span className="logo">ELITE MATCH</span>
          <Link href="/login" className="pwa-login">Sign In</Link>
        </div>
      </header>

      <main className="pwa-main">
        {/* HERO: Background image as requested with Premium Overlay */}
        <section className="hero-full">
          <div className="hero-bg"></div>
          <div className="hero-content">
            <span className="kicker">Invitation-Only Matchmaking</span>
            <h1>Start something <br/>epic.</h1>
            <p className="description">
              A private introduction service for discerning individuals who value 
              elegance, discretion, and exceptional chemistry.
            </p>
            
            <div className="action-stack">
              <button className="btn-primary">Request Invitation</button>
              <button className="btn-secondary">Existing Member</button>
            </div>
          </div>
        </section>

        {/* WHY SECTION: Clean spacing, no unnecessary stats */}
        <section className="reveal-section">
          <p className="kicker gold">The Standard</p>
          <h2>Exclusivity. Redefined.</h2>
          
          <div className="card-grid">
            <div className="pwa-card">
              <h3>Boutique Curation</h3>
              <p>Personalized matching that aligns with your specific lifestyle and status.</p>
            </div>
            <div className="pwa-card">
              <h3>Global Access</h3>
              <p>Connections within the most exclusive circles in major global hubs.</p>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .pwa-wrapper {
          --rose-gold: linear-gradient(135deg, #B76E79 0%, #91545D 100%);
          --pearl: #FDFCFB;
          background: #0B0B0B;
          color: var(--pearl);
          font-family: var(--font-inter), sans-serif;
          /* Prevents pulling down to refresh or seeing white gaps */
          height: 100dvh;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        /* HARDWARE STATUS BAR FIX */
        .pwa-nav {
          position: fixed;
          top: 0;
          width: 100%;
          z-index: 1000;
          /* This is the magic for iPhone XR and Dynamic Islands */
          padding-top: env(safe-area-inset-top, 20px);
          transition: background 0.4s ease;
        }

        .nav-inner {
          padding: 15px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .pwa-nav.scrolled {
          background: rgba(11, 11, 11, 0.85);
          backdrop-filter: blur(20px);
        }

        .logo {
          font-family: var(--font-playfair);
          letter-spacing: 0.3em;
          font-weight: 700;
          font-size: 0.85rem;
        }

        /* HERO STYLING */
        .hero-full {
          position: relative;
          height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 24px;
          text-align: center;
        }

        .hero-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.4)), 
                      url('https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2000');
          background-size: cover;
          background-position: center;
        }

        .hero-content {
          position: relative;
          z-index: 10;
          animation: fadeUp 1.2s cubic-bezier(0.22, 1, 0.36, 1);
        }

        h1 {
          font-family: var(--font-playfair);
          font-size: clamp(2.8rem, 12vw, 5rem);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          line-height: 1.05;
          margin: 15px 0 25px;
        }

        .description {
          max-width: 500px;
          margin: 0 auto 35px;
          font-size: 1.05rem;
          line-height: 1.7;
          opacity: 0.85;
        }

        /* PWA NATIVE STYLE BUTTONS */
        .action-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          max-width: 320px;
          margin: 0 auto;
        }

        .btn-primary {
          background: var(--rose-gold);
          border: none;
          color: white;
          padding: 18px;
          border-radius: 14px; /* Squircle style for PWA */
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          box-shadow: 0 8px 24px rgba(145, 84, 93, 0.3);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 18px;
          border-radius: 14px;
          backdrop-filter: blur(10px);
        }

        /* REVEAL SECTION */
        .reveal-section {
          padding: 80px 24px;
          background: #0B0B0B;
          /* Margin for safe area home bar */
          padding-bottom: calc(80px + env(safe-area-inset-bottom, 20px));
        }

        .card-grid {
          display: grid;
          gap: 16px;
          margin-top: 40px;
        }

        .pwa-card {
          background: rgba(255, 255, 255, 0.03);
          border: 0.5px solid rgba(183, 110, 121, 0.2);
          padding: 30px;
          border-radius: 20px;
          text-align: left;
        }

        .pwa-card h3 {
          font-family: var(--font-playfair);
          color: #B76E79;
          margin-bottom: 10px;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (min-width: 768px) {
          .action-stack { flex-direction: row; max-width: 600px; }
          .card-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
}
