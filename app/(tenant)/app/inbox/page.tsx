'use client';

import { useMemo, useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
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
import { AccountInsights } from "../../components/insights/AccountInsights";
import { MediaInsights } from "../../components/insights/MediaInsights";
import { PlatformAnalytics } from "../../components/inbox/PlatformAnalytics";
import {
  InboxIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  PaperClipIcon,
  FacebookIcon,
  InstagramIcon,
  WhatsAppIcon,
  TelegramIcon,
  AllMessagesIcon,
  PlusIcon,
} from "../../components/icons";

const STATUS_FILTERS = ["All", "Unsigned", "Assigned", "Resolved"];
const ALL_PLATFORMS = ['whatsapp', 'instagram', 'facebook', 'telegram', 'tiktok', 'email'];

export default function InboxPage() {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>("All");
  const [activePlatformFilter, setActivePlatformFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedConversationId, setSelectedConversationId] = useState<string>("");
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat" | "analytics">("list");
  const [readConversationIds, setReadConversationIds] = useState<Set<number>>(new Set());

  // Build filters for API
  const apiFilters = useMemo(() => {
    const filters: { status?: string; search?: string; platform?: string } = {};
    if (activeStatusFilter !== "All") {
      const statusMap: Record<string, string> = {
        "Unsigned": "active",
        "Assigned": "active",
        "Resolved": "resolved",
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

  // Get available platforms from conversations with unread counts
  // Always show all platforms, even if they have no conversations
  const availablePlatforms = useMemo(() => {
    const platformMap = new Map<string, number>();
    
    // Initialize all platforms with 0 unread
    ALL_PLATFORMS.forEach((platform) => {
      platformMap.set(platform, 0);
    });
    
    // Update with actual unread counts from conversations
    if (conversations && conversations.length > 0) {
      conversations.forEach((conv) => {
        if (conv.platform) {
          const platform = conv.platform.toLowerCase();
          const currentCount = platformMap.get(platform) || 0;
          platformMap.set(platform, currentCount + (conv.unread_count || 0));
        }
      });
    }
    
    return Array.from(platformMap.entries())
      .map(([platform, unreadCount]) => ({ platform, unreadCount }))
      .sort((a, b) => {
        // Keep order: whatsapp, instagram, facebook, telegram, tiktok, email
        const orderA = ALL_PLATFORMS.indexOf(a.platform);
        const orderB = ALL_PLATFORMS.indexOf(b.platform);
        if (orderA !== -1 && orderB !== -1) return orderA - orderB;
        if (orderA !== -1) return -1;
        if (orderB !== -1) return 1;
        return a.platform.localeCompare(b.platform);
      });
  }, [conversations]);

  // Calculate total unread count
  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
  }, [conversations]);

  // Sort conversations by last message time
  const sortedConversations = useMemo(() => {
    const sorted = [...conversations];
    return sorted.sort((a, b) => {
      if (a.unread_count > 0 && b.unread_count === 0) return -1;
      if (a.unread_count === 0 && b.unread_count > 0) return 1;
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    });
  }, [conversations]);
  
  const { data: conversationDetail } = useConversation(selectedConversationId);
  const sendReplyMutation = useSendReply(selectedConversationId);
  const updateStatusMutation = useUpdateConversationStatus(selectedConversationId);
  const updateConversationMutation = useUpdateConversation(selectedConversationId);

  useEffect(() => {
    if (conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(String(conversations[0].id));
    }
  }, [conversations, selectedConversationId]);

  const activeConversation = conversationDetail;
  const messages = useMemo(() => {
    const msgs = conversationDetail?.messages ?? [];
    if (msgs.length > 0) {
      return [...msgs].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateA - dateB;
      });
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

    // Mark conversation as read when opened
    const conversationId = Number(id);
    if (conversationId && !readConversationIds.has(conversationId)) {
      setReadConversationIds((prev) => new Set([...prev, conversationId]));

      // Optimistically update the conversation cache to set unread_count to 0
      queryClient.setQueryData<ConversationSummary[]>(
        ["conversations", apiFilters],
        (oldData) => {
          if (!oldData || !Array.isArray(oldData)) return oldData;

          return oldData.map((conv) => {
            if (Number(conv.id) === conversationId) {
              return { ...conv, unread_count: 0 };
            }
            return conv;
          });
        }
      );
      
      // Invalidate to sync with backend
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
    
    // Switch to chat view on mobile
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileView("chat");
    }
    // On desktop, keep showing all panels (mobileView stays "list")
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
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-auto md:space-y-4 sm:space-y-6 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4 md:mb-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 lg:text-4xl">Inbox</h1>
          <p className="mt-1 md:mt-2 text-xs md:text-sm text-gray-600">
            Respond to messages, set up automations and more.
          </p>
        </div>
      </header>

      {/* Platform Filters */}
      <div className="flex-shrink-0 rounded-xl border border-gray-200 bg-white p-3 md:p-4 md:shadow-sm sm:p-6 mb-4 md:mb-0">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
                activePlatformFilter === "All"
                  ? "bg-blue-100 text-gray-900"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setActivePlatformFilter("All")}
            >
              All messages
              {totalUnreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-xs font-semibold text-white">
                  {totalUnreadCount}
                </span>
              )}
            </button>
            {availablePlatforms.map(({ platform, unreadCount }) => {
              const isActive = activePlatformFilter.toLowerCase() === platform.toLowerCase();
              const PlatformIcon = platform === "whatsapp" ? WhatsAppIcon :
                                 platform === "instagram" ? InstagramIcon :
                                 platform === "facebook" ? FacebookIcon :
                                 platform === "telegram" ? TelegramIcon :
                                 AllMessagesIcon;
              const platformName = platform === "whatsapp" ? "WhatsApp" :
                                 platform === "instagram" ? "Instagram" :
                                 platform === "facebook" ? "Messenger" :
                                 platform === "telegram" ? "Telegram" :
                                 platform === "tiktok" ? "TikTok" :
                                 platform === "email" ? "Email" :
                                 platform.charAt(0).toUpperCase() + platform.slice(1);
              
              return (
                <button
                  key={platform}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 relative whitespace-nowrap ${
                    isActive
                      ? "bg-blue-100 text-gray-900"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => setActivePlatformFilter(platform)}
                >
                  <PlatformIcon className="h-4 w-4" />
                  {platformName}
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-xs font-semibold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      </div>

      {/* Main Content - Three Panel Layout */}
      <div className="flex-1 min-h-0 grid gap-0 grid-cols-1 md:grid-cols-[320px_1fr_320px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Left Panel - Conversation List */}
        <section className={`flex flex-col h-full border-r border-gray-200 bg-white transition-transform duration-300 overflow-hidden ${
          (mobileView === "chat" || mobileView === "analytics") ? "hidden md:flex" : "flex"
        }`}>
          {/* Status Tabs */}
          <div className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-3">
            <div className="flex gap-1">
              {STATUS_FILTERS.map((tab) => {
                const isActive = activeStatusFilter === tab || (tab === "All" && activeStatusFilter === "All");
                return (
                  <button
                    key={tab}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => setActiveStatusFilter(tab)}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Search */}
          <div className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-8 py-2 text-sm text-gray-700 placeholder-gray-400 transition focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <FunnelIcon className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          
          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              </div>
            ) : error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 md:p-6 text-center text-sm text-rose-900 m-3">
                Failed to load conversations: {error.message}
              </div>
            ) : sortedConversations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 md:p-8 text-center m-3">
                <InboxIcon className="mx-auto h-10 w-10 md:h-12 md:w-12 text-gray-400" />
                <p className="mt-3 text-sm font-medium text-gray-900">
                  {searchQuery || activeStatusFilter !== "All"
                    ? "No conversations found"
                    : "No conversations yet"}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {searchQuery || activeStatusFilter !== "All"
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

        {/* Right Panel - Chat Conversation */}
        <section className={`flex h-full flex-col bg-white border-l border-gray-200 transition-transform duration-300 overflow-hidden ${
          mobileView === "list" || mobileView === "analytics" ? "hidden md:flex" : "flex"
        }`}>
          {activeConversation ? (
            <>
              {/* Instagram Account Insights - Show for Instagram conversations */}
              {activeConversation?.platform.toLowerCase() === 'instagram' && (
                <div className="flex-shrink-0 border-b border-gray-200 bg-white px-3 py-2 sm:px-4 sm:py-3">
                  <AccountInsights period="day" save={true} />
                </div>
              )}

              {/* Chat Header - Fixed */}
              <header className="flex-shrink-0 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6 z-10">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Back button - Mobile only */}
                  {mobileView === "chat" && (
                    <button
                      onClick={() => setMobileView("list")}
                      className="flex-shrink-0 rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors md:hidden"
                      aria-label="Back to conversations"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  {/* Clickable name to open analytics on mobile */}
                  <button
                    onClick={() => {
                      if (typeof window !== "undefined" && window.innerWidth < 768) {
                        setMobileView("analytics");
                      }
                    }}
                    className="flex items-center gap-3 flex-1 min-w-0 md:pointer-events-none"
                  >
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
                      <div className="flex items-center gap-1 mt-0.5">
                        {(() => {
                          const platform = activeConversation.platform.toLowerCase();
                          const PlatformIcon = platform === "whatsapp" ? WhatsAppIcon :
                                             platform === "instagram" ? InstagramIcon :
                                             platform === "facebook" ? FacebookIcon :
                                             platform === "telegram" ? TelegramIcon :
                                             AllMessagesIcon;
                          return (
                            <>
                              <PlatformIcon className="h-4 w-4 text-gray-600" />
                              <span className="text-xs text-gray-500 capitalize">{activeConversation.platform}</span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    {/* Arrow indicator on mobile */}
                    {typeof window !== "undefined" && window.innerWidth < 768 && (
                      <svg className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button 
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Favorite conversation"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                  <button 
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="More options"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  <button className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                    Case Close X
                  </button>
                </div>
              </header>

              {/* Messages - Scrollable */}
              <div className="flex-1 overflow-y-auto bg-gray-50 min-h-0">
                {/* Date separator */}
                {messages.length > 0 && (
                  <div className="px-4 py-2 text-center sm:px-6">
                    <span className="text-xs text-gray-500">
                      {new Date(messages[0].created_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                )}
                
                <div className="space-y-4 px-4 py-4 pb-4">
                  {messages.map((message: Message) => {
                    const isIncoming = message.direction === "incoming";
                    const isOutgoing = message.direction === "outgoing";
                    const isInstagram = activeConversation?.platform.toLowerCase() === 'instagram';
                    const mediaId = message.metadata && typeof message.metadata === "object" && "media_id" in message.metadata
                      ? String(message.metadata.media_id)
                      : message.metadata && typeof message.metadata === "object" && "platform_post_id" in message.metadata
                      ? String(message.metadata.platform_post_id)
                      : null;
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isIncoming ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                            isIncoming
                              ? "bg-white"
                              : "bg-primary text-white"
                          }`}
                        >
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
                                <p className={`text-sm ${isOutgoing ? "text-white" : "text-gray-700"}`}>
                                  {String(message.metadata.caption)}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className={`text-sm whitespace-pre-wrap break-words ${
                              isOutgoing ? "text-white" : "text-gray-700"
                            }`}>
                              {message.content}
                            </p>
                          )}
                          <div className={`mt-2 text-xs ${
                            isOutgoing ? "text-white/70" : "text-gray-500"
                          }`}>
                            {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                          </div>
                          {/* Show media insights for Instagram posts */}
                          {isInstagram && mediaId && (message.message_type === "image" || message.message_type === "video") && (
                            <MediaInsights mediaId={mediaId} showSave={true} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {messages.length === 0 && (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-sm text-gray-500">No messages yet</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input - Fixed */}
              <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-3 sm:px-6 z-10">
                <div className="flex items-end gap-2">
                  <button 
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Attach file"
                  >
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
                  <button 
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Add emoji"
                  >
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
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-gray-500 px-4">
              <InboxIcon className="h-12 w-12 text-gray-400" />
              <p className="text-sm">Select a conversation to view messages</p>
            </div>
          )}
        </section>

        {/* Right Panel - Platform Analytics */}
        <aside className={`flex flex-col h-full border-l border-gray-200 bg-white transition-transform duration-300 overflow-hidden ${
          mobileView === "analytics" ? "flex md:flex" : "hidden md:flex"
        }`}>
          {activeConversation ? (
            <>
              {/* Header - Fixed */}
              <div className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="flex items-center gap-3">
                  {/* Back button - Mobile only */}
                  {mobileView === "analytics" && (
                    <button
                      onClick={() => setMobileView("chat")}
                      className="flex-shrink-0 rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors md:hidden"
                      aria-label="Back to chat"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  <h3 className="text-sm font-semibold text-gray-900 sm:text-base">Platform Analytics</h3>
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto min-h-0 py-4 px-4 sm:px-6">
                <PlatformAnalytics platform={activeConversation.platform} />
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-gray-500">Select a conversation</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
