"use client";

import { useMemo } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import { useAdminMembersData } from "@/lib/opsState";

export default function AdminMembersPage() {
  const membersQuery = useAdminMembersData();
  const members = membersQuery.data ?? [];
  const error = membersQuery.error instanceof Error ? membersQuery.error.message : null;

  const stats = useMemo(() => ({
    total: members.length,
    approved: members.filter((member) => member.status === "APPROVED").length,
    pendingVerification: members.filter((member) => member.onboardingStep === "VIDEO_VERIFICATION_PENDING").length,
    active: members.filter((member) => member.onboardingStep === "ACTIVE").length
  }), [members]);

  return (
    <div className="p-8 space-y-6 text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif uppercase tracking-[0.14em]">Members</h1>
          <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/45">Full member lifecycle oversight</p>
        </div>
        <button
          type="button"
          onClick={() => void membersQuery.refetch()}
          className="rounded-full border border-white/20 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-white/75"
        >
          <span className="inline-flex items-center gap-2">
            {membersQuery.isFetching ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
            Refresh
          </span>
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Total members", stats.total],
          ["Approved", stats.approved],
          ["Verification pending", stats.pendingVerification],
          ["Active", stats.active]
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-[#0d1118] p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">{label}</p>
            <p className="mt-2 text-3xl text-[#f0c8be]">{value}</p>
          </div>
        ))}
      </div>

      {membersQuery.isPending && members.length === 0 ? (
        <div className="inline-flex items-center gap-2 text-sm text-white/65">
          <Loader2 size={16} className="animate-spin" /> Loading members...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-[#0d1118] overflow-hidden">
          <div className="grid grid-cols-[1.5fr,0.8fr,0.9fr,0.9fr,1fr] gap-3 px-4 py-3 text-[10px] uppercase tracking-[0.14em] text-white/45 border-b border-white/5">
            <div>Member</div>
            <div>Status</div>
            <div>Onboarding</div>
            <div>Verification</div>
            <div>Created</div>
          </div>
          <div className="divide-y divide-white/5">
            {members.map((member) => (
              <div key={member.id} className="grid grid-cols-[1.5fr,0.8fr,0.9fr,0.9fr,1fr] gap-3 px-4 py-3 text-sm items-center">
                <div className="min-w-0">
                  <p className="truncate">
                    {member.profile?.name ?? ([member.firstName, member.lastName].filter(Boolean).join(" ") || member.displayName || member.phone)}
                  </p>
                  <p className="mt-1 text-xs text-white/45">{member.phone}{member.email ? ` - ${member.email}` : ""}</p>
                </div>
                <div>{member.status}</div>
                <div>{member.onboardingStep.replaceAll("_", " ")}</div>
                <div>{member.videoVerificationStatus.replaceAll("_", " ")}</div>
                <div>{new Date(member.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
