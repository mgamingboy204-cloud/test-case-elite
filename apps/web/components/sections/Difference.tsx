'use client';

export default function Difference() {
  return (
    <section id="difference" className="py-24 px-6 bg-[var(--bg-secondary)]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl lg:text-5xl font-serif font-bold leading-tight">
              Beyond Swipe <span className="text-[var(--accent-primary)]">Culture</span>
            </h2>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed text-pretty">
              We reject the endless scroll. Elite reimagines modern matchmaking by combining thoughtful curation with genuine human connection—not shallow profiles, but real people with real intentions.
            </p>

            <div className="space-y-6">
              {[
                {
                  title: 'Curated, Not Algorithmic',
                  desc: 'We review every profile. Quality over quantity, always.'
                },
                {
                  title: 'Intentions Matter',
                  desc: 'We attract people looking for meaningful relationships, not casual games.'
                },
                {
                  title: 'Exclusivity With Purpose',
                  desc: 'Higher standards mean better compatibility and more respectful interactions.'
                },
                {
                  title: 'Premium Experience',
                  desc: 'No ads, no tricks, no endless notifications—just genuine connection.'
                }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[var(--accent-primary)]/20">
                      <svg className="h-5 w-5 text-[var(--accent-primary)]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">{item.title}</h3>
                    <p className="text-[var(--text-tertiary)] mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative h-96 lg:h-full min-h-[500px]">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/10 rounded-3xl blur-3xl"></div>
            <div className="relative bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-3xl p-12 h-full flex flex-col justify-center space-y-8">
              <div className="space-y-4">
                <div className="text-5xl font-serif text-[var(--accent-primary)]">"</div>
                <p className="text-[var(--text-secondary)] text-lg leading-relaxed italic">
                  Elite isn't for everyone—and that's precisely the point. It's for people who value authenticity, discretion, and genuine compatibility above all else.
                </p>
              </div>
              <div className="text-sm text-[var(--text-tertiary)]">
                — The Elite Team
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
