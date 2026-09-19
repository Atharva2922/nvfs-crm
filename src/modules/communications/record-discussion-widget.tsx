"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  Paperclip,
  CheckSquare,
  Smile,
  Shield,
  Clock,
  FileText,
  Loader2,
  Check,
  CornerDownRight,
  MoreVertical,
  Trash2,
  Edit2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { MessageToTaskDialog } from "./message-to-task-dialog";

interface RecordDiscussionWidgetProps {
  recordType: "CLIENT" | "LEAD" | "OPERATION" | "TASK" | "INVOICE" | "CONTRACT" | "VENDOR" | "PURCHASE_ORDER" | "EMPLOYEE";
  recordId: string;
  recordTitle?: string;
  className?: string;
}

const COMMON_REACTIONS = ["👍", "✅", "❤️", "🔥", "⚠️", "❗"];

export function RecordDiscussionWidget({
  recordType,
  recordId,
  recordTitle,
  className = "",
}: RecordDiscussionWidgetProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"MESSAGES" | "ACTIVITIES" | "FILES">("MESSAGES");
  const [conversation, setConversation] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [priority, setPriority] = useState<"NORMAL" | "IMPORTANT" | "URGENT">("NORMAL");
  const [channel, setChannel] = useState<"INTERNAL" | "EMAIL" | "SMS">("INTERNAL");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [taskModalMessage, setTaskModalMessage] = useState<any | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or fetch conversation for this CRM record
  const fetchRecordConversation = async () => {
    try {
      const res = await fetch("/api/communications/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "RECORD",
          recordType,
          recordId,
          title: recordTitle ? `${recordTitle} Discussion` : `${recordType} Discussion`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const conv = data.data.conversation;
        setConversation(conv);
        fetchMessages(conv.id);
      }
    } catch (e) {
      console.error("Failed to load record conversation:", e);
      setIsLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/communications/conversations/${convId}/messages?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.data.messages || []);
      }
    } catch (e) {
      console.error("Failed to fetch messages:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (recordId) {
      setIsLoading(true);
      fetchRecordConversation();
    }
  }, [recordId, recordType]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/communications/conversations/${conversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage,
          priority,
          channel,
          parentId: replyTo?.id || undefined,
        }),
      });

      if (res.ok) {
        setNewMessage("");
        setReplyTo(null);
        setPriority("NORMAL");
        fetchMessages(conversation.id);
      }
    } catch (e) {
      console.error("Failed to send message:", e);
    } finally {
      setIsSending(false);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await fetch(`/api/communications/messages/${messageId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (conversation) fetchMessages(conversation.id);
    } catch (e) {
      console.error("Failed to react:", e);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      await fetch(`/api/communications/messages/${messageId}`, {
        method: "DELETE",
      });
      if (conversation) fetchMessages(conversation.id);
    } catch (e) {
      console.error("Failed to delete message:", e);
    }
  };

  return (
    <div className={`flex flex-col rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/90 ${className}`}>
      {/* Widget Header & Nav */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 p-3.5 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/40">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {recordTitle || `${recordType} Collaboration`}
            </span>
            <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {recordType}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-md bg-slate-100 p-0.5 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("MESSAGES")}
            className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
              activeTab === "MESSAGES"
                ? "bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Discussions ({messages.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ACTIVITIES")}
            className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
              activeTab === "ACTIVITIES"
                ? "bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Activity Stream
          </button>
        </div>
      </div>

      {/* Internal vs External Banner */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-1.5 text-[11px] text-slate-500 dark:border-slate-800/80 dark:bg-slate-950/40">
        <div className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-blue-600" />
          <span>
            Channel: <strong className="text-blue-600 dark:text-blue-400 font-semibold">{channel}</strong>
          </span>
          <span className="text-[10px] text-slate-400">
            {channel === "INTERNAL" ? "(Encrypted internally)" : "(External preparation)"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setChannel("INTERNAL")}
            className={`rounded px-1.5 py-0.5 text-[10px] ${
              channel === "INTERNAL" ? "bg-blue-600 text-white font-medium" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Internal
          </button>
          <button
            type="button"
            onClick={() => setChannel("EMAIL")}
            className={`rounded px-1.5 py-0.5 text-[10px] ${
              channel === "EMAIL" ? "bg-purple-600 text-white font-medium" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Email Track
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[260px] max-h-[420px]">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          </div>
        ) : activeTab === "MESSAGES" ? (
          messages.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-center text-slate-400">
              <MessageSquare className="h-8 w-8 text-slate-300 dark:text-slate-700" />
              <p className="mt-2 text-xs">No discussion yet on this {recordType.toLowerCase()}.</p>
              <p className="text-[11px] text-slate-400">Type below to start the conversation.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isMyMessage = msg.senderId === user?.employee?.id;
                const senderName = msg.sender?.user?.name || "Colleague";

                return (
                  <div
                    key={msg.id}
                    className={`group relative flex flex-col rounded-lg border p-3 text-xs transition-all ${
                      msg.isDeleted
                        ? "border-slate-100 bg-slate-50/50 text-slate-400 italic dark:border-slate-800 dark:bg-slate-900/40"
                        : msg.priority === "URGENT"
                        ? "border-red-200 bg-red-50/40 dark:border-red-900/40 dark:bg-red-950/20"
                        : msg.priority === "IMPORTANT"
                        ? "border-amber-200 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20"
                        : "border-slate-100 bg-white hover:border-slate-200 dark:border-slate-800 dark:bg-slate-800/40"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {senderName}
                        </span>
                        {isMyMessage && (
                          <span className="rounded bg-blue-100 px-1 text-[9px] font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                            You
                          </span>
                        )}
                        {msg.priority !== "NORMAL" && (
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                              msg.priority === "URGENT"
                                ? "bg-red-600 text-white"
                                : "bg-amber-600 text-white"
                            }`}
                          >
                            {msg.priority}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {msg.isEdited && " (edited)"}
                      </span>
                    </div>

                    {/* Content */}
                    <p className="mt-1 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {msg.isDeleted ? "This message was deleted" : msg.content}
                    </p>

                    {/* Reactions & Actions Row */}
                    {!msg.isDeleted && (
                      <div className="mt-2 flex items-center justify-between pt-1">
                        {/* Reactions list */}
                        <div className="flex flex-wrap items-center gap-1">
                          {msg.reactions?.map((r: any) => (
                            <button
                              key={r.id}
                              onClick={() => handleReaction(msg.id, r.emoji)}
                              className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                            >
                              {r.emoji}
                            </button>
                          ))}

                          <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                            {COMMON_REACTIONS.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(msg.id, emoji)}
                                className="text-[11px] hover:scale-125 transition-transform"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setReplyTo(msg)}
                            title="Reply"
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          >
                            <CornerDownRight className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setTaskModalMessage(msg)}
                            title="Convert to Task"
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                          >
                            <CheckSquare className="h-3.5 w-3.5" />
                          </button>
                          {isMyMessage && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(msg.id)}
                              title="Delete"
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800 dark:hover:text-red-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )
        ) : (
          /* Activity Stream Tab */
          <div className="space-y-3">
            <div className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50/60 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/50">
              <Clock className="mt-0.5 h-3.5 w-3.5 text-blue-600" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {recordType} Collaboration Space Initialized
                </p>
                <p className="text-[11px] text-slate-400">
                  All discussions, tasks, and notifications regarding this record are synchronized to the central CRM timeline.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reply Banner */}
      {replyTo && (
        <div className="flex items-center justify-between border-t border-slate-100 bg-blue-50/50 px-3 py-1.5 text-[11px] text-blue-700 dark:border-slate-800 dark:bg-blue-950/30 dark:text-blue-300">
          <div className="flex items-center gap-1 truncate">
            <CornerDownRight className="h-3 w-3 shrink-0" />
            <span>Replying to: </span>
            <span className="truncate italic">"{replyTo.content.slice(0, 40)}..."</span>
          </div>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="text-xs font-semibold text-blue-500 hover:text-blue-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Footer Composer */}
      {activeTab === "MESSAGES" && (
        <form onSubmit={handleSendMessage} className="border-t border-slate-100 p-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Discuss this ${recordType.toLowerCase()}... (use @name to mention colleagues)`}
              className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            />

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-700 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="NORMAL">Normal</option>
              <option value="IMPORTANT">Important</option>
              <option value="URGENT">Urgent</option>
            </select>

            <Button
              type="submit"
              size="sm"
              disabled={isSending || !newMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3"
            >
              {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </form>
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
    </div>
  );
}
