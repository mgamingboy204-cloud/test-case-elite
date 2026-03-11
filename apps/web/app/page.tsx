'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Hero from '@/components/sections/Hero';
import Trust from '@/components/sections/Trust';
import HowItWorks from '@/components/sections/HowItWorks';
import Difference from '@/components/sections/Difference';
import PWAExplanation from '@/components/sections/PWAExplanation';
import FinalCTA from '@/components/sections/FinalCTA';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to app if already authenticated and on mobile
  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      // Check if mobile or PWA
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

      if (isMobile || isPWA) {
        router.push('/app');
      }
    }
  }, [isAuthenticated, isLoading, router]);

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
