"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AppLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="card">
      <h2>Redirecting to sign in…</h2>
    </div>
  );
}
