"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/ui/pagination";
import {
  CheckSquare,
  Plus,
  Filter,
  Search,
  Calendar,
  User,
  Clock,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Send,
  MoreVertical,
  Kanban,
  List,
  Layers,
  Building,
  Tag,
  Briefcase,
  ChevronRight,
  ChevronDown,
  Shield,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";

interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "CANCELLED";
  dueDate?: string | null;
  completedAt?: string | null;
  relatedProjectId?: string | null;
  relatedClientId?: string | null;
  client?: { id: string; name: string; code: string } | null;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    designation: string;
    avatarUrl?: string | null;
  };
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
    designation: string;
    avatarUrl?: string | null;
  } | null;
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
  _count: {
    comments: number;
  };
  comments?: Array<{
    id: string;
    content: string;
    createdAt: string;
    author: {
      firstName: string;
      lastName: string;
      designation: string;
    };
  }>;
}

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  designation: string;
  department?: { id?: string; name: string; code?: string } | null;
  isFree?: boolean;
  busyReason?: string | null;
  activeTasksCount?: number;
  user?: { email?: string; role?: { code?: string; name?: string; level?: number } | null } | null;
}

// Roles considered leadership/executive — excluded from the Staff assignee window
const LEADERSHIP_ROLES = new Set([
  "SUPER_ADMIN", "ADMIN", "CHAIRPERSON", "CEO", "COO", "CFO", "CIO", "CTO", "CMO", "HR", "DIRECTOR", "MANAGER", "VP"
]);

function getRoleCode(emp: EmployeeOption): string {
  return emp.user?.role?.code || "EMPLOYEE";
}

function isExecutiveOrLeadership(emp: EmployeeOption): boolean {
  const email = (emp.email || emp.user?.email || "").toLowerCase();
  // 1. Exclude all core structural architecture personas (*.internal)
  if (email.endsWith(".internal")) return true;

  // 2. Exclude by role code and level
  const roleCode = getRoleCode(emp).toUpperCase();
  const roleLevel = emp.user?.role?.level ?? 10;
  if (LEADERSHIP_ROLES.has(roleCode) || roleLevel >= 30 || (roleCode && roleCode !== "EMPLOYEE")) {
    return true;
  }

  // 3. Exclude by designation keywords (executives, CXOs, managers, controllers, directors, officers)
  const des = (emp.designation || "").toLowerCase();
  return (
    des.includes("chief") ||
    des.includes("ceo") ||
    des.includes("cto") ||
    des.includes("cio") ||
    des.includes("cfo") ||
    des.includes("coo") ||
    des.includes("cmo") ||
    des.includes("cxo") ||
    des.includes("administrator") ||
    des.includes("admin") ||
    des.includes("chairperson") ||
    des.includes("director") ||
    des.includes("human resources") ||
    des.includes("hr") ||
    des.includes("head") ||
    des.includes("vp") ||
    des.includes("vice president") ||
    des.includes("manager") ||
    des.includes("lead") ||
    des.includes("controller") ||
    des.includes("officer") ||
    des.includes("executive") ||
    des.includes("supervisor")
  );
}

interface ClientOption {
  id: string;
  name: string;
  code: string;
}

