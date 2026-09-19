"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  MessageSquare,
  Users,
  Hash,
  AtSign,
  Megaphone,
  Archive,
  Plus,
  Send,
  Paperclip,
  CheckSquare,
  Smile,
  Shield,
  Clock,
  FileText,
  CornerDownRight,
  MoreVertical,
  Trash2,
  Edit2,
  Copy,
  ExternalLink,
  ChevronRight,
  User,
  PanelRightClose,
  PanelRightOpen,
  Loader2,
  AlertCircle,
  Check,
  CheckCheck,
  Building,
  FolderKanban,
  FileCheck,
  Receipt,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/components/providers/auth-provider";
import { MessageToTaskDialog } from "./message-to-task-dialog";
import { AnnouncementsView } from "./announcements-view";

const COMMON_REACTIONS = ["👍", "✅", "❤️", "😂", "⚠️", "❗"];

export function CommunicationHub() {
  const { user } = useAuth();

  // Navigation / Filter selection
  const [activeSection, setActiveSection] = useState<
    "INBOX" | "DIRECT" | "GROUPS" | "CHANNELS" | "MENTIONS" | "ANNOUNCEMENTS" | "ARCHIVED"
  >("INBOX");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Conversations list & selection
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  // Messages stream
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [priority, setPriority] = useState<"NORMAL" | "IMPORTANT" | "URGENT">("NORMAL");
  const [channel, setChannel] = useState<"INTERNAL" | "EMAIL" | "SMS" | "WHATSAPP">("INTERNAL");
  const [isSending, setIsSending] = useState(false);

  // Thread & Interaction state
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [editingMessage, setEditingMessage] = useState<any | null>(null);
  const [editContent, setEditContent] = useState("");
  const [taskModalMessage, setTaskModalMessage] = useState<any | null>(null);

  // Right sidebar drawer state
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(true);

  // New conversation modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState<"DIRECT" | "GROUP" | "CHANNEL">("DIRECT");
  const [createTitle, setCreateTitle] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createTargetEmpId, setCreateTargetEmpId] = useState("");
  const [employeesDirectory, setEmployeesDirectory] = useState<any[]>([]);
  const [isCreatingConv, setIsCreatingConv] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch directory for creating conversations
  const fetchDirectory = async () => {
    try {
      const res = await fetch("/api/employees?limit=100");
      if (res.ok) {
        const data = await res.json();
        const emps = (data.data?.employees || data.employees || []).map((e: any) => ({
          id: e.id,
          name: `${e.firstName || ""} ${e.lastName || ""}`.trim() || e.user?.name || e.email,
          email: e.email || e.user?.email,
          designation: e.designation || e.department?.name,
        }));
        setEmployeesDirectory(emps.filter((e: any) => e.id !== user?.employee?.id));
      }
    } catch (e) {
      console.error("Directory fetch error:", e);
    }
  };

  // Fetch conversations list
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/communications/conversations");
      if (res.ok) {
        const data = await res.json();
        const convs = data.data.conversations || [];
        setConversations(convs);

        // Select first conversation if none selected
        if (!selectedConversation && convs.length > 0 && activeSection !== "ANNOUNCEMENTS") {
          setSelectedConversation(convs[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load conversations:", e);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [selectedConversation, activeSection]);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const res = await fetch(`/api/communications/conversations/${conversationId}/messages?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.data.messages || []);
      }
    } catch (e) {
      console.error("Failed to fetch messages:", e);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    fetchDirectory();
  }, []);

  useEffect(() => {
    if (selectedConversation?.id && activeSection !== "ANNOUNCEMENTS") {
      setIsLoadingMessages(true);
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation?.id, activeSection]);

  // Polling fallback every 8 seconds for real-time update feel
  useEffect(() => {
    if (!selectedConversation?.id || activeSection === "ANNOUNCEMENTS") return;
    const interval = setInterval(() => {
      fetchMessages(selectedConversation.id);
    }, 8000);
    return () => clearInterval(interval);
  }, [selectedConversation?.id, activeSection, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Global search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/communications/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.data.results);
        }
      } catch (e) {
        console.error("Search error:", e);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/communications/conversations/${selectedConversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: messageInput,
          priority,
          channel,
          parentId: replyTo?.id || undefined,
        }),
      });

      if (res.ok) {
        setMessageInput("");
        setReplyTo(null);
        setPriority("NORMAL");
        fetchMessages(selectedConversation.id);
        fetchConversations();
      }
    } catch (e) {
      console.error("Error sending message:", e);
    } finally {
      setIsSending(false);
    }
  };

  // Reactions & Actions
  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await fetch(`/api/communications/messages/${messageId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (selectedConversation) fetchMessages(selectedConversation.id);
    } catch (e) {
      console.error("Error reacting:", e);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Delete this message?")) return;
    try {
      await fetch(`/api/communications/messages/${messageId}`, {
        method: "DELETE",
      });
      if (selectedConversation) fetchMessages(selectedConversation.id);
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  const handleEditMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMessage || !editContent.trim()) return;
    try {
      await fetch(`/api/communications/messages/${editingMessage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      setEditingMessage(null);
      if (selectedConversation) fetchMessages(selectedConversation.id);
    } catch (e) {
      console.error("Edit error:", e);
    }
  };

  // Handle Create Conversation (Direct, Group, Channel)
  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingConv(true);
    try {
      const payload: any = { type: createType };
      if (createType === "DIRECT") {
        payload.targetEmployeeId = createTargetEmpId;
      } else {
        payload.title = createTitle;
        payload.description = createDesc;
      }

      const res = await fetch("/api/communications/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setIsCreateModalOpen(false);
        setCreateTitle("");
        setCreateDesc("");
        setCreateTargetEmpId("");
        await fetchConversations();
        setSelectedConversation(data.data.conversation);
      }
    } catch (e) {
      console.error("Create conversation error:", e);
    } finally {
      setIsCreatingConv(false);
    }
  };

  // Filter conversations according to active section
  const filteredConversations = conversations.filter((c) => {
    if (activeSection === "DIRECT") return c.type === "DIRECT";
    if (activeSection === "GROUPS") return c.type === "GROUP";
    if (activeSection === "CHANNELS") return c.type === "CHANNEL";
    if (activeSection === "ARCHIVED") return c.isArchived;
    return !c.isArchived; // INBOX shows all non-archived
  });

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-slate-50 dark:bg-[#070b14]">
      {/* 1. LEFT PANE: Search, Navigation, Conversation List */}
      <div className="flex w-80 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0b101d]">
        {/* Hub Header & Action */}
        <div className="flex items-center justify-between border-b border-slate-100 p-3.5 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600 dark:bg-blue-500/20">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Collaboration Hub
              </h1>
              <p className="text-[10px] text-slate-400">Connected CRM Layer</p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="h-7 w-7 rounded-full p-0 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            title="Start New Conversation"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Global Search Bar */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages, records, files..."
              className="h-8 pl-8 text-xs bg-slate-50 dark:bg-slate-900"
            />
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="grid grid-cols-4 gap-1 p-2 border-b border-slate-100 text-[11px] font-medium dark:border-slate-800">
          {[
            { id: "INBOX", label: "Inbox", icon: MessageSquare },
            { id: "DIRECT", label: "Direct", icon: User },
            { id: "CHANNELS", label: "Channels", icon: Hash },
            { id: "ANNOUNCEMENTS", label: "Notices", icon: Megaphone },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex flex-col items-center justify-center rounded-md py-1.5 transition-colors ${
                activeSection === tab.id
                  ? "bg-blue-50 text-blue-600 font-semibold dark:bg-blue-950/40 dark:text-blue-400"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5 mb-0.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search Results Dropdown/Overlay */}
        {searchResults && (
          <div className="p-3 bg-blue-50/50 border-b border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/40 text-xs">
            <p className="font-semibold text-blue-800 dark:text-blue-300 mb-1.5">
              Found {searchResults.messages.length} messages, {searchResults.conversations.length} chats
            </p>
            {searchResults.messages.slice(0, 3).map((m: any) => (
              <div
                key={m.id}
                onClick={() => {
                  const targetConv = conversations.find((c) => c.id === m.conversationId);
                  if (targetConv) setSelectedConversation(targetConv);
                  setSearchQuery("");
                }}
                className="cursor-pointer rounded p-1 hover:bg-white dark:hover:bg-slate-800 text-[11px] truncate text-slate-700 dark:text-slate-300"
              >
                • {m.content}
              </div>
            ))}
          </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850">
          {isLoadingConversations ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            </div>
          ) : activeSection === "ANNOUNCEMENTS" ? (
            <div className="p-4 text-center text-xs text-slate-400">
              Viewing Official Announcements in Center Pane
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-slate-400">
              <MessageSquare className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-2" />
              <p>No conversations found in this view.</p>
              <p className="text-[10px] text-slate-400 mt-1">
                Click + above or open any CRM record to collaborate.
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedConversation?.id === conv.id;
              const isDirect = conv.type === "DIRECT";
              const isRecord = conv.type === "RECORD";
              const isChannel = conv.type === "CHANNEL";

              // Find counterpart name if direct
              const counterpart = isDirect
                ? conv.participants?.find((p: any) => p.employeeId !== user?.employee?.id)?.employee
                : null;
              const convTitle = counterpart
                ? `${counterpart.firstName || ""} ${counterpart.lastName || ""}`.trim() || counterpart.user?.name || "Colleague"
                : conv.title || "Group Chat";

              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`flex cursor-pointer items-start gap-3 p-3 transition-colors ${
                    isSelected
                      ? "border-l-4 border-l-blue-600 bg-blue-50/50 dark:bg-blue-950/20"
                      : "hover:bg-slate-50 dark:hover:bg-slate-900/60"
                  }`}
                >
                  <div className="relative mt-0.5 shrink-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {isChannel ? (
                        <Hash className="h-4 w-4 text-blue-600" />
                      ) : isRecord ? (
                        <FolderKanban className="h-4 w-4 text-amber-600" />
                      ) : (
                        convTitle[0]?.toUpperCase()
                      )}
                    </div>
                    {/* Active Presence Dot */}
                    {isDirect && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                    )}
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {convTitle}
                      </p>
                      <span className="text-[9px] text-slate-400">
                        {conv.messages?.[0]?.createdAt
                          ? new Date(conv.messages[0].createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </div>

                    <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                      {conv.messages?.[0]?.content || conv.description || "No messages yet"}
                    </p>

                    {isRecord && conv.recordType && (
                      <span className="mt-1 inline-block rounded bg-amber-50 px-1.5 py-0.2 text-[9px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                        {conv.recordType}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. CENTER PANE: Active Conversation Stream OR Announcements */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-[#090d16]">
        {activeSection === "ANNOUNCEMENTS" ? (
          <AnnouncementsView />
        ) : selectedConversation ? (
          <>
            {/* Conversation Top Header */}
            <div className="flex h-14 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600 dark:bg-blue-500/20">
                  {selectedConversation.type === "CHANNEL" ? (
                    <Hash className="h-5 w-5" />
                  ) : selectedConversation.type === "RECORD" ? (
                    <FolderKanban className="h-5 w-5" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {selectedConversation.title || "Direct Communication"}
                    </h2>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {selectedConversation.type}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {selectedConversation.participants?.length || 0} participants • Connected to CRM Record Layer
                  </p>
                </div>
              </div>

              {/* Toggle Right Context Drawer */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRightDrawerOpen(!isRightDrawerOpen)}
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                  title="Toggle Record & Participant Details"
                >
                  {isRightDrawerOpen ? (
                    <PanelRightClose className="h-4 w-4" />
                  ) : (
                    <PanelRightOpen className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Conversation Messages Stream */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {isLoadingMessages ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center text-center text-slate-400">
                  <MessageSquare className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Start of Conversation
                  </p>
                  <p className="text-xs text-slate-400">
                    Messages are securely isolated to your organization and participants.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === user?.employee?.id;
                  const senderName = msg.sender?.user?.name || "Colleague";

                  return (
                    <div
                      key={msg.id}
                      className={`group flex items-start gap-3 text-xs ${
                        isMine ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {senderName[0]?.toUpperCase()}
                      </div>

                      {/* Bubble */}
                      <div className={`max-w-xl space-y-1 ${isMine ? "items-end" : "items-start"}`}>
                        {/* Header info */}
                        <div
                          className={`flex items-center gap-2 text-[10px] text-slate-400 ${
                            isMine ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {isMine ? "You" : senderName}
                          </span>
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {msg.isEdited && <span className="italic">(edited)</span>}
                        </div>

                        {/* Content Card */}
                        <div
                          className={`rounded-2xl px-4 py-2.5 leading-relaxed shadow-xs ${
                            msg.isDeleted
                              ? "bg-slate-100 text-slate-400 italic dark:bg-slate-800"
                              : isMine
                              ? "bg-blue-600 text-white rounded-tr-none"
                              : "bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200 rounded-tl-none"
                          }`}
                        >
                          {/* Priority Tag */}
                          {msg.priority !== "NORMAL" && !msg.isDeleted && (
                            <span
                              className={`mb-1 inline-block rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                                msg.priority === "URGENT"
                                  ? "bg-red-500 text-white"
                                  : "bg-amber-500 text-white"
                              }`}
                            >
                              {msg.priority}
                            </span>
                          )}

                          <p className="whitespace-pre-wrap">{msg.isDeleted ? "Message deleted" : msg.content}</p>
                        </div>

                        {/* Reactions & Action toolbar */}
                        {!msg.isDeleted && (
                          <div
                            className={`flex items-center gap-1 text-[10px] ${
                              isMine ? "justify-end" : "justify-start"
                            }`}
                          >
                            {/* Reactions pill */}
                            {msg.reactions?.map((r: any) => (
                              <button
                                key={r.id}
                                onClick={() => handleReaction(msg.id, r.emoji)}
                                className="rounded-full bg-slate-100 px-1.5 py-0.5 hover:bg-slate-200 dark:bg-slate-800"
                              >
                                {r.emoji}
                              </button>
                            ))}

                            {/* Quick Emoji Reaction Buttons */}
                            <div className="hidden group-hover:flex items-center gap-0.5">
                              {COMMON_REACTIONS.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReaction(msg.id, emoji)}
                                  className="text-[12px] hover:scale-125 transition-transform"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>

                            {/* Actions menu */}
                            <div className="hidden group-hover:flex items-center gap-1 ml-1 text-slate-400">
                              <button
                                type="button"
                                onClick={() => setReplyTo(msg)}
                                title="Reply in thread"
                                className="hover:text-slate-700 dark:hover:text-slate-200"
                              >
                                <CornerDownRight className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setTaskModalMessage(msg)}
                                title="Convert to CRM Task"
                                className="hover:text-blue-600"
                              >
                                <CheckSquare className="h-3.5 w-3.5" />
                              </button>
                              {isMine && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingMessage(msg);
                                      setEditContent(msg.content);
                                    }}
                                    title="Edit"
                                    className="hover:text-slate-700 dark:hover:text-slate-200"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    title="Delete"
                                    className="hover:text-red-500"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply / Edit Banner */}
            {replyTo && (
              <div className="flex items-center justify-between border-t border-slate-100 bg-blue-50/60 px-5 py-2 text-xs text-blue-700 dark:border-slate-800 dark:bg-blue-950/40 dark:text-blue-300">
                <div className="flex items-center gap-2 truncate">
                  <CornerDownRight className="h-3.5 w-3.5 shrink-0" />
                  <span>Replying to: </span>
                  <span className="italic truncate font-medium">"{replyTo.content.slice(0, 50)}..."</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="font-bold text-blue-600 hover:text-blue-800"
                >
                  ✕
                </button>
              </div>
            )}

            {editingMessage && (
              <form
                onSubmit={handleEditMessage}
                className="flex items-center gap-2 border-t border-slate-100 bg-amber-50/60 p-3 dark:border-slate-800 dark:bg-amber-950/30"
              >
                <input
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="flex-1 rounded border border-amber-300 bg-white p-1.5 text-xs text-slate-800 dark:border-amber-700 dark:bg-slate-900 dark:text-slate-100"
                  required
                />
                <Button type="submit" size="sm" className="bg-amber-600 text-white h-7 text-xs">
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingMessage(null)}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
              </form>
            )}

            {/* Message Composer */}
            <form onSubmit={handleSendMessage} className="border-t border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type message... use @name to mention colleagues"
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />

                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="IMPORTANT">Important</option>
                  <option value="URGENT">Urgent</option>
                </select>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isSending || !messageInput.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1.5" /> Send
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-slate-400">
            <MessageSquare className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
              Select or Start a Conversation
            </h3>
            <p className="text-xs text-slate-400 max-w-sm text-center mt-1">
              Connect around Clients, Leads, Projects, Contracts, and Invoices with seamless activity timeline tracking.
            </p>
          </div>
        )}
      </div>

      {/* 3. RIGHT PANE: Members, CRM Record Details, Files & Tasks */}
      {isRightDrawerOpen && selectedConversation && activeSection !== "ANNOUNCEMENTS" && (
        <div className="w-80 shrink-0 border-l border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-[#0b101d] overflow-y-auto space-y-5">
          {/* Header */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Conversation Details
            </h3>
            <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">
              {selectedConversation.title || "Direct Chat"}
            </p>
            {selectedConversation.description && (
              <p className="text-xs text-slate-500 mt-0.5">{selectedConversation.description}</p>
            )}
          </div>

          {/* CRM Record Link Card */}
          {selectedConversation.recordType && selectedConversation.recordId && (
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3.5 dark:border-amber-900/50 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <FolderKanban className="h-4 w-4" />
                <span className="text-xs font-bold">Attached CRM Record</span>
              </div>
              <div className="mt-2 text-xs space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Type: {selectedConversation.recordType}
                </p>
                <p className="text-[10px] text-slate-500 font-mono truncate">
                  ID: {selectedConversation.recordId}
                </p>
                <div className="pt-2">
                  <a
                    href={`/app/${selectedConversation.recordType.toLowerCase()}s/${selectedConversation.recordId}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    Open CRM Record Page <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Participants */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Participants ({selectedConversation.participants?.length || 0})
            </h4>
            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
              {selectedConversation.participants?.map((p: any) => {
                const empName = p.employee
                  ? `${p.employee.firstName || ""} ${p.employee.lastName || ""}`.trim() || p.employee.user?.name || "Colleague"
                  : "Employee";
                return (
                  <div key={p.id} className="flex items-center justify-between p-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {empName[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{empName}</p>
                        <p className="text-[10px] text-slate-400">{p.employee?.designation || "Member"}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase">{p.role}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Smart Actions</h4>
            <div className="space-y-1.5">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs gap-2 text-slate-700 dark:text-slate-300"
                onClick={() => {
                  if (messages.length > 0) {
                    setTaskModalMessage(messages[messages.length - 1]);
                  }
                }}
              >
                <CheckSquare className="h-3.5 w-3.5 text-blue-600" />
                Create Task from Last Message
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Convert Message To Task Modal */}
      {taskModalMessage && (
        <MessageToTaskDialog
          isOpen={Boolean(taskModalMessage)}
          onClose={() => setTaskModalMessage(null)}
          messageId={taskModalMessage.id}
          defaultTitle={`Action: ${taskModalMessage.content.slice(0, 50)}`}
          defaultPriority={taskModalMessage.priority === "URGENT" ? "URGENT" : "MEDIUM"}
        />
      )}

      {/* Create Conversation Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              New Collaboration Conversation
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateConversation} className="space-y-4 py-2">
            {/* Conversation Type Selection */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "DIRECT", label: "Direct Message" },
                { id: "GROUP", label: "Team Group" },
                { id: "CHANNEL", label: "Channel" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setCreateType(t.id as any)}
                  className={`rounded-lg border p-2 text-center text-xs font-semibold transition-colors ${
                    createType === t.id
                      ? "border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-950/40"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {createType === "DIRECT" ? (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Colleague <span className="text-red-500">*</span>
                </label>
                <select
                  value={createTargetEmpId}
                  onChange={(e) => setCreateTargetEmpId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  required
                >
                  <option value="">-- Choose a colleague --</option>
                  {employeesDirectory.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.designation || emp.email})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {createType === "CHANNEL" ? "Channel Name (e.g., #marketing)" : "Group Name"} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    placeholder={createType === "CHANNEL" ? "#engineering" : "Project Alpha Group"}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Description
                  </label>
                  <Input
                    value={createDesc}
                    onChange={(e) => setCreateDesc(e.target.value)}
                    placeholder="Purpose of this group/channel..."
                    className="text-xs"
                  />
                </div>
              </>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isCreatingConv}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={
                  isCreatingConv ||
                  (createType === "DIRECT" && !createTargetEmpId) ||
                  (createType !== "DIRECT" && !createTitle.trim())
                }
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isCreatingConv ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Conversation"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
