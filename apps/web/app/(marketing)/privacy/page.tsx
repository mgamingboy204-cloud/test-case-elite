export default function PrivacyPage() {
  const sections = [
    { title: "1. Information We Collect", body: "We collect account details, profile content, and usage signals needed to run and improve matching." },
    { title: "2. How We Use Data", body: "Data is used to deliver the service, improve recommendations, and protect member safety." },
    { title: "3. Data Sharing", body: "We do not sell personal data. We only share data with necessary service providers or when legally required." },
    { title: "4. Your Choices", body: "You can update profile information, adjust privacy settings, or request account deletion." },
  ];

  return (
    <div className="page-bg">
      <div className="legal-wrap">
        <h1>Privacy Policy</h1>
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
