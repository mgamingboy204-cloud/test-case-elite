export default function TermsPage() {
  const sections = [
    { title: "1. Acceptance of Terms", body: "By using Elite Match, you agree to these terms. If you do not agree, please do not use the service." },
    { title: "2. Eligibility", body: "You must be at least 18 years old to create and maintain an account." },
    { title: "3. Accounts", body: "You are responsible for your account credentials and for keeping profile details accurate." },
    { title: "4. Membership & Billing", body: "Paid memberships may auto-renew unless canceled before renewal." },
    { title: "5. Conduct", body: "Harassment, impersonation, fraud, and illegal behavior are strictly prohibited." },
    { title: "6. Termination", body: "We may suspend or terminate accounts for violations of these terms." },
  ];

  return (
    <div className="page-bg">
      <div className="legal-wrap">
        <h1>Terms of Service</h1>
        <p className="updated">Last updated: January 2026</p>
        <div className="legal-stack">
          {sections.map((section) => (
            <section key={section.title}>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </div>

      <style jsx>{`
        .page-bg { padding: 2rem 1rem 5rem; }
        .legal-wrap {
          max-width: 860px;
          margin: 0 auto;
          border-radius: 28px;
          padding: 2rem;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(15, 15, 15, 0.7);
          backdrop-filter: blur(25px);
          box-shadow: 0 22px 48px rgba(0,0,0,0.32);
        }
        h1, h3 { color: #fff; }
        .updated { color: rgba(255,255,255,0.78); margin: 0.4rem 0 1.5rem; }
        .legal-stack { display: grid; gap: 1.2rem; }
        p { color: rgba(255,255,255,0.82); line-height: 1.7; }
        @media (max-width: 768px) { .legal-wrap { padding: 1.3rem; border-radius: 22px; } .page-bg { padding-top: 1rem; } }
      `}</style>
    </div>
  );
}
