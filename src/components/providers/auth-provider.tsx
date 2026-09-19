"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AuthenticatedUser, SystemRoleCode } from "@/types";

interface AuthContextValue {
  user: AuthenticatedUser | null;
  role: SystemRoleCode;
  roleLevel: number;
  roleName: string;
  permissions: string[];
  isManager: boolean;
  isExecutive: boolean;
  isDeptHead: boolean;
  hasPermission: (permission: string) => boolean;
  refreshUser: () => Promise<void>;
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

  const role = user?.roleCode || "EMPLOYEE";
  const roleLevel = user?.roleLevel || 10;
  const roleName = user?.roleName || "Staff Member";
  const permissions = user?.permissions || [];

  const isManager = roleLevel >= 30 || role === "MANAGER";
  const isDeptHead = roleLevel >= 50 || role === "DEPARTMENT_HEAD";
  const isExecutive =
    roleLevel >= 80 ||
    ["SUPER_ADMIN", "CHAIRPERSON", "CEO", "CFO", "CTO", "CMO", "ADMIN"].includes(role);

  const hasPermission = useCallback(
    (perm: string) => {
      if (role === "SUPER_ADMIN" || roleLevel >= 90) return true;
      return permissions.includes(perm);
    },
    [role, roleLevel, permissions]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        roleLevel,
        roleName,
        permissions,
        isManager,
        isExecutive,
        isDeptHead,
        hasPermission,
        refreshUser,
      }}
    >
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
