"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiRequestAuth } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { Loader2, ShieldCheck, UserRoundCheck } from "lucide-react";

type EmployeeMemberRow = {
  id: string;
  name: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "BANNED";
  plan: string;
  subscriptionEndsAt: string | null;
  lastActivityAt: string;
};

function formatRelativeTime(iso: string) {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function EmployeeMembersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<EmployeeMemberRow[]>([]);
  const [capacity, setCapacity] = useState<{ max: number; approaching: boolean } | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiRequestAuth<{ members: EmployeeMemberRow[]; capacity: { max: number; approaching: boolean } }>("/employee/members");
        setMembers(res.members);
        setCapacity(res.capacity);
      } catch (err) {
        const apiErr = err instanceof ApiError ? err : null;
        setError(apiErr?.message ?? (err instanceof Error ? err.message : "Unable to load members."));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const approachingBadge = useMemo(() => {
    if (!capacity) return null;
    if (!capacity.approaching) return null;
    return <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-amber-200">Approaching capacity</span>;
  }, [capacity]);

  return (
    <div className="p-8 space-y-6 text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif tracking-wide uppercase">My Members</h1>
          <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/50">
            Assigned users (max {capacity?.max ?? 40})
          </p>
        </div>
        {approachingBadge}
      </div>

      {loading ? (
        <div className="rounded-xl border border-white/10 bg-[#0d1016] p-6 text-sm text-white/65 inline-flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading members…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/35 bg-red-500/10 p-6 text-xs text-red-200">{error}</div>
      ) : members.length === 0 ? (
        <div className="rounded-xl border border-[#1f222b] bg-[#0d1016] p-8 text-sm text-white/60">No assigned members yet.</div>
      ) : (
        <div className="rounded-xl border border-[#1f222b] bg-[#0d1016] overflow-hidden">
          <div className="grid grid-cols-[1.6fr,0.8fr,0.8fr,1fr,0.8fr] gap-2 px-4 py-3 text-[10px] uppercase tracking-[0.14em] text-white/45 border-b border-white/5">
            <div>Name</div>
            <div>Status</div>
            <div>Plan</div>
            <div>Last activity</div>
            <div />
          </div>
          <div className="divide-y divide-white/5">
            {members.map((m) => (
              <div
                key={m.id}
                className="grid grid-cols-[1.6fr,0.8fr,0.8fr,1fr,0.8fr] gap-2 px-4 py-3 items-center"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{m.name}</p>
                  <p className="text-[10px] text-white/45 mt-1">Expires: {m.subscriptionEndsAt ? new Date(m.subscriptionEndsAt).toLocaleDateString("en-IN") : "—"}</p>
                </div>
                <div className="text-sm text-white/85">{m.status}</div>
                <div className="text-sm text-[#C89B90]">{m.plan}</div>
                <div className="text-sm text-white/70">{formatRelativeTime(m.lastActivityAt)}</div>
                <div className="flex justify-end">
                  <Link
                    href="/profile"
                    className="rounded-lg border border-white/15 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-white/75 hover:text-white hover:bg-white/5"
                    title="View profile"
                  >
                    View
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

