"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
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
  Shield,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  designation: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  // Filters
  const [scope, setScope] = useState<"all" | "my" | "department">("all");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

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

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (scope) params.set("scope", scope);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (priorityFilter !== "ALL") params.set("priority", priorityFilter);
      if (searchTerm) params.set("search", searchTerm);

      const res = await fetch(`/api/tasks?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.data.tasks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees?limit=50");
      const data = await res.json();
      if (data.success && data.data.employees) {
        setEmployees(data.data.employees);
      }
    } catch {}
  };

  useEffect(() => {
    fetchTasks();
  }, [scope, statusFilter, priorityFilter, searchTerm]);

  useEffect(() => {
    fetchEmployees();
  }, []);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDesc || undefined,
          priority: newTaskPriority,
          assigneeId: newTaskAssigneeId || undefined,
          dueDate: newTaskDueDate || undefined,
          relatedProjectId: newTaskProject || undefined,
          relatedClientId: newTaskClient || undefined,
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

      {/* Control Bar: Scope, Filters, Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 rounded-lg border border-slate-800 bg-[#0f172a]/90 p-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Scope Pills */}
          <div className="flex items-center rounded-md border border-slate-800 bg-slate-900 p-0.5">
            <button
              onClick={() => setScope("all")}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                scope === "all" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
              )}
            >
              All Tasks
            </button>
            <button
              onClick={() => setScope("my")}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                scope === "my" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
              )}
            >
              My Assigned
            </button>
            <button
              onClick={() => setScope("department")}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                scope === "department" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
              )}
            >
              Department
            </button>
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
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
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-md border border-slate-800 bg-slate-900 px-2.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search tasks, projects, tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 w-full rounded-md border border-slate-800 bg-slate-900 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Main View: Kanban or List */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-500">Loading corporate tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-12 text-center">
          <CheckSquare className="mx-auto h-8 w-8 text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-300">No tasks found matching criteria</p>
          <p className="text-xs text-slate-500 mt-1">Create a new task to initiate delegation and activity tracking.</p>
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
                        {(t.relatedProjectId || t.relatedClientId) && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                            {t.relatedProjectId && (
                              <span className="inline-flex items-center gap-1 rounded bg-slate-800/80 px-1.5 py-0.5 text-[9px] font-mono text-slate-400">
                                <Tag className="h-2.5 w-2.5" />
                                {t.relatedProjectId}
                              </span>
                            )}
                            {t.relatedClientId && (
                              <span className="inline-flex items-center gap-1 rounded bg-slate-800/80 px-1.5 py-0.5 text-[9px] font-mono text-cyan-400">
                                <Briefcase className="h-2.5 w-2.5" />
                                {t.relatedClientId}
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
        <div className="rounded-xl border border-slate-800 bg-[#0c1322] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-[#0f172a] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Task Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Assignee</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Due Date</th>
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
                      <span className="text-[10px] text-slate-500">Created by {t.creator.firstName} {t.creator.lastName}</span>
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
                  <label className="block font-medium text-slate-300 mb-1">Assignee</label>
                  <select
                    value={newTaskAssigneeId}
                    onChange={(e) => setNewTaskAssigneeId(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.designation})
                      </option>
                    ))}
                  </select>
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
                  disabled={isCreating}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 transition-colors shadow-md disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
