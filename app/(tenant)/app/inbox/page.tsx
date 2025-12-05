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
  CalendarIcon,
  UserGroupIcon,
  SettingsIcon,
  PlusIcon,
  MenuIcon,
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

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50 w-full">
      {/* Top Header Bar - Simplified */}
      <header className="hidden md:flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-gray-900">Inbox</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-64 rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 py-2 text-sm text-gray-700 placeholder-gray-400 transition focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
              {tenant?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <span className="text-sm font-medium text-gray-700">CS Niki Ayu</span>
          </div>
        </div>
      </header>
      
      {/* Mobile Header */}
      <header className="md:hidden flex-shrink-0 border-b border-gray-200 bg-white px-3 py-2.5">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold text-gray-900">Inbox</h1>
          <button
            onClick={() => setMobileView(mobileView === "list" ? "chat" : "list")}
            className="p-2 text-gray-600"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content - Three Panel Layout */}
      <div className="grid min-h-0 flex-1 gap-0 grid-cols-1 md:grid-cols-[60px_320px_1fr] xl:grid-cols-[60px_380px_1fr_320px] w-full overflow-x-hidden">
        {/* Left Sidebar - Dark Blue Navigation */}
        <aside className="hidden md:flex flex-col items-center gap-2 bg-[#1E3A8A] py-4 px-2 border-r border-blue-900/20">
          <button className="w-10 h-10 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition-colors">
            <InboxIcon className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
          <button className="w-10 h-10 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition-colors">
            <CalendarIcon className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition-colors">
            <UserGroupIcon className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <button className="w-10 h-10 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition-colors">
            <SettingsIcon className="w-5 h-5" />
          </button>
        </aside>

        {/* Conversations List */}
        <section className={`hidden md:flex flex-col border-r border-gray-200 bg-white transition-transform duration-300 overflow-x-hidden ${
          mobileView === "chat" || mobileView === "contact" ? "hidden" : ""
        }`}>
          {/* Tabs */}
          <div className="flex-shrink-0 border-b border-gray-200 bg-white px-3 py-2 md:px-4 md:py-2.5">
            <div className="flex gap-1">
              {["All", "Unsigned", "Assigned", "Resolved"].map((tab) => (
                <button
                  key={tab}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    activeStatusFilter === tab || (tab === "All" && activeStatusFilter === "All")
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => {
                    if (tab === "All") setActiveStatusFilter("All");
                    else if (tab === "Unsigned") setActiveStatusFilter("Active");
                    else if (tab === "Assigned") setActiveStatusFilter("Active");
                    else setActiveStatusFilter("Resolved");
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          
          {/* Search */}
          <div className="flex-shrink-0 border-b border-gray-200 bg-white px-3 py-2 md:px-4 md:py-2.5">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-8 py-2 text-xs text-gray-700 placeholder-gray-400 transition focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <FunnelIcon className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              </div>
            ) : error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 md:p-6 text-center text-xs md:text-sm text-rose-900 m-3">
                Failed to load conversations: {error.message}
              </div>
            ) : sortedConversations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 md:p-8 text-center m-3">
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
              <div className="divide-y divide-gray-100">
                {sortedConversations.map((conversation) => {
                  const isActive = selectedConversationId === String(conversation.id);
                  const unread = conversation.unread_count > 0;
                  const platform = conversation.platform.toLowerCase();
                  
                  // Get platform icon
                  const PlatformIcon = platform === "whatsapp" ? WhatsAppIcon :
                                     platform === "instagram" ? InstagramIcon :
                                     platform === "facebook" ? FacebookIcon :
                                     platform === "telegram" ? TelegramIcon :
                                     AllMessagesIcon;
                  
                  return (
                    <button
                      key={conversation.id}
                      onClick={() => handleConversationSelect(String(conversation.id))}
                      className={`group w-full px-3 py-3 text-left transition-colors ${
                        isActive
                          ? "bg-blue-50 border-l-4 border-primary"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="flex-shrink-0 relative">
                          {conversation.customer_avatar ? (
                            <Image
                              src={conversation.customer_avatar}
                              alt={conversation.customer_name}
                              width={48}
                              height={48}
                              className="h-12 w-12 rounded-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-sm font-medium text-primary">
                              {conversation.customer_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {/* Platform icon badge */}
                          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white border-2 border-white">
                            <PlatformIcon className="h-3 w-3 text-gray-600" />
                          </div>
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900 truncate">{conversation.customer_name}</span>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              {unread && (
                                <span className="inline-flex h-2 w-2 rounded-full bg-blue-600" />
                              )}
                              <span className="text-xs text-gray-500">{formatTime(conversation.last_message_at)}</span>
                            </div>
                          </div>
                          <p className="line-clamp-1 text-sm text-gray-600">{conversation.last_message || "No messages"}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Chat Panel */}
        <section className={`hidden md:flex min-h-0 flex-1 flex-col bg-white transition-transform duration-300 overflow-x-hidden ${
          mobileView === "list" ? "hidden" : ""
        }`}>
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <header className="sticky top-0 z-10 flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3 flex-1 min-w-0">
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
                      className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-sm font-medium text-primary flex-shrink-0">
                      {activeConversation.customer_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-semibold text-gray-900 truncate">{activeConversation.customer_name}</h2>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Platform icon */}
                    {(() => {
                      const platform = activeConversation.platform.toLowerCase();
                      const PlatformIcon = platform === "whatsapp" ? WhatsAppIcon :
                                         platform === "instagram" ? InstagramIcon :
                                         platform === "facebook" ? FacebookIcon :
                                         platform === "telegram" ? TelegramIcon :
                                         AllMessagesIcon;
                      return <PlatformIcon className="h-5 w-5 text-gray-600" />;
                    })()}
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                    <button className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                      Case Close X
                    </button>
                  </div>
                </div>
              </header>

              {/* Chat Content - Mobile: Single column, Desktop: Grid with sidebar */}
              <div className="grid min-h-0 flex-1 gap-0 xl:grid-cols-[1fr_320px] w-full">
                <div className="flex min-h-0 flex-col w-full bg-gray-50">
                  {/* Date separator */}
                  <div className="px-4 py-2 text-center">
                    <span className="text-xs text-gray-500">
                      {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  
                  {/* Messages */}
                  <div className="flex min-h-0 flex-1 flex-col space-y-4 overflow-y-auto px-4 py-4">
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
                            className={`max-w-[75%] rounded-2xl p-3 transition-all ${
                              isIncoming
                                ? "bg-white"
                                : isOutgoing
                                ? "bg-primary text-white"
                                : "bg-white"
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
                                  <p className={`whitespace-pre-line text-sm break-words ${
                                    isOutgoing ? "text-white" : "text-gray-700"
                                  }`}>
                                    {message.content}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {/* Timestamp */}
                            <div className="mt-2 flex items-center justify-end">
                              <span className={`text-xs ${
                                isOutgoing ? "text-white/70" : "text-gray-500"
                              }`}>
                                {(() => {
                                  const date = new Date(message.created_at);
                                  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
                                })()}
                              </span>
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

                  {/* Composer */}
                  <div className="sticky bottom-0 flex-shrink-0 border-t border-gray-200 bg-white px-4 py-3">
                    <div className="flex items-end gap-2">
                      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <PaperClipIcon className="h-5 w-5" />
                      </button>
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
                        placeholder="Type message here.."
                        className="min-h-[44px] max-h-[120px] flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      />
                      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => void handleSendReply()}
                        disabled={sendReplyMutation.isPending || !replyText.trim() || !selectedConversationId}
                        className="flex-shrink-0 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
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

                {/* Contact Panel - Right Sidebar */}
                {contactPanelOpen && (
                  <div
                    className="fixed inset-0 bg-black/50 z-40 xl:hidden"
                    onClick={() => setContactPanelOpen(false)}
                  />
                )}

                <aside className={`flex flex-col border-l border-gray-200 bg-white transition-transform duration-300 ${
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
                  
                  {/* Header */}
                  <div className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Chat Details</h3>
                    <button className="p-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    {/* Contact Information */}
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-4">
                        {activeConversation.customer_avatar ? (
                          <Image
                            src={activeConversation.customer_avatar}
                            alt={activeConversation.customer_name}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-base font-medium text-gray-600 flex-shrink-0">
                            {activeConversation.customer_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{activeConversation.customer_name}</p>
                          <p className="text-xs text-gray-500">+62 989-289-929</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mb-4">
                        <button className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors">
                          Call
                        </button>
                        <button className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                          Chat
                        </button>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Status:</span>
                          <select
                            value={activeConversation.status}
                            onChange={(e) => {
                              const newStatus = e.target.value as "active" | "resolved" | "archived";
                              updateStatusMutation.mutate({ status: newStatus });
                            }}
                            className="text-gray-900 font-medium border-0 bg-transparent focus:outline-none"
                          >
                            <option value="active">Assigned</option>
                            <option value="resolved">Resolved</option>
                            <option value="archived">Archived</option>
                          </select>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Start chat:</span>
                          <span className="text-gray-900 font-medium">
                            {new Date(activeConversation.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Country:</span>
                          <span className="text-gray-900 font-medium">Yordania</span>
                        </div>
                      </div>
                    </div>

                    {/* Add Tag */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Add tag</p>
                        <button className="p-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(activeConversation.tags) && activeConversation.tags.length > 0 ? activeConversation.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                          >
                            {tag}
                          </span>
                        )) : (
                          <span className="text-xs text-gray-500">No tags</span>
                        )}
                      </div>
                    </div>

                    {/* Assigned By */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned by</p>
                        <button className="p-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                            NA
                          </div>
                          <span className="text-xs text-gray-700">CS Niki Ayu</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                            GB
                          </div>
                          <span className="text-xs text-gray-700">CS Geeburn</span>
                        </div>
                      </div>
                    </div>

                    {/* Add Note */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Add Note</p>
                      </div>
                      <textarea
                        placeholder="Type your note here.."
                        className="min-h-[120px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs text-gray-700 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                        onBlur={async (e) => {
                          const value = e.target.value.trim();
                          if (value) {
                            try {
                              await updateConversationMutation.mutateAsync({ notes: value });
                            } catch {}
                          }
                        }}
                      />
                    </div>
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
