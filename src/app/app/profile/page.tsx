"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { ArrowLeft, User, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { EmployeeProfileDossier } from "@/modules/hr/employee-profile-dossier";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";

export default function MyProfilePage() {
  const { user: currentUser } = useAuth();
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [completion, setCompletion] = useState<any>(null);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch logged-in user's profile dossier
      const profileRes = await fetch("/api/profile");
      const profileJson = await profileRes.json();

      if (!profileRes.ok || !profileJson.success) {
        throw new Error(profileJson.error?.message || "Failed to load employee profile");
      }

      setEmployeeData(profileJson.data.employee);
      setCompletion(profileJson.data.completion);

      // Fetch departments & managers for selection dropdowns
      const [deptRes, empRes] = await Promise.all([
        fetch("/api/hr/departments").then((r) => r.json()).catch(() => ({ success: false })),
        fetch("/api/employees?limit=150").then((r) => r.json()).catch(() => ({ success: false })),
      ]);

      if (deptRes?.success && deptRes.data) {
        setDepartments(deptRes.data);
      }
      if (empRes?.success && empRes.data) {
        const empList = Array.isArray(empRes.data) ? empRes.data : empRes.data.employees || [];
        setManagers(empList);
      }
    } catch (err: any) {
      setError(err.message || "Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <LoadingState message="Loading Your Corporate Profile & Completion Dossier..." />;
  }

  if (error || !employeeData) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto py-12">
        <Link
          href="/app/overview"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Workspace Overview</span>
        </Link>
        <ErrorState
          title="Profile Unavailable"
          message={error || "Your employee profile could not be initialized."}
        />
      </div>
    );
  }

  const score = completion?.totalScore ?? employeeData.profileCompletion ?? 20;

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <Link
          href="/app/overview"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to Workspace Overview</span>
        </Link>

        <div className="flex items-center gap-2">
          <Badge
            variant={score >= 80 ? "success" : score >= 50 ? "gold" : "warning"}
            size="sm"
            className="font-mono text-xs px-2.5 py-0.5"
          >
            Profile Completion: {score}%
          </Badge>
          {score >= 80 ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-500">
              <CheckCircle2 className="h-3.5 w-3.5" /> Verified Profile
            </span>
          ) : (
            <span className="text-[11px] text-amber-500 font-medium">
              Complete remaining sections below
            </span>
          )}
        </div>
      </div>

      <EmployeeProfileDossier
        initialEmployee={employeeData}
        initialCompletion={completion}
        departments={departments}
        managers={managers}
        currentUser={currentUser}
        onRefresh={loadData}
      />
    </div>
  );
}
