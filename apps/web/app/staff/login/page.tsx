"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { routeForAuthenticatedUser } from "@/lib/onboarding";

export default function StaffLoginPage() {
  const router = useRouter();
  const { startEmployeeLogin, isAuthResolved, isAuthenticated, user } = useAuth();
  const [employeeId, setEmployeeId] = useState("VAEL-EMP-001");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthResolved || !isAuthenticated || !user) return;
    router.replace(routeForAuthenticatedUser(user));
  }, [isAuthResolved, isAuthenticated, router, user]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (employeeId.trim().length < 2) return;
    if (password.length < 1) return;

    setLoading(true);
    try {
      await startEmployeeLogin(employeeId, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0d1118] p-6">
        <h1 className="text-2xl font-serif tracking-wide text-white">
          VAEL <span className="text-[#C89B90]">Staff</span> Login
        </h1>
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/45">Secure internal operations</p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.14em] text-white/50 mb-2">Employee ID</label>
            <input
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-3 text-sm text-white focus:outline-none focus:border-[#C89B90]/60"
              placeholder="VAEL-EMP-001"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.14em] text-white/50 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-3 text-sm text-white focus:outline-none focus:border-[#C89B90]/60"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-vael-primary disabled:opacity-60">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
