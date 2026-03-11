'use client';

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Create Your Profile',
      description: 'Tell us about yourself. What makes you unique? Your preferences, values, and what you\'re looking for.'
    },
    {
      number: '02',
      title: 'Get Verified',
      description: 'Complete our verification process. We ensure every member is real, genuine, and serious about connection.'
    },
    {
      number: '03',
      title: 'Discover Matches',
      description: 'Browse curated matches tailored to your preferences. See who aligns with your values and interests.'
    },
    {
      number: '04',
      title: 'Connect Meaningfully',
      description: 'Exchange messages with your matches. Build real connections in a safe, private environment.'
    }
  ];

  return (
    <section id="how-it-works" className="py-24 px-6 bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-6 mb-20">
          <h2 className="text-4xl lg:text-5xl font-serif font-bold">
            How It <span className="text-[var(--accent-primary)]">Works</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            A seamless journey from signup to meaningful connections, designed with elegance and simplicity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              <div className="p-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl hover:border-[var(--accent-primary)] transition-all hover:shadow-lg hover:shadow-[var(--accent-primary)]/10">
                <div className="absolute -top-6 -left-6 w-16 h-16 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full flex items-center justify-center border-4 border-[var(--bg-primary)]">
                  <span className="text-[var(--bg-primary)] font-serif font-bold text-xl">
                    {step.number}
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  <h3 className="text-2xl font-semibold text-[var(--text-primary)]">
                    {step.title}
                  </h3>
                  <p className="text-[var(--text-tertiary)] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <button className="px-10 py-4 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded-full font-semibold hover:bg-[var(--accent-secondary)] transition-all hover:shadow-lg hover:shadow-[var(--accent-primary)]/20 text-lg">
            Start Your Journey
          </button>
        </div>
      </div>
    </section>
  );
}