export default function TasksPage() {
  const { user, isSuperAdmin, activeCompany } = useAuth();
  const activeCompanyId =
    activeCompany?.id || user?.activeCompany?.id || user?.employee?.organizationId;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  // Filters
  const [scope, setScope] = useState<"all" | "my" | "department">(
    (searchParams.get("scope") as "all" | "my" | "department") || "all"
  );
  const [quickFilter, setQuickFilter] = useState<string>(searchParams.get("quickFilter") || "all");
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>(searchParams.get("priority") || "ALL");
  const [assigneeFilter, setAssigneeFilter] = useState<string>(searchParams.get("assigneeId") || "ALL");
  const [clientFilter, setClientFilter] = useState<string>(searchParams.get("relatedClientId") || "ALL");
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">((searchParams.get("sortOrder") as "asc" | "desc") || "desc");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals & Drawers
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Form State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskProject, setNewTaskProject] = useState("");
  const [newTaskClient, setNewTaskClient] = useState("");
  const [formError, setFormError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (scope !== "all") params.set("scope", scope);
    if (quickFilter !== "all") params.set("quickFilter", quickFilter);
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (priorityFilter !== "ALL") params.set("priority", priorityFilter);
    if (assigneeFilter !== "ALL") params.set("assigneeId", assigneeFilter);
    if (clientFilter !== "ALL") params.set("relatedClientId", clientFilter);
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (sortBy !== "createdAt") params.set("sortBy", sortBy);
    if (sortOrder !== "desc") params.set("sortOrder", sortOrder);
    if (page > 1) params.set("page", String(page));

    const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState(null, "", newUrl);
  }, [scope, quickFilter, statusFilter, priorityFilter, assigneeFilter, clientFilter, debouncedSearch, sortBy, sortOrder, page, pathname]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (scope) params.set("scope", scope);
      if (quickFilter && quickFilter !== "all") params.set("quickFilter", quickFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (priorityFilter !== "ALL") params.set("priority", priorityFilter);
      if (assigneeFilter !== "ALL") params.set("assigneeId", assigneeFilter);
      if (clientFilter !== "ALL") params.set("relatedClientId", clientFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("page", String(viewMode === "kanban" ? 1 : page));
      params.set("limit", String(viewMode === "kanban" ? 100 : limit));

      if (activeCompanyId) params.set("organizationId", activeCompanyId);

      const res = await fetch(`/api/tasks?${params.toString()}`, {
        headers: activeCompanyId ? { "x-company-id": activeCompanyId } : {},
      });
      const data = await res.json();
      if (data.success) {
        const items = data.data.tasks || [];
        setTasks(items);
        if (data.data.pagination) {
          setTotalRecords(data.data.pagination.total);
          setTotalPages(data.data.pagination.totalPages);
        } else {
          setTotalRecords(items.length);
          setTotalPages(1);
        }

        // Deep link from global search: auto-open drawer if ?id=... matches
        const targetId = searchParams.get("id");
        if (targetId && !selectedTask) {
          const found = items.find((t: TaskItem) => t.id === targetId);
          if (found) {
            handleSelectTask(found);
          } else {
            // Fetch directly
            fetch(`/api/tasks/${targetId}`, {
              headers: activeCompanyId ? { "x-company-id": activeCompanyId } : {},
            })
              .then((r) => r.json())
              .then((d) => {
                if (d.success && d.data) setSelectedTask(d.data);
              })
              .catch(() => {});
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Strictly filter to regular staff employees — NO EXECUTIVES OR LEADERSHIP
  const staffEmployees = useMemo(
    () => employees.filter((e) => !isExecutiveOrLeadership(e)),
    [employees]
  );

  // Assignee dropdown state
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!assigneeDropdownOpen) return;
    function handleOutside(e: MouseEvent) {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(e.target as Node)) {
        setAssigneeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [assigneeDropdownOpen]);

  const matchesSearch = useCallback(
    (e: EmployeeOption) =>
      `${e.firstName} ${e.lastName} ${e.designation} ${e.department?.name || ""}`
        .toLowerCase()
        .includes(assigneeSearch.toLowerCase()),
    [assigneeSearch]
  );

  // Filtered staff list for the assignee window (NO EXECUTIVES)
  const filteredStaff = useMemo(
    () => staffEmployees.filter(matchesSearch),
    [staffEmployees, matchesSearch]
  );

  const selectedAssignee = newTaskAssigneeId
    ? staffEmployees.find((e) => e.id === newTaskAssigneeId) || employees.find((e) => e.id === newTaskAssigneeId)
    : null;

  const fetchEmployees = useCallback(async () => {
    try {
      const url = activeCompanyId
        ? `/api/employees?limit=200&organizationId=${encodeURIComponent(activeCompanyId)}`
        : "/api/employees?limit=200";
      const res = await fetch(url, {
        headers: activeCompanyId ? { "x-company-id": activeCompanyId } : {},
      });
      const data = await res.json();
      if (data.success) {
        const list = Array.isArray(data.data) ? data.data : (data.data?.employees || data.data?.items || []);
        setEmployees(list);
      }
    } catch (err) {
      console.error("fetchEmployees error:", err);
    }
  }, [activeCompanyId]);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/crm/clients?limit=200", {
        headers: activeCompanyId ? { "x-company-id": activeCompanyId } : {},
      });
      const data = await res.json();
      if (data.success && data.data.clients) {
        setClients(data.data.clients);
      }
    } catch {}
  }, [activeCompanyId]);

  useEffect(() => {
    fetchTasks();
  }, [scope, quickFilter, statusFilter, priorityFilter, assigneeFilter, clientFilter, debouncedSearch, sortBy, sortOrder, page, viewMode, activeCompanyId]);

  useEffect(() => {
    fetchEmployees();
    fetchClients();
  }, [fetchEmployees, fetchClients]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const handleClearFilters = () => {
    setScope("all");
    setQuickFilter("all");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setAssigneeFilter("ALL");
    setClientFilter("ALL");
    setSearchTerm("");
    setDebouncedSearch("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    scope !== "all" ||
    quickFilter !== "all" ||
    statusFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    assigneeFilter !== "ALL" ||
    clientFilter !== "ALL" ||
    debouncedSearch
  );

  const handleSelectTask = async (task: TaskItem) => {
    setSelectedTask(task);
    try {
      const res = await fetch(`/api/tasks/${task.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedTask(data.data);
      }
    } catch {}
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskItem["status"]) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch {}
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!newTaskTitle.trim()) {
      setFormError("Task title is required");
      return;
    }

    try {
      setIsCreating(true);
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(activeCompanyId ? { "x-company-id": activeCompanyId } : {}),
        },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDesc || undefined,
          priority: newTaskPriority,
          assigneeId: newTaskAssigneeId || undefined,
          dueDate: newTaskDueDate || undefined,
          relatedProjectId: newTaskProject || undefined,
          relatedClientId: newTaskClient || undefined,
          organizationId: activeCompanyId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error?.message || "Failed to create task");
        return;
      }

      setCreateModalOpen(false);
      setNewTaskTitle("");
      setNewTaskDesc("");
      setNewTaskAssigneeId("");
      setNewTaskDueDate("");
      setNewTaskProject("");
      setNewTaskClient("");
      fetchTasks();
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !commentInput.trim()) return;

    try {
      setIsSubmittingComment(true);
      const res = await fetch(`/api/tasks/${selectedTask.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentInput }),
      });
      const data = await res.json();
      if (data.success) {
        setCommentInput("");
        // Reload single task
        handleSelectTask(selectedTask);
        // Also increment comment count in task list
        setTasks((prev) =>
          prev.map((t) =>
            t.id === selectedTask.id
              ? { ...t, _count: { comments: t._count.comments + 1 } }
              : t
          )
        );
      }
    } catch {} finally {
      setIsSubmittingComment(false);
    }
  };

  const getPriorityBadge = (priority: TaskItem["priority"]) => {
    switch (priority) {
      case "URGENT":
        return <span className="rounded bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-semibold text-rose-400">Urgent</span>;
      case "HIGH":
        return <span className="rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-medium text-amber-400">High</span>;
      case "MEDIUM":
        return <span className="rounded bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-medium text-blue-400">Medium</span>;
      default:
        return <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400">Low</span>;
    }
  };

  const getStatusBadge = (status: TaskItem["status"]) => {
    switch (status) {
      case "COMPLETED":
        return <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-medium text-emerald-400">Completed</span>;
      case "IN_PROGRESS":
        return <span className="rounded bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-medium text-blue-400">In Progress</span>;
      case "BLOCKED":
        return <span className="rounded bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[10px] font-medium text-red-400">Blocked</span>;
      case "CANCELLED":
        return <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400">Cancelled</span>;
      default:
        return <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300">To Do</span>;
    }
  };

  const columns: { id: TaskItem["status"]; title: string; color: string }[] = [
    { id: "TODO", title: "To Do", color: "border-slate-700" },
    { id: "IN_PROGRESS", title: "In Progress", color: "border-blue-500/40" },
    { id: "BLOCKED", title: "Blocked", color: "border-rose-500/40" },
    { id: "COMPLETED", title: "Completed", color: "border-emerald-500/40" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Company Tasks & Activity"
          description="Hierarchical task delegation, departmental deliverables, status lifecycle, and collaboration threads."
        />
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-800 bg-[#0f172a] p-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
                viewMode === "kanban" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
                viewMode === "list" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <List className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Quick Filters, Dropdowns, Search */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-3.5 space-y-3">
        {/* Quick Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "All Tasks" },
              { id: "my", label: "My Tasks" },
              { id: "today", label: "Today" },
              { id: "upcoming", label: "Upcoming" },
              { id: "overdue", label: "Overdue" },
              { id: "completed", label: "Completed" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setQuickFilter(tab.id);
                  setPage(1);
                }}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  quickFilter === tab.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Scope Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Scope:</span>
            <select
              value={scope}
              onChange={(e) => {
                setScope(e.target.value as "all" | "my" | "department");
                setPage(1);
              }}
              className="h-7 rounded border border-slate-800 bg-slate-900 px-2 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Entire Organization</option>
              <option value="my">My Assigned</option>
              <option value="department">My Department</option>
            </select>
          </div>
        </div>

        {/* Detailed Filters & Search Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search tasks, descriptions, client tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 w-full rounded-md border border-slate-800 bg-slate-900 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Assignee Filter — Staff Employees Only */}
          <select
            value={assigneeFilter}
            onChange={(e) => {
              setAssigneeFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 rounded-md border border-slate-800 bg-slate-900 px-2.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none max-w-[200px]"
          >
            <option value="ALL">All Assignees</option>
            {staffEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.isFree ? "🟢" : "🟡"} {emp.firstName} {emp.lastName} ({emp.designation})
              </option>
            ))}
          </select>

          {/* Related Client Filter */}
          <select
            value={clientFilter}
            onChange={(e) => {
              setClientFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 rounded-md border border-slate-800 bg-slate-900 px-2.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none max-w-[160px]"
          >
            <option value="ALL">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 rounded-md border border-slate-800 bg-slate-900 px-2.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 rounded-md border border-slate-800 bg-slate-900 px-2.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-slate-800 bg-slate-900 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Filters:</span>
            {debouncedSearch && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs">
                Search: &ldquo;{debouncedSearch}&rdquo;
                <button onClick={() => { setSearchTerm(""); setDebouncedSearch(""); }} className="hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {quickFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs">
                Tab: {quickFilter}
                <button onClick={() => setQuickFilter("all")} className="hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {scope !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs">
                Scope: {scope}
                <button onClick={() => setScope("all")} className="hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {statusFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs">
                Status: {statusFilter}
                <button onClick={() => setStatusFilter("ALL")} className="hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {priorityFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs">
                Priority: {priorityFilter}
                <button onClick={() => setPriorityFilter("ALL")} className="hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {assigneeFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs">
                Assignee: {employees.find(e => e.id === assigneeFilter)?.firstName || "Selected"}
                <button onClick={() => setAssigneeFilter("ALL")} className="hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {clientFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs">
                Client: {clients.find(c => c.id === clientFilter)?.name || "Selected"}
                <button onClick={() => setClientFilter("ALL")} className="hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              onClick={handleClearFilters}
              className="text-xs text-blue-400 hover:text-blue-300 ml-1 underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Main View: Kanban or List */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-500">Loading corporate tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-12 text-center">
          <CheckSquare className="mx-auto h-8 w-8 text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-300">
            {hasActiveFilters ? "No tasks match your search and filter criteria" : "No corporate tasks found"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {hasActiveFilters 
              ? "Try adjusting filters, status, or search terms."
              : "Create a new task to initiate delegation and activity tracking."}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={handleClearFilters}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear Filters
            </button>
          ) : (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Task
            </button>
          )}
        </div>
      ) : viewMode === "kanban" ? (
        /* Kanban Board */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className="flex flex-col rounded-xl border border-slate-800/80 bg-[#0c1322] overflow-hidden"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-slate-800 bg-[#0f172a] px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200">{col.title}</span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-400">
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                {/* Card Container */}
                <div className="p-2.5 space-y-2.5 min-h-64 max-h-[70vh] overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="p-6 text-center text-[11px] text-slate-600 border border-dashed border-slate-800 rounded-lg">
                      No tasks in this lane
                    </div>
                  ) : (
                    colTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleSelectTask(t)}
                        className="group relative cursor-pointer rounded-lg border border-slate-800 bg-[#111928] p-3.5 hover:border-blue-500/50 hover:bg-[#141f33] transition-all shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          {getPriorityBadge(t.priority)}
                          {t.dueDate && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-400">
                              <Clock className="h-3 w-3" />
                              {new Date(t.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-semibold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-2">
                          {t.title}
                        </h4>

                        {t.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                            {t.description}
                          </p>
                        )}

                        {/* Project / Client Tags */}
                        {(t.relatedProjectId || t.relatedClientId || t.client) && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                            {t.relatedProjectId && (
                              <span className="inline-flex items-center gap-1 rounded bg-slate-800/80 px-1.5 py-0.5 text-[9px] font-mono text-slate-400">
                                <Tag className="h-2.5 w-2.5" />
                                {t.relatedProjectId}
                              </span>
                            )}
                            {(t.client?.name || t.relatedClientId) && (
                              <span className="inline-flex items-center gap-1 rounded bg-slate-800/80 px-1.5 py-0.5 text-[9px] font-mono text-cyan-400">
                                <Briefcase className="h-2.5 w-2.5" />
                                {t.client?.name || t.relatedClientId}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Footer: Assignee & Comments */}
                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/60 text-[10px] text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600/30 text-[9px] font-bold text-blue-300">
                              {t.assignee ? t.assignee.firstName[0] : "?"}
                            </div>
                            <span className="truncate max-w-[100px]">
                              {t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : "Unassigned"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-slate-500">
                            <MessageSquare className="h-3 w-3" />
                            <span>{t._count.comments}</span>
                          </div>
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
        /* Table / List View */
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#0c1322] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-[#0f172a] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-white select-none"
                    onClick={() => handleSort("title")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Task Title</span>
                      {sortBy === "title" ? (
                        sortOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-blue-400" /> : <ArrowDown className="h-3.5 w-3.5 text-blue-400" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-600" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-white select-none"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      {sortBy === "status" ? (
                        sortOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-blue-400" /> : <ArrowDown className="h-3.5 w-3.5 text-blue-400" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-600" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-white select-none"
                    onClick={() => handleSort("priority")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Priority</span>
                      {sortBy === "priority" ? (
                        sortOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-blue-400" /> : <ArrowDown className="h-3.5 w-3.5 text-blue-400" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-600" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Department</th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-white select-none"
                    onClick={() => handleSort("dueDate")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Due Date</span>
                      {sortBy === "dueDate" ? (
                        sortOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-blue-400" /> : <ArrowDown className="h-3.5 w-3.5 text-blue-400" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-600" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tasks.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => handleSelectTask(t)}
                    className="cursor-pointer hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200 hover:text-blue-400">{t.title}</span>
                        <span className="text-[10px] text-slate-500">
                          Created by {t.creator.firstName} {t.creator.lastName}
                          {t.client?.name && ` • Client: ${t.client.name}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(t.status)}</td>
                    <td className="px-4 py-3">{getPriorityBadge(t.priority)}</td>
                    <td className="px-4 py-3">
                      {t.assignee ? (
                        <span className="text-slate-300 font-medium">{t.assignee.firstName} {t.assignee.lastName}</span>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{t.department?.name || "General"}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChevronRight className="h-4 w-4 text-slate-500 ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Server-Side Pagination Bar */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalRecords={totalRecords}
            pageSize={limit}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}

      {/* Task Details Drawer Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative flex h-full w-full max-w-xl flex-col border-l border-slate-800 bg-[#0f172a] shadow-2xl overflow-hidden animate-in slide-in-from-right">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 py-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Task Specification & Activity
                </span>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Title & Status Controls */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {getPriorityBadge(selectedTask.priority)}
                  {getStatusBadge(selectedTask.status)}
                </div>
                <h2 className="text-lg font-bold text-white leading-snug">{selectedTask.title}</h2>
              </div>

              {/* Status Update Dropdown */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 flex items-center justify-between gap-4">
                <span className="text-xs font-medium text-slate-300">Update Lifecycle Status:</span>
                <select
                  value={selectedTask.status}
                  onChange={(e) => handleStatusChange(selectedTask.id, e.target.value as any)}
                  className="rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Description</h4>
                <div className="rounded-lg border border-slate-800/80 bg-[#0b101b] p-4 text-xs text-slate-300 leading-relaxed">
                  {selectedTask.description || "No formal description provided for this task."}
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Assignee</span>
                  <p className="text-slate-200 font-medium mt-0.5">
                    {selectedTask.assignee ? `${selectedTask.assignee.firstName} ${selectedTask.assignee.lastName}` : "Unassigned"}
                  </p>
                  <p className="text-[10px] text-slate-400">{selectedTask.assignee?.designation}</p>
                </div>
                <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Delegated By</span>
                  <p className="text-slate-200 font-medium mt-0.5">
                    {selectedTask.creator.firstName} {selectedTask.creator.lastName}
                  </p>
                  <p className="text-[10px] text-slate-400">{selectedTask.creator.designation}</p>
                </div>
                <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Due Date</span>
                  <p className="text-slate-200 font-medium mt-0.5">
                    {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : "No deadline"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Department</span>
                  <p className="text-slate-200 font-medium mt-0.5">
                    {selectedTask.department?.name || "Corporate"}
                  </p>
                </div>
              </div>

              {/* Discussion Thread */}
              <div>
                <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Activity & Comments ({selectedTask.comments?.length || 0})</span>
                </h4>

                <div className="space-y-3 mb-4 max-h-56 overflow-y-auto">
                  {selectedTask.comments && selectedTask.comments.length > 0 ? (
                    selectedTask.comments.map((c) => (
                      <div key={c.id} className="rounded-lg border border-slate-800 bg-[#0b101b] p-3 text-xs">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span className="font-semibold text-slate-200">
                            {c.author.firstName} {c.author.lastName}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-slate-300">{c.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                      No discussion notes yet. Leave a progress update below.
                    </div>
                  )}
                </div>

                {/* Comment Input Form */}
                <form onSubmit={handlePostComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a progress note or reply..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !commentInput.trim()}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors flex items-center gap-1"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-blue-500" />
                <h3 className="text-sm font-semibold text-white">Create Corporate Task</h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-md bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-400">
                {formError}
              </div>
            )}

            {(isSuperAdmin || user?.roleCode === "SUPER_ADMIN") && (
              <div className="mb-4 rounded-lg bg-blue-500/10 border border-blue-500/30 p-3 text-xs text-blue-300 flex items-start gap-2.5">
                <Shield className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-bold text-blue-200">Platform Super Admin: Read-Only Audit Oversight</p>
                  <p className="text-[11px] text-blue-300/80 leading-relaxed">
                    Under the CRM architecture, Super Admin monitors all corporate tasks across organizations and assigns persona roles. Direct operational task creation is delegated to operational management (Admin &gt; CEO &gt; HR &gt; CXOs &gt; Teams).
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Audit SSO Token Rotation Policy"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Detailed task instructions, acceptance criteria, or context..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Assign To</label>

                  {/* Custom Assignee Dropdown */}
                  <div ref={assigneeDropdownRef} className="relative">
                    {/* Trigger button */}
                    <button
                      type="button"
                      onClick={() => {
                        setAssigneeDropdownOpen((v) => !v);
                        setAssigneeSearch("");
                      }}
                      className={cn(
                        "w-full flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs transition-all",
                        assigneeDropdownOpen
                          ? "border-blue-500 bg-slate-900 ring-1 ring-blue-500/30"
                          : "border-slate-700 bg-slate-900 hover:border-slate-600"
                      )}
                    >
                      {selectedAssignee ? (
                        <>
                          <span className="text-sm">
                            {selectedAssignee.isFree ? "🟢" : "🟡"}
                          </span>
                          <div className="flex-1 text-left min-w-0">
                            <span className="font-semibold text-slate-100 truncate block">
                              {selectedAssignee.firstName} {selectedAssignee.lastName}
                            </span>
                            <span className="text-slate-400 text-[10px] truncate block">
                              {selectedAssignee.designation}{selectedAssignee.department ? ` · ${selectedAssignee.department.name}` : ""}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(ev) => { ev.stopPropagation(); setNewTaskAssigneeId(""); }}
                            className="shrink-0 rounded p-0.5 text-slate-500 hover:bg-slate-800 hover:text-rose-400 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-3.5 w-3.5 text-slate-500" />
                          <span className="flex-1 text-left text-slate-500">Select employee...</span>
                          <ChevronDown className={cn("h-3.5 w-3.5 text-slate-500 transition-transform", assigneeDropdownOpen && "rotate-180")} />
                        </>
                      )}
                    </button>

                    {/* Dropdown panel */}
                    {assigneeDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-xl border border-slate-700 bg-[#0c1225] shadow-2xl shadow-black/60 overflow-hidden animate-in fade-in zoom-in-95">
                        {/* Search bar */}
                        <div className="p-2 border-b border-slate-800">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
                            <input
                              autoFocus
                              type="text"
                              placeholder="Search employee name, designation, department..."
                              value={assigneeSearch}
                              onChange={(e) => setAssigneeSearch(e.target.value)}
                              className="w-full rounded-md border border-slate-700 bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Option list */}
                        <div className="max-h-56 overflow-y-auto py-1">
                          {/* Unassigned option */}
                          <button
                            type="button"
                            onClick={() => { setNewTaskAssigneeId(""); setAssigneeDropdownOpen(false); }}
                            className={cn(
                              "w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors",
                              !newTaskAssigneeId
                                ? "bg-blue-600/20 text-blue-300"
                                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                            )}
                          >
                            <span className="text-slate-500">—</span>
                            <span>Unassigned</span>
                          </button>

                          {/* Staff Employees Group — strictly staff employees only */}
                          {filteredStaff.length > 0 ? (
                            <>
                              <div className="flex items-center gap-1.5 px-3 py-1.5 mt-1 border-t border-slate-800/60">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                  👷 Assignable Staff Employees
                                </span>
                                <span className="ml-auto rounded-full bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-slate-400">
                                  {filteredStaff.length}
                                </span>
                              </div>
                              {filteredStaff.map((emp) => (
                                <button
                                  key={emp.id}
                                  type="button"
                                  onClick={() => {
                                    setNewTaskAssigneeId(emp.id);
                                    setAssigneeDropdownOpen(false);
                                    setAssigneeSearch("");
                                  }}
                                  className={cn(
                                    "w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors group",
                                    newTaskAssigneeId === emp.id
                                      ? "bg-blue-600/20 text-blue-300"
                                      : "text-slate-300 hover:bg-slate-800/70 hover:text-slate-100"
                                  )}
                                >
                                  <span className="text-sm shrink-0">{emp.isFree ? "🟢" : "🟡"}</span>
                                  <div className="flex-1 text-left min-w-0">
                                    <p className="font-medium truncate">{emp.firstName} {emp.lastName}</p>
                                    <p className="text-[10px] text-slate-500 group-hover:text-slate-400 truncate">
                                      {emp.designation}{emp.department ? ` · ${emp.department.name}` : ""}
                                    </p>
                                  </div>
                                  {emp.isFree ? (
                                    <span className="shrink-0 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400">
                                      Free
                                    </span>
                                  ) : (
                                    <span className="shrink-0 rounded-full bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400">
                                      Busy
                                    </span>
                                  )}
                                </button>
                              ))}
                            </>
                          ) : (
                            <div className="px-3 py-6 text-center text-xs text-slate-500">
                              {assigneeSearch.trim()
                                ? `No staff employees match "${assigneeSearch}"`
                                : "No staff employees available"}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected preview card (shown below trigger when closed) */}
                  {selectedAssignee && !assigneeDropdownOpen && (
                    <div className={cn(
                      "mt-2 rounded-lg px-3 py-2.5 flex items-center gap-3 text-xs border",
                      selectedAssignee.isFree
                        ? "bg-emerald-950/50 border-emerald-700/30 text-emerald-300"
                        : "bg-amber-950/50 border-amber-700/30 text-amber-300"
                    )}>
                      <span className="text-base">
                        {selectedAssignee.isFree ? "🟢" : "🟡"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{selectedAssignee.firstName} {selectedAssignee.lastName}</p>
                        <p className="opacity-70 truncate text-[10px]">
                          {selectedAssignee.isFree
                            ? `Free · ${selectedAssignee.designation}`
                            : `Busy · ${selectedAssignee.busyReason || "has active workload"}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Due Date</label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Related Project ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="PRJ-..."
                    value={newTaskProject}
                    onChange={(e) => setNewTaskProject(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Related Client ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="CLI-..."
                    value={newTaskClient}
                    onChange={(e) => setNewTaskClient(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isSuperAdmin || user?.roleCode === "SUPER_ADMIN"}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 transition-colors shadow-md disabled:opacity-50"
                >
                  {isSuperAdmin || user?.roleCode === "SUPER_ADMIN"
                    ? "Read-Only Audit Mode"
                    : isCreating
                    ? "Creating..."
                    : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
