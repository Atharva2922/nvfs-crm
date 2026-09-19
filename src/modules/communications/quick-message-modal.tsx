"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, AlertCircle, Loader2, MessageSquare, Search, User, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

interface QuickMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedEmployeeId?: string;
  preselectedName?: string;
}

export function QuickMessageModal({
  isOpen,
  onClose,
  preselectedEmployeeId,
  preselectedName,
}: QuickMessageModalProps) {
  const router = useRouter();
  const [employees, setEmployees] = useState<any[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [messageText, setMessageText] = useState("");
  const [priority, setPriority] = useState<"NORMAL" | "IMPORTANT" | "URGENT">("NORMAL");
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(false);
      setMessageText("");
      setSearchQuery("");

      if (preselectedEmployeeId) {
        setSelectedEmployee({ id: preselectedEmployeeId, name: preselectedName || "Selected Colleague" });
      } else {
        setSelectedEmployee(null);
        fetchEmployees();
      }
    }
  }, [isOpen, preselectedEmployeeId, preselectedName]);

  const fetchEmployees = async () => {
    setIsLoadingEmployees(true);
    try {
      const res = await fetch("/api/employees?limit=100");
      if (res.ok) {
        const data = await res.json();
        const emps = (data.data?.employees || data.employees || []).map((e: any) => ({
          id: e.id,
          name: `${e.firstName || ""} ${e.lastName || ""}`.trim() || e.user?.name || e.email,
          email: e.email || e.user?.email,
          designation: e.designation || e.department?.name || "Employee",
          department: e.department?.name,
        }));
        setEmployees(emps);
        setFilteredEmployees(emps.slice(0, 8));
      }
    } catch (e) {
      console.error("Failed to load employees for quick message:", e);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEmployees(employees.slice(0, 8));
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredEmployees(
        employees.filter(
          (e) =>
            e.name.toLowerCase().includes(q) ||
            e.email?.toLowerCase().includes(q) ||
            e.designation?.toLowerCase().includes(q)
        ).slice(0, 10)
      );
    }
  }, [searchQuery, employees]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) {
      setError("Please select a recipient");
      return;
    }
    if (!messageText.trim()) {
      setError("Message content cannot be empty");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      // 1. Create or get direct conversation
      const convRes = await fetch("/api/communications/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "DIRECT",
          targetEmployeeId: selectedEmployee.id,
        }),
      });

      const convData = await convRes.json();
      if (!convRes.ok) {
        throw new Error(convData.error?.message || "Failed to start direct conversation");
      }

      const conversationId = convData.data.conversation.id;

      // 2. Send the message
      const msgRes = await fetch(`/api/communications/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: messageText,
          priority,
          channel: "INTERNAL",
        }),
      });

      const msgData = await msgRes.json();
      if (!msgRes.ok) {
        throw new Error(msgData.error?.message || "Failed to send message");
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to deliver quick message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Quick Message
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50">
              <Send className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
              Message Delivered!
            </h4>
            <p className="text-xs text-slate-500">Sent to {selectedEmployee?.name}</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4 py-1">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 p-2.5 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Recipient Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Recipient <span className="text-red-500">*</span>
              </label>

              {selectedEmployee ? (
                <div className="flex items-center justify-between rounded-md border border-blue-200 bg-blue-50/50 px-3 py-2 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-medium">{selectedEmployee.name}</p>
                      <p className="text-[10px] text-blue-600/80">{selectedEmployee.designation || selectedEmployee.email}</p>
                    </div>
                  </div>
                  {!preselectedEmployeeId && (
                    <button
                      type="button"
                      onClick={() => setSelectedEmployee(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      Change
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search colleague by name or department..."
                      className="pl-8 text-xs"
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto rounded-md border border-slate-200 divide-y divide-slate-100 dark:border-slate-800 dark:divide-slate-800">
                    {isLoadingEmployees ? (
                      <div className="p-3 text-center text-xs text-slate-400">Loading directory...</div>
                    ) : filteredEmployees.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">No matching colleague found</div>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => setSelectedEmployee(emp)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-200">{emp.name}</p>
                            <p className="text-[10px] text-slate-400">{emp.designation}</p>
                          </div>
                          {emp.department && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              {emp.department}
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Message input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={3}
                placeholder="Type your message... use @name to mention colleagues"
                className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                required
              />
            </div>

            {/* Priority option */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Priority</span>
              <div className="flex gap-1">
                {(["NORMAL", "IMPORTANT", "URGENT"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`rounded px-2 py-1 text-[10px] font-semibold transition-colors ${
                      priority === p
                        ? p === "URGENT"
                          ? "bg-red-600 text-white"
                          : p === "IMPORTANT"
                          ? "bg-amber-600 text-white"
                          : "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter className="gap-2 pt-3">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSending}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSending || !selectedEmployee || !messageText.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    Send Quick Message
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
