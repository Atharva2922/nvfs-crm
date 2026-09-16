import React from "react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Shield, Sliders } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AppSettingsPage() {
  const [settings, org] = await Promise.all([
    db.systemSetting.findMany({ orderBy: { category: "asc" } }),
    db.organization.findFirst(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform & System Settings"
        description="Global parameters, organization boundary configuration, and runtime environment settings."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Configured Platform Parameters</CardTitle>
            <CardDescription>
              Loaded dynamically from database table SystemSetting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {settings.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/60 p-3 text-xs"
              >
                <div className="flex flex-col">
                  <span className="font-mono text-xs font-semibold text-slate-200">
                    {s.key}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {s.description || "No description provided"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" size="sm">
                    {s.category}
                  </Badge>
                  <span className="rounded bg-slate-800 px-2.5 py-1 font-mono text-xs font-semibold text-blue-400 border border-slate-700">
                    {s.value}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active Organization Boundary</CardTitle>
            <CardDescription>
              Primary corporate tenant for CRM + NFVS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/60 p-3">
              <span className="text-slate-400">Organization Name</span>
              <span className="font-semibold text-slate-200">{org?.name}</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/60 p-3">
              <span className="text-slate-400">Organization Code</span>
              <span className="font-mono font-medium text-blue-400">{org?.code}</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/60 p-3">
              <span className="text-slate-400">Operating Currency</span>
              <span className="font-mono font-medium text-emerald-400">{org?.currency}</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/60 p-3">
              <span className="text-slate-400">System Timezone</span>
              <span className="font-mono text-slate-300">{org?.timezone}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
