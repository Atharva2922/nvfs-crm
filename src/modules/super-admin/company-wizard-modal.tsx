"use client";

import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Building,
  Palette,
  UserCheck,
  Layers,
  Shield,
  Key,
  Sparkles,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CompanyWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompanyCreated: () => void;
}

export function CompanyWizardModal({
  isOpen,
  onClose,
  onCompanyCreated,
}: CompanyWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wizard Form State
  const [formData, setFormData] = useState({
    // Step 1: Info
    name: "",
    code: "",
    legalName: "",
    industry: "Technology & Software Solutions",
    website: "https://",
    email: "",
    phone: "",
    address: "",

    // Step 2: Branding
    logo: "",
    primaryColor: "#2563eb",
    secondaryColor: "#1e40af",
    currency: "USD",
    timezone: "UTC",
    dateFormat: "YYYY-MM-DD",
    fiscalYear: "JAN-DEC",

    // Step 3: Admin Account
    adminName: "",
    adminEmail: "",
    adminPassword: "",

    // Step 4: Default Departments
    departments: [
      { name: "Executive Leadership", code: "EXEC", enabled: true },
      { name: "Technology & Engineering", code: "ENG", enabled: true },
      { name: "Commercial & Sales", code: "CRM", enabled: true },
      { name: "Finance & Treasury", code: "FIN", enabled: true },
      { name: "Operations & Delivery", code: "OPS", enabled: true },
      { name: "Human Resources", code: "HR", enabled: true },
    ],

    // Step 5: Default Roles
    roles: [
      { name: "CEO", level: 90, enabled: true },
      { name: "CTO", level: 85, enabled: true },
      { name: "CMO", level: 85, enabled: true },
      { name: "CFO", level: 85, enabled: true },
      { name: "COO", level: 85, enabled: true },
      { name: "HR", level: 80, enabled: true },
      { name: "Department Head", level: 50, enabled: true },
      { name: "Manager", level: 40, enabled: true },
      { name: "Team Lead", level: 25, enabled: true },
      { name: "Employee", level: 10, enabled: true },
    ],

    // Step 6: Permission Presets
    permissionPreset: "ENTERPRISE_STANDARD",
  });

  if (!isOpen) return null;

  const handleNext = () => {
    setError(null);
    if (currentStep === 1) {
      if (!formData.name.trim() || !formData.code.trim()) {
        setError("Company Name and Code are required");
        return;
      }
    } else if (currentStep === 3) {
      if (formData.adminEmail && !formData.adminPassword) {
        setError("Please provide a password for the initial administrator account");
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 7));
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const activeDepts = formData.departments
        .filter((d) => d.enabled)
        .map(({ name, code }) => ({ name, code }));

      const res = await fetch("/api/super-admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          legalName: formData.legalName,
          industry: formData.industry,
          website: formData.website,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          currency: formData.currency,
          timezone: formData.timezone,
          dateFormat: formData.dateFormat,
          fiscalYear: formData.fiscalYear,
          adminEmail: formData.adminEmail || undefined,
          adminPassword: formData.adminPassword || undefined,
          adminName: formData.adminName || undefined,
          departments: activeDepts,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to provision company");
        setIsSubmitting(false);
        return;
      }

      onCompanyCreated();
      onClose();
    } catch {
      setError("Network communication error with platform API");
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: "Information" },
    { num: 2, label: "Branding" },
    { num: 3, label: "Admin Account" },
    { num: 4, label: "Departments" },
    { num: 5, label: "Roles" },
    { num: 6, label: "Permissions" },
    { num: 7, label: "Confirmation" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] shadow-2xl text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-md">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Company Creation Wizard
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Step {currentStep} of 7: {steps[currentStep - 1].label}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 text-center text-[10px] font-medium">
          {steps.map((s) => (
            <div
              key={s.num}
              className={cn(
                "py-2 px-1 border-r last:border-r-0 border-slate-200 dark:border-slate-800 transition-colors truncate",
                currentStep === s.num
                  ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold border-b-2 border-b-blue-600"
                  : currentStep > s.num
                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                  : "text-slate-400 opacity-60"
              )}
            >
              {s.num}. {s.label}
            </div>
          ))}
        </div>

        {/* Wizard Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* STEP 1: COMPANY INFORMATION */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Building className="h-4 w-4 text-blue-500" />
                Step 1: General Company Information
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Acme Technologies Inc."
                    className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Company Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. ACME-TECH"
                    className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-mono uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Legal Registered Name
                  </label>
                  <input
                    type="text"
                    value={formData.legalName}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                    placeholder="e.g. Acme Technologies Global Private Limited"
                    className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Industry Domain
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Official Corporate Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@acme.com"
                    className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: BRANDING & LOCALIZATION */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Palette className="h-4 w-4 text-blue-500" />
                Step 2: Brand Identity & Regional Settings
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Primary Brand Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="h-9 w-12 rounded cursor-pointer border border-slate-200 dark:border-slate-800 bg-transparent"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="h-9 flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-mono uppercase text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="h-9 w-12 rounded cursor-pointer border border-slate-200 dark:border-slate-800 bg-transparent"
                    />
                    <input
                      type="text"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="h-9 flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-mono uppercase text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="AED">AED (د.إ)</option>
                  </select>
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Timezone
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ADMIN ACCOUNT */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-blue-500" />
                Step 3: Company Primary Administrator
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This administrator account will hold exclusive company-level management control.
              </p>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Administrator Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    placeholder="e.g. Johnathan Miller"
                    className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Admin Corporate Email
                  </label>
                  <input
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    placeholder="admin@newcompany.internal"
                    className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Temporary Initial Password
                  </label>
                  <input
                    type="password"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                    placeholder="••••••••••••"
                    className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: DEFAULT DEPARTMENTS */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-blue-500" />
                Step 4: Default Departments Provisioning
              </h3>
              <div className="space-y-2">
                {formData.departments.map((dept, idx) => (
                  <label
                    key={dept.code}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={dept.enabled}
                        onChange={(e) => {
                          const updated = [...formData.departments];
                          updated[idx].enabled = e.target.checked;
                          setFormData({ ...formData, departments: updated });
                        }}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {dept.name}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">{dept.code}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: DEFAULT ROLES */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-blue-500" />
                Step 5: Default Roles & Hierarchy Configuration
              </h3>
              <div className="space-y-2">
                {formData.roles.map((r) => (
                  <div
                    key={r.name}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs"
                  >
                    <span className="font-medium text-slate-900 dark:text-white">{r.name}</span>
                    <span className="font-mono text-[10px] text-blue-500">Level {r.level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: PERMISSIONS */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Key className="h-4 w-4 text-blue-500" />
                Step 6: Security & Workflow Policy Presets
              </h3>
              <div className="space-y-2">
                <label className="block p-3 rounded-lg border border-blue-500/30 bg-blue-500/10 text-xs cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input type="radio" name="preset" checked readOnly className="text-blue-600" />
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      Enterprise Strict Isolation Standard
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 pl-5 leading-relaxed">
                    Strict RBAC enforced at query layer. Company users cannot cross boundaries.
                    Full approval workflow chains enabled.
                  </p>
                </label>
              </div>
            </div>
          )}

          {/* STEP 7: CONFIRMATION */}
          {currentStep === 7 && (
            <div className="space-y-4 animate-in fade-in text-xs">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Step 7: Review & Instant Provisioning
              </h3>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-slate-500">Company Name:</span>
                  <strong className="text-slate-900 dark:text-white text-sm">{formData.name}</strong>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-slate-500">Tenant Code:</span>
                  <span className="font-mono font-bold text-blue-500">{formData.code}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-slate-500">Primary Color:</span>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: formData.primaryColor }}
                    />
                    <span className="font-mono">{formData.primaryColor}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-slate-500">Initial Admin:</span>
                  <span>{formData.adminEmail || "None specified"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Active Departments:</span>
                  <span>{formData.departments.filter((d) => d.enabled).length} departments</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/30">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>

          {currentStep < 7 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 transition-colors"
            >
              Next <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Provisioning Tenant..." : "Confirm & Provision Company"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
