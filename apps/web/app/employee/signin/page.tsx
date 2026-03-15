"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, setAuthToken } from "@/lib/api";

export default function EmployeeSigninPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<{ accessToken: string }>("/employee/auth/login", {
        method: "POST",
        body: JSON.stringify({ employeeId: employeeId.trim(), password, rememberMe: true })
      });
      setAuthToken(response.accessToken);
      router.replace("/verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white flex items-center justify-center px-6">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-[#1f222b] bg-[#0f1218] p-8 space-y-5">
        <div>
          <h1 className="text-2xl font-serif">Employee Sign In</h1>
          <p className="text-xs text-white/50 uppercase tracking-[0.18em] mt-2">Private internal workspace</p>
        </div>

        <label className="block text-xs uppercase tracking-[0.15em] text-white/60">
          Employee ID
          <input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="mt-2 w-full rounded-lg border border-[#2a2f3b] bg-black/30 px-3 py-2 text-sm" required />
        </label>

        <label className="block text-xs uppercase tracking-[0.15em] text-white/60">
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-lg border border-[#2a2f3b] bg-black/30 px-3 py-2 text-sm" required />
        </label>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button disabled={loading} className="w-full rounded-lg border border-[#C89B90]/40 bg-[#C89B90]/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#f1c8be] disabled:opacity-60">
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
