"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { OperationsNav } from "@/modules/operations/components/operations-nav";
import {
  Layers,
  Save,
  ArrowLeft,
  Users,
  Briefcase,
  Building,
  IndianRupee,
  Package,
  Calendar,
  AlertTriangle,
  Plus,
  Trash2,
} from "lucide-react";

export default function NewOperationPage() {
  const router = useRouter();

  // Reference data loaded from DB
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [pos, setPos] = useState<any[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [operationType, setOperationType] = useState("CLIENT_DELIVERY");
  const [departmentId, setDepartmentId] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [clientId, setClientId] = useState("");
  const [opportunityId, setOpportunityId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [purchaseOrderId, setPurchaseOrderId] = useState("");

  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [status, setStatus] = useState("PLANNING");
  const [riskLevel, setRiskLevel] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("LOW");
  const [riskDescription, setRiskDescription] = useState("");
  const [mitigationPlan, setMitigationPlan] = useState("");

  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedCompletionDate, setExpectedCompletionDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  );
  const [estimatedHours, setEstimatedHours] = useState(120);
  const [estimatedCost, setEstimatedCost] = useState(15000);
  const [approvedBudget, setApprovedBudget] = useState(20000);
  const [internalNotes, setInternalNotes] = useState("");

  // Dynamic Resource Lists
  const [teamMembers, setTeamMembers] = useState<{ employeeId: string; role: string; assignedHours: number }[]>([]);
  const [inventoryItems, setInventoryItems] = useState<{ productId: string; requiredQuantity: number }[]>([]);
  const [linkedVendors, setLinkedVendors] = useState<{ vendorId: string; role: string; estimatedCost: number }[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReferences();
  }, []);

  const fetchReferences = async () => {
    try {
      setLoadingRefs(true);
      const [empRes, clientRes, dealRes, venRes, prodRes, poRes] = await Promise.all([
        fetch("/api/employees?limit=100").then((r) => r.json()).catch(() => ({ data: {} })),
        fetch("/api/crm/clients?limit=100").then((r) => r.json()).catch(() => ({ data: {} })),
        fetch("/api/crm/opportunities?limit=100").then((r) => r.json()).catch(() => ({ data: {} })),
        fetch("/api/inventory/vendors?limit=100").then((r) => r.json()).catch(() => ({ data: {} })),
        fetch("/api/inventory/products?limit=100").then((r) => r.json()).catch(() => ({ data: {} })),
        fetch("/api/inventory/purchase-orders?limit=100").then((r) => r.json()).catch(() => ({ data: {} })),
      ]);

      const emps = empRes.data?.items || [];
      setEmployees(emps);
      if (emps.length > 0) {
        setOwnerId(emps[0].id);
        if (emps[0].departmentId) setDepartmentId(emps[0].departmentId);
      }

      // Unique departments from employees
      const deptMap: Record<string, { id: string; name: string }> = {};
      for (const e of emps) {
        if (e.departmentId && e.department) {
          deptMap[e.departmentId] = { id: e.departmentId, name: e.department.name };
        }
      }
      setDepartments(Object.values(deptMap));

      setClients(clientRes.data?.items || []);
      setDeals(dealRes.data?.items || []);
      setVendors(venRes.data?.items || []);
      setProducts(prodRes.data?.items || []);
      setPos(poRes.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRefs(false);
    }
  };

  const handleAddTeamMember = () => {
    if (employees.length === 0) return;
    setTeamMembers([...teamMembers, { employeeId: employees[0].id, role: "ENGINEER", assignedHours: 40 }]);
  };

  const handleRemoveTeamMember = (idx: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== idx));
  };

  const handleAddInventory = () => {
    if (products.length === 0) return;
    setInventoryItems([...inventoryItems, { productId: products[0].id, requiredQuantity: 5 }]);
  };

  const handleRemoveInventory = (idx: number) => {
    setInventoryItems(inventoryItems.filter((_, i) => i !== idx));
  };

  const handleAddVendor = () => {
    if (vendors.length === 0) return;
    setLinkedVendors([...linkedVendors, { vendorId: vendors[0].id, role: "SUPPLIER", estimatedCost: 5000 }]);
  };

  const handleRemoveVendor = (idx: number) => {
    setLinkedVendors(linkedVendors.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Operation Name is required.");
      return;
    }
    if (!departmentId) {
      setError("Please select an executing Department.");
      return;
    }
    if (!ownerId) {
      setError("Please assign an operational Owner.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        description,
        operationType,
        departmentId,
        ownerId,
        clientId: clientId || undefined,
        opportunityId: opportunityId || undefined,
        projectName: projectName || undefined,
        purchaseOrderId: purchaseOrderId || undefined,
        priority,
        status,
        riskLevel,
        riskDescription,
        mitigationPlan,
        startDate,
        expectedCompletionDate,
        estimatedHours: Number(estimatedHours) || 0,
        estimatedCost: Number(estimatedCost) || 0,
        approvedBudget: Number(approvedBudget) || 0,
        internalNotes,
        teamMembers,
        inventoryItems,
        vendors: linkedVendors,
      };

      const res = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || "Failed to create operation.");
      }

      router.push(`/app/operations/${json.data.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to initialize operation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <Link
          href="/app/operations"
          className="rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Initialize New Operation</h1>
          <p className="text-xs text-slate-400">
            Define mission parameters, stakeholder relationships, personnel staffing, and supply requirements.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-3.5 text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Information */}
        <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white border-b border-slate-800 pb-2.5">
            <Layers className="h-4 w-4 text-blue-400" />
            <span>1. Basic Operational Information</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-medium text-slate-300">
                Operation Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Data Center Infrastructure Modernization"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Operation Type</label>
              <select
                value={operationType}
                onChange={(e) => setOperationType(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="CLIENT_DELIVERY">Client Delivery Project</option>
                <option value="INTERNAL_INITIATIVE">Internal Corporate Initiative</option>
                <option value="INFRASTRUCTURE">Infrastructure & Engineering</option>
                <option value="MAINTENANCE">Scheduled Maintenance & SLA</option>
                <option value="ON_SITE_SERVICE">On-Site Field Service</option>
                <option value="PROCUREMENT_LOGISTICS">Procurement Logistics Deployment</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">
                Executing Department <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select Department...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">
                Operational Owner <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.designation})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Priority & Initial Status</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                >
                  <option value="LOW">Low Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="CRITICAL">Critical Priority</option>
                </select>

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                >
                  <option value="PLANNING">Planning</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="QUALITY_REVIEW">Quality Review</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-medium text-slate-300">Executive Scope & Description</label>
              <textarea
                rows={3}
                placeholder="Detail the operational objectives, technical deliverables, and success criteria..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Relationships */}
        <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white border-b border-slate-800 pb-2.5">
            <Briefcase className="h-4 w-4 text-indigo-400" />
            <span>2. Stakeholder & Enterprise Linkages</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Related Client (CRM)</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="">None (Internal Corporate Operation)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Related CRM Deal / Pipeline</label>
              <select
                value={opportunityId}
                onChange={(e) => setOpportunityId(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="">None</option>
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} (${d.value?.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Project Name / Reference</label>
              <input
                type="text"
                placeholder="e.g. Project Apollo Phase II"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Primary Purchase Order Linkage</label>
              <select
                value={purchaseOrderId}
                onChange={(e) => setPurchaseOrderId(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="">None</option>
                {pos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.poNumber} — {p.vendor?.displayName} (${p.total?.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Schedule & Financials */}
        <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white border-b border-slate-800 pb-2.5">
            <Calendar className="h-4 w-4 text-emerald-400" />
            <span>3. Schedule & Budget Baseline</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Target Completion Date</label>
              <input
                type="date"
                required
                value={expectedCompletionDate}
                onChange={(e) => setExpectedCompletionDate(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Estimated Effort (Hours)</label>
              <input
                type="number"
                min="0"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Approved Budget ($)</label>
              <input
                type="number"
                min="0"
                value={approvedBudget}
                onChange={(e) => setApprovedBudget(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Risk Profile */}
        <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white border-b border-slate-800 pb-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span>4. Risk Governance</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Risk Assessment Level</label>
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value as any)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="LOW">Low Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="HIGH">High Risk</option>
                <option value="CRITICAL">Critical Risk</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-medium text-slate-300">Risk Description</label>
              <input
                type="text"
                placeholder="Identify key vulnerabilities, supply constraints, or third-party dependencies..."
                value={riskDescription}
                onChange={(e) => setRiskDescription(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-medium text-slate-300">Mitigation Strategy</label>
              <input
                type="text"
                placeholder="Contingency plans, redundant suppliers, or risk fallback triggers..."
                value={mitigationPlan}
                onChange={(e) => setMitigationPlan(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Resource Allocations (Personnel, Inventory & Vendors) */}
        <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-5 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-white border-b border-slate-800 pb-2.5">
            <Users className="h-4 w-4 text-cyan-400" />
            <span>5. Resource Planning & Sourcing</span>
          </div>

          {/* Sub-section: Team Members */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Assigned Employees & Project Personnel</h4>
                <p className="text-[11px] text-slate-500">Staff members dedicated to delivering this operation.</p>
              </div>
              <button
                type="button"
                onClick={handleAddTeamMember}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 border border-blue-900/60 bg-blue-950/30 px-2.5 py-1 rounded-lg"
              >
                <Plus className="h-3.5 w-3.5" /> Add Member
              </button>
            </div>

            {teamMembers.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-900/40 rounded-lg border border-slate-800/80">
                No initial team members added. You can also assign personnel after creating the operation.
              </p>
            ) : (
              <div className="space-y-2">
                {teamMembers.map((m, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                    <select
                      value={m.employeeId}
                      onChange={(e) => {
                        const next = [...teamMembers];
                        next[idx].employeeId = e.target.value;
                        setTeamMembers(next);
                      }}
                      className="flex-1 min-w-[180px] rounded border border-slate-800 bg-slate-900 px-2 py-1.5 text-slate-200"
                    >
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.designation})
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Role (e.g. Lead, Engineer)"
                      value={m.role}
                      onChange={(e) => {
                        const next = [...teamMembers];
                        next[idx].role = e.target.value;
                        setTeamMembers(next);
                      }}
                      className="w-36 rounded border border-slate-800 bg-slate-900 px-2 py-1.5 text-slate-200"
                    />

                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        placeholder="Hours"
                        value={m.assignedHours}
                        onChange={(e) => {
                          const next = [...teamMembers];
                          next[idx].assignedHours = Number(e.target.value);
                          setTeamMembers(next);
                        }}
                        className="w-20 rounded border border-slate-800 bg-slate-900 px-2 py-1.5 text-slate-200"
                      />
                      <span className="text-slate-500 text-[11px]">hrs</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveTeamMember(idx)}
                      className="p-1.5 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sub-section: Inventory Requirements */}
          <div className="space-y-3 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Required Inventory Items & Hardware</h4>
                <p className="text-[11px] text-slate-500">Materials, components, or server equipment allocated from stock.</p>
              </div>
              <button
                type="button"
                onClick={handleAddInventory}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 border border-blue-900/60 bg-blue-950/30 px-2.5 py-1 rounded-lg"
              >
                <Plus className="h-3.5 w-3.5" /> Add Item
              </button>
            </div>

            {inventoryItems.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-900/40 rounded-lg border border-slate-800/80">
                No inventory items required at initialization.
              </p>
            ) : (
              <div className="space-y-2">
                {inventoryItems.map((item, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                    <select
                      value={item.productId}
                      onChange={(e) => {
                        const next = [...inventoryItems];
                        next[idx].productId = e.target.value;
                        setInventoryItems(next);
                      }}
                      className="flex-1 min-w-[200px] rounded border border-slate-800 bg-slate-900 px-2 py-1.5 text-slate-200"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 text-[11px]">Qty:</span>
                      <input
                        type="number"
                        min="1"
                        value={item.requiredQuantity}
                        onChange={(e) => {
                          const next = [...inventoryItems];
                          next[idx].requiredQuantity = Number(e.target.value);
                          setInventoryItems(next);
                        }}
                        className="w-20 rounded border border-slate-800 bg-slate-900 px-2 py-1.5 text-slate-200"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveInventory(idx)}
                      className="p-1.5 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sub-section: Vendors */}
          <div className="space-y-3 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Required Vendors & Subcontractors</h4>
                <p className="text-[11px] text-slate-500">Contracted suppliers or specialized third-party service providers.</p>
              </div>
              <button
                type="button"
                onClick={handleAddVendor}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 border border-blue-900/60 bg-blue-950/30 px-2.5 py-1 rounded-lg"
              >
                <Plus className="h-3.5 w-3.5" /> Add Vendor
              </button>
            </div>

            {linkedVendors.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-900/40 rounded-lg border border-slate-800/80">
                No external vendors associated.
              </p>
            ) : (
              <div className="space-y-2">
                {linkedVendors.map((v, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                    <select
                      value={v.vendorId}
                      onChange={(e) => {
                        const next = [...linkedVendors];
                        next[idx].vendorId = e.target.value;
                        setLinkedVendors(next);
                      }}
                      className="flex-1 min-w-[180px] rounded border border-slate-800 bg-slate-900 px-2 py-1.5 text-slate-200"
                    >
                      {vendors.map((ven) => (
                        <option key={ven.id} value={ven.id}>
                          {ven.displayName} ({ven.vendorCode})
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Role (e.g. Subcontractor)"
                      value={v.role}
                      onChange={(e) => {
                        const next = [...linkedVendors];
                        next[idx].role = e.target.value;
                        setLinkedVendors(next);
                      }}
                      className="w-32 rounded border border-slate-800 bg-slate-900 px-2 py-1.5 text-slate-200"
                    />

                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 text-[11px]">$</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Cost"
                        value={v.estimatedCost}
                        onChange={(e) => {
                          const next = [...linkedVendors];
                          next[idx].estimatedCost = Number(e.target.value);
                          setLinkedVendors(next);
                        }}
                        className="w-24 rounded border border-slate-800 bg-slate-900 px-2 py-1.5 text-slate-200"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveVendor(idx)}
                      className="p-1.5 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 6: Notes & Attachments */}
        <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white border-b border-slate-800 pb-2.5">
            <IndianRupee className="h-4 w-4 text-purple-400" />
            <span>6. Internal Notes & Documentation</span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Internal Operational Notes</label>
              <textarea
                rows={3}
                placeholder="Confidential execution notes, customer SLA notes, or handover guidelines..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Link
            href="/app/operations"
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-5 py-2 text-xs font-semibold text-white shadow-lg transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {submitting ? "Initializing..." : "Create Operation"}
          </button>
        </div>
      </form>
    </div>
  );
}
