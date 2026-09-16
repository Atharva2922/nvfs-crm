"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, Calendar, Plus, Play, CheckCircle2, FileText } from "lucide-react";

interface DutyItem {
  id: string;
  assignmentNumber: string;
  clientName?: string | null;
  location: string;
  date: string;
  purpose: string;
  status: string;
  reportNotes?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

export default function OnDutyPage() {
  const [duties, setDuties] = useState<DutyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [reportModalDuty, setReportModalDuty] = useState<DutyItem | null>(null);
  const [reportNotes, setReportNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    clientName: "",
    location: "",
    date: new Date().toISOString().split("T")[0],
    purpose: "",
  });

  const fetchDuties = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/on-duty");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setDuties(json.data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch duties:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuties();
  }, []);

  const handleCreateDuty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.location || !formData.purpose) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/on-duty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        setFormData({ clientName: "", location: "", date: new Date().toISOString().split("T")[0], purpose: "" });
        await fetchDuties();
      }
    } catch (err) {
      console.error("Create duty failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDutyAction = async (id: string, action: "START" | "COMPLETE", notes?: string) => {
    try {
      const res = await fetch("/api/on-duty", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, reportNotes: notes }),
      });
      if (res.ok) {
        setReportModalDuty(null);
        setReportNotes("");
        await fetchDuties();
      }
    } catch (err) {
      console.error("Duty action failed:", err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="On-Duty Field Assignments"
        description="Track client visits, offsite assignments, check-ins, and duty reports."
        badge={
          <Badge variant="gold" size="sm" className="gap-1">
            <Briefcase className="h-3 w-3 text-amber-500" />
            <span>Field Operations</span>
          </Badge>
        }
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" /> Request On-Duty
          </button>
        }
      />

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-400">Loading duty assignments...</div>
      ) : duties.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-8">
          <Briefcase className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No On-Duty Assignments</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto mb-4">
            You currently have no scheduled offsite or client field visits.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
          >
            Request On-Duty
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {duties.map((duty) => (
            <div
              key={duty.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                      {duty.assignmentNumber}
                    </span>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-0.5">
                      {duty.clientName ? `Client: ${duty.clientName}` : duty.purpose}
                    </h3>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      duty.status === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300"
                        : duty.status === "IN_PROGRESS"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-300"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-300"
                    }`}
                  >
                    {duty.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-orange-500" />
                    <span>Location: <strong className="text-slate-800 dark:text-slate-200">{duty.location}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Date: <strong className="font-mono text-slate-800 dark:text-slate-200">{new Date(duty.date).toLocaleDateString()}</strong></span>
                  </div>
                  <div className="flex items-start gap-1.5 pt-1">
                    <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>Purpose: {duty.purpose}</span>
                  </div>
                </div>

                {duty.reportNotes && (
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Duty Report</span>
                    <p className="text-slate-700 dark:text-slate-300">{duty.reportNotes}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                {duty.status === "ASSIGNED" && (
                  <button
                    onClick={() => handleDutyAction(duty.id, "START")}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" /> Start Duty
                  </button>
                )}
                {duty.status === "IN_PROGRESS" && (
                  <button
                    onClick={() => setReportModalDuty(duty)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Complete Duty & Submit Report
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request On-Duty Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Request On-Duty Assignment</h3>
            <form onSubmit={handleCreateDuty} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Client Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. ABC Corporation"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Location / City</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune / Client HQ"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Purpose / Objective</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Onsite Client Integration Meeting..."
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Duty & Report Modal */}
      {reportModalDuty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Submit Duty Report</h3>
            <div className="text-xs space-y-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Duty Summary Notes</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide meeting outcomes, key decisions, or client feedback..."
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setReportModalDuty(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDutyAction(reportModalDuty.id, "COMPLETE", reportNotes)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
                >
                  Submit Report & Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
