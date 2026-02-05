"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DiscoverRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/discover");
  }, [router]);

  return (
    <div className="card">
      <h2>Redirecting...</h2>
      <p className="card-subtitle">Discover is now available at /discover.</p>
    </div>
  );
}
