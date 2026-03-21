"use client";

import { Loader2, RefreshCcw } from "lucide-react";
import { useAdminEscalationsData } from "@/lib/opsState";

export default function AdminEscalationsPage() {
  const escalationsQuery = useAdminEscalationsData();
  const data = escalationsQuery.data ?? null;
  const error = escalationsQuery.error instanceof Error ? escalationsQuery.error.message : null;

  return (
    <div className="p-8 space-y-6 text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif uppercase tracking-[0.14em]">Escalations</h1>
          <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/45">Verification help requests, reports, and refund attention queue</p>
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

      {escalationsQuery.isPending && !data ? (
        <div className="inline-flex items-center gap-2 text-sm text-white/65"><Loader2 size={16} className="animate-spin" /> Loading escalations...</div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      ) : data ? (
        <div className="grid gap-6 xl:grid-cols-3">
          <section className="rounded-xl border border-white/10 bg-[#0d1118] p-5">
            <h2 className="text-sm uppercase tracking-[0.16em] text-white/60">WhatsApp Verification Help</h2>
            <div className="mt-4 space-y-3">
              {data.verification.length === 0 ? <p className="text-sm text-white/50">No active verification escalations.</p> : data.verification.map((item) => (
                <article key={item.id} className="rounded-xl border border-amber-300/20 bg-amber-500/10 p-3">
                  <p className="text-sm font-medium">{item.member.name}</p>
                  <p className="mt-1 text-xs text-white/60">{item.member.phone}{item.member.email ? ` - ${item.member.email}` : ""}</p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-amber-200">{item.status.replaceAll("_", " ")}</p>
                  <p className="mt-1 text-xs text-white/55">Requested {new Date(item.requestedAt).toLocaleString()}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#0d1118] p-5">
            <h2 className="text-sm uppercase tracking-[0.16em] text-white/60">Open Reports</h2>
            <div className="mt-4 space-y-3">
              {data.reports.length === 0 ? <p className="text-sm text-white/50">No open reports.</p> : data.reports.map((report) => (
                <article key={report.id} className="rounded-xl border border-white/10 p-3">
                  <p className="text-sm font-medium">{report.reason}</p>
                  <p className="mt-1 text-xs text-white/55">Reporter: {report.reporter.name} - Target: {report.reportedUser.name}</p>
                  {report.details ? <p className="mt-2 text-sm text-white/75">{report.details}</p> : null}
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#0d1118] p-5">
            <h2 className="text-sm uppercase tracking-[0.16em] text-white/60">Pending Refunds</h2>
            <div className="mt-4 space-y-3">
              {data.refunds.length === 0 ? <p className="text-sm text-white/50">No pending refunds.</p> : data.refunds.map((refund) => (
                <article key={refund.id} className="rounded-xl border border-white/10 p-3">
                  <p className="text-sm font-medium">{refund.member.name}</p>
                  <p className="mt-1 text-xs text-white/55">{refund.member.phone}{refund.member.email ? ` - ${refund.member.email}` : ""}</p>
                  <p className="mt-2 text-xs text-white/60">Requested {new Date(refund.requestedAt).toLocaleString()}</p>
                  {refund.reason ? <p className="mt-2 text-sm text-white/75">{refund.reason}</p> : null}
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
