export default function CookiePolicyPage() {
  const sections = [
    { title: "What Are Cookies?", body: "Cookies are small text files stored on your device when you visit our website. They help us provide a better experience." },
    { title: "Essential Cookies", body: "These cookies are necessary for the website to function. They enable core features like authentication, security, and accessibility." },
    { title: "Analytics Cookies", body: "We use analytics cookies to understand how visitors interact with our platform, helping us improve the user experience." },
    { title: "Preference Cookies", body: "These cookies remember your settings, such as theme preference (light/dark mode) and language." },
    { title: "Managing Cookies", body: "You can manage or disable cookies through your browser settings. Note that disabling certain cookies may affect platform functionality." },
  ];

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
      <h1 style={{ marginBottom: 8 }}>Cookie Policy</h1>
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
