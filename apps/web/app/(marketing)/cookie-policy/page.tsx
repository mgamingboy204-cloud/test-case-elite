export default function CookiePolicyPage() {
  const sections = [
    { title: "What Are Cookies?", body: "Cookies are small files that help us remember preferences and keep sessions secure." },
    { title: "Essential Cookies", body: "Required for authentication, security, and basic platform functionality." },
    { title: "Analytics Cookies", body: "Help us understand product usage and improve overall experience." },
    { title: "Managing Cookies", body: "You can control cookies through browser settings, though some features may degrade." },
  ];

  return (
    <div className="page-bg">
      <div className="legal-wrap">
        <h1>Cookie Policy</h1>
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
