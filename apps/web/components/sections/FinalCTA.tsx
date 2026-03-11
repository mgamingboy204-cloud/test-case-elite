'use client';

export default function FinalCTA() {
  return (
    <section className="py-24 px-6 bg-[var(--bg-secondary)]">
      <div className="max-w-4xl mx-auto text-center space-y-12">
        <div className="space-y-6">
          <h2 className="text-4xl lg:text-5xl xl:text-6xl font-serif font-bold leading-tight">
            Ready for <span className="text-[var(--accent-primary)]">Genuine</span> Connection?
          </h2>
          <p className="text-xl text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
            Join the Elite community of discerning individuals who refuse to settle for casual interactions. Your perfect match is waiting.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-10 py-4 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded-full font-semibold hover:bg-[var(--accent-secondary)] transition-all hover:shadow-lg hover:shadow-[var(--accent-primary)]/20 text-lg">
            Install App Now
          </button>
          <button className="px-10 py-4 border border-[var(--accent-primary)] text-[var(--accent-primary)] rounded-full font-semibold hover:bg-[var(--accent-primary)]/10 transition text-lg">
            Learn About Premium
          </button>
        </div>

        <div className="grid grid-cols-3 gap-8 pt-8">
          <div>
            <div className="text-3xl font-serif font-bold text-[var(--accent-primary)]">10K+</div>
            <p className="text-[var(--text-tertiary)] text-sm mt-2">Verified Members</p>
          </div>
          <div>
            <div className="text-3xl font-serif font-bold text-[var(--accent-primary)]">15K+</div>
            <p className="text-[var(--text-tertiary)] text-sm mt-2">Successful Matches</p>
          </div>
          <div>
            <div className="text-3xl font-serif font-bold text-[var(--accent-primary)]">98%</div>
            <p className="text-[var(--text-tertiary)] text-sm mt-2">Satisfaction Rate</p>
          </div>
        </div>
      </div>
    </section>
  );
}
