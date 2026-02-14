export default function TermsPage() {
  const sections = [
    { title: "1. Acceptance of Terms", body: "By accessing or using Private Club, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform." },
    { title: "2. Eligibility", body: "You must be at least 18 years of age to use Private Club. By creating an account, you represent and warrant that you meet this requirement." },
    { title: "3. Account Registration", body: "You must provide accurate, complete information during registration. You are responsible for maintaining the confidentiality of your account credentials." },
    { title: "4. Membership & Payments", body: "Private Club offers paid membership plans. All payments are processed securely. Subscriptions auto-renew unless cancelled before the renewal date." },
    { title: "5. User Conduct", body: "You agree not to: harass, abuse, or threaten other users; create fake profiles; use the platform for commercial purposes; or violate any applicable laws." },
    { title: "6. Content", body: "You retain ownership of content you upload. By uploading, you grant Private Club a license to display your content within the platform." },
    { title: "7. Termination", body: "We reserve the right to suspend or terminate your account at any time for violations of these terms or for any other reason at our discretion." },
    { title: "8. Limitation of Liability", body: "Private Club is provided 'as is' without warranties. We are not liable for any damages arising from your use of the platform." },
    { title: "9. Changes to Terms", body: "We may modify these terms at any time. Continued use after changes constitutes acceptance of the updated terms." },
  ];

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
      <h1 style={{ marginBottom: 8 }}>Terms of Service</h1>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 40 }}>
        Last updated: January 2026
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {sections.map((s) => (
          <div key={s.title}>
            <h3 style={{ marginBottom: 8 }}>{s.title}</h3>
            <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.7 }}>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
