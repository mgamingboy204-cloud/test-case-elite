"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import { ApiError } from "@/lib/api";
import { fetchEmployeeDashboard } from "@/lib/internalOps";
import { useLiveResourceRefresh } from "@/contexts/LiveUpdatesContext";
import { EMPLOYEE_SUMMARY_FALLBACK_MS } from "@/lib/resourceSync";

export default function EmployeeHomePage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchEmployeeDashboard>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await fetchEmployeeDashboard());
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      setError(apiError?.message ?? "Unable to load work summary.");
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
    eventTypes: ["admin.verification.queue.changed", "admin.offline_meets.changed", "admin.online_meets.changed"],
    fallbackIntervalMs: EMPLOYEE_SUMMARY_FALLBACK_MS
  });

  return (
    <div className="p-8 space-y-6 text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif uppercase tracking-[0.14em]">Work Summary</h1>
          <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/45">Your current operational load and open queues</p>
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
        <div className="inline-flex items-center gap-2 text-sm text-white/65"><Loader2 size={16} className="animate-spin" /> Loading summary...</div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      ) : data ? (
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {[
            ["Pending verification queue", data.pendingVerificationRequests],
            ["My verification cases", data.myVerificationCases],
            ["My offline cases", data.myOfflineCases],
            ["My online cases", data.myOnlineCases],
            ["Assigned members", data.assignedMembers],
            ["Open escalations", data.openEscalations]
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/10 bg-[#0d1118] p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">{label}</p>
              <p className="mt-2 text-3xl text-[#f0c8be]">{value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
