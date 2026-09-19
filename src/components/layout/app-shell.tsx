"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { SystemRoleCode, AuthenticatedUser } from "@/types";
import { AuthProvider } from "@/components/providers/auth-provider";

export interface AppShellProps {
  children: React.ReactNode;
  userRole?: SystemRoleCode;
  initialUser?: AuthenticatedUser | null;
}

export function AppShell({ children, initialUser }: AppShellProps) {
  const [currentRole, setCurrentRole] = useState<SystemRoleCode>(initialUser?.roleCode || "SUPER_ADMIN");

  return (
    <AuthProvider initialUser={initialUser || null}>
      <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header currentRole={currentRole as any} onRoleChange={(role) => setCurrentRole(role as any)} />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-7xl space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}

