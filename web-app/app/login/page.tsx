"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setSession, getUser } from "@/lib/session.utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:3000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid email or password");
      }

      // Save token in cookie & localStorage
      const token = data.data.accessToken;
      setSession(token);

      const user = getUser();
      if (user?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to backend server");
    } finally {
      setLoading(false);
    }
  };

  const fillQuickCredentials = (role: "admin" | "customer") => {
    if (role === "admin") {
      setEmail("admin@kissanvikas.com");
      setPassword("Admin@1234");
    } else {
      setEmail("ramesh.farmer@kissanvikas.com");
      setPassword("Customer@1234");
    }
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#07090E] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] right-[30%] w-[350px] h-[350px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl shadow-emerald-950/30 relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 mb-4">
            <div className="w-full h-full bg-[#0A0D14] rounded-[14px] flex items-center justify-center text-2xl">
              🌿
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Kissan<span className="text-emerald-400">Vikas</span> Portal
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            Smart Polyhouse Digital Twin & Aerial Survey Management
          </p>
        </div>

        {/* Demo Fast-Fill Buttons */}
        <div className="mb-6 p-1 bg-slate-950/60 rounded-xl border border-slate-800/60 flex gap-1">
          <button
            type="button"
            onClick={() => fillQuickCredentials("admin")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              email === "admin@kissanvikas.com"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            👑 Admin Demo
          </button>
          <button
            type="button"
            onClick={() => fillQuickCredentials("customer")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              email === "ramesh.farmer@kissanvikas.com"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            👨‍🌾 Customer Demo
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@kissanvikas.com"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 text-slate-100 placeholder-slate-600 text-sm transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 text-slate-100 placeholder-slate-600 text-sm transition-all outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold text-sm shadow-lg shadow-emerald-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-slate-950"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In to Dashboard →</span>
            )}
          </button>
        </form>

        {/* Footer Note */}
        <div className="mt-8 pt-6 border-t border-slate-800/60 text-center">
          <p className="text-xs text-slate-500">
            Protected Multi-Tenant Agro-Spatial Infrastructure
          </p>
        </div>
      </div>
    </div>
  );
}
