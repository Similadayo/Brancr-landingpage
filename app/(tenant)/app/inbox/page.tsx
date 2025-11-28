'use client';

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTenant } from "../../providers/TenantProvider";
import { 
  useConversations, 
  useConversation, 
  useSendReply, 
  useUpdateConversationStatus, 
  useUpdateConversation, 
  useSuggestReplies
} from "@/app/(tenant)/hooks/useConversations";
import type { Message, ConversationDetail, ConversationSummary } from "@/app/(tenant)/hooks/useConversations";
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

const STATUS_FILTERS = ["All", "Active", "Resolved", "Archived"];
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
      // Map UI filter names to API status values
      const statusMap: Record<string, string> = {
        "Active": "active",
        "Resolved": "resolved",
        "Archived": "archived",
      };
      filters.status = statusMap[activeStatusFilter] || activeStatusFilter.toLowerCase();
    }
    if (activePlatformFilter !== "All") {
      filters.platform = activePlatformFilter.toLowerCase();
    }
    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }
    return filters;
  }, [activeStatusFilter, activePlatformFilter, searchQuery]);

  const { data: conversationsData, isLoading, error } = useConversations(apiFilters);
  
  // Ensure conversations is always an array
  const conversations = useMemo(() => {
    return Array.isArray(conversationsData) ? conversationsData : [];
  }, [conversationsData]);

  // Sort conversations - unread first, then by last_message_at
  const sortedConversations = useMemo(() => {
    const sorted = [...conversations];
    switch (sortBy) {
      case "newest":
        return sorted.sort((a, b) => {
          // Unread first
          if (a.unread_count > 0 && b.unread_count === 0) return -1;
          if (a.unread_count === 0 && b.unread_count > 0) return 1;
          // Then by last_message_at
          return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
        });
      case "oldest":
        return sorted.sort((a, b) => {
          // Unread first
          if (a.unread_count > 0 && b.unread_count === 0) return -1;
          if (a.unread_count === 0 && b.unread_count > 0) return 1;
          // Then by last_message_at
          return new Date(a.last_message_at).getTime() - new Date(b.last_message_at).getTime();
        });
      case "unread":
        return sorted.sort((a, b) => {
          // Unread first
          if (a.unread_count > 0 && b.unread_count === 0) return -1;
          if (a.unread_count === 0 && b.unread_count > 0) return 1;
          // Then by last_message_at
          return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
        });
      default:
        return sorted;
    }
  }, [conversations, sortBy]);
  
  const { data: conversationDetail } = useConversation(selectedConversationId);
  const sendReplyMutation = useSendReply(selectedConversationId);
  const updateStatusMutation = useUpdateConversationStatus(selectedConversationId);
  const updateConversationMutation = useUpdateConversation(selectedConversationId);
  const suggestRepliesMutation = useSuggestReplies(selectedConversationId);

  // Set first conversation as selected when conversations load
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(String(conversations[0].id));
    }
  }, [conversations, selectedConversationId]);

  const activeConversation = conversationDetail;
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
                aria-label="Filter by platform"
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
                aria-label="Sort conversations"
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
          <div className="mt-4 space-y-2 overflow-y-auto px-1 pb-2 pt-1 max-h-[calc(100vh-300px)]">
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
                const isActive = selectedConversationId === String(conversation.id);
                const unread = conversation.unread_count > 0;
                const platform = conversation.platform.toLowerCase();
                
                // Format relative time
                const formatTime = (dateString: string) => {
                  const date = new Date(dateString);
                  const now = new Date();
                  const diffMs = now.getTime() - date.getTime();
                  const diffMins = Math.floor(diffMs / 60000);
                  const diffHours = Math.floor(diffMs / 3600000);
                  const diffDays = Math.floor(diffMs / 86400000);
                  
                  if (diffMins < 1) return "Just now";
                  if (diffMins < 60) return `${diffMins}m ago`;
                  if (diffHours < 24) return `${diffHours}h ago`;
                  if (diffDays === 1) return "Yesterday";
                  if (diffDays < 7) return `${diffDays}d ago`;
                  return date.toLocaleDateString([], { month: "short", day: "numeric" });
                };
                
                return (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversationId(String(conversation.id))}
                    className={`w-full rounded-2xl border-l-4 px-4 py-3 text-left transition ${
                      isActive
                        ? "border-primary bg-primary/10 shadow-sm shadow-primary/20"
                        : unread
                        ? "border-blue-500 bg-blue-50/50 hover:bg-blue-50"
                        : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {conversation.customer_avatar ? (
                            <Image
                              src={conversation.customer_avatar}
                              alt={conversation.customer_name}
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                              {conversation.customer_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900 truncate">{conversation.customer_name}</span>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest flex-shrink-0 ${
                                CHANNEL_COLORS[platform] ?? "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {platform}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-1 text-xs text-gray-500">{conversation.last_message}</p>
                          <p className="mt-1 text-[10px] text-gray-400">{formatTime(conversation.last_message_at)}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {unread ? (
                          <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white">
                            {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
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
                  {activeConversation.customer_avatar ? (
                    <Image
                      src={activeConversation.customer_avatar}
                      alt={activeConversation.customer_name}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                      {activeConversation.customer_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{activeConversation.customer_name}</h2>
                    <p className="text-sm text-gray-500">
                      via <span className="font-medium capitalize">{activeConversation.platform}</span> ·{" "}
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        activeConversation.status === "active" ? "bg-blue-100 text-blue-700" :
                        activeConversation.status === "resolved" ? "bg-green-100 text-green-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {activeConversation.status}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-gray-200 px-3 py-1 text-xs uppercase tracking-[0.3em] text-gray-500">
                    {activeConversation.status}
                  </span>
                </div>
              </header>

              <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="flex flex-col gap-4">
                  <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl bg-gray-50 p-4">
                    {messages.map((message: Message) => {
                      const isIncoming = message.direction === "incoming";
                      const isOutgoing = message.direction === "outgoing";
                      
                      // Intent colors
                      const intentColors: Record<string, string> = {
                        inquiry: "bg-blue-100 text-blue-700",
                        order: "bg-green-100 text-green-700",
                        payment: "bg-orange-100 text-orange-700",
                        complaint: "bg-red-100 text-red-700",
                        refund: "bg-orange-100 text-orange-700",
                        delivery_issue: "bg-yellow-100 text-yellow-700",
                        casual: "bg-gray-100 text-gray-600",
                      };
                      
                      // Tone indicators
                      const toneIcons: Record<string, string> = {
                        urgent: "⚠️",
                        positive: "✓",
                        neutral: "○",
                        negative: "⚠️",
                      };
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isIncoming ? "justify-start" : "justify-end"}`}
                        >
                          <article
                            className={`max-w-xl rounded-2xl border p-4 shadow-sm ${
                              isIncoming
                                ? "border-gray-200 bg-white"
                                : isOutgoing
                                ? "border-primary/30 bg-primary/5"
                                : "border-gray-200 bg-white"
                            }`}
                          >
                            {/* AI Insights for incoming messages */}
                            {isIncoming && (message.detected_intent || message.detected_tone) && (
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                {message.detected_intent && (
                                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                    intentColors[message.detected_intent] || "bg-gray-100 text-gray-600"
                                  }`}>
                                    {message.detected_intent === "inquiry" && "💬"}
                                    {message.detected_intent === "order" && "📦"}
                                    {message.detected_intent === "payment" && "💳"}
                                    {message.detected_intent === "complaint" && "⚠️"}
                                    {message.detected_intent === "refund" && "↩️"}
                                    {message.detected_intent === "delivery_issue" && "🚚"}
                                    {message.detected_intent === "casual" && "💭"}
                                    {message.detected_intent}
                                  </span>
                                )}
                                {message.detected_tone && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-600">
                                    {toneIcons[message.detected_tone] || "○"} {message.detected_tone}
                                  </span>
                                )}
                                {message.confidence && (
                                  <span className="text-[10px] text-gray-400">
                                    {Math.round(message.confidence * 100)}% confidence
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {/* Response type indicator for outgoing messages */}
                            {isOutgoing && message.response_type && (
                              <div className="mb-2">
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500">
                                  {message.response_type === "auto_reply" && "🤖 Auto-replied"}
                                  {message.response_type === "escalated" && "🚨 Escalated"}
                                  {message.response_type === "manual" && "✍️ Manual reply"}
                                </span>
                              </div>
                            )}
                            
                            {/* Message content */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                {message.message_type === "image" || message.message_type === "video" ? (
                                  <div className="space-y-2">
                                    <Image
                                      src={message.content}
                                      alt="Media"
                                      width={320}
                                      height={240}
                                      className="max-w-xs rounded-lg"
                                      unoptimized
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = "none";
                                      }}
                                    />
                                    {message.metadata && typeof message.metadata === "object" && "caption" in message.metadata && (
                                      <p className="text-sm text-gray-700">{String(message.metadata.caption)}</p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="whitespace-pre-line text-sm text-gray-700">
                                    {isOutgoing && message.final_reply ? message.final_reply : message.content}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {/* Timestamp and status */}
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-[10px] text-gray-400">
                                {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              {isOutgoing && message.response_status && (
                                <span className="text-[10px] text-gray-400">
                                  {message.response_status === "sent" && "✓ Sent"}
                                  {message.response_status === "pending" && "⏳ Pending"}
                                  {message.response_status === "approved" && "✓ Approved"}
                                  {message.response_status === "rejected" && "❌ Rejected"}
                                </span>
                              )}
                            </div>
                            
                            {/* Suggested reply for incoming messages */}
                            {isIncoming && message.suggested_reply && (
                              <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                                <p className="text-xs font-semibold text-primary mb-1">🤖 AI Suggested Reply:</p>
                                <p className="text-xs text-gray-700">{message.suggested_reply}</p>
                              </div>
                            )}
                          </article>
                        </div>
                      );
                    })}
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
                              const suggestions = res?.suggestions;
                              if (Array.isArray(suggestions) && suggestions.length > 0) {
                                // Use the first suggestion's reply field
                                const firstSuggestion = suggestions[0];
                                let suggestionText = "";
                                if (typeof firstSuggestion === "string") {
                                  suggestionText = firstSuggestion;
                                } else if (firstSuggestion && typeof firstSuggestion === "object" && "reply" in firstSuggestion) {
                                  suggestionText = String(firstSuggestion.reply);
                                } else {
                                  suggestionText = String(firstSuggestion);
                                }
                                if (suggestionText) {
                                  setReplyText(suggestionText);
                                }
                              }
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
                      <p className="text-sm font-semibold text-gray-900">{activeConversation.customer_name}</p>
                      <p className="text-xs text-gray-500 capitalize">{activeConversation.platform}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-widest ${
                      activeConversation.status === "active" ? "bg-blue-100 text-blue-700" :
                      activeConversation.status === "resolved" ? "bg-green-100 text-green-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
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
                      onChange={(e) => {
                        const newStatus = e.target.value as "active" | "resolved" | "archived";
                        updateStatusMutation.mutate({ status: newStatus });
                      }}
                      aria-label="Update conversation status"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {["active", "resolved", "archived"].map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4">
                    <p className="uppercase tracking-[0.3em] text-gray-400">Tags</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Array.isArray(activeConversation.tags) ? activeConversation.tags.map((tag: string) => (
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
                      {new Date(activeConversation.updated_at).toLocaleString([], {
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


