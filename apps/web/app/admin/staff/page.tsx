"use client";

import { useMemo, useState } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import { ApiError } from "@/lib/api";
import { useCreateStaffMemberMutation, useSetStaffActivationMutation, useStaffMembersData, type StaffMember } from "@/lib/opsState";

type FormState = {
  firstName: string;
  lastName: string;
  displayName: string;
  phone: string;
  email: string;
  role: "EMPLOYEE" | "ADMIN";
};

const EMPTY_FORM: FormState = {
  firstName: "",
  lastName: "",
  displayName: "",
  phone: "",
  email: "",
  role: "EMPLOYEE"
};

export default function AdminStaffPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const staffQuery = useStaffMembersData();
  const createStaffMutation = useCreateStaffMemberMutation();
  const setStaffActivationMutation = useSetStaffActivationMutation();
  const staff = staffQuery.data ?? [];
  const loadError = staffQuery.error instanceof Error ? staffQuery.error.message : null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setTemporaryPassword(null);
    try {
      const payload = await createStaffMutation.mutateAsync({
        firstName: form.firstName || null,
        lastName: form.lastName || null,
        displayName: form.displayName || null,
        phone: form.phone,
        email: form.email || null,
        role: form.role
      });
      setSuccess(`Created ${payload.staff.role.toLowerCase()} ${payload.staff.employeeId}.`);
      setTemporaryPassword(payload.temporaryPassword);
      setForm(EMPTY_FORM);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      setError(apiError?.message ?? "Unable to create staff member.");
    }
  };

  const toggleActivation = async (member: StaffMember) => {
    setBusyId(member.id);
    setError(null);
    setSuccess(null);
    try {
      const payload = await setStaffActivationMutation.mutateAsync({
        staffUserId: member.id,
        active: !member.isActive
      });
      const nextName = payload.staff.name || member.name;
      setSuccess(member.isActive ? `Deactivated ${nextName}.` : `Reactivated ${nextName}.`);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      setError(apiError?.message ?? "Unable to update staff member.");
    } finally {
      setBusyId(null);
    }
  };

  const stats = useMemo(() => ({
    total: staff.length,
    active: staff.filter((entry) => entry.isActive).length,
    admins: staff.filter((entry) => entry.role === "ADMIN").length,
    mustReset: staff.filter((entry) => entry.mustResetPassword).length
  }), [staff]);

  return (
    <div className="p-8 space-y-6 text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif uppercase tracking-[0.14em]">Staff Management</h1>
          <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/45">Internal employee/admin provisioning and lifecycle control</p>
        </div>
        <button
          type="button"
          onClick={() => void staffQuery.refetch().catch((err) => setError(err instanceof Error ? err.message : "Unable to refresh staff."))}
          className="rounded-full border border-white/20 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-white/75"
        >
          <span className="inline-flex items-center gap-2">{staffQuery.isFetching ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />} Refresh</span>
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Total staff", stats.total],
          ["Active staff", stats.active],
          ["Admins", stats.admins],
          ["Must reset password", stats.mustReset]
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-[#0d1118] p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">{label}</p>
            <p className="mt-2 text-3xl text-[#f0c8be]">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
        <section className="rounded-xl border border-white/10 bg-[#0d1118] p-5">
          <h2 className="text-sm uppercase tracking-[0.16em] text-white/60">Create staff account</h2>
          <p className="mt-2 text-xs text-white/45">Creates an internal account with a temporary password and a forced reset on first login.</p>

          <form onSubmit={submit} className="mt-5 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input value={form.firstName} onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))} placeholder="First name" className="rounded-xl border border-white/15 bg-black/20 px-3 py-3 text-sm" />
              <input value={form.lastName} onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))} placeholder="Last name" className="rounded-xl border border-white/15 bg-black/20 px-3 py-3 text-sm" />
            </div>
            <input value={form.displayName} onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))} placeholder="Display name (optional)" className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-3 text-sm" />
            <div className="grid gap-3 md:grid-cols-2">
              <input value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} placeholder="Phone" className="rounded-xl border border-white/15 bg-black/20 px-3 py-3 text-sm" />
              <input value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="Email" className="rounded-xl border border-white/15 bg-black/20 px-3 py-3 text-sm" />
            </div>
            <select value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as "EMPLOYEE" | "ADMIN" }))} className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-3 text-sm">
              <option value="EMPLOYEE" className="text-black">Employee</option>
              <option value="ADMIN" className="text-black">Admin</option>
            </select>

            {error ?? loadError ? <p className="text-sm text-red-300">{error ?? loadError}</p> : null}
            {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
            {temporaryPassword ? (
              <div className="rounded-xl border border-amber-300/35 bg-amber-500/10 p-3 text-sm text-amber-100">
                Temporary password: <span className="font-semibold">{temporaryPassword}</span>
              </div>
            ) : null}

            <button type="submit" disabled={createStaffMutation.isPending} className="btn-vael-primary disabled:opacity-60">
              {createStaffMutation.isPending ? "Creating..." : "Create staff account"}
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-white/10 bg-[#0d1118] overflow-hidden">
          <div className="grid grid-cols-[1.3fr,0.8fr,0.9fr,0.8fr] gap-3 px-4 py-3 text-[10px] uppercase tracking-[0.14em] text-white/45 border-b border-white/5">
            <div>Staff</div>
            <div>Role</div>
            <div>State</div>
            <div />
          </div>
          {staffQuery.isPending && staff.length === 0 ? (
            <div className="p-4 text-sm text-white/65 inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading staff...</div>
          ) : (
            <div className="divide-y divide-white/5">
              {staff.map((member) => (
                <div key={member.id} className="grid grid-cols-[1.3fr,0.8fr,0.9fr,0.8fr] gap-3 px-4 py-3 items-center">
                  <div className="min-w-0">
                    <p className="truncate">{member.name}</p>
                    <p className="mt-1 text-xs text-white/45">{member.employeeId}{member.email ? ` - ${member.email}` : ""}</p>
                  </div>
                  <div className="text-sm">{member.role}</div>
                  <div className="text-sm text-white/70">{member.isActive ? (member.mustResetPassword ? "Needs reset" : "Active") : "Deactivated"}</div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={busyId === member.id}
                      onClick={() => void toggleActivation(member)}
                      className="rounded-lg border border-white/15 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-white/75 disabled:opacity-45"
                    >
                      {member.isActive ? "Deactivate" : "Reactivate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
