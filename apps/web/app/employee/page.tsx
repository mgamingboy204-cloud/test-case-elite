"use client";

import { Loader2, RefreshCcw } from "lucide-react";
import { useEmployeeDashboardData } from "@/lib/opsState";

export default function EmployeeHomePage() {
  const dashboardQuery = useEmployeeDashboardData();
  const data = dashboardQuery.data ?? null;
  const error = dashboardQuery.error instanceof Error ? dashboardQuery.error.message : null;

  return (
    <div className="p-8 space-y-6 text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif uppercase tracking-[0.14em]">Work Summary</h1>
          <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/45">Your current operational load and open queues</p>
        </div>
        <button
          type="button"
          onClick={() => void dashboardQuery.refetch()}
          className="rounded-full border border-white/20 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-white/75"
        >
          <span className="inline-flex items-center gap-2">{dashboardQuery.isFetching ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />} Refresh</span>
        </button>
      </div>

      {dashboardQuery.isPending && !data ? (
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
