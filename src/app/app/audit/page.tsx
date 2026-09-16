import React from "react";
import { AuditService } from "@/services/audit.service";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ShieldAlert } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AppAuditPage() {
  const auditLogs = await AuditService.getLogs(50);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit & Compliance Trail"
        description="Immutable record of system state mutations, security authentications, and organizational changes."
        badge={
          <Badge variant="info" size="sm" className="gap-1">
            <ShieldAlert className="h-3 w-3" />
            <span>Audit Logging Active</span>
          </Badge>
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Audit Log Records</CardTitle>
              <CardDescription>
                Displaying {auditLogs.length} recent system mutations
              </CardDescription>
            </div>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-300">
              Retention: 365 Days
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Mutation Diff / Metadata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-xs text-slate-500">
                    No audit records found.
                  </TableCell>
                </TableRow>
              ) : (
                auditLogs.map((log) => {
                  let parsedNew = null;
                  if (log.newValue) {
                    try {
                      parsedNew = JSON.parse(log.newValue);
                    } catch {
                      parsedNew = log.newValue;
                    }
                  }

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="info" size="sm">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-200">
                        {log.entity}
                        {log.entityId && (
                          <span className="ml-1 text-[10px] font-mono text-slate-500">
                            ({log.entityId.slice(0, 8)}...)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-200">
                            {log.actor?.employee
                              ? `${log.actor.employee.firstName} ${log.actor.employee.lastName}`
                              : log.actor?.email || "System Process"}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {log.actor?.role?.name || "SYSTEM"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[11px] font-mono text-slate-400">
                        {log.ipAddress || "Internal"}
                      </TableCell>
                      <TableCell>
                        {parsedNew ? (
                          <pre className="max-w-xs truncate rounded bg-slate-950/80 p-1 font-mono text-[10px] text-slate-300 border border-slate-800">
                            {typeof parsedNew === "object"
                              ? JSON.stringify(parsedNew)
                              : parsedNew}
                          </pre>
                        ) : (
                          <span className="text-[11px] text-slate-600">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
