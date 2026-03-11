'use client';

export default function PWAExplanation() {
  const benefits = [
    {
      title: 'Install from Browser',
      description: 'No app store needed. Simply install Elite directly from your browser in seconds.'
    },
    {
      title: 'Works Offline',
      description: 'The app continues to work seamlessly even without an internet connection.'
    },
    {
      title: 'Native App Feel',
      description: 'Indistinguishable from native apps. Full screen, home screen icon, instant launch.'
    },
    {
      title: 'Always Up-to-Date',
      description: 'Updates happen automatically in the background. Never miss a feature.'
    },
    {
      title: 'Space Efficient',
      description: 'Small footprint. Takes minimal storage space on your device.'
    },
    {
      title: 'Safe & Secure',
      description: 'PWAs are served over HTTPS with same security standards as native apps.'
    }
  ];

  return (
    <section id="pwa" className="py-24 px-6 bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-serif font-bold">
                The Elite <span className="text-[var(--accent-primary)]">Experience</span>
              </h2>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed text-pretty">
                Elite is built as a Progressive Web App. It installs directly from your browser and feels like a native mobile app—but with the added benefits of being lightweight, secure, and always updated.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Why PWA?</h3>
              <p className="text-[var(--text-tertiary)] leading-relaxed">
                We chose PWA technology to give you the best of both worlds: the reliability and feel of a native app with the accessibility and security of modern web technology. No complicated installation. No app store restrictions. Just pure, elegant connection.
              </p>
            </div>

            <button className="px-8 py-4 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded-full font-semibold hover:bg-[var(--accent-secondary)] transition-all hover:shadow-lg hover:shadow-[var(--accent-primary)]/20">
              Install Now
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {benefits.map((benefit, i) => (
              <div
                key={i}
                className="p-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl hover:border-[var(--accent-primary)] transition-colors group"
              >
                <h4 className="text-lg font-semibold mb-2 text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition">
                  {benefit.title}
                </h4>
                <p className="text-sm text-[var(--text-tertiary)]">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 bg-gradient-to-r from-[var(--bg-secondary)] to-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl p-12">
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-[var(--text-primary)]">
              How to Install
            </h3>
            <ol className="space-y-3 text-[var(--text-secondary)]">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent-primary)] text-[var(--bg-primary)] flex items-center justify-center text-sm font-semibold">
                  1
                </span>
                <span>Open Elite on your mobile browser</span>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent-primary)] text-[var(--bg-primary)] flex items-center justify-center text-sm font-semibold">
                  2
                </span>
                <span>Tap the menu icon and select "Add to Home Screen"</span>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent-primary)] text-[var(--bg-primary)] flex items-center justify-center text-sm font-semibold">
                  3
                </span>
                <span>Confirm and tap "Add" when the prompt appears</span>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent-primary)] text-[var(--bg-primary)] flex items-center justify-center text-sm font-semibold">
                  4
                </span>
                <span>That's it! Elite is now on your home screen like any native app</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
