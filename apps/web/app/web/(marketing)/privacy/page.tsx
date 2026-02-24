import { MarketingContentPage } from "@/app/components/MarketingContentPage";

export default function PrivacyPage() {
  const sections = [
    { title: "1. Information We Collect", body: "We collect information you provide during registration (phone number, profile data, photos) and usage data (interactions, preferences, device information)." },
    { title: "2. How We Use Your Data", body: "Your data is used to: provide and improve the service, match you with compatible users, ensure platform safety, and communicate with you about your account." },
    { title: "3. Data Sharing", body: "We do not sell your personal data. We share data only with: service providers who help us operate the platform, law enforcement when required by law, and other users as part of the matching process." },
    { title: "4. Data Security", body: "We use industry-standard encryption and security measures to protect your data. However, no system is 100% secure." },
    { title: "5. Your Rights", body: "You have the right to: access your data, correct inaccuracies, delete your account, export your data, and opt out of marketing communications." },
    { title: "6. Data Retention", body: "We retain your data for as long as your account is active. Upon deletion, your data is removed within 30 days, except where required by law." },
    { title: "7. Contact", body: "For privacy-related inquiries, contact our Data Protection Officer at privacy@elitematch.com." }
  ];

  return (
    <MarketingContentPage title="Privacy Policy" subtitle="Last updated: January 2026">
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {sections.map((section) => (
          <article key={section.title} className="marketing-panel" style={{ padding: "24px 24px 26px" }}>
            <h3 style={{ marginBottom: 10 }}>{section.title}</h3>
            <p className="marketing-kicker">{section.body}</p>
          </article>
        ))}
      </div>
    </MarketingContentPage>
  );
}
