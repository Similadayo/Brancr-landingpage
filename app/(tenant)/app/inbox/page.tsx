'use client';

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTenant } from "../../providers/TenantProvider";
import { useConversations, useConversation, useSendReply, useUpdateConversationStatus, useUpdateConversation, useSuggestReplies } from "@/app/(tenant)/hooks/useConversations";

const FILTERS = ["All", "Open", "Pending", "Closed"];

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: "bg-emerald-100 text-emerald-700",
  instagram: "bg-fuchsia-100 text-fuchsia-700",
  facebook: "bg-blue-100 text-blue-700",
  tiktok: "bg-neutral-900 text-white",
  telegram: "bg-sky-100 text-sky-700",
  email: "bg-purple-100 text-purple-700",
};

export default function InboxPage() {
  const { tenant } = useTenant();
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedConversationId, setSelectedConversationId] = useState<string>("");
  const [replyText, setReplyText] = useState("");

  // Build filters for API
  const apiFilters = useMemo(() => {
    const filters: { platform?: string; status?: string; search?: string } = {};
    if (activeFilter !== "All") {
      filters.status = activeFilter.toLowerCase();
    }
    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }
    return filters;
  }, [activeFilter, searchQuery]);

  const { data: conversations = [], isLoading, error } = useConversations(apiFilters);
  const { data: conversationDetail } = useConversation(selectedConversationId);
  const sendReplyMutation = useSendReply(selectedConversationId);
  const updateStatusMutation = useUpdateConversationStatus(selectedConversationId);
  const updateConversationMutation = useUpdateConversation(selectedConversationId);
  const suggestRepliesMutation = useSuggestReplies(selectedConversationId);

  // Set first conversation as selected when conversations load
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  const activeConversation = conversationDetail?.conversation;
  const messages = conversationDetail?.messages ?? [];

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConversationId) return;

    try {
      await sendReplyMutation.mutateAsync({ body: replyText.trim() });
      setReplyText("");
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Inbox</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Manage conversations across WhatsApp, Instagram, Facebook, and Telegram from one collaborative workspace. Assign
            threads, close loops quickly, and keep customers delighted.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                activeFilter === filter
                  ? "border-primary bg-primary text-white shadow shadow-primary/30"
                  : "border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary"
              }`}
            >
              {filter}
            </button>
          ))}
          <button
            onClick={() => {
              const rows: string[] = [];
              rows.push("Contact,Channel,Status,Updated,Preview");
              conversations.forEach((c) => {
                rows.push(`"${c.contactName}",${c.channel},${c.status},${c.updatedAt ? new Date(c.updatedAt).toISOString() : ""},"${(c.preview || "").replace(/"/g, '""')}"`);
              });
              const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "conversations.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
          >
            Export CSV
          </button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr] xl:grid-cols-[360px_1fr]">
        <section className="rounded-3xl border border-gray-200 bg-white/70 p-4 shadow-lg shadow-primary/5">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-semibold text-gray-900">Conversations</h2>
            <span className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500">
              {conversations.length}
            </span>
          </div>
          <div className="mt-4 px-2">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs uppercase tracking-[0.3em] text-gray-400">
                🔍
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-10 py-2 text-sm text-gray-700 shadow-sm transition focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Search by name or tag…"
              />
            </div>
          </div>
          <div className="mt-4 space-y-2 overflow-y-auto px-1 pb-2 pt-1" style={{ maxHeight: "calc(100vh - 240px)" }}>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-900">
                Failed to load conversations: {error.message}
              </div>
            ) : conversations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                {searchQuery ? "No conversations found." : "No conversations yet."}
              </div>
            ) : (
              conversations.map((conversation) => {
                const isActive = selectedConversationId === conversation.id;
                const unread = conversation.unreadCount > 0;
                return (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      isActive
                        ? "border-primary/40 bg-primary/10 shadow-sm shadow-primary/20"
                        : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{conversation.contactName}</span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
                              CHANNEL_COLORS[conversation.channel] ?? "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {conversation.channel}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500">{conversation.preview}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {conversation.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest text-gray-400">
                          {conversation.updatedAt
                            ? new Date(conversation.updatedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "--"}
                        </p>
                        {unread ? (
                          <span className="mt-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                            {conversation.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="flex min-h-[70vh] flex-col gap-6 rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-lg shadow-primary/5">
          {activeConversation ? (
            <>
              <header className="flex flex-col gap-4 border-b border-gray-200 pb-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                    {activeConversation.contactName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{activeConversation.contactName}</h2>
                    <p className="text-sm text-gray-500">
                      via {activeConversation.channel.toUpperCase()} · Assigned to{" "}
                      <span className="font-medium text-gray-700">{tenant?.name ?? "You"}</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="https://t.me/brancrbot"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-primary hover:text-primary"
                  >
                    Open in Telegram
                  </Link>
                  <span className="rounded-full border border-gray-200 px-3 py-1 text-xs uppercase tracking-[0.3em] text-gray-500">
                    {activeConversation.status}
                  </span>
                </div>
              </header>

              <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="flex flex-col gap-4">
                  <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl bg-neutral-bg p-4">
                    {messages.map((message) => (
                      <article
                        key={message.id}
                        className={`max-w-xl rounded-2xl border border-gray-200 bg-white p-4 shadow-sm ${
                          message.author === "tenant" ? "ml-auto bg-primary/5" : ""
                        }`}
                      >
                        <header className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-gray-500">{message.authorName ?? message.author}</p>
                          <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400">
                            {new Date(message.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </header>
                        <p className="mt-3 whitespace-pre-line text-sm text-gray-700">{message.body}</p>
                      </article>
                    ))}
                    {messages.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
                        No messages yet.
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Reply</p>
                    <div className="mt-3 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {["Thanks! We’ll get back to you shortly.", "Could you share more details?", "Noted. I’ll update you soon."].map((q) => (
                          <button
                            key={q}
                            onClick={() => setReplyText((prev) => (prev ? prev + "\n" + q : q))}
                            className="rounded-full border border-gray-200 px-3 py-1 text-[11px] font-semibold text-gray-600 hover:border-primary hover:text-primary"
                          >
                            {q}
                          </button>
                        ))}
                        <button
                          onClick={async () => {
                            try {
                              const res = await suggestRepliesMutation.mutateAsync();
                              const suggestion = res?.suggestions?.[0];
                              if (suggestion) setReplyText((prev) => (prev ? prev + "\n" + suggestion : suggestion));
                            } catch {}
                          }}
                          className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20"
                        >
                          AI Suggest
                        </button>
                      </div>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            void handleSendReply();
                          }
                        }}
                        disabled={sendReplyMutation.isPending || !selectedConversationId}
                        placeholder="Type your reply here... (Cmd/Ctrl + Enter to send)"
                        className="min-h-[140px] w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1">
                            Supports Instagram, Facebook, and WhatsApp
                          </span>
                        </div>
                        <button
                          onClick={() => void handleSendReply()}
                          disabled={sendReplyMutation.isPending || !replyText.trim() || !selectedConversationId}
                          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {sendReplyMutation.isPending ? (
                            <>
                              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Sending...
                            </>
                          ) : (
                            <>
                              Send Reply
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900">Contact</h3>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{activeConversation.contactName}</p>
                      <p className="text-xs text-gray-500 capitalize">{activeConversation.channel}</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                      {activeConversation.status}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="uppercase tracking-[0.3em] text-gray-400">Status</p>
                    <select
                      value={activeConversation.status}
                      onChange={(e) => updateStatusMutation.mutate({ status: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700"
                    >
                      {["open", "pending", "closed"].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4">
                    <p className="uppercase tracking-[0.3em] text-gray-400">Tags</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {activeConversation.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                      {activeConversation.tags.length === 0 ? (
                        <span className="text-xs text-gray-500">No tags yet.</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="uppercase tracking-[0.3em] text-gray-400">Last updated</p>
                    <p className="mt-1 text-xs text-gray-600">
                      {new Date(activeConversation.updatedAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <div className="mt-4">
                    <p className="uppercase tracking-[0.3em] text-gray-400">Notes</p>
                    <textarea
                      placeholder="Add internal notes..."
                      className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      onBlur={async (e) => {
                        const value = e.target.value.trim();
                        if (value) {
                          try {
                            await updateConversationMutation.mutateAsync({ notes: value });
                          } catch {}
                        }
                      }}
                    />
                    <p className="mt-2 text-[11px] text-gray-400">Saved on blur.</p>
                  </div>
                </aside>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-gray-500">
              <Image src="/logo-light.svg" alt="Brancr" width={64} height={64} className="opacity-80" />
              <p className="text-sm">Select a conversation to view the thread and reply.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}


