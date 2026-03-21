"use client";

import Link from "next/link";
import { Loader2, RefreshCcw } from "lucide-react";
import { useAssignedCasesData } from "@/lib/opsState";

export default function EmployeeAssignedCasesPage() {
  const assignedCasesQuery = useAssignedCasesData();
  const cases = assignedCasesQuery.data ?? [];
  const error = assignedCasesQuery.error instanceof Error ? assignedCasesQuery.error.message : null;

  return (
    <div className="p-8 space-y-6 text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif uppercase tracking-[0.14em]">My Assigned Cases</h1>
          <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/45">Verification and match cases currently owned by you</p>
        </div>
        <button
          type="button"
          onClick={() => void assignedCasesQuery.refetch()}
          className="rounded-full border border-white/20 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-white/75"
        >
          <span className="inline-flex items-center gap-2">{assignedCasesQuery.isFetching ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />} Refresh</span>
        </button>
      </div>

      {assignedCasesQuery.isPending && cases.length === 0 ? (
        <div className="inline-flex items-center gap-2 text-sm text-white/65"><Loader2 size={16} className="animate-spin" /> Loading cases...</div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      ) : cases.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-[#0d1118] p-6 text-sm text-white/55">No cases assigned to you right now.</div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-[#0d1118] overflow-hidden">
          <div className="grid grid-cols-[0.9fr,1.4fr,1.2fr,1fr,0.8fr] gap-3 px-4 py-3 text-[10px] uppercase tracking-[0.14em] text-white/45 border-b border-white/5">
            <div>Case Type</div>
            <div>Participants</div>
            <div>Status</div>
            <div>Updated</div>
            <div />
          </div>
          <div className="divide-y divide-white/5">
            {cases.map((caseItem) => (
              <div key={caseItem.id} className="grid grid-cols-[0.9fr,1.4fr,1.2fr,1fr,0.8fr] gap-3 px-4 py-3 items-center">
                <div className="text-sm">{caseItem.caseType.replaceAll("_", " ")}</div>
                <div className="min-w-0">
                  <p className="truncate text-sm">{caseItem.participants.map((entry) => entry.name).join(" x ")}</p>
                  <p className="mt-1 text-xs text-white/45 truncate">{caseItem.summary}</p>
                </div>
                <div className="text-sm">{caseItem.status.replaceAll("_", " ")}</div>
                <div className="text-sm text-white/65">{new Date(caseItem.updatedAt).toLocaleString()}</div>
                <div className="flex justify-end">
                  <Link href={caseItem.deskRoute} className="rounded-lg border border-white/15 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-white/75">
                    Open desk
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
