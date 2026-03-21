"use client";

import { Loader2, RefreshCcw } from "lucide-react";
import { useAdminAuditLogsData } from "@/lib/opsState";

export default function AdminAuditPage() {
  const auditQuery = useAdminAuditLogsData();
  const logs = auditQuery.data ?? [];
  const error = auditQuery.error instanceof Error ? auditQuery.error.message : null;

  return (
    <div className="p-8 space-y-6 text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif uppercase tracking-[0.14em]">Audit Logs</h1>
          <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/45">Critical internal activity across staff and operational workflows</p>
        </div>
        <button
          type="button"
          onClick={() => void auditQuery.refetch()}
          className="rounded-full border border-white/20 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-white/75"
        >
          <span className="inline-flex items-center gap-2">
            {auditQuery.isFetching ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
            Refresh
          </span>
        </button>
      </div>

      {auditQuery.isPending && logs.length === 0 ? (
        <div className="inline-flex items-center gap-2 text-sm text-white/65"><Loader2 size={16} className="animate-spin" /> Loading audit logs...</div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-[#0d1118] overflow-hidden">
          <div className="grid grid-cols-[1fr,0.9fr,1fr,1fr] gap-3 px-4 py-3 text-[10px] uppercase tracking-[0.14em] text-white/45 border-b border-white/5">
            <div>Action</div>
            <div>Actor</div>
            <div>Target</div>
            <div>Time</div>
          </div>
          <div className="divide-y divide-white/5">
            {logs.map((entry) => (
              <div key={entry.id} className="grid grid-cols-[1fr,0.9fr,1fr,1fr] gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p>{entry.action.replaceAll("_", " ")}</p>
                  {"body" in entry.metadata && typeof entry.metadata.body === "string" ? (
                    <p className="mt-1 text-xs text-white/50 line-clamp-2">{entry.metadata.body}</p>
                  ) : null}
                </div>
                <div>{entry.actor ? `${entry.actor.name} (${entry.actor.role})` : "System"}</div>
                <div>{entry.targetType} - {entry.targetId}</div>
                <div>{new Date(entry.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
