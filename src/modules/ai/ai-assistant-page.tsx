"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles,
  Search,
  Plus,
  Send,
  Loader2,
  AlertCircle,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building,
  Briefcase,
  Layers,
  IndianRupee,
  FolderKanban,
  FileCheck,
  CheckSquare,
  HelpCircle,
  ArrowRight,
  Info,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";
import { AIActionPreviewModal } from "./ai-action-preview-modal";

interface MessageItem {
  id?: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  sources?: any[];
  actionPreview?: any;
}

export function AIAssistantPage() {
  const { user, role } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [searchHistory, setSearchHistory] = useState("");
  const [pendingAction, setPendingAction] = useState<any | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Role-specific suggested prompts
  const suggestedPrompts = React.useMemo(() => {
    if (role === "CEO" || role === "CHAIRPERSON") {
      return [
        "Give me today's business overview.",
        "Show major organizational risks.",
        "Explain this month's revenue trend.",
        "Which delayed projects need attention?",
      ];
    } else if (role === "CFO") {
      return [
        "Show overdue receivables.",
        "Summarize this month's expenses.",
        "Identify unusual financial changes.",
        "Which client invoices are overdue?",
      ];
    } else if (role === "CMO") {
      return [
        "Show leads requiring attention.",
        "Analyze conversion performance.",
        "Summarize inactive clients.",
        "What is our open sales pipeline?",
      ];
    } else if (role === "CTO") {
      return [
        "Show delayed projects.",
        "Analyze team workload.",
        "Summarize technical operations risks.",
        "What are the highest priority tasks?",
      ];
    } else {
      return [
        "Show my pending tasks.",
        "Summarize today's work.",
        "Show tasks approaching their deadline.",
        "Help me follow up on my recent project.",
      ];
    }
  }, [role]);

  // Fetch list of conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/conversations");
      if (res.ok) {
        const data = await res.json();
        const convs = data.data.conversations || [];
        setConversations(convs);
        if (!selectedConversation && convs.length > 0) {
          loadConversation(convs[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load conversations:", e);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [selectedConversation]);

  const loadConversation = async (convId: string) => {
    try {
      const res = await fetch(`/api/ai/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedConversation(data.data.conversation);
        setMessages(data.data.conversation.messages || []);
      }
    } catch (e) {
      console.error("Failed to load conversation details:", e);
    }
  };

  const handleStartNewSession = async () => {
    setSelectedConversation(null);
    setMessages([]);
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation session?")) return;
    try {
      await fetch(`/api/ai/conversations/${convId}`, { method: "DELETE" });
      if (selectedConversation?.id === convId) {
        handleStartNewSession();
      }
      fetchConversations();
    } catch (e) {
      console.error("Delete conversation error:", e);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || isLoading) return;

    const userMsg: MessageItem = { role: "USER", content: query };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          conversationId: selectedConversation?.id || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to get AI response");
      }

      const assistantMsg: MessageItem = {
        role: "ASSISTANT",
        content: data.data.message,
        sources: data.data.sources || [],
        actionPreview: data.data.actionPreview,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (!selectedConversation?.id && data.data.conversationId) {
        fetchConversations();
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ASSISTANT",
          content: `⚠️ ${err.message || "An error occurred while evaluating your query."}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchHistory.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-slate-50 dark:bg-[#070b14]">
      {/* 1. LEFT PANE: Conversations History & Search */}
      <div className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0b101d]">
        <div className="flex items-center justify-between border-b border-slate-100 p-3.5 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Intelligence Sessions
            </span>
          </div>

          <Button
            size="sm"
            onClick={handleStartNewSession}
            className="h-7 px-2.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New</span>
          </Button>
        </div>

        {/* Search History */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              placeholder="Search previous sessions..."
              className="h-8 pl-8 text-xs bg-slate-50 dark:bg-slate-900"
            />
          </div>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
          {isLoadingHistory ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No previous AI sessions found.
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isSelected = selectedConversation?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => loadConversation(c.id)}
                  className={`group flex cursor-pointer items-center justify-between p-3 text-xs transition-colors ${
                    isSelected
                      ? "border-l-4 border-l-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20"
                      : "hover:bg-slate-50 dark:hover:bg-slate-900/60"
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="truncate font-semibold text-slate-800 dark:text-slate-200">
                      {c.title}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(c.updatedAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteConversation(c.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. CENTER PANE: Conversation Stream, Prompt Chips & Composer */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-[#090d16]">
        {/* Top Header */}
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {selectedConversation?.title || "Executive AI Intelligence Hub"}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span className="hidden sm:inline">RBAC Scoped & Grounded</span>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center max-w-xl mx-auto">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg mb-4">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                How can I assist your {role} decisions today?
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Ask natural-language questions across your authorized CRM records, analyze financial trends, or request verified action drafts.
              </p>

              {/* Suggested Prompt Chips */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full text-left">
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(p)}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-700 hover:border-indigo-400 hover:bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-indigo-800 transition-all shadow-2xs"
                  >
                    <span className="truncate mr-2 font-medium">{p}</span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, idx) => {
              const isUser = m.role === "USER";
              return (
                <div
                  key={idx}
                  className={`flex gap-3 text-xs ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 mt-1">
                      <Sparkles className="h-4 w-4" />
                    </div>
                  )}

                  <div className={`max-w-2xl space-y-2 ${isUser ? "items-end" : "items-start"}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 leading-relaxed shadow-2xs ${
                        isUser
                          ? "bg-indigo-600 text-white rounded-tr-none"
                          : "border border-slate-200 bg-slate-50/80 text-slate-800 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 rounded-tl-none"
                      }`}
                    >
                      <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                    </div>

                    {/* Source Citations */}
                    {m.sources && m.sources.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Grounded Source Records
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {m.sources.map((s: any, sIdx: number) => (
                            <a
                              key={sIdx}
                              href={s.url}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-700 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                            >
                              <span>{s.title}</span>
                              <ExternalLink className="h-2.5 w-2.5 text-slate-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Preview Card */}
                    {m.actionPreview && (
                      <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 text-xs dark:border-indigo-900/60 dark:bg-indigo-950/30">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-900 dark:text-indigo-200">
                            Suggested Action: {m.actionPreview.title}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => setPendingAction(m.actionPreview)}
                            className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1"
                          >
                            <span>Review & Confirm</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                          {m.actionPreview.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Query Composer */}
        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={`Ask AI Intelligence Assistant as ${role}...`}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
            <Button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-4 gap-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Ask</span>
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* 3. RIGHT PANE: Context & Intelligence Drawer */}
      <div className="w-80 shrink-0 border-l border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-[#0b101d] overflow-y-auto space-y-5 hidden lg:block">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Current Account Context
          </h3>
          <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">
            {user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user?.email || "Enterprise User"}
          </p>
          <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
            {role}
          </span>
        </div>

        {/* Security / RBAC Banner */}
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-3.5 text-xs text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Strict Data Isolation
          </p>
          <p className="text-[11px] text-emerald-800/90 dark:text-emerald-400 leading-relaxed">
            All AI responses are scoped exclusively to your organization and permission levels. Financial and legal data remain strictly compartmentalized.
          </p>
        </div>

        {/* Suggested Queries */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Suggested Inquiries
          </h4>
          <div className="space-y-1.5">
            {suggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(p)}
                className="w-full text-left rounded-lg border border-slate-200 bg-white p-2.5 text-[11px] text-slate-700 hover:border-indigo-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition-colors shadow-2xs truncate"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Preview Modal */}
      {pendingAction && (
        <AIActionPreviewModal
          isOpen={Boolean(pendingAction)}
          onClose={() => setPendingAction(null)}
          action={pendingAction}
          onSuccess={() => handleStartNewSession()}
        />
      )}
    </div>
  );
}
