"use client";

import { Navigation } from "@/components/ui/navigation";
import { Footer } from "@/components/ui/footer";
import { ReactNode } from "react";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    // min-h-screen ensures the Pearl White background fills the page
    // overflow-y-auto ensures that scrolling is explicitly allowed here
    <div className="flex flex-col min-h-screen w-full overflow-y-auto overflow-x-hidden bg-background">
      <Navigation />

      {/* Remove 'relative' if not needed to avoid z-index stacking bugs */}
      <main className="flex-1 w-full">
        {children}
      </main>

      <Footer />
    </div>
  );
}