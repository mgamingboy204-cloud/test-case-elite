"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BrowsePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/app/discover");
  }, [router]);

  return (
    <div className="card">
      <h2>Redirecting...</h2>
      <p className="card-subtitle">Discover has moved to the /app shell.</p>
    </div>
  );
}
