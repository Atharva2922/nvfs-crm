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
  CheckCircle2,
  Sparkles,
  Server,
  Layers,
  Activity,
  Globe2,
  X,
  UserCheck,
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
    <div className="relative flex min-h-screen w-full bg-[#070b16] text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Background Decorative Ambient Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="absolute top-1/2 left-1/4 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-indigo-600/10 blur-[150px]" />
        <div className="absolute -bottom-32 right-1/3 h-96 w-96 rounded-full bg-amber-500/10 blur-[140px]" />
      </div>

      <div className="relative z-10 flex min-h-screen w-full flex-col lg:flex-row">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Visual Showcase & Brand Intelligence Hub     */}
        {/* Inspired by Nagad Back Office CRM Dribbble Design         */}
        {/* ========================================================= */}
        <div className="relative hidden w-full flex-col justify-between overflow-hidden border-r border-[#16233d] bg-gradient-to-br from-[#0c1322] via-[#080e1c] to-[#070b16] p-10 lg:flex lg:w-[50%] xl:w-[52%] 2xl:p-14">
          {/* Subtle Grid Backdrop */}
          <div
            className="absolute inset-0 opacity-[0.035] pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
              backgroundSize: "36px 36px",
            }}
          />

          {/* Top Brand */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 font-bold text-white shadow-lg shadow-blue-600/25 border border-blue-400/30">
                <span className="tracking-tight text-lg">NF</span>
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  CRM + NFVS
                  <span className="text-[#d4af37] text-xs font-semibold px-1.5 py-0.5 rounded bg-[#d4af37]/10 border border-[#d4af37]/25">
                    ENTERPRISE
                  </span>
                </span>
                <p className="text-[11px] font-medium text-slate-400">
                  Unified Back-Office Management Cloud
                </p>
              </div>
            </div>
          </div>

          {/* Center Showcase: Nagad CRM Hero Visual */}
          <div className="relative z-10 my-auto py-10 space-y-8">
            <div className="space-y-3 max-w-lg">
              <div className="inline-flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                <Sparkles className="h-3.5 w-3.5 text-[#d4af37]" />
                <span>Next-Gen Back Office Architecture</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white xl:text-4xl 2xl:text-5xl leading-tight">
                Enterprise Precision. <br />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-[#d4af37] bg-clip-text text-transparent">
                  Zero-Friction Control.
                </span>
              </h1>
              <p className="text-sm leading-relaxed text-slate-400 max-w-md">
                Manage clients, multi-tier procurement, real-time payroll, inventory movements,
                and legal compliance in a single secured operational back-office.
              </p>
            </div>

            {/* Glassmorphism Visual Feature Cards (Nagad Style) */}
            <div className="space-y-3.5 max-w-md">
              {/* Card 1: Operational Velocity */}
              <div className="rounded-xl border border-[#1e3258]/80 bg-[#121c33]/70 p-4 shadow-xl backdrop-blur-md transition-all hover:border-blue-500/40 hover:bg-[#121c33]/90">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        Operational Velocity & SLA
                      </div>
                      <div className="text-[11px] text-slate-400">
                        99.98% High-availability multi-zone clusters
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    +28.4%
                  </span>
                </div>
              </div>

              {/* Card 2: Unified DB & RBAC Security */}
              <div className="rounded-xl border border-[#1e3258]/80 bg-[#121c33]/70 p-4 shadow-xl backdrop-blur-md transition-all hover:border-blue-500/40 hover:bg-[#121c33]/90">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        Zero-Trust RBAC Governance
                      </div>
                      <div className="text-[11px] text-slate-400">
                        77 Core Data Models • ISO 27001 Certified
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#d4af37] bg-[#d4af37]/10 px-2 py-0.5 rounded border border-[#d4af37]/20">
                    Active
                  </span>
                </div>
              </div>

              {/* Card 3: Modules Ecosystem */}
              <div className="rounded-xl border border-[#1e3258]/80 bg-[#121c33]/70 p-4 shadow-xl backdrop-blur-md transition-all hover:border-blue-500/40 hover:bg-[#121c33]/90">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        Integrated Business Suite
                      </div>
                      <div className="text-[11px] text-slate-400">
                        CRM • Finance • Inventory • Operations • Legal
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    Full Suite
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security & Status Guarantee */}
          <div className="relative z-10 flex items-center justify-between border-t border-[#16233d] pt-5 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-blue-400" />
              <span>TLS 1.3 End-to-End Encrypted Session</span>
            </div>
            <span className="font-mono text-slate-400">Build 2026.09.15</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Back Office Login Form & Google SSO         */}
        {/* ========================================================= */}
        <div className="flex flex-1 flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16">
          {/* Mobile Top Header */}
          <div className="flex items-center justify-between lg:hidden mb-8">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-md">
                NF
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
              <div className="text-blue-300">superadmin@nfvs.internal</div>
              <div className="text-[11px] text-slate-500 pt-1">Default Seed: Enterprise@2026</div>
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
