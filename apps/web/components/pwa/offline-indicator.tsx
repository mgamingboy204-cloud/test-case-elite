"use client";

import { useEffect, useState } from "react";

export function OfflineIndicator() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 top-3 z-[100] rounded-full border border-amber-500/30 bg-amber-950/85 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-amber-200 backdrop-blur">
      Offline mode
    </div>
  );
}
