"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import { loginSchema } from "@/validations/auth.schema";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password Modal State
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Standard Email/Password Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Invalid credentials provided");
        setIsLoading(false);
        return;
      }

      const targetDashboard = json.data?.targetDashboard || "/app/dashboard/ceo";
      router.push(targetDashboard);
      router.refresh();
    } catch {
      setError("Network error while communicating with authentication server");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#070b16] text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Background Decorative Ambient Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="absolute top-1/2 left-1/4 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-indigo-600/10 blur-[150px]" />
        <div className="absolute -bottom-32 right-1/3 h-96 w-96 rounded-full bg-amber-500/10 blur-[140px]" />
      </div>

      <div className="relative z-10 flex h-screen w-full flex-col lg:flex-row">
        {/* LEFT COLUMN: Portfolio Brand Image Showcase */}
        <div
          className="relative hidden w-full flex-col overflow-hidden border-r border-[#16233d] bg-gradient-to-br from-[#070b16] via-[#0a1020] to-[#0c1322] lg:flex lg:w-[50%] xl:w-[52%]"
          style={{ height: "100vh" }}
        >
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.025] pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
          {/* Ambient glows */}
          <div className="absolute top-0 left-0 h-64 w-64 rounded-full bg-blue-700/10 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-amber-500/8 blur-[100px] pointer-events-none" />

          {/* ── Header ── */}
          <div className="relative z-10 px-8 pt-7 pb-2 shrink-0">
            <span className="inline-flex items-center rounded-md border border-[#d4af37]/30 bg-[#d4af37]/8 px-2.5 py-1 text-[10px] font-semibold tracking-widest text-[#d4af37] uppercase">
              Our Portfolio
            </span>
            <h2 className="mt-2.5 text-[15px] font-bold leading-snug text-white">
              Centralized Resource Management{" "}
              <span className="bg-gradient-to-r from-blue-400 to-[#d4af37] bg-clip-text text-transparent">
                For Naree Foundation
              </span>{" "}
              and Group Ventures
            </h2>
          </div>

          {/* ── Image layout: 2 upside (Naree Foundation & Venture Studio), 3 at bottom ── */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-5 px-6 pb-6">

            {/* Top row: 2 squares (Naree Foundation & Naree Foundation Venture Studio) */}
            <div className="flex flex-row items-center justify-center gap-5">
              <div className="w-[145px] h-[145px] xl:w-[160px] xl:h-[160px] shrink-0 overflow-hidden rounded-2xl border border-[#2a3f5f] bg-white shadow-xl hover:border-blue-400/50 hover:shadow-blue-500/10 transition-all">
                <img
                  src="/logos/naree-foundation-logo.jpg"
                  alt="Naree Foundation"
                  className="h-full w-full object-contain p-3"
                />
              </div>

              <div className="w-[145px] h-[145px] xl:w-[160px] xl:h-[160px] shrink-0 overflow-hidden rounded-2xl border border-[#2a3f5f] bg-white shadow-xl hover:border-blue-400/50 hover:shadow-blue-500/10 transition-all">
                <img
                  src="/logos/nfvs-venture-studio-logo.jpg"
                  alt="Naree Foundation Venture Studio"
                  className="h-full w-full object-contain p-3"
                />
              </div>
            </div>

            {/* Bottom row: 3 squares (Naree Care Service, Quality Pest Control, Nirlesh Foods) */}
            <div className="flex flex-row items-center justify-center gap-3.5 xl:gap-4">
              <div className="w-[105px] h-[105px] xl:w-[118px] xl:h-[118px] shrink-0 overflow-hidden rounded-xl border border-[#2a3f5f] bg-white shadow-md hover:border-blue-400/40 transition-all">
                <img
                  src="/logos/naree-care-service-logo.jpg"
                  alt="Naree Care Service"
                  className="h-full w-full object-contain p-2.5"
                />
              </div>

              <div className="w-[105px] h-[105px] xl:w-[118px] xl:h-[118px] shrink-0 overflow-hidden rounded-xl border border-[#2a3f5f] bg-white shadow-md hover:border-blue-400/40 transition-all">
                <img
                  src="/logos/quality-pest-control-logo.jpg"
                  alt="Quality Pest Control & Allied Services"
                  className="h-full w-full object-contain p-2.5"
                />
              </div>

              <div className="w-[105px] h-[105px] xl:w-[118px] xl:h-[118px] shrink-0 overflow-hidden rounded-xl border border-[#2a3f5f] bg-white shadow-md hover:border-blue-400/40 transition-all">
                <img
                  src="/logos/nirlesh-foods-logo.jpg"
                  alt="Nirlesh Foods"
                  className="h-full w-full object-contain p-2.5"
                />
              </div>
            </div>

          </div>


          {/* ── Bottom bar ── */}
          <div className="relative z-10 flex items-center justify-between border-t border-[#16233d] px-8 py-3 text-[10px] text-slate-500 shrink-0">
            <span>Powered by NFVS Enterprise CRM</span>
            <span className="font-mono">Build 2026.09.15</span>
          </div>
        </div>



        {/* RIGHT COLUMN: Back Office Login Form */}
        <div className="flex flex-1 flex-col justify-center overflow-y-auto p-6 sm:p-8 lg:p-10 xl:p-12" style={{ height: "100vh" }}>
          {/* Mobile Top Header */}
          <div className="flex items-center justify-between lg:hidden mb-8">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-0.5 shadow-md border border-slate-700">
                <img
                  src="/logos/nfvs-logo.jpg"
                  alt="Naree Foundation Venture Studio"
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="text-sm font-bold text-white tracking-tight">
                CRM + NFVS Enterprise
              </span>
            </div>
          </div>

          <div className="mx-auto my-auto w-full max-w-[420px] space-y-6">
            {/* Form Header */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-[#121c33] px-2.5 py-1 text-[11px] font-medium text-blue-400 border border-[#1e3258]">
                <Shield className="h-3 w-3" />
                <span>Back-Office Authentication</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Sign in to CRM
              </h2>
              <p className="text-xs text-slate-400">
                Enter your authorized enterprise credentials to access the back-office.
              </p>
            </div>

            {/* Error Alert Box */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300 animate-in fade-in">
                <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                <span className="flex-1">{error}</span>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-rose-400 hover:text-rose-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* ========================================================= */}
            {/* CREDENTIALS LOGIN FORM                                    */}
            {/* ========================================================= */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Corporate Email Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-slate-300"
                >
                  Corporate Email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    type="text"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@nfvs.internal"
                    className="flex h-10 w-full rounded-xl border border-[#1e3258] bg-[#0c1322] pl-9 pr-3 text-sm text-white placeholder:text-slate-500 shadow-inner transition-colors focus:border-blue-500 focus:bg-[#0e1628] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-medium text-slate-300"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="flex h-10 w-full rounded-xl border border-[#1e3258] bg-[#0c1322] pl-9 pr-10 text-sm text-white placeholder:text-slate-500 shadow-inner transition-colors focus:border-blue-500 focus:bg-[#0e1628] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Workstation Remember Me */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-[#1e3258] bg-[#0c1322] text-blue-600 focus:ring-blue-500/50"
                  />
                  <span>Remember this workstation</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold text-sm text-white shadow-lg shadow-blue-600/30 transition-all hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <>
                    <span>Sign In to Back Office</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {/* Security Compliance Seal */}
            <div className="rounded-xl border border-[#16233d] bg-[#0c1322]/50 p-3 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center justify-between text-slate-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-blue-400" />
                  <span>Unified Access Control</span>
                </span>
                <span className="text-[10px] font-mono text-[#d4af37]">PostgreSQL 17</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Unauthorized access to this back-office system is strictly monitored and audited.
              </p>
            </div>
          </div>


        </div>
      </div>


      {/* ========================================================= */}
      {/* FORGOT PASSWORD MODAL                                     */}
      {/* ========================================================= */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#1e3258] bg-[#0c1322] p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400">
                <Lock className="h-5 w-5" />
                <h3 className="text-base font-bold text-white">Password Recovery</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This is a private corporate enterprise CRM back-office. Password resets must be
              requested through your system administrator or authorized HR officer.
            </p>

            <div className="rounded-xl border border-[#1e3258] bg-[#121c33] p-3 text-xs space-y-1 font-mono">
              <div className="text-slate-400">Primary Administrator:</div>
              <div className="text-blue-300">superadmin@nfvs.in</div>
              <div className="text-[11px] text-slate-500 pt-1">Universal Password: Admin@123</div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(false)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
