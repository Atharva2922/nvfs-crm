"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { HrNav } from "@/modules/hr/components/hr-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { KPICard } from "@/components/ui/kpi-card";
import {
  ShieldCheck,
  PlusCircle,
  AlertTriangle,
  FileCheck2,
  Clock,
  Building,
  CheckCircle2,
  Calendar,
  ShieldAlert,
} from "lucide-react";

interface ComplianceItem {
  id: string;
  title: string;
  type: "LABOR_LAW" | "TAX_STATUTORY" | "DATA_PRIVACY" | "WORKPLACE_SAFETY" | "CERTIFICATION";
  authority: string;
  referenceNo?: string | null;
  status: "COMPLIANT" | "ACTION_REQUIRED" | "PENDING_REVIEW" | "EXPIRED";
  dueDate?: string | null;
  lastAuditDate?: string | null;
  notes?: string | null;
}

export default function CompliancePage() {
  const [records, setRecords] = useState<ComplianceItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [counts, setCounts] = useState({
    total: 0,
    compliant: 0,
    actionRequired: 0,
    pendingReview: 0,
    expired: 0,
  });
  const [loading, setLoading] = useState(true);

  // New Compliance Modal
  const [isOpen, setIsOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<any>("LABOR_LAW");
  const [newAuthority, setNewAuthority] = useState("");
  const [newRefNo, setNewRefNo] = useState("");
  const [newStatus, setNewStatus] = useState<any>("COMPLIANT");
  const [newDueDate, setNewDueDate] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCompliance = async () => {
    setLoading(true);
    try {
      const url = statusFilter === "ALL" ? "/api/hr/compliance" : `/api/hr/compliance?status=${statusFilter}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setRecords(json.data.records || []);
        if (json.data.counts) {
          setCounts(json.data.counts);
        }
      }
    } catch (err) {
      console.error("Failed to load compliance records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompliance();
  }, [statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/hr/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          type: newType,
          authority: newAuthority,
          referenceNo: newRefNo || undefined,
          status: newStatus,
          dueDate: newDueDate || undefined,
          notes: newNotes || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMsg(json.error?.message || "Failed to log compliance item");
        setSubmitting(false);
        return;
      }
      setIsOpen(false);
      setNewTitle("");
      setNewAuthority("");
      setNewRefNo("");
      setNewNotes("");
      setSubmitting(false);
      await fetchCompliance();
    } catch (err: any) {
      setErrorMsg(err.message || "Network error");
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: ComplianceItem["status"]) => {
    switch (status) {
      case "COMPLIANT":
        return <Badge variant="success">Compliant</Badge>;
      case "ACTION_REQUIRED":
        return <Badge variant="warning">Action Required</Badge>;
      case "PENDING_REVIEW":
        return <Badge variant="outline" className="border-blue-500/40 text-blue-300">Pending Review</Badge>;
      case "EXPIRED":
        return <Badge variant="danger">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statutory & Regulatory Compliance Register"
        description="Labor law governance, tax statutory filings, employee welfare mandates, workplace safety certifications, and audit tracking."
        actions={
          <Button
            onClick={() => {
              setErrorMsg(null);
              setIsOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            Log Statutory Obligation
          </Button>
        }
      />

      <HrNav />

      {/* Compliance Health KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Obligations"
          value={counts.total}
          icon={FileCheck2}
          subtitle="Statutory Register"
        />
        <KPICard
          title="Verified Compliant"
          value={counts.compliant}
          icon={CheckCircle2}
          subtitle="Active Filings"
          trend={{
            value: `${counts.total > 0 ? Math.round((counts.compliant / counts.total) * 100) : 100}%`,
            positive: true,
          }}
        />
        <KPICard
          title="Action Required"
          value={counts.actionRequired}
          icon={AlertTriangle}
          subtitle="Immediate Attention"
        />
        <KPICard
          title="Under Review / Expired"
          value={counts.pendingReview + counts.expired}
          icon={Clock}
          subtitle="Regulatory Oversight"
        />
      </div>

      {/* Main Table Card */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Statutory & Regulatory Obligations</h3>
            <p className="text-xs text-slate-400 mt-0.5">Formal compliance filings and external authority oversight records.</p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {["ALL", "COMPLIANT", "ACTION_REQUIRED", "PENDING_REVIEW", "EXPIRED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap font-medium transition-colors ${
                  statusFilter === st
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
                }`}
              >
                {st.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Title / Requirement</TableHead>
              <TableHead className="text-slate-400">Domain / Type</TableHead>
              <TableHead className="text-slate-400">Governing Authority</TableHead>
              <TableHead className="text-slate-400">Reference No</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-slate-400">Due / Audit Date</TableHead>
              <TableHead className="text-slate-400">Operational Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                  No statutory records found matching this status filter.
                </TableCell>
              </TableRow>
            ) : (
              records.map((rec) => (
                <TableRow key={rec.id} className="border-slate-800/70 hover:bg-slate-800/30">
                  <TableCell className="font-semibold text-xs text-slate-200">
                    {rec.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-300">
                      {rec.type.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-300">
                    {rec.authority}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-400">
                    {rec.referenceNo || "—"}
                  </TableCell>
                  <TableCell>{getStatusBadge(rec.status)}</TableCell>
                  <TableCell className="text-xs font-mono text-slate-300">
                    {rec.dueDate ? new Date(rec.dueDate).toLocaleDateString() : "Annual / Ongoing"}
                  </TableCell>
                  <TableCell className="text-xs text-slate-400 max-w-[220px]">
                    {rec.notes || "Regulatory compliance maintained"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* CREATE COMPLIANCE RECORD MODAL */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[480px] bg-[#0f172a] border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-400" />
              Log Statutory Obligation
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Record a mandatory labor, safety, or tax compliance obligation with audit tracking.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="rounded-lg bg-rose-950/50 border border-rose-800/80 p-3 text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-3.5 py-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Obligation Title</label>
              <Input
                type="text"
                required
                placeholder="e.g. Employee Provident Fund (EPF) Annual Audit"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-slate-900 border-slate-700 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Domain Type</label>
                <select
                  value={newType}
                  onChange={(e: any) => setNewType(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
                >
                  <option value="LABOR_LAW">Labor Law</option>
                  <option value="TAX_STATUTORY">Tax Statutory</option>
                  <option value="DATA_PRIVACY">Data Privacy</option>
                  <option value="WORKPLACE_SAFETY">Workplace Safety</option>
                  <option value="CERTIFICATION">Certification</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e: any) => setNewStatus(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
                >
                  <option value="COMPLIANT">Compliant</option>
                  <option value="ACTION_REQUIRED">Action Required</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Governing Authority</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Ministry of Labour"
                  value={newAuthority}
                  onChange={(e) => setNewAuthority(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Reference Number</label>
                <Input
                  type="text"
                  placeholder="Registration/Doc No."
                  value={newRefNo}
                  onChange={(e) => setNewRefNo(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Due / Audit Date</label>
              <Input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="bg-slate-900 border-slate-700 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Compliance Notes</label>
              <textarea
                rows={2}
                placeholder="Audit observations or filing remarks..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-900 p-2 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="border-slate-700 text-slate-300 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
              >
                {submitting ? "Saving..." : "Save Record"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
