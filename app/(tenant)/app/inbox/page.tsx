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
  XIcon,
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
  
  // Responsive state management
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contactPanelOpen, setContactPanelOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat" | "contact">("list");

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
  const messages = useMemo(() => {
    const msgs = conversationDetail?.messages ?? [];
    // Debug: Log message counts
    if (msgs.length > 0) {
      const incomingCount = msgs.filter(m => m.direction === "incoming").length;
      const outgoingCount = msgs.filter(m => m.direction === "outgoing").length;
      console.log(`[Inbox] Messages loaded: total=${msgs.length}, incoming=${incomingCount}, outgoing=${outgoingCount}`);
    }
    return msgs;
  }, [conversationDetail?.messages]);

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

  // Handle conversation selection - switch to chat view on mobile/tablet
  const handleConversationSelect = (id: string) => {
    setSelectedConversationId(id);
    // On mobile/tablet portrait, switch to chat view
    if (typeof window !== "undefined" && window.innerWidth < 900) {
      setMobileView("chat");
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (mobileView === "contact") {
      setMobileView("chat");
    } else if (mobileView === "chat") {
      setMobileView("list");
      setSelectedConversationId("");
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden sm:h-[calc(100vh-120px)] sm:gap-4">
      {/* Header */}
      <section className="mb-4 flex flex-shrink-0 flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Title */}
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <InboxIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 lg:text-3xl">Inbox</h1>
                <p className="mt-0.5 max-w-2xl text-sm text-gray-600">
                  Manage conversations across all platforms from one workspace
                </p>
              </div>
            </div>
          </div>

          {/* Right: Search, Status Filters, and Sort */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
            {/* Search Bar */}
            <div className="relative w-full sm:w-auto sm:min-w-[240px]">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 transition focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

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

            {/* Sort */}
            <div className="flex items-center gap-2">
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

      {/* Platform Tabs */}
      <div className="flex flex-shrink-0 gap-1 border-b border-gray-200 bg-white px-1">
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
              className={`relative flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
                isSelected
                  ? "border-primary bg-primary/5 text-primary font-bold"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50/50"
              }`}
            >
              <column.Icon className="h-5 w-5" />
              <span>{column.label}</span>
              {unreadCount > 0 && (
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
              {column.value === "whatsapp" && unreadCount === 0 && platformConversations.length > 0 && (
                <span className="rounded-full bg-green-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                  New
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid min-h-0 flex-1 gap-0 lg:gap-4 xl:grid-cols-[340px_1fr]">
        {/* Conversations List */}
        <section className={`flex flex-col rounded-2xl border border-gray-200/50 bg-[#F3F4F6] p-4 shadow-sm transition-transform duration-300 lg:rounded-3xl ${
          // Desktop: always visible
          // Tablet landscape (900-1023px): visible
          // Tablet portrait (768-899px): hidden when in chat/contact view
          // Mobile: hidden when in chat/contact view
          mobileView === "chat" || mobileView === "contact" ? "hidden md:flex" : "flex"
        }`}>
          <div className="flex flex-shrink-0 items-center justify-between px-2">
            <h2 className="text-sm font-semibold text-gray-900">Conversations</h2>
            <span className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500">
              {sortedConversations.length}
            </span>
          </div>
          <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto px-1 pb-2 pt-1">
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
                
                // Format relative time - consistent format
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
                  if (diffDays < 7) return `${diffDays} days ago`;
                  return date.toLocaleDateString([], { month: "short", day: "numeric" });
                };
                
                return (
                  <button
                    key={conversation.id}
                    onClick={() => handleConversationSelect(String(conversation.id))}
                    className={`group w-full rounded-xl border-l-4 px-4 py-4 text-left transition-all duration-200 ${
                      isActive
                        ? "border-primary bg-white shadow-md"
                        : unread
                        ? "border-blue-500 bg-white/80 hover:bg-white hover:shadow-sm"
                        : "border-transparent bg-white/60 hover:bg-white hover:shadow-sm"
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
                              width={44}
                              height={44}
                              className="h-11 w-11 rounded-full object-cover ring-2 ring-white"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-base font-semibold text-primary ring-2 ring-white">
                              {conversation.customer_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900 truncate">{conversation.customer_name}</span>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider flex-shrink-0 ${
                                CHANNEL_COLORS[platform] ?? "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {platform}
                            </span>
                          </div>
                          <p className="line-clamp-1 text-xs text-gray-600">{conversation.last_message || "No messages"}</p>
                          <p className="text-[11px] font-medium text-gray-400">{formatTime(conversation.last_message_at)}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {unread ? (
                          <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-white shadow-sm">
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

        <section className={`flex min-h-0 flex-1 flex-col gap-4 rounded-2xl border border-gray-200/50 bg-white p-4 shadow-sm transition-transform duration-300 lg:gap-6 lg:rounded-3xl lg:p-6 ${
          // Hide on mobile when in list view
          mobileView === "list" ? "hidden md:flex" : "flex"
        }`}>
          {activeConversation ? (
            <>
              <header className="sticky top-0 z-10 flex flex-shrink-0 flex-col gap-3 border-b border-gray-200 bg-white pb-3 shadow-sm md:gap-4 md:pb-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  {/* Back button for mobile/tablet */}
                  {(mobileView === "chat" || mobileView === "contact") && (
                    <button
                      onClick={handleBack}
                      className="flex-shrink-0 rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors md:hidden"
                      aria-label="Back to conversations"
                    >
                      <ArrowRightIcon className="h-5 w-5 rotate-180" />
                    </button>
                  )}
                  {activeConversation.customer_avatar ? (
                    <Image
                      src={activeConversation.customer_avatar}
                      alt={activeConversation.customer_name}
                      width={48}
                      height={48}
                      className="h-10 w-10 rounded-full object-cover md:h-12 md:w-12"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary md:h-12 md:w-12 md:text-lg">
                      {activeConversation.customer_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-semibold text-gray-900 truncate md:text-lg">{activeConversation.customer_name}</h2>
                    <p className="text-xs text-gray-500 md:text-sm">
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
                <div className="flex items-center gap-2">
                  {/* Info button for laptop/tablet - opens contact drawer */}
                  <button
                    onClick={() => setContactPanelOpen(true)}
                    className="flex-shrink-0 rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors xl:hidden"
                    aria-label="Contact information"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m0-4h1v1m0 0h1m-1 0v1m-1 0h-1m1 0v-1m1 0h1m-1 0v-1" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                    </svg>
                  </button>
                  {/* Mobile: Info button opens contact view */}
                  <button
                    onClick={() => setMobileView("contact")}
                    className="flex-shrink-0 rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors md:hidden"
                    aria-label="Contact information"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m0-4h1v1m0 0h1m-1 0v1m-1 0h-1m1 0v-1m1 0h1m-1 0v-1" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                    </svg>
                  </button>
                </div>
              </header>

              <div className="grid min-h-0 flex-1 gap-4 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="flex min-h-0 flex-col gap-3 md:gap-4">
                  <div className="flex min-h-0 flex-1 flex-col space-y-4 overflow-y-auto rounded-2xl bg-gray-50 p-4">
                    {messages.map((message: Message) => {
                      const isIncoming = message.direction === "incoming";
                      const isOutgoing = message.direction === "outgoing";
                      
                      // Debug: Log if we see an outgoing message
                      if (isOutgoing) {
                        console.log(`[Inbox] Rendering outgoing message:`, {
                          id: message.id,
                          content: message.content,
                          final_reply: message.final_reply,
                          response_type: message.response_type,
                          response_status: message.response_status,
                        });
                      }
                      
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
                            className={`max-w-xl rounded-2xl border p-4 transition-all hover:shadow-md ${
                              isIncoming
                                ? "border-gray-200/50 bg-white shadow-sm"
                                : isOutgoing
                                ? "border-primary/30 bg-primary/5 shadow-sm"
                                : "border-gray-200/50 bg-white shadow-sm"
                            }`}
                          >
                            {/* AI Insights for incoming messages */}
                            {isIncoming && (message.detected_intent || message.detected_tone) && (
                              <div className="mb-3 flex flex-wrap items-center gap-2">
                                {message.detected_intent && (
                                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold md:px-3 md:py-1.5 md:text-xs ${
                                    intentColors[message.detected_intent] || "bg-gray-100 text-gray-600"
                                  }`}>
                                    <span className="hidden sm:inline">
                                      {message.detected_intent === "inquiry" && "💬"}
                                      {message.detected_intent === "order" && "📦"}
                                      {message.detected_intent === "payment" && "💳"}
                                      {message.detected_intent === "complaint" && "⚠️"}
                                      {message.detected_intent === "refund" && "↩️"}
                                      {message.detected_intent === "delivery_issue" && "🚚"}
                                      {message.detected_intent === "casual" && "💭"}
                                    </span>
                                    <span className="sm:hidden">
                                      {message.detected_intent === "inquiry" && "💬"}
                                      {message.detected_intent === "order" && "📦"}
                                      {message.detected_intent === "payment" && "💳"}
                                      {message.detected_intent === "complaint" && "⚠️"}
                                      {message.detected_intent === "refund" && "↩️"}
                                      {message.detected_intent === "delivery_issue" && "🚚"}
                                      {message.detected_intent === "casual" && "💭"}
                                    </span>
                                    <span className="hidden xs:inline">{message.detected_intent}</span>
                                  </span>
                                )}
                                {message.detected_tone && (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
                                    {toneIcons[message.detected_tone] || "○"} {message.detected_tone}
                                  </span>
                                )}
                                {message.confidence && (
                                  <span className="text-xs font-medium text-gray-500">
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
                            <div className="mt-3 flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-500">
                                {(() => {
                                  const date = new Date(message.created_at);
                                  const now = new Date();
                                  const diffMs = now.getTime() - date.getTime();
                                  const diffMins = Math.floor(diffMs / 60000);
                                  const diffHours = Math.floor(diffMs / 3600000);
                                  const diffDays = Math.floor(diffMs / 86400000);
                                  
                                  if (diffMins < 1) return "Just now";
                                  if (diffMins < 60) return `${diffMins}m ago`;
                                  if (diffHours < 24) return `${diffHours}h ago`;
                                  if (diffDays === 1) return "Yesterday";
                                  if (diffDays < 7) return `${diffDays} days ago`;
                                  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
                                })()}
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

                  <div className="flex-shrink-0 rounded-2xl border border-gray-200/50 bg-white p-4 shadow-md">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex flex-wrap gap-2 flex-1">
                        {["Thanks! We'll get back to you shortly.", "Could you share more details?", "Noted. I'll update you soon."].map((q) => (
                          <button
                            key={q}
                            onClick={() => setReplyText((prev) => (prev ? prev + "\n" + q : q))}
                            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition-all hover:border-primary hover:bg-primary/5 hover:text-primary hover:shadow-sm"
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
                          className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/20 hover:shadow-sm disabled:opacity-50"
                        >
                          <SparklesIcon className="h-3.5 w-3.5" />
                          {suggestRepliesMutation.isPending ? "Generating..." : "AI Suggest"}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-end gap-3">
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
                        placeholder="Type your reply... (Cmd/Ctrl + Enter to send)"
                        className="min-h-[56px] max-h-[140px] flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-700 shadow-sm transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      />
                      <button
                        onClick={() => void handleSendReply()}
                        disabled={sendReplyMutation.isPending || !replyText.trim() || !selectedConversationId}
                        className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {sendReplyMutation.isPending ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                          <>
                            <span>Send</span>
                            <ArrowUpIcon className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Drawer Overlay */}
                {contactPanelOpen && (
                  <div
                    className="fixed inset-0 bg-black/50 z-40 xl:hidden"
                    onClick={() => setContactPanelOpen(false)}
                  />
                )}

                {/* Contact Panel - Desktop: always visible, Laptop/Tablet: drawer, Mobile: full view */}
                <aside className={`rounded-2xl border border-gray-200/50 bg-[#F9FAFB] p-5 shadow-sm transition-transform duration-300 ${
          // Desktop (≥1280px): always visible (xl:flex)
          // Laptop/Tablet: drawer (hidden xl:flex, shown when contactPanelOpen)
          // Mobile: full view when mobileView === "contact"
          mobileView === "contact" 
            ? "flex md:hidden" // Show as full view on mobile when in contact mode
            : contactPanelOpen
            ? "fixed right-0 top-0 h-full w-80 z-50 translate-x-0 overflow-y-auto xl:relative xl:h-auto xl:w-auto xl:translate-x-0 xl:overflow-visible" // Drawer open on laptop/tablet
            : "hidden xl:flex" // Hidden on laptop/tablet, visible on desktop
        }`}>
                  {/* Close button for drawer */}
                  {contactPanelOpen && (
                    <button
                      onClick={() => setContactPanelOpen(false)}
                      className="absolute top-4 right-4 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors xl:hidden"
                      aria-label="Close contact panel"
                    >
                      <XIcon className="h-5 w-5" />
                    </button>
                  )}
                  
                  {/* Profile Section */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {activeConversation.customer_avatar ? (
                          <Image
                            src={activeConversation.customer_avatar}
                            alt={activeConversation.customer_name}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-full object-cover ring-2 ring-white"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-lg font-semibold text-primary ring-2 ring-white">
                            {activeConversation.customer_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{activeConversation.customer_name}</p>
                          <p className="text-xs text-gray-500 capitalize">{activeConversation.platform}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Section */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <TagIcon className="h-4 w-4 text-gray-400" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Status</p>
                    </div>
                    <select
                      value={activeConversation.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as "active" | "resolved" | "archived";
                        updateStatusMutation.mutate({ status: newStatus });
                      }}
                      aria-label="Update conversation status"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {["active", "resolved", "archived"].map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                    <div className="mt-3">
                      <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider ${
                        activeConversation.status === "active" ? "bg-blue-100 text-blue-700" :
                        activeConversation.status === "resolved" ? "bg-green-100 text-green-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {activeConversation.status}
                      </span>
                    </div>
                  </div>

                  {/* Tags Section */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(activeConversation.tags) && activeConversation.tags.length > 0 ? activeConversation.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-white border border-gray-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700 hover:border-primary hover:bg-primary/5 transition-all"
                        >
                          {tag}
                        </span>
                      )) : (
                        <span className="text-xs text-gray-500">No tags yet.</span>
                      )}
                    </div>
                  </div>

                  {/* Last Updated Section */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Last Updated</p>
                    <p className="text-sm text-gray-700">
                      {(() => {
                        const date = new Date(activeConversation.updated_at);
                        const now = new Date();
                        const diffMs = now.getTime() - date.getTime();
                        const diffMins = Math.floor(diffMs / 60000);
                        const diffHours = Math.floor(diffMs / 3600000);
                        const diffDays = Math.floor(diffMs / 86400000);
                        
                        if (diffMins < 1) return "Just now";
                        if (diffMins < 60) return `${diffMins}m ago`;
                        if (diffHours < 24) return `${diffHours}h ago`;
                        if (diffDays === 1) return "Yesterday";
                        if (diffDays < 7) return `${diffDays} days ago`;
                        return date.toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                      })()}
                    </p>
                  </div>

                  {/* Notes Section */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Notes</p>
                    <textarea
                      placeholder="Add internal notes..."
                      className="min-h-[160px] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                      onBlur={async (e) => {
                        const value = e.target.value.trim();
                        if (value) {
                          try {
                            await updateConversationMutation.mutateAsync({ notes: value });
                          } catch {}
                        }
                      }}
                    />
                    <p className="mt-2 text-xs text-gray-400">Saved on blur.</p>
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


