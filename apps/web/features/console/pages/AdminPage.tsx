"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, RefreshCcw } from "lucide-react";
import { ApiError, apiRequestAuth } from "@/lib/api";
import { fetchAdminDashboard, type AdminDashboardPayload } from "@/lib/adminDashboard";

type MePayload = { role: "USER" | "EMPLOYEE" | "ADMIN"; isAdmin?: boolean };

function StatCard({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "warn" | "danger" }) {
  const toneClass = tone === "danger" ? "text-red-300" : tone === "warn" ? "text-amber-200" : "text-[#f0c8be]";
  return (
    <div className="rounded-xl border border-[#222733] bg-[#0d1118] p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">{label}</p>
      <p className={`mt-2 text-3xl font-light ${toneClass}`}>{value.toLocaleString()}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const me = await apiRequestAuth<MePayload>("/me");
      if (me.role !== "ADMIN" && !me.isAdmin) {
        setForbidden(true);
        setData(null);
        return;
      }
      setForbidden(false);
      const payload = await fetchAdminDashboard();
      setData(payload);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      if (apiError?.status === 403) {
        setForbidden(true);
        setData(null);
      } else {
        setError(apiError?.message ?? "Unable to load admin dashboard.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  const employeeRows = useMemo(() => data?.employeeWorkload.perEmployee ?? [], [data]);

  if (loading) {
    return (
      <div className="p-10 text-white/70 inline-flex items-center gap-3">
        <Loader2 className="animate-spin" size={18} /> Loading founder dashboard…
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="p-10">
        <div className="max-w-2xl rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-100">
          <p className="text-sm font-medium uppercase tracking-[0.14em]">Access denied</p>
          <p className="mt-3 text-sm text-red-100/80">This dashboard is restricted to founder/admin users only.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10">
        <div className="max-w-2xl rounded-xl border border-amber-500/30 bg-amber-500/10 p-6">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-amber-100 uppercase tracking-[0.12em]">
            <AlertCircle size={16} /> Unable to load dashboard
          </p>
          <p className="mt-3 text-sm text-amber-100/80">{error}</p>
          <button
            onClick={() => void load(false)}
            className="mt-4 rounded-lg border border-amber-200/30 px-4 py-2 text-xs uppercase tracking-[0.15em] text-amber-100"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-10 text-sm text-white/60">No operational data is available yet.</div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif uppercase tracking-[0.14em] text-white">Founder Operations Dashboard</h1>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/45">Business health, queues, and team workload</p>
        </div>
        <button
          disabled={refreshing}
          onClick={() => void load(true)}
          className="rounded-lg border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.15em] text-white/80 disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-2">{refreshing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCcw size={13} />} Refresh</span>
        </button>
      </header>

      <section className="grid grid-cols-4 gap-4">
        <StatCard label="Total users" value={data.businessOverview.totalUsers} />
        <StatCard label="Verified users" value={data.membershipAndVerification.verifiedUsers} />
        <StatCard label="Active subscriptions" value={data.subscriptionOverview.activeSubscriptions} />
        <StatCard label="Pending coordination" value={data.coordinationOperations.pendingCoordinationTotal} tone="warn" />
      </section>

      <section className="grid grid-cols-2 gap-5">
        <div className="rounded-xl border border-[#222733] bg-[#0d1118] p-5 space-y-4">
          <h2 className="text-sm uppercase tracking-[0.18em] text-white/60">Membership & Verification</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Rejected / banned" value={data.membershipAndVerification.rejectedOrBannedUsers} tone="danger" />
            <StatCard label="Onboarding complete" value={data.membershipAndVerification.onboardingCompleted} />
            <StatCard label="Verification queue" value={data.membershipAndVerification.verificationQueue} tone="warn" />
            <StatCard label="Employees" value={data.employeeWorkload.totalEmployees} />
          </div>
        </div>

        <div className="rounded-xl border border-[#222733] bg-[#0d1118] p-5 space-y-4">
          <h2 className="text-sm uppercase tracking-[0.18em] text-white/60">Revenue / Subscription Overview</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="1 month plan" value={data.subscriptionOverview.planDistribution.ONE_MONTH} />
            <StatCard label="5 months plan" value={data.subscriptionOverview.planDistribution.FIVE_MONTHS} />
            <StatCard label="12 months plan" value={data.subscriptionOverview.planDistribution.TWELVE_MONTHS} />
            <StatCard label="Payment issues" value={data.subscriptionOverview.paymentIssueCount} tone="warn" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-5">
        <div className="rounded-xl border border-[#222733] bg-[#0d1118] p-5 space-y-4">
          <h2 className="text-sm uppercase tracking-[0.18em] text-white/60">Engagement & Match Activity</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total likes" value={data.engagementAndMatchActivity.likesCount} />
            <StatCard label="Total matches" value={data.engagementAndMatchActivity.matchesCount} />
            <StatCard label="Offline meet requests" value={data.engagementAndMatchActivity.offlineMeetRequests} />
            <StatCard label="Online meet requests" value={data.engagementAndMatchActivity.onlineMeetRequests} />
            <StatCard label="Social exchange requests" value={data.engagementAndMatchActivity.socialExchangeRequests} />
            <StatCard label="Phone exchange requests" value={data.engagementAndMatchActivity.phoneExchangeRequests} />
          </div>
        </div>

        <div className="rounded-xl border border-[#222733] bg-[#0d1118] p-5 space-y-4">
          <h2 className="text-sm uppercase tracking-[0.18em] text-white/60">Queues / Attention Needed</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Pending verification" value={data.queuesAndAttention.verificationQueue} tone="warn" />
            <StatCard label="Pending coordination" value={data.queuesAndAttention.pendingMatchCoordinationQueue} tone="warn" />
            <StatCard label="Payment issue queue" value={data.queuesAndAttention.paymentIssueQueue} tone="warn" />
            <StatCard label="Operational follow-ups" value={data.queuesAndAttention.pendingOperationalFollowUps} tone="warn" />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[#222733] bg-[#0d1118] p-5">
        <h2 className="text-sm uppercase tracking-[0.18em] text-white/60">Employee Workload</h2>
        {employeeRows.length === 0 ? (
          <p className="mt-4 text-sm text-white/60">No active employees found.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] uppercase tracking-[0.14em] text-white/45">
                <tr>
                  <th className="py-2">Employee</th>
                  <th className="py-2">Assigned Members</th>
                  <th className="py-2">Verification</th>
                  <th className="py-2">Offline Cases</th>
                  <th className="py-2">Online Cases</th>
                  <th className="py-2">Total Active Tasks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-white/85">
                {employeeRows.map((employee) => (
                  <tr key={employee.id}>
                    <td className="py-3">{employee.name}</td>
                    <td className="py-3">{employee.assignedMembers}</td>
                    <td className="py-3">{employee.verificationActive}</td>
                    <td className="py-3">{employee.activeOfflineCases}</td>
                    <td className="py-3">{employee.activeOnlineCases}</td>
                    <td className="py-3">{employee.totalActiveTasks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-[#222733] bg-[#0d1118] p-5">
        <h2 className="text-sm uppercase tracking-[0.18em] text-white/60">Alert / Activity Summary (last {data.alertsActivity.recentWindowDays} days)</h2>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <StatCard label="Total alerts" value={data.alertsActivity.recentAlertsTotal} />
          <StatCard label="Unread operational alerts" value={data.alertsActivity.unreadOperationalAlerts} tone="warn" />
          <StatCard label="Pending follow-up signals" value={data.queuesAndAttention.pendingOperationalFollowUps} tone="warn" />
        </div>
        {data.alertsActivity.byType.length > 0 ? (
          <ul className="mt-4 space-y-1 text-xs text-white/70">
            {data.alertsActivity.byType.map((entry) => (
              <li key={entry.type} className="flex items-center justify-between border-b border-white/5 py-1">
                <span>{entry.type.replaceAll("_", " ")}</span>
                <span>{entry.count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-white/60">No recent alert activity yet.</p>
        )}
      </section>
    </div>
  );
}
