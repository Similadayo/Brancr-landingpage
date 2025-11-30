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
  const [activeContactTab, setActiveContactTab] = useState<"contact" | "tags" | "activity">("contact");

  // Build filters for API
  const apiFilters = useMemo(() => {
    const filters: { platform?: string; status?: string; search?: string } = {};
    if (activeStatusFilter !== "All") {
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
  
  const conversations = useMemo(() => {
    return Array.isArray(conversationsData) ? conversationsData : [];
  }, [conversationsData]);

  // Filter and sort conversations
  const sortedConversations = useMemo(() => {
    let filtered = [...conversations];
    if (activePlatformFilter !== "All") {
      filtered = filtered.filter((conv) => 
        conv.platform.toLowerCase() === activePlatformFilter.toLowerCase()
      );
    }
    
    if (activeStatusFilter !== "All") {
      const statusMap: Record<string, string> = {
        "Active": "active",
        "Resolved": "resolved",
        "Archived": "archived",
      };
      const statusValue = statusMap[activeStatusFilter] || activeStatusFilter.toLowerCase();
      filtered = filtered.filter((conv) => conv.status === statusValue);
    }
    
    const sorted = [...filtered];
    switch (sortBy) {
      case "newest":
        return sorted.sort((a, b) => {
          if (a.unread_count > 0 && b.unread_count === 0) return -1;
          if (a.unread_count === 0 && b.unread_count > 0) return 1;
          return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
        });
      case "oldest":
        return sorted.sort((a, b) => {
          if (a.unread_count > 0 && b.unread_count === 0) return -1;
          if (a.unread_count === 0 && b.unread_count > 0) return 1;
          return new Date(a.last_message_at).getTime() - new Date(b.last_message_at).getTime();
        });
      case "unread":
        return sorted.sort((a, b) => {
          if (a.unread_count > 0 && b.unread_count === 0) return -1;
          if (a.unread_count === 0 && b.unread_count > 0) return 1;
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

  useEffect(() => {
    if (conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(String(conversations[0].id));
    }
  }, [conversations, selectedConversationId]);

  const activeConversation = conversationDetail;
  const messages = useMemo(() => {
    const msgs = conversationDetail?.messages ?? [];
    if (msgs.length > 0) {
      const incomingCount = msgs.filter(m => m.direction === "incoming").length;
      const outgoingCount = msgs.filter(m => m.direction === "outgoing").length;
      console.log(`[Inbox] Messages loaded: total=${msgs.length}, incoming=${incomingCount}, outgoing=${outgoingCount}`);
      
      // Ensure messages are sorted by created_at ascending (oldest first)
      const sorted = [...msgs].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateA - dateB;
      });
      return sorted;
    }
    return msgs;
  }, [conversationDetail?.messages]);

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

  const handleConversationSelect = (id: string) => {
    setSelectedConversationId(id);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileView("chat");
    }
  };

  const handleBack = () => {
    if (mobileView === "contact") {
      setMobileView("chat");
    } else if (mobileView === "chat") {
      setMobileView("list");
      setSelectedConversationId("");
    }
  };

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

  // MOBILE-FIRST: Base styles are for mobile, then enhance with md:, lg:, xl:
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F9FAFB] w-full">
      {/* Header - Mobile First: Compact, then enhance for larger screens */}
      <header className="flex-shrink-0 border-b border-gray-200 bg-white px-3 py-2.5 md:px-4 md:py-3 lg:px-6 lg:py-4">
        <div className="w-full">
          {/* Title Row - Mobile: Stack, Desktop: Side by side */}
          <div className="mb-2 flex flex-col gap-2 md:mb-3 md:flex-row md:items-center md:justify-between">
            <h1 className="text-lg font-semibold text-gray-900 md:text-xl lg:text-[1.4rem]">Inbox</h1>
            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Search - Mobile: Full width, Desktop: Fixed width */}
              <div className="relative flex-1 md:flex-none md:min-w-[200px]">
                <MagnifyingGlassIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 md:left-3" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-2 py-2 text-xs text-gray-700 placeholder-gray-400 transition focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 md:pl-9 md:pr-3 md:py-2 md:text-sm"
                />
              </div>
              {/* Sort - Mobile: Compact, Desktop: Standard */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort conversations"
                className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs font-medium text-gray-700 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 md:px-3 md:text-sm flex-shrink-0"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Filters - Mobile: Wrap, Desktop: Row */}
          <div className="mb-2 flex flex-wrap items-center gap-1.5 md:gap-2">
            <span className="text-[10px] md:text-xs font-medium text-gray-500 whitespace-nowrap flex-shrink-0">Status:</span>
            <div className="flex flex-wrap gap-1 md:gap-1.5 flex-1 min-w-0">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveStatusFilter(filter)}
                  className={`rounded-lg border px-2 py-1 text-[10px] md:px-2.5 md:py-1 md:text-xs font-medium transition whitespace-nowrap flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center ${
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

          {/* Platform Tabs - Mobile: Horizontal scroll, Desktop: Row */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 -mx-3 px-3 md:-mx-4 md:px-4 lg:-mx-6 lg:px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                  className={`relative flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[10px] md:gap-1.5 md:px-2.5 md:py-1.5 md:text-xs font-medium transition-all flex-shrink-0 min-h-[44px] ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary"
                  }`}
                >
                  <column.Icon className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">{column.label}</span>
                  {unreadCount > 0 && (
                    <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white md:h-5 md:min-w-[20px] md:px-1.5 md:text-[10px]">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content - Mobile: Single column, Desktop: Grid */}
      <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[320px_1fr] xl:grid-cols-[380px_1fr] w-full overflow-x-hidden">
        {/* Conversations List - Mobile: Full width, Desktop: Fixed width */}
        <section className={`flex flex-col border-r-0 lg:border-r border-gray-200 bg-[#F3F4F6] transition-transform duration-300 overflow-x-hidden w-full ${
          mobileView === "chat" || mobileView === "contact" ? "hidden md:flex" : "flex"
        }`}>
          <div className="flex-shrink-0 border-b border-gray-200 bg-white px-3 py-2 md:px-4 md:py-2.5 lg:px-6 lg:py-3">
            <h2 className="text-xs md:text-sm font-semibold text-gray-900">
              Conversations <span className="ml-1 md:ml-2 text-[10px] md:text-xs font-normal text-gray-500">({sortedConversations.length})</span>
            </h2>
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 py-2 md:px-3 md:py-2 lg:px-4 lg:py-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              </div>
            ) : error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 md:p-6 text-center text-xs md:text-sm text-rose-900">
                Failed to load conversations: {error.message}
              </div>
            ) : sortedConversations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 md:p-8 text-center">
                <InboxIcon className="mx-auto h-10 w-10 md:h-12 md:w-12 text-gray-400" />
                <p className="mt-3 text-xs md:text-sm font-medium text-gray-900">
                  {searchQuery || activeStatusFilter !== "All" || activePlatformFilter !== "All"
                    ? "No conversations found"
                    : "No conversations yet"}
                </p>
                <p className="mt-1 text-[10px] md:text-xs text-gray-500">
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
                
                return (
                  <button
                    key={conversation.id}
                    onClick={() => handleConversationSelect(String(conversation.id))}
                    className={`group w-full min-h-[72px] md:min-h-[76px] rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-2 md:px-3 md:py-2.5 lg:px-4 lg:py-3 text-left transition-all duration-200 ${
                      isActive
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "hover:border-gray-300 hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <div className="flex items-start gap-2 md:gap-2.5 lg:gap-3">
                      {/* Avatar - Mobile: Smaller, Desktop: Standard */}
                      <div className="flex-shrink-0">
                        {conversation.customer_avatar ? (
                          <Image
                            src={conversation.customer_avatar}
                            alt={conversation.customer_name}
                            width={40}
                            height={40}
                            className="h-9 w-9 rounded-full object-cover md:h-10 md:w-10"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-xs font-medium text-primary md:h-10 md:w-10 md:text-sm">
                            {conversation.customer_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                          <span className="text-xs md:text-sm font-medium text-gray-900 truncate">{conversation.customer_name}</span>
                          {unread && (
                            <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-white md:h-5 md:min-w-[20px] md:px-1.5 md:text-[10px]">
                              {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
                            </span>
                          )}
                        </div>
                        <div className="mb-1">
                          <span
                            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider md:px-2 md:text-[10px] ${
                              CHANNEL_COLORS[platform] ?? "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {platform}
                          </span>
                        </div>
                        <p className="line-clamp-1 text-[11px] text-[#6B7280] mb-0.5 md:text-[12px] lg:text-[13px]">{conversation.last_message || "No messages"}</p>
                        <p className="text-[9px] text-gray-400 text-right md:text-[10px] lg:text-[11px]">{formatTime(conversation.last_message_at)}</p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Chat Panel - Mobile: Full screen, Desktop: Side by side */}
        <section className={`flex min-h-0 flex-1 flex-col bg-white transition-transform duration-300 overflow-x-hidden w-full ${
          mobileView === "list" ? "hidden md:flex" : "flex"
        }`}>
          {activeConversation ? (
            <>
              {/* Chat Header - Mobile: Compact, Desktop: Standard */}
              <header className="sticky top-0 z-10 flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-3 py-2.5 md:px-4 md:py-2.5 lg:px-6 lg:py-3 shadow-sm">
                <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                  {/* Back button - Mobile only */}
                  {(mobileView === "chat" || mobileView === "contact") && (
                    <button
                      onClick={handleBack}
                      className="flex-shrink-0 rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="Back to conversations"
                    >
                      <ArrowRightIcon className="h-5 w-5 rotate-180" />
                    </button>
                  )}
                  {activeConversation.customer_avatar ? (
                    <Image
                      src={activeConversation.customer_avatar}
                      alt={activeConversation.customer_name}
                      width={40}
                      height={40}
                      className="h-9 w-9 rounded-full object-cover md:h-10 md:w-10 flex-shrink-0"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-xs font-medium text-primary md:h-10 md:w-10 md:text-sm flex-shrink-0">
                      {activeConversation.customer_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm md:text-base lg:text-[1.1rem] font-medium text-gray-900 truncate">{activeConversation.customer_name}</h2>
                    <p className="text-[10px] md:text-xs text-gray-500 truncate">
                      via <span className="font-medium capitalize">{activeConversation.platform}</span> ·{" "}
                      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] md:px-2 md:text-[10px] font-medium uppercase ${
                        activeConversation.status === "active" ? "bg-blue-100 text-blue-700" :
                        activeConversation.status === "resolved" ? "bg-green-100 text-green-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {activeConversation.status}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                  {/* Info button - Tablet/Laptop */}
                  <button
                    onClick={() => setContactPanelOpen(true)}
                    className="flex-shrink-0 rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors xl:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Contact information"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m0-4h1v1m0 0h1m-1 0v1m-1 0h-1m1 0v-1m1 0h1m-1 0v-1" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                    </svg>
                  </button>
                  {/* Info button - Mobile */}
                  <button
                    onClick={() => setMobileView("contact")}
                    className="flex-shrink-0 rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Contact information"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m0-4h1v1m0 0h1m-1 0v1m-1 0h-1m1 0v-1m1 0h1m-1 0v-1" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                    </svg>
                  </button>
                </div>
              </header>

              {/* Chat Content - Mobile: Single column, Desktop: Grid with sidebar */}
              <div className="grid min-h-0 flex-1 gap-0 xl:grid-cols-[1fr_320px] w-full">
                <div className="flex min-h-0 flex-col w-full">
                  {/* Messages - Mobile: Compact padding, Desktop: Standard */}
                  <div className="flex min-h-0 flex-1 flex-col space-y-2.5 md:space-y-3.5 overflow-y-auto px-3 py-3 md:px-4 md:py-3 lg:px-6 lg:py-4">
                    {messages.map((message: Message) => {
                      const isIncoming = message.direction === "incoming";
                      const isOutgoing = message.direction === "outgoing";
                      
                      const intentColors: Record<string, string> = {
                        inquiry: "bg-blue-100 text-blue-700",
                        order: "bg-green-100 text-green-700",
                        payment: "bg-orange-100 text-orange-700",
                        complaint: "bg-red-100 text-red-700",
                        refund: "bg-orange-100 text-orange-700",
                        delivery_issue: "bg-yellow-100 text-yellow-700",
                        casual: "bg-gray-100 text-gray-600",
                      };
                      
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
                            className={`max-w-[85%] md:max-w-[75%] lg:max-w-[660px] rounded-xl border p-3 md:p-4 transition-all ${
                              isIncoming
                                ? "border-gray-200/50 bg-white shadow-sm"
                                : isOutgoing
                                ? "border-primary/30 bg-primary/5 shadow-sm"
                                : "border-gray-200/50 bg-white shadow-sm"
                            }`}
                          >
                            {/* AI Insights for incoming messages */}
                            {isIncoming && (message.detected_intent || message.detected_tone) && (
                              <div className="mb-2 md:mb-3 flex flex-wrap items-center gap-1.5 md:gap-2">
                                {message.detected_intent && (
                                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] md:px-2.5 md:py-1 md:text-[10px] lg:px-3 lg:py-1.5 lg:text-xs font-semibold ${
                                    intentColors[message.detected_intent] || "bg-gray-100 text-gray-600"
                                  }`}>
                                    <span>
                                      {message.detected_intent === "inquiry" && "💬"}
                                      {message.detected_intent === "order" && "📦"}
                                      {message.detected_intent === "payment" && "💳"}
                                      {message.detected_intent === "complaint" && "⚠️"}
                                      {message.detected_intent === "refund" && "↩️"}
                                      {message.detected_intent === "delivery_issue" && "🚚"}
                                      {message.detected_intent === "casual" && "💭"}
                                    </span>
                                    <span className="hidden sm:inline">{message.detected_intent}</span>
                                  </span>
                                )}
                                {message.detected_tone && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[9px] md:px-3 md:py-1.5 md:text-xs font-medium text-gray-700">
                                    {toneIcons[message.detected_tone] || "○"} <span className="hidden sm:inline">{message.detected_tone}</span>
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {/* Response type indicator for outgoing messages - AI vs You badge */}
                            {isOutgoing && (
                              <div className="mb-2">
                                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] md:text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                                  {message.response_type === "auto_reply" && (
                                    <>
                                      <span>🤖</span>
                                      <span>AI</span>
                                    </>
                                  )}
                                  {message.response_type === "escalated" && (
                                    <>
                                      <span>🚨</span>
                                      <span>Escalated</span>
                                    </>
                                  )}
                                  {(message.response_type === "manual" || !message.response_type) && (
                                    <>
                                      <span>✍️</span>
                                      <span>You</span>
                                    </>
                                  )}
                                </span>
                              </div>
                            )}
                            
                            {/* Message content */}
                            <div className="flex items-start justify-between gap-2 md:gap-3">
                              <div className="flex-1 min-w-0">
                                {message.message_type === "image" || message.message_type === "video" ? (
                                  <div className="space-y-2">
                                    <Image
                                      src={message.content}
                                      alt="Media"
                                      width={320}
                                      height={240}
                                      className="max-w-full rounded-lg"
                                      unoptimized
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = "none";
                                      }}
                                    />
                                    {message.metadata && typeof message.metadata === "object" && "caption" in message.metadata && (
                                      <p className="text-xs md:text-sm text-gray-700">{String(message.metadata.caption)}</p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="whitespace-pre-line text-xs md:text-sm text-gray-700 break-words">
                                    {/* Backend handles content correctly - use content directly */}
                                    {message.content}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {/* Timestamp and status */}
                            <div className="mt-2 md:mt-3 flex items-center justify-between">
                              <span className="text-[10px] md:text-xs font-medium text-gray-500">
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
                                <span className="text-[9px] md:text-[10px] text-gray-400">
                                  {message.response_status === "sent" && "✓ Sent"}
                                  {message.response_status === "pending" && "⏳ Pending"}
                                  {message.response_status === "approved" && "✓ Approved"}
                                  {message.response_status === "rejected" && "❌ Rejected"}
                                </span>
                              )}
                            </div>
                            
                            {/* Suggested reply for incoming messages */}
                            {isIncoming && message.suggested_reply && (
                              <div className="mt-2 md:mt-3 rounded-lg border border-[#E2E8F0] bg-[#F7F9FB] p-2.5 md:p-3.5">
                                <p className="text-[10px] md:text-xs font-medium text-primary mb-1 md:mb-1.5 flex items-center gap-1 md:gap-1.5">
                                  <span>💡</span> AI Suggested Reply
                                </p>
                                <p className="text-xs md:text-sm text-gray-700 leading-relaxed break-words">{message.suggested_reply}</p>
                              </div>
                            )}
                          </article>
                        </div>
                      );
                    })}
                    {messages.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-xs md:text-sm text-gray-500">
                        No messages yet.
                      </div>
                    ) : null}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Composer - Mobile: Sticky bottom, Desktop: Standard */}
                  <div className="sticky bottom-0 flex-shrink-0 border-t border-gray-200 bg-white px-3 py-2.5 md:px-4 md:py-3 lg:px-6 lg:py-4 shadow-[0_-1px_3px_rgba(0,0,0,0.08)]">
                    {/* Quick replies - Mobile: Horizontal scroll, Desktop: Row */}
                    <div className="mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      <div className="flex gap-1.5 md:gap-2 min-w-max">
                        {["Thanks! We'll get back to you shortly.", "Could you share more details?", "Noted. I'll update you soon."].map((q) => (
                          <button
                            key={q}
                            onClick={() => setReplyText((prev) => (prev ? prev + "\n" + q : q))}
                            className="flex-shrink-0 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[10px] md:px-3 md:py-1.5 md:text-xs font-medium text-gray-700 transition-all hover:border-primary hover:bg-primary/5 hover:text-primary min-h-[44px]"
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
                          className="flex-shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-[10px] md:px-3 md:py-1.5 md:text-xs font-semibold text-primary transition-all hover:bg-primary/20 disabled:opacity-50 min-h-[44px]"
                        >
                          <SparklesIcon className="h-3 w-3 md:h-3.5 md:w-3.5" />
                          <span className="hidden sm:inline">{suggestRepliesMutation.isPending ? "Generating..." : "AI Suggest"}</span>
                          <span className="sm:hidden">{suggestRepliesMutation.isPending ? "..." : "AI"}</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-end gap-2 md:gap-3">
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
                        className="min-h-[44px] md:min-h-[52px] max-h-[120px] md:max-h-[140px] flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm text-gray-700 shadow-sm transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      />
                      <button
                        onClick={() => void handleSendReply()}
                        disabled={sendReplyMutation.isPending || !replyText.trim() || !selectedConversationId}
                        className="flex-shrink-0 inline-flex items-center gap-1.5 md:gap-2 rounded-full bg-primary px-4 py-2.5 md:px-5 md:py-3 text-xs md:text-sm font-semibold text-white shadow-md transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] min-w-[44px] md:min-w-auto"
                      >
                        {sendReplyMutation.isPending ? (
                          <div className="h-4 w-4 md:h-5 md:w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                          <>
                            <span className="hidden sm:inline">Send</span>
                            <ArrowUpIcon className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Contact Panel - Mobile: Full view, Tablet: Drawer, Desktop: Sidebar */}
                {contactPanelOpen && (
                  <div
                    className="fixed inset-0 bg-black/50 z-40 xl:hidden"
                    onClick={() => setContactPanelOpen(false)}
                  />
                )}

                <aside className={`flex flex-col border-l-0 xl:border-l border-gray-200 bg-white transition-transform duration-300 ${
          mobileView === "contact" 
            ? "flex md:hidden" 
            : contactPanelOpen
            ? "fixed right-0 top-0 h-full w-80 z-50 translate-x-0 overflow-y-auto xl:relative xl:h-auto xl:w-auto xl:translate-x-0 xl:overflow-visible" 
            : "hidden xl:flex"
        }`}>
                  {contactPanelOpen && (
                    <button
                      onClick={() => setContactPanelOpen(false)}
                      className="absolute top-4 right-4 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors xl:hidden z-10 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="Close contact panel"
                    >
                      <XIcon className="h-5 w-5" />
                    </button>
                  )}
                  
                  {/* Tabs */}
                  <div className="flex-shrink-0 border-b border-gray-200 bg-white px-3 md:px-4">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setActiveContactTab("contact")}
                        className={`px-3 py-2.5 md:px-4 md:py-3 text-[10px] md:text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 min-h-[44px] ${
                          activeContactTab === "contact"
                            ? "text-gray-900 border-gray-900"
                            : "text-gray-500 border-transparent hover:text-gray-700"
                        }`}
                      >
                        Contact Card
                      </button>
                      <button
                        onClick={() => setActiveContactTab("tags")}
                        className={`px-3 py-2.5 md:px-4 md:py-3 text-[10px] md:text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 min-h-[44px] ${
                          activeContactTab === "tags"
                            ? "text-gray-900 border-gray-900"
                            : "text-gray-500 border-transparent hover:text-gray-700"
                        }`}
                      >
                        Tags & Notes
                      </button>
                      <button
                        onClick={() => setActiveContactTab("activity")}
                        className={`px-3 py-2.5 md:px-4 md:py-3 text-[10px] md:text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 min-h-[44px] ${
                          activeContactTab === "activity"
                            ? "text-gray-900 border-gray-900"
                            : "text-gray-500 border-transparent hover:text-gray-700"
                        }`}
                      >
                        Activity
                      </button>
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-y-auto px-4 py-4 md:px-5 md:py-5">
                    {activeContactTab === "contact" && (
                      <div className="space-y-3 md:space-y-4">
                        <div className="flex items-center gap-2 md:gap-3">
                          {activeConversation.customer_avatar ? (
                            <Image
                              src={activeConversation.customer_avatar}
                              alt={activeConversation.customer_name}
                              width={48}
                              height={48}
                              className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover flex-shrink-0"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-gray-100 text-sm md:text-base font-medium text-gray-600 flex-shrink-0">
                              {activeConversation.customer_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs md:text-sm font-medium text-gray-900 leading-tight break-words">{activeConversation.customer_name}</p>
                            <p className="text-[10px] md:text-xs text-gray-500 capitalize mt-0.5">{activeConversation.platform}</p>
                          </div>
                        </div>
                        <select
                          value={activeConversation.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as "active" | "resolved" | "archived";
                            updateStatusMutation.mutate({ status: newStatus });
                          }}
                          aria-label="Update conversation status"
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs md:text-sm font-medium text-gray-700 transition-all hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[44px]"
                        >
                          {["active", "resolved", "archived"].map((s) => (
                            <option key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {activeContactTab === "tags" && (
                      <div className="space-y-3 md:space-y-4">
                        <div>
                          <p className="text-[10px] md:text-xs text-gray-500 mb-2 md:mb-3">Tags</p>
                          <div className="flex flex-wrap gap-1.5 md:gap-2">
                            {Array.isArray(activeConversation.tags) && activeConversation.tags.length > 0 ? activeConversation.tags.map((tag: string) => (
                              <span
                                key={tag}
                                className="inline-flex items-center rounded-full bg-white border border-gray-200 px-2 py-1 text-[10px] md:px-2.5 md:py-1 md:text-[11px] font-medium uppercase tracking-wider text-gray-700 hover:border-primary hover:bg-primary/5 transition-all"
                              >
                                {tag}
                              </span>
                            )) : (
                              <span className="text-[10px] md:text-xs text-gray-500">No tags yet.</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] md:text-xs text-gray-500 mb-2 md:mb-3">Notes</p>
                          <textarea
                            placeholder="Add internal notes..."
                            className="min-h-[160px] md:min-h-[200px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs md:text-sm text-gray-700 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                            onBlur={async (e) => {
                              const value = e.target.value.trim();
                              if (value) {
                                try {
                                  await updateConversationMutation.mutateAsync({ notes: value });
                                } catch {}
                              }
                            }}
                          />
                          <p className="mt-1.5 text-[10px] md:text-[11px] text-gray-400">Saved on blur.</p>
                        </div>
                      </div>
                    )}

                    {activeContactTab === "activity" && (
                      <div className="space-y-3 md:space-y-4">
                        <div>
                          <p className="text-[10px] md:text-xs text-gray-500 mb-1">Last updated:</p>
                          <p className="text-xs md:text-sm font-medium text-gray-900">
                            {(() => {
                              const date = new Date(activeConversation.updated_at);
                              return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
                            })()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] md:text-xs text-gray-500 mb-1">Joined:</p>
                          <p className="text-xs md:text-sm font-medium text-gray-900">
                            {new Date(activeConversation.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </aside>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-gray-500 px-4">
              <Image src="/logo-light.svg" alt="Brancr" width={64} height={64} className="opacity-80" />
              <p className="text-xs md:text-sm">Select a conversation to view the thread and reply.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
