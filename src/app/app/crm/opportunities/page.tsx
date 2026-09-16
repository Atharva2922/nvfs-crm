"use client";

import { useEffect, useState, useTransition } from "react";
import { CrmNav } from "@/modules/crm/components/crm-nav";
import { 
  IndianRupee, 
  TrendingUp, 
  Award, 
  Filter, 
  Plus, 
  Kanban, 
  List, 
  Building2, 
  Calendar, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  XCircle,
  MoreVertical,
  ChevronRight
} from "lucide-react";

interface Opportunity {
  id: string;
  name: string;
  value: number;
  stage: string;
  probability: number;
  expectedCloseDate: string | null;
  client: { id: string; name: string; code: string };
  contact?: { id: string; firstName: string; lastName: string; email: string } | null;
  owner: { id: string; firstName: string; lastName: string };
}

interface Metrics {
  pipelineValue: number;
  weightedForecast: number;
  wonValue: number;
  winRate: number;
  stageCounts: Record<string, number>;
}

const STAGES = [
  { key: "DISCOVERY", label: "Discovery", color: "border-sky-500/40 bg-sky-500/5 text-sky-400" },
  { key: "PROPOSAL", label: "Proposal", color: "border-indigo-500/40 bg-indigo-500/5 text-indigo-400" },
  { key: "NEGOTIATION", label: "Negotiation", color: "border-amber-500/40 bg-amber-500/5 text-amber-400" },
  { key: "CLOSED_WON", label: "Closed Won", color: "border-emerald-500/40 bg-emerald-500/5 text-emerald-400" },
  { key: "CLOSED_LOST", label: "Closed Lost", color: "border-rose-500/40 bg-rose-500/5 text-rose-400" },
];

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clients, setClients] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [isPending, startTransition] = useTransition();

  // Create form state
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [value, setValue] = useState("");
  const [stage, setStage] = useState("DISCOVERY");
  const [probability, setProbability] = useState("20");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [oppsRes, metricsRes, clientsRes] = await Promise.all([
        fetch("/api/crm/opportunities"),
        fetch("/api/crm/opportunities/metrics"),
        fetch("/api/crm/clients")
      ]);

      if (oppsRes.ok) {
        const json = await oppsRes.json();
        setOpportunities(json.data?.opportunities || []);
      }
      if (metricsRes.ok) {
        const json = await metricsRes.json();
        setMetrics(json.data || json);
      }
      if (clientsRes.ok) {
        const json = await clientsRes.json();
        const clientList = json.data?.clients || [];
        setClients(clientList);
        if (clientList.length > 0 && !clientId) setClientId(clientList[0].id);
      }
    } catch (err) {
      console.error("Failed to load opportunities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStage = async (oppId: string, newStage: string) => {
    try {
      const res = await fetch(`/api/crm/opportunities/${oppId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Stage update error:", err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !clientId || !value) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/crm/opportunities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            clientId,
            value: parseFloat(value),
            stage,
            probability: parseInt(probability, 10),
            expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate).toISOString() : null,
          })
        });

        if (res.ok) {
          setShowCreateModal(false);
          setName("");
          setValue("");
          fetchData();
        }
      } catch (err) {
        console.error("Create opportunity error:", err);
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header with Title & Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Deal Opportunities & Pipeline</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Visual stage tracking, probability-weighted revenue forecasts, and deal progression.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900/60 p-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === "kanban" 
                  ? "bg-zinc-800 text-white shadow-sm" 
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === "table" 
                  ? "bg-zinc-800 text-white shadow-sm" 
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Table
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Deal
          </button>
        </div>
      </div>

      {/* CRM Sub-Navigation */}
      <CrmNav />

      {/* Forecasting KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Open Pipeline</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">
              ₹{(metrics?.pipelineValue || 0).toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500 block mt-0.5">Active stages (Discovery to Negotiation)</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Weighted Forecast</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-400 tracking-tight">
              ₹{(metrics?.weightedForecast || 0).toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500 block mt-0.5">Adjusted by win probability</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Closed Won</span>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">
              ₹{(metrics?.wonValue || 0).toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500 block mt-0.5">Successfully booked revenue</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Win Rate</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">
              {metrics?.winRate || 0}%
            </span>
            <span className="text-xs text-zinc-500 block mt-0.5">Won vs total closed decisions</span>
          </div>
        </div>
      </div>

      {/* Main View: Kanban or Table */}
      {loading ? (
        <div className="p-12 text-center text-zinc-400">Loading pipeline deals...</div>
      ) : viewMode === "kanban" ? (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
          {STAGES.map((col) => {
            const colOpps = opportunities.filter((o) => o.stage === col.key);
            const colTotal = colOpps.reduce((sum, o) => sum + o.value, 0);

            return (
              <div key={col.key} className="flex flex-col rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 min-h-[550px]">
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${
                        col.key === "CLOSED_WON" ? "bg-emerald-500" :
                        col.key === "CLOSED_LOST" ? "bg-rose-500" :
                        col.key === "NEGOTIATION" ? "bg-amber-500" :
                        col.key === "PROPOSAL" ? "bg-indigo-500" : "bg-sky-500"
                      }`} />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">{col.label}</h3>
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                        {colOpps.length}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-zinc-400 block mt-1">
                      ₹{colTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Cards List */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colOpps.length === 0 ? (
                    <div className="py-8 text-center border border-dashed border-zinc-800/80 rounded-lg">
                      <span className="text-xs text-zinc-600">No deals</span>
                    </div>
                  ) : (
                    colOpps.map((opp) => (
                      <div 
                        key={opp.id} 
                        className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-4 shadow-sm hover:border-zinc-700 transition-all group"
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">
                            {opp.name}
                          </h4>
                          <span className="text-xs font-bold text-white">
                            ₹{opp.value.toLocaleString()}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
                          <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                          <span className="truncate">{opp.client.name}</span>
                        </div>

                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-500">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{opp.owner.firstName}</span>
                          </div>
                          <span className="font-medium text-zinc-400">{opp.probability}% win</span>
                        </div>

                        {/* Stage Mover Buttons */}
                        <div className="mt-3 flex items-center justify-between gap-1 pt-2 border-t border-zinc-800/40">
                          <select
                            value={opp.stage}
                            onChange={(e) => handleUpdateStage(opp.id, e.target.value)}
                            className="w-full rounded bg-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-300 border border-zinc-700 hover:border-zinc-600 focus:outline-none"
                          >
                            <option value="DISCOVERY">Discovery (20%)</option>
                            <option value="PROPOSAL">Proposal (40%)</option>
                            <option value="NEGOTIATION">Negotiation (70%)</option>
                            <option value="CLOSED_WON">Closed Won (100%)</option>
                            <option value="CLOSED_LOST">Closed Lost (0%)</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
          <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
            <thead className="bg-zinc-950/60 text-xs uppercase font-semibold tracking-wider text-zinc-400">
              <tr>
                <th className="px-6 py-4">Opportunity</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4">Stage</th>
                <th className="px-6 py-4">Probability</th>
                <th className="px-6 py-4">Close Date</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {opportunities.map((opp) => {
                const stageConfig = STAGES.find((s) => s.key === opp.stage);
                return (
                  <tr key={opp.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{opp.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-zinc-500" />
                        <span>{opp.client.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">
                      ₹{opp.value.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${stageConfig?.color}`}>
                        {stageConfig?.label || opp.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{opp.probability}%</td>
                    <td className="px-6 py-4 text-xs text-zinc-400">
                      {opp.expectedCloseDate ? new Date(opp.expectedCloseDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-400">
                      {opp.owner.firstName} {opp.owner.lastName}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select
                        value={opp.stage}
                        onChange={(e) => handleUpdateStage(opp.id, e.target.value)}
                        className="rounded bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300 border border-zinc-700 hover:border-zinc-600 focus:outline-none"
                      >
                        <option value="DISCOVERY">Discovery</option>
                        <option value="PROPOSAL">Proposal</option>
                        <option value="NEGOTIATION">Negotiation</option>
                        <option value="CLOSED_WON">Closed Won</option>
                        <option value="CLOSED_LOST">Closed Lost</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* New Opportunity Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Create New Opportunity</h3>
            <p className="text-xs text-zinc-400 mt-1">Add a new deal to the pipeline.</p>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300">Opportunity Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise Cloud Migration"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300">Client Account *</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300">Deal Value (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="50000"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300">Initial Stage</label>
                  <select
                    value={stage}
                    onChange={(e) => {
                      setStage(e.target.value);
                      if (e.target.value === "DISCOVERY") setProbability("20");
                      if (e.target.value === "PROPOSAL") setProbability("40");
                      if (e.target.value === "NEGOTIATION") setProbability("70");
                      if (e.target.value === "CLOSED_WON") setProbability("100");
                      if (e.target.value === "CLOSED_LOST") setProbability("0");
                    }}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="DISCOVERY">Discovery (20%)</option>
                    <option value="PROPOSAL">Proposal (40%)</option>
                    <option value="NEGOTIATION">Negotiation (70%)</option>
                    <option value="CLOSED_WON">Closed Won (100%)</option>
                    <option value="CLOSED_LOST">Closed Lost (0%)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300">Probability (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={probability}
                    onChange={(e) => setProbability(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300">Expected Close Date</label>
                  <input
                    type="date"
                    value={expectedCloseDate}
                    onChange={(e) => setExpectedCloseDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isPending ? "Creating..." : "Create Deal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
