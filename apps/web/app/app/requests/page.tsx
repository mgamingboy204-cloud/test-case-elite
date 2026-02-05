"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LikesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/likes");
  }, [router]);

  return (
    <div className="card">
      <h2>Redirecting...</h2>
      <p className="card-subtitle">Likes now live at /likes.</p>
    </div>
  );
}
