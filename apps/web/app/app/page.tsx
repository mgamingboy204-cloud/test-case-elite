"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AppHome() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/app/discover");
  }, [router]);

  return (
    <div className="card">
      <h2>Loading your dashboard...</h2>
      <p className="card-subtitle">Preparing your premium experience.</p>
    </div>
  );
}
