"use client";

import { Loader2, RefreshCcw } from "lucide-react";
import { useEmployeeEscalationsData } from "@/lib/opsState";

export default function EmployeeIncidentDeskPage() {
  const escalationsQuery = useEmployeeEscalationsData();
  const items = escalationsQuery.data ?? [];
  const error = escalationsQuery.error instanceof Error ? escalationsQuery.error.message : null;

  return (
    <div className="p-8 space-y-6 text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif uppercase tracking-[0.14em]">Incident Desk</h1>
          <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/45">Operational escalations that need concierge attention</p>
        </div>
        <button
          type="button"
          onClick={() => void escalationsQuery.refetch()}
          className="rounded-full border border-white/20 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-white/75"
        >
          <span className="inline-flex items-center gap-2">
            {escalationsQuery.isFetching ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
            Refresh
          </span>
        </button>
      </div>

      {escalationsQuery.isPending && items.length === 0 ? (
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
              <p className="mt-1 text-xs text-white/55">{item.member.phone}{item.member.email ? ` - ${item.member.email}` : ""}</p>
              <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-amber-200">{item.status.replaceAll("_", " ")}</p>
              <p className="mt-1 text-xs text-white/60">WhatsApp help requested {new Date(item.requestedAt).toLocaleString()}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
