"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="card">
      <h2>Redirecting...</h2>
      <p className="card-subtitle">Sending you to the new login experience.</p>
    </div>
  );
}
