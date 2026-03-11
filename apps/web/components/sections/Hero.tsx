'use client';

import { useEffect, useState } from 'react';

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="min-h-screen bg-gradient-to-b from-[var(--bg-primary)] via-[var(--bg-primary)] to-[var(--bg-secondary)] pt-32 px-6 flex items-center justify-center">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div
          className={`space-y-8 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-serif font-bold leading-tight text-balance">
              Curated
              <br />
              <span className="text-[var(--accent-primary)]">Connection</span>
            </h1>
            <p className="text-xl text-[var(--text-secondary)] leading-relaxed text-pretty max-w-lg">
              Step beyond the ordinary. Elite connects discerning individuals with intention, discretion, and genuine compatibility at the highest level.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button className="px-8 py-4 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded-full font-semibold hover:bg-[var(--accent-secondary)] transition-all hover:shadow-lg hover:shadow-[var(--accent-primary)]/20 text-lg">
              Install App
            </button>
            <button className="px-8 py-4 border border-[var(--accent-primary)] text-[var(--accent-primary)] rounded-full font-semibold hover:bg-[var(--accent-primary)]/10 transition text-lg">
              Learn More
            </button>
          </div>

          <div className="flex items-center space-x-6 text-sm text-[var(--text-tertiary)] pt-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)]"></div>
              <span>iPhone & Android</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)]"></div>
              <span>Verified Members</span>
            </div>
          </div>
        </div>

        <div
          className={`relative h-96 lg:h-full min-h-[500px] transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
          }`}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Phone mockup */}
            <div className="relative w-full max-w-xs">
              <div className="bg-gradient-to-b from-[var(--bg-tertiary)] to-[var(--bg-secondary)] rounded-3xl border-2 border-[var(--border-color)] shadow-2xl overflow-hidden">
                {/* Notch */}
                <div className="h-7 bg-[var(--bg-primary)] rounded-b-3xl mx-auto w-48 border-b border-[var(--border-color)]"></div>
                
                {/* Phone screen content */}
                <div className="bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-tertiary)] p-4 aspect-[9/16]">
                  <div className="h-full flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-serif text-white text-lg">Matches</h3>
                        <span className="text-xs text-[var(--text-tertiary)]">Today</span>
                      </div>
                      
                      <div className="space-y-3">
                        {[1, 2].map((i) => (
                          <div
                            key={i}
                            className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-xl h-20 opacity-80"
                          ></div>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button className="flex-1 h-12 bg-[var(--border-color)] rounded-lg text-white text-sm font-medium hover:bg-opacity-80 transition">
                        Pass
                      </button>
                      <button className="flex-1 h-12 bg-[var(--accent-primary)] rounded-lg text-[var(--bg-primary)] text-sm font-medium hover:bg-[var(--accent-secondary)] transition">
                        Like
                      </button>
                    </div>
                  </div>
                </div>

                {/* Phone bottom bezel */}
                <div className="h-2 bg-[var(--bg-primary)] border-t border-[var(--border-color)]"></div>
              </div>

              {/* Glow effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-transparent opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500 -z-10"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
