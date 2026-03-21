"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import { ApiError } from "@/lib/api";
import { fetchAdminAuditLogs } from "@/lib/internalOps";
import { useLiveResourceRefresh } from "@/contexts/LiveUpdatesContext";
import { ADMIN_AUDIT_FALLBACK_MS } from "@/lib/resourceSync";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<Awaited<ReturnType<typeof fetchAdminAuditLogs>>["logs"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const payload = await fetchAdminAuditLogs();
      setLogs(payload.logs);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      setError(apiError?.message ?? "Unable to load audit logs.");
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
    eventTypes: ["admin.audit_logs.changed"],
    fallbackIntervalMs: ADMIN_AUDIT_FALLBACK_MS
  });

  return (
    <div className="p-8 space-y-6 text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif uppercase tracking-[0.14em]">Audit Logs</h1>
          <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/45">Critical internal activity across staff and operational workflows</p>
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
                <div>{entry.targetType} • {entry.targetId}</div>
                <div>{new Date(entry.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
