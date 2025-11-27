'use client';

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTenant } from "../../providers/TenantProvider";
import { useConversations, useConversation, useSendReply, useUpdateConversationStatus, useUpdateConversation, useSuggestReplies } from "@/app/(tenant)/hooks/useConversations";
import {
  InboxIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TagIcon,
  PaperClipIcon,
  SparklesIcon,
  ArrowRightIcon,
} from "../../components/icons";

const STATUS_FILTERS = ["All", "Open", "Pending", "Closed"];
const PLATFORM_FILTERS = ["All", "Instagram", "Facebook", "WhatsApp", "TikTok", "Telegram"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "unread", label: "Unread First" },
];

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
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>("All");
  const [activePlatformFilter, setActivePlatformFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedConversationId, setSelectedConversationId] = useState<string>("");
  const [replyText, setReplyText] = useState("");

  // Build filters for API
  const apiFilters = useMemo(() => {
    const filters: { platform?: string; status?: string; search?: string } = {};
    if (activeStatusFilter !== "All") {
      filters.status = activeStatusFilter.toLowerCase();
    }
    if (activePlatformFilter !== "All") {
      filters.platform = activePlatformFilter.toLowerCase();
    }
    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }
    return filters;
  }, [activeStatusFilter, activePlatformFilter, searchQuery]);

  // Sort conversations
  const sortedConversations = useMemo(() => {
    const sorted = [...conversations];
    switch (sortBy) {
      case "newest":
        return sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      case "oldest":
        return sorted.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
      case "unread":
        return sorted.sort((a, b) => (b.unreadCount > 0 ? 1 : 0) - (a.unreadCount > 0 ? 1 : 0));
      default:
        return sorted;
    }
  }, [conversations, sortBy]);

  const { data: conversationsData, isLoading, error } = useConversations(apiFilters);
  const conversations = Array.isArray(conversationsData) ? conversationsData : [];
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
      {/* Header */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <InboxIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Inbox</h1>
                <p className="mt-1 max-w-2xl text-sm text-gray-600">
                  Manage conversations across all platforms from one workspace
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          {/* Search Bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name or message..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 transition focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filters */}
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Status:</span>
              <div className="flex gap-1.5">
                {STATUS_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveStatusFilter(filter)}
                    className={`rounded-lg border px-3 py-1 text-xs font-semibold transition ${
                      activeStatusFilter === filter
                        ? "border-primary bg-primary text-white shadow-sm"
                        : "border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Platform Filters */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Platform:</span>
              <select
                value={activePlatformFilter}
                onChange={(e) => setActivePlatformFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {PLATFORM_FILTERS.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
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
          <div className="mt-4 space-y-2 overflow-y-auto px-1 pb-2 pt-1" style={{ maxHeight: "calc(100vh - 300px)" }}>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              </div>
            ) : error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-900">
                Failed to load conversations: {error.message}
              </div>
            ) : sortedConversations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                <InboxIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-3 text-sm font-medium text-gray-900">
                  {searchQuery || activeStatusFilter !== "All" || activePlatformFilter !== "All"
                    ? "No conversations found"
                    : "No conversations yet"}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {searchQuery || activeStatusFilter !== "All" || activePlatformFilter !== "All"
                    ? "Try adjusting your filters"
                    : "Conversations will appear here when customers reach out"}
                </p>
              </div>
            ) : (
              sortedConversations.map((conversation) => {
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
                          {Array.isArray(conversation.tags) ? conversation.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-600"
                            >
                              {tag}
                            </span>
                          )) : null}
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
                          <span className="mt-2 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white">
                            {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
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
                        {["Thanks! We'll get back to you shortly.", "Could you share more details?", "Noted. I'll update you soon."].map((q) => (
                          <button
                            key={q}
                            onClick={() => setReplyText((prev) => (prev ? prev + "\n" + q : q))}
                            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-primary hover:bg-primary/5 hover:text-primary"
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
                          disabled={suggestRepliesMutation.isPending}
                          className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-50"
                        >
                          <SparklesIcon className="h-3.5 w-3.5" />
                          {suggestRepliesMutation.isPending ? "Generating..." : "AI Suggest"}
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
                          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary/90 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                        >
                          {sendReplyMutation.isPending ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                              Sending...
                            </>
                          ) : (
                            <>
                              Send Reply
                              <ArrowUpIcon className="h-4 w-4" />
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
                    <div className="flex items-center gap-2 mb-2">
                      <TagIcon className="h-4 w-4 text-gray-400" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Status</p>
                    </div>
                    <select
                      value={activeConversation.status}
                      onChange={(e) => updateStatusMutation.mutate({ status: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {["open", "pending", "closed"].map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4">
                    <p className="uppercase tracking-[0.3em] text-gray-400">Tags</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Array.isArray(activeConversation.tags) ? activeConversation.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-600"
                        >
                          {tag}
                        </span>
                      )) : null}
                      {(!Array.isArray(activeConversation.tags) || activeConversation.tags.length === 0) ? (
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


