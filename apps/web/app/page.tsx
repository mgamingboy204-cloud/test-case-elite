'use client';

import { useState } from 'react';
import Hero from '@/components/sections/Hero';
import Trust from '@/components/sections/Trust';
import HowItWorks from '@/components/sections/HowItWorks';
import Difference from '@/components/sections/Difference';
import PWAExplanation from '@/components/sections/PWAExplanation';
import FinalCTA from '@/components/sections/FinalCTA';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Navigation />
      <Hero />
      <Trust />
      <HowItWorks />
      <Difference />
      <PWAExplanation />
      <FinalCTA />
      <Footer />
    </main>
  );
}
