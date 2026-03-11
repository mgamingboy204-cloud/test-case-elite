'use client';

export default function Trust() {
  const features = [
    {
      icon: '🔒',
      title: 'End-to-End Encrypted',
      description: 'Your conversations are completely private and secure. No one, not even us, can access your messages.'
    },
    {
      icon: '✓',
      title: 'Verified Members Only',
      description: 'Every profile is manually verified. We ensure authenticity, safety, and genuine intentions from day one.'
    },
    {
      icon: '🛡️',
      title: 'Privacy First',
      description: 'We never sell your data. Your information stays completely confidential and is never shared with third parties.'
    },
    {
      icon: '👤',
      title: 'Anonymous Profiles',
      description: 'Share what you want, when you want. Maintain complete control over your personal information and visibility.'
    }
  ];

  return (
    <section className="py-24 px-6 bg-[var(--bg-secondary)]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-6 mb-20">
          <h2 className="text-4xl lg:text-5xl font-serif font-bold">
            Trust &amp; <span className="text-[var(--accent-primary)]">Privacy</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            At Elite, your security and privacy are non-negotiable. We've built the platform with the highest standards of protection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, i) => (
            <div
              key={i}
              className="p-8 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl hover:border-[var(--accent-primary)] transition-colors group"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3 text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition">
                {feature.title}
              </h3>
              <p className="text-[var(--text-tertiary)] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
