"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PayrollNav } from "@/modules/payroll/components/payroll-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Layers,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";

interface ComponentItem {
  id: string;
  code: string;
  name: string;
  type: "EARNING" | "DEDUCTION" | "REIMBURSEMENT";
  calcType: "FIXED" | "PERCENTAGE_OF_BASIC" | "PERCENTAGE_OF_GROSS";
  defaultValue: number;
  isTaxable: boolean;
  isStatutory: boolean;
  description?: string | null;
}

interface StructureItem {
  id: string;
  name: string;
  description?: string | null;
  currency: string;
  items: Array<{
    id: string;
    calcType: string;
    value: number;
    component: ComponentItem;
  }>;
  _count?: { assignments: number };
}

export default function SalaryStructuresPage() {
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [structures, setStructures] = useState<StructureItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // New Structure Modal
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedItems, setSelectedItems] = useState<
    Array<{ componentId: string; calcType: "FIXED" | "PERCENTAGE_OF_BASIC" | "PERCENTAGE_OF_GROSS"; value: number }>
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payroll/structures");
      const json = await res.json();
      if (json.success) {
        setComponents(json.data.components || []);
        setStructures(json.data.structures || []);
        if (json.data.structures?.length > 0) {
          setExpandedId(json.data.structures[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load salary structures:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/payroll/structures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          items: selectedItems,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMsg(json.error?.message || "Failed to create structure");
        setSubmitting(false);
        return;
      }
      setIsOpen(false);
      setName("");
      setDescription("");
      setSelectedItems([]);
      setSubmitting(false);
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Network error");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compensation Structures & Salary Components"
        description="Dynamic salary formula builders: allowances (TA, DA, HRA), statutory withholdings (PF, Tax), and reusable employee compensation packages."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setErrorMsg(null);
              // Default to Basic + HRA + TA + PF + Tax
              setSelectedItems([
                { componentId: components.find((c) => c.code === "BASIC")?.id || "", calcType: "FIXED", value: 0 },
                { componentId: components.find((c) => c.code === "HRA")?.id || "", calcType: "PERCENTAGE_OF_BASIC", value: 40 },
                { componentId: components.find((c) => c.code === "TA")?.id || "", calcType: "FIXED", value: 500 },
                { componentId: components.find((c) => c.code === "PF")?.id || "", calcType: "PERCENTAGE_OF_BASIC", value: 12 },
                { componentId: components.find((c) => c.code === "TAX")?.id || "", calcType: "PERCENTAGE_OF_GROSS", value: 10 },
              ]);
              setIsOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            Build Salary Template
          </Button>
        }
      />

      <PayrollNav />

      {/* Main Grid: Structures on Left, Components Master on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Structure Templates */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Configured Compensation Structure Templates</h3>
            <span className="text-xs text-slate-400 font-mono">{structures.length} Templates Active</span>
          </div>

          {structures.map((struct) => {
            const isExpanded = expandedId === struct.id;
            return (
              <div
                key={struct.id}
                className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden shadow-sm transition-all"
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : struct.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/20 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white">{struct.name}</h4>
                      <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-300">
                        {struct.items.length} Components
                      </Badge>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {struct._count?.assignments || 0} Staff Assigned
                      </span>
                    </div>
                    {struct.description && (
                      <p className="text-xs text-slate-400 mt-1">{struct.description}</p>
                    )}
                  </div>
                  <button className="flex h-7 w-7 items-center justify-center rounded bg-slate-800 text-slate-400">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-800/80 p-4 bg-slate-950/30 space-y-2">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-800 hover:bg-transparent">
                          <TableHead className="text-slate-400">Component</TableHead>
                          <TableHead className="text-slate-400">Classification</TableHead>
                          <TableHead className="text-slate-400">Calculation Method</TableHead>
                          <TableHead className="text-right text-slate-400">Value / Formula</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {struct.items.map((item) => (
                          <TableRow key={item.id} className="border-slate-800/50 hover:bg-transparent">
                            <TableCell className="font-semibold text-xs text-slate-200">
                              <span className="font-mono text-blue-400 mr-2">{item.component.code}</span>
                              {item.component.name}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={item.component.type === "EARNING" ? "success" : "danger"}
                                className="text-[10px]"
                              >
                                {item.component.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-slate-400 font-mono">
                              {item.calcType.replace(/_/g, " ")}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs font-semibold text-slate-100">
                              {item.calcType === "PERCENTAGE_OF_BASIC" && `${item.value}% of Basic`}
                              {item.calcType === "PERCENTAGE_OF_GROSS" && `${item.value}% of Gross`}
                              {item.calcType === "FIXED" && (item.value > 0 ? `₹${item.value}` : "Base Salary")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: Master Components Register */}
        <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Salary Components Master</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Enterprise compensation building blocks</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {components.map((c) => (
              <div
                key={c.id}
                className="p-2.5 rounded-lg border border-slate-800/70 bg-slate-900/40 flex items-start justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-blue-400">{c.code}</span>
                    <span className="text-xs font-semibold text-slate-200">{c.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {c.calcType.replace(/_/g, " ")} {c.defaultValue > 0 && `(Default: ${c.defaultValue})`}
                  </div>
                </div>
                <Badge
                  variant={c.type === "EARNING" ? "success" : "danger"}
                  className="text-[9px]"
                >
                  {c.type}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CREATE STRUCTURE MODAL */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[520px] bg-[#0f172a] border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-400" />
              Build Salary Structure Template
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Formulate a reusable compensation template that can be assigned to job roles or departments.
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
              <label className="block text-xs font-medium text-slate-300 mb-1">Structure Template Name</label>
              <Input
                type="text"
                required
                placeholder="e.g. Senior Staff Engineering Package"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-900 border-slate-700 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Description (Optional)</label>
              <Input
                type="text"
                placeholder="Compensation rationale..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-slate-900 border-slate-700 text-xs"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <label className="block text-xs font-medium text-slate-300">Selected Components & Formula Values</label>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedItems.map((item, idx) => {
                  const comp = components.find((c) => c.id === item.componentId);
                  return (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded bg-slate-900/60 border border-slate-800">
                      <span className="font-mono text-xs font-bold text-blue-400 w-20 truncate">
                        {comp?.code || "Item"}
                      </span>
                      <select
                        value={item.calcType}
                        onChange={(e) => {
                          const updated = [...selectedItems];
                          updated[idx].calcType = e.target.value as any;
                          setSelectedItems(updated);
                        }}
                        className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-200"
                      >
                        <option value="FIXED">Fixed Amount</option>
                        <option value="PERCENTAGE_OF_BASIC">% of Basic</option>
                        <option value="PERCENTAGE_OF_GROSS">% of Gross</option>
                      </select>
                      <Input
                        type="number"
                        step="any"
                        value={item.value}
                        onChange={(e) => {
                          const updated = [...selectedItems];
                          updated[idx].value = Number(e.target.value);
                          setSelectedItems(updated);
                        }}
                        className="w-20 h-7 text-xs font-mono bg-slate-800 border-slate-700"
                      />
                    </div>
                  );
                })}
              </div>
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
                {submitting ? "Saving..." : "Save Structure"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
