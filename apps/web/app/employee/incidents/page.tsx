"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import { ApiError } from "@/lib/api";
import { fetchEmployeeEscalations } from "@/lib/internalOps";
import { useLiveResourceRefresh } from "@/contexts/LiveUpdatesContext";
import { EMPLOYEE_SUMMARY_FALLBACK_MS } from "@/lib/resourceSync";

export default function EmployeeIncidentDeskPage() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof fetchEmployeeEscalations>>["escalations"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const payload = await fetchEmployeeEscalations();
      setItems(payload.escalations);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      setError(apiError?.message ?? "Unable to load incidents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useLiveResourceRefresh({
    enabled: true,
    refresh: () => load(),
    eventTypes: ["admin.verification.queue.changed"],
    fallbackIntervalMs: EMPLOYEE_SUMMARY_FALLBACK_MS
  });

  return (
    <div className="p-8 space-y-6 text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif uppercase tracking-[0.14em]">Incident Desk</h1>
          <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/45">Operational escalations that need concierge attention</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-full border border-white/20 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-white/75"
        >
          <span className="inline-flex items-center gap-2"><RefreshCcw size={14} /> Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="inline-flex items-center gap-2 text-sm text-white/65"><Loader2 size={16} className="animate-spin" /> Loading incidents...</div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-[#0d1118] p-6 text-sm text-white/55">No active incidents right now.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-xl border border-amber-300/20 bg-[#0d1118] p-4">
              <p className="text-sm font-medium">{item.member.name}</p>
              <p className="mt-1 text-xs text-white/55">{item.member.phone}{item.member.email ? ` • ${item.member.email}` : ""}</p>
              <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-amber-200">{item.status.replaceAll("_", " ")}</p>
              <p className="mt-1 text-xs text-white/60">WhatsApp help requested {new Date(item.requestedAt).toLocaleString()}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
