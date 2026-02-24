"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BrowsePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/web/discover");
  }, [router]);

  return (
    <div className="public-shell">
      <div className="card">
        <h2>Redirecting...</h2>
        <p className="card-subtitle">Discover is now available at /discover.</p>
      </div>
    </div>
  );
}
