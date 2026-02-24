"use client";

import { MarketingContentPage } from "@/app/components/MarketingContentPage";

export default function CookiePolicyPage() {
  const sections = [
    { title: "What Are Cookies?", body: "Cookies are small text files stored on your device when you visit our website. They help us provide a better experience." },
    { title: "Essential Cookies", body: "These cookies are necessary for the website to function. They enable core features like authentication, security, and accessibility." },
    { title: "Analytics Cookies", body: "We use analytics cookies to understand how visitors interact with our platform, helping us improve the user experience." },
    { title: "Preference Cookies", body: "These cookies remember your settings, such as theme preference (light/dark mode) and language." },
    { title: "Managing Cookies", body: "You can manage or disable cookies through your browser settings. Note that disabling certain cookies may affect platform functionality." }
  ];

  return (
    <MarketingContentPage title="Cookie Policy" subtitle="Last updated: January 2026">
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
