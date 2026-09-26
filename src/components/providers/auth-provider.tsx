"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  AuthenticatedUser,
  SystemRoleCode,
  CompanySummary,
  UserCompanyMembershipSummary,
} from "@/types";

interface AuthContextValue {
  user: AuthenticatedUser | null;
  role: SystemRoleCode;
  roleLevel: number;
  roleName: string;
  permissions: string[];
  activeCompany: CompanySummary | null;
  memberships: UserCompanyMembershipSummary[];
  isMultiCompanyUser: boolean;
  isSuperAdmin: boolean;
  isExecutive: boolean;
  isDeptHead: boolean;
  isManager: boolean;
  hasPermission: (permission: string) => boolean;
  refreshUser: () => Promise<void>;
  switchCompany: (companyId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
  initialUser: AuthenticatedUser | null;
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<AuthenticatedUser | null>(initialUser);

  // Sync state if initialUser changes from server
  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
    }
  }, [initialUser]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setUser(json.data);
        }
      }
    } catch (err) {
      console.error("[AuthProvider] Failed to refresh user:", err);
    }
  }, []);

  const switchCompany = useCallback(
    async (companyId: string) => {
      try {
        const res = await fetch("/api/auth/switch-company", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyId }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            // Hard reload or window refresh to ensure complete state/cache invalidation
            window.location.reload();
            return true;
          }
        }
        return false;
      } catch (err) {
        console.error("[AuthProvider] Failed to switch company:", err);
        return false;
      }
    },
    []
  );

  const role = user?.roleCode || "EMPLOYEE";
  const roleLevel = user?.roleLevel || 10;
  const roleName = user?.roleName || "Staff Member";
  const permissions = user?.permissions || [];
  const activeCompany = user?.activeCompany || null;
  const memberships = user?.memberships || [];

  const isSuperAdmin = role === "SUPER_ADMIN" || roleLevel >= 100;
  const isMultiCompanyUser = isSuperAdmin || memberships.length > 1;

  const isManager = roleLevel >= 30 || role === "MANAGER";
  const isDeptHead = roleLevel >= 50 || role === "DEPARTMENT_HEAD";
  const isExecutive =
    roleLevel >= 70 ||
    ["SUPER_ADMIN", "CHAIRPERSON", "CEO", "CFO", "CTO", "CMO", "COO", "HR", "ADMIN"].includes(
      role
    );

  const hasPermission = useCallback(
    (perm: string) => {
      if (isSuperAdmin || roleLevel >= 90) return true;
      return permissions.includes(perm);
    },
    [isSuperAdmin, roleLevel, permissions]
  );

  const authContextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      roleLevel,
      roleName,
      permissions,
      activeCompany,
      memberships,
      isMultiCompanyUser,
      isSuperAdmin,
      isExecutive,
      isDeptHead,
      isManager,
      hasPermission,
      refreshUser,
      switchCompany,
    }),
    [
      user,
      role,
      roleLevel,
      roleName,
      permissions,
      activeCompany,
      memberships,
      isMultiCompanyUser,
      isSuperAdmin,
      isExecutive,
      isDeptHead,
      isManager,
      hasPermission,
      refreshUser,
      switchCompany,
    ]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
