'use client';

import { useMemo, useState, useEffect, useRef } from "react";
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
  FacebookIcon,
  InstagramIcon,
  WhatsAppIcon,
  TelegramIcon,
  AllMessagesIcon,
} from "../../components/icons";

const STATUS_FILTERS = ["All", "Active", "Resolved", "Archived"];
const PLATFORM_COLUMNS = [
  { value: "all", label: "All", Icon: AllMessagesIcon },
  { value: "facebook", label: "Facebook", Icon: FacebookIcon },
  { value: "instagram", label: "Instagram", Icon: InstagramIcon },
  { value: "telegram", label: "Telegram", Icon: TelegramIcon },
  { value: "whatsapp", label: "WhatsApp", Icon: WhatsAppIcon },
];
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Filter and sort conversations
  const sortedConversations = useMemo(() => {
    // First filter by platform tab
    let filtered = [...conversations];
    if (activePlatformFilter !== "All") {
      filtered = filtered.filter((conv) => 
        conv.platform.toLowerCase() === activePlatformFilter.toLowerCase()
      );
    }
    
    // Then filter by status
    if (activeStatusFilter !== "All") {
      const statusMap: Record<string, string> = {
        "Active": "active",
        "Resolved": "resolved",
        "Archived": "archived",
      };
      const statusValue = statusMap[activeStatusFilter] || activeStatusFilter.toLowerCase();
      filtered = filtered.filter((conv) => conv.status === statusValue);
    }
    
    // Then sort
    const sorted = [...filtered];
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
  }, [conversations, sortBy, activePlatformFilter, activeStatusFilter]);
  
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
  const messages = useMemo(() => conversationDetail?.messages ?? [], [conversationDetail?.messages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    <div className="flex h-screen flex-col overflow-hidden sm:h-[calc(100vh-120px)]">
      {/* Header - Mobile optimized */}
      <section className="flex flex-shrink-0 flex-col gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:gap-4 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:gap-4">
          {/* Left: Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSelectedConversationId("")}
              aria-label="Back to conversations"
              className={`lg:hidden ${selectedConversationId ? "flex" : "hidden"} items-center justify-center rounded-lg p-1.5 text-gray-600 hover:bg-gray-100`}
            >
              <ArrowRightIcon className="h-5 w-5 rotate-180" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-10 sm:w-10 sm:rounded-xl">
              <InboxIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl lg:text-3xl xl:text-4xl">Inbox</h1>
              <p className="hidden text-xs text-gray-600 sm:mt-1 sm:block sm:text-sm">
                Manage conversations across all platforms from one workspace
              </p>
            </div>
          </div>

          {/* Right: Search, Status Filters, and Sort */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            {/* Search Bar */}
            <div className="relative w-full sm:w-auto sm:min-w-[240px]">
              <MagnifyingGlassIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 sm:left-3 sm:h-5 sm:w-5" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full rounded-md border border-gray-200 bg-gray-50 pl-8 pr-3 py-2 text-xs text-gray-700 placeholder-gray-400 transition focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 sm:rounded-lg sm:pl-10 sm:pr-4 sm:py-2 sm:text-sm"
              />
            </div>

            {/* Status Filters */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <FunnelIcon className="hidden h-3.5 w-3.5 text-gray-400 sm:block sm:h-4 sm:w-4" />
              <span className="text-[10px] font-medium text-gray-500 sm:text-xs">Status:</span>
              <div className="flex gap-1 sm:gap-1.5">
                {STATUS_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveStatusFilter(filter)}
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold transition sm:rounded-lg sm:px-3 sm:py-1 sm:text-xs ${
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

            {/* Sort */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="hidden text-[10px] font-medium text-gray-500 sm:inline sm:text-xs">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort conversations"
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] font-semibold text-gray-700 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:rounded-lg sm:px-3 sm:text-xs"
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

      {/* Platform Tabs */}
      <div className="flex flex-shrink-0 gap-1 overflow-x-auto border-b border-gray-200 bg-white px-1 scrollbar-hide">
        {PLATFORM_COLUMNS.map((column) => {
          const platformConversations = column.value === "all"
            ? sortedConversations
            : sortedConversations.filter((conv) => conv.platform.toLowerCase() === column.value);
          const unreadCount = platformConversations.reduce((sum, conv) => sum + conv.unread_count, 0);
          const isSelected = activePlatformFilter === column.label || (column.value === "all" && activePlatformFilter === "All");
          
          return (
            <button
              key={column.value}
              onClick={() => {
                if (column.value === "all") {
                  setActivePlatformFilter("All");
                } else {
                  setActivePlatformFilter(column.label);
                }
              }}
              className={`relative flex flex-shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold transition sm:gap-2 sm:px-4 sm:py-3 sm:text-sm ${
                isSelected
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              <column.Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="whitespace-nowrap">{column.label}</span>
              {unreadCount > 0 && (
                <span className="inline-flex h-4 min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white sm:h-5 sm:min-w-[20px] sm:px-1.5 sm:text-[10px]">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
              {column.value === "whatsapp" && unreadCount === 0 && platformConversations.length > 0 && (
                <span className="rounded-full bg-green-500 px-1 py-0.5 text-[8px] font-semibold text-white sm:px-1.5 sm:text-[9px]">
                  New
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid min-h-0 flex-1 gap-4 sm:gap-6 lg:grid-cols-[340px_1fr] xl:grid-cols-[360px_1fr]">
        {/* Conversations List */}
        <section className={`flex flex-col rounded-2xl border border-gray-200 bg-white/70 p-3 shadow-lg shadow-primary/5 sm:rounded-3xl sm:p-4 ${
          selectedConversationId ? "hidden lg:flex" : "flex"
        }`}>
          <div className="flex flex-shrink-0 items-center justify-between px-1 sm:px-2">
            <h2 className="text-xs font-semibold text-gray-900 sm:text-sm">Conversations</h2>
            <span className="rounded-full border border-gray-200 px-2 py-0.5 text-[10px] text-gray-500 sm:px-3 sm:py-1 sm:text-xs">
              {sortedConversations.length}
            </span>
          </div>
          <div className="mt-2 min-h-0 flex-1 space-y-1.5 overflow-y-auto px-0.5 pb-1.5 pt-0.5 sm:mt-3 sm:space-y-2 sm:px-1 sm:pb-2 sm:pt-1 md:mt-4">
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
                    className={`w-full rounded-xl border-l-4 px-2 py-2 text-left transition sm:rounded-2xl sm:px-3 sm:py-2.5 md:px-4 md:py-3 ${
                      isActive
                        ? "border-primary bg-primary/10 shadow-sm shadow-primary/20"
                        : unread
                        ? "border-blue-500 bg-blue-50/50 hover:bg-blue-50"
                        : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <div className="flex items-start gap-2 flex-1 min-w-0 sm:gap-3">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {conversation.customer_avatar ? (
                            <Image
                              src={conversation.customer_avatar}
                              alt={conversation.customer_name}
                              width={40}
                              height={40}
                              className="h-8 w-8 rounded-full object-cover sm:h-10 sm:w-10"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary sm:h-10 sm:w-10 sm:text-sm">
                              {conversation.customer_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-xs font-semibold text-gray-900 truncate sm:text-sm">{conversation.customer_name}</span>
                            <span
                              className={`hidden items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest sm:inline-flex sm:px-2 sm:text-[10px] ${
                                CHANNEL_COLORS[platform] ?? "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {platform}
                            </span>
                          </div>
                          <p className="mt-0.5 line-clamp-1 text-[10px] text-gray-500 sm:mt-1 sm:text-xs">{conversation.last_message}</p>
                          <p className="mt-0.5 text-[9px] text-gray-400 sm:mt-1 sm:text-[10px]">{formatTime(conversation.last_message_at)}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {unread ? (
                          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white sm:h-6 sm:min-w-[24px] sm:px-1.5 sm:text-xs">
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

        <section className={`flex min-h-0 flex-1 flex-col gap-3 rounded-2xl border border-gray-200 bg-white/80 p-3 shadow-lg shadow-primary/5 sm:gap-4 sm:rounded-3xl sm:p-4 md:gap-6 md:p-6 ${
          selectedConversationId ? "flex" : "hidden lg:flex"
        }`}>
          {activeConversation ? (
            <>
              <header className="flex flex-shrink-0 flex-col gap-2 border-b border-gray-200 pb-2 sm:gap-3 sm:pb-3 md:flex-row md:items-center md:justify-between md:gap-4 md:pb-4">
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                  {activeConversation.customer_avatar ? (
                    <Image
                      src={activeConversation.customer_avatar}
                      alt={activeConversation.customer_name}
                      width={48}
                      height={48}
                      className="h-10 w-10 rounded-full object-cover sm:h-12 sm:w-12"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary sm:h-12 sm:w-12 sm:text-lg">
                      {activeConversation.customer_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-semibold text-gray-900 sm:text-lg">{activeConversation.customer_name}</h2>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-500 sm:text-sm">
                      <span>via <span className="font-medium capitalize">{activeConversation.platform}</span></span>
                      <span className="hidden sm:inline">·</span>
                      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase sm:px-2 sm:text-[10px] ${
                        activeConversation.status === "active" ? "bg-blue-100 text-blue-700" :
                        activeConversation.status === "resolved" ? "bg-green-100 text-green-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {activeConversation.status}
                      </span>
                    </p>
                  </div>
                </div>
              </header>

              <div className="grid min-h-0 flex-1 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="flex min-h-0 flex-col gap-2 sm:gap-3 md:gap-4">
                  <div className="flex min-h-0 flex-1 flex-col space-y-2 overflow-y-auto rounded-lg bg-gray-50 p-2 sm:space-y-3 sm:rounded-xl sm:p-3 md:space-y-4 md:rounded-2xl md:p-4">
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
                                    {isOutgoing ? (message.final_reply || message.content) : message.content}
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
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="flex-shrink-0 rounded-lg border border-gray-200 bg-white p-2 shadow-sm sm:rounded-xl sm:p-3">
                    {/* Quick replies - Hidden on very small screens */}
                    <div className="hidden items-center gap-1.5 sm:flex sm:gap-2">
                      <div className="flex flex-wrap gap-1 flex-1 sm:gap-1.5">
                        {["Thanks! We'll get back to you shortly.", "Could you share more details?", "Noted. I'll update you soon."].map((q) => (
                          <button
                            key={q}
                            onClick={() => setReplyText((prev) => (prev ? prev + "\n" + q : q))}
                            className="flex items-center gap-0.5 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-gray-600 transition hover:border-primary hover:bg-primary/5 hover:text-primary sm:gap-1 sm:px-2 sm:py-1 sm:text-[10px]"
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
                          className="flex items-center gap-0.5 rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-50 sm:gap-1 sm:px-2 sm:py-1 sm:text-[10px]"
                        >
                          <SparklesIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          <span className="hidden md:inline">{suggestRepliesMutation.isPending ? "Generating..." : "AI Suggest"}</span>
                          <span className="md:hidden">{suggestRepliesMutation.isPending ? "..." : "AI"}</span>
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-end gap-1.5 sm:gap-2">
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
                        placeholder="Type your reply..."
                        className="min-h-[44px] max-h-[100px] flex-1 rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs text-gray-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 resize-none sm:min-h-[50px] sm:max-h-[120px] sm:rounded-lg sm:px-3 sm:py-2 sm:text-sm"
                      />
                      <button
                        onClick={() => void handleSendReply()}
                        disabled={sendReplyMutation.isPending || !replyText.trim() || !selectedConversationId}
                        className="flex-shrink-0 inline-flex items-center justify-center rounded-md bg-primary p-2 text-white shadow-md shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:gap-1.5 sm:rounded-lg sm:px-4 sm:py-2"
                      >
                        {sendReplyMutation.isPending ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                        ) : (
                          <>
                            <span className="hidden sm:inline sm:mr-0.5">Send</span>
                            <ArrowUpIcon className="h-4 w-4" />
                          </>
                        )}
                      </button>
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


