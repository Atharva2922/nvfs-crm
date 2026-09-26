"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { EmployeeProfileDossier } from "@/modules/hr/employee-profile-dossier";

export default function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
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

      // Fetch profile dossier
      const profileRes = await fetch(`/api/employees/${id}/profile`);
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
  }, [id]);

  if (loading) {
    return <LoadingState message="Loading Complete Employee Profile Dossier..." />;
  }

  if (error || !employeeData) {
    return (
      <div className="space-y-4">
        <Link
          href="/app/hr/employees"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Employee Directory</span>
        </Link>
        <ErrorState
          title="Employee Profile Unavailable"
          message={error || "Profile could not be found."}
        />
      </div>
    );
  }

  return (
    <EmployeeProfileDossier
      initialEmployee={employeeData}
      initialCompletion={completion}
      departments={departments}
      managers={managers}
      currentUser={currentUser}
      onRefresh={loadData}
    />
  );
}
