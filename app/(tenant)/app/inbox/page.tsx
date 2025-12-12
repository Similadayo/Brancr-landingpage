'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useTenant } from "../../providers/TenantProvider";
import { useWebSocketTenant } from "@/lib/hooks/use-websocket-tenant";
import { 
  useConversations, 
  useConversation, 
  useSendReply, 
  useUpdateConversationStatus, 
  useUpdateConversation, 
  useSuggestReplies,
  useMarkConversationRead,
} from "@/app/(tenant)/hooks/useConversations";
import type { TenantNotification } from "@/lib/api";
import { getUserFriendlyErrorMessage, ErrorMessages } from "@/lib/error-messages";
import type { Message, ConversationDetail, ConversationSummary } from "@/app/(tenant)/hooks/useConversations";
import { MessageMedia } from "@/app/(tenant)/components/inbox/MessageMedia";
import { PlatformAnalytics } from "../../components/inbox/PlatformAnalytics";
import Select from "@/app/(tenant)/components/ui/Select";
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

export default function InboxPage() {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>("All");
  const [activePlatformFilter, setActivePlatformFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [selectedConversationId, setSelectedConversationId] = useState<string>("");
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const unreadCountsRef = useRef<Record<string, number>>({});
  const hasInitializedUnreadRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 350);
    return () => clearTimeout(handle);
  }, [searchQuery]);

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
    if (debouncedSearch) {
      filters.search = debouncedSearch;
    }
    return filters;
  }, [activeStatusFilter, activePlatformFilter, debouncedSearch]);

  const { data: conversationsData, isLoading, error } = useConversations(apiFilters);
  
  const conversations = useMemo(() => {
    return Array.isArray(conversationsData) ? conversationsData : [];
  }, [conversationsData]);

  const conversationsWithEffectiveUnread = useMemo(() => conversations, [conversations]);

  // Get available platforms from conversations
  const availablePlatforms = useMemo(() => {
    const platformSet = new Set<string>();
    conversationsWithEffectiveUnread.forEach((conv) => {
      if (conv.platform) {
        platformSet.add(conv.platform.toLowerCase());
      }
    });
    return Array.from(platformSet).sort();
  }, [conversationsWithEffectiveUnread]);

  // Sort conversations by most recent message time (newest first)
  const sortedConversations = useMemo(() => {
    const sorted = [...conversationsWithEffectiveUnread];
    return sorted.sort((a, b) => {
      // Get the most recent message time for each conversation
      const timeA = new Date(a.last_message_at || a.updated_at || a.created_at).getTime();
      const timeB = new Date(b.last_message_at || b.updated_at || b.created_at).getTime();
      
      // Sort by most recent message time (newest first)
      // If times are equal, prioritize conversations with unread messages
      if (timeB === timeA) {
        if (a.unread_count > 0 && b.unread_count === 0) return -1;
        if (a.unread_count === 0 && b.unread_count > 0) return 1;
        return 0;
      }
      
      return timeB - timeA;
    });
  }, [conversationsWithEffectiveUnread]);
  
  const { data: conversationDetail } = useConversation(selectedConversationId);
  const sendReplyMutation = useSendReply(selectedConversationId);
  const updateStatusMutation = useUpdateConversationStatus(selectedConversationId);
  const updateConversationMutation = useUpdateConversation(selectedConversationId);
  const { mutate: markConversationRead } = useMarkConversationRead();

  useWebSocketTenant((message) => {
    if (!message || typeof message !== "object") return;
    const payload = (message as any).payload;
    const type = (message as any).type;
    const conversationId = payload?.conversation_id ?? payload?.conversationId ?? payload?.conversationID;
    const isIncoming = payload?.direction === "incoming" || payload?.direction === "inbound";

    if (!conversationId || !isIncoming) return;

    const idStr = String(conversationId);
    const isActive = selectedConversationId === idStr;

    // Increment unread for non-active conversations
    if (!isActive) {
      queryClient.setQueriesData<ConversationSummary[]>({ queryKey: ["conversations"] }, (old) => {
        if (!old) return old;
        return old.map((conv) =>
          String(conv.id) === idStr ? { ...conv, unread_count: (conv.unread_count || 0) + 1 } : conv
        );
      });
      playNotificationSound();
    }
  });

  const markConversationAsRead = useCallback((conversationId: string) => {
    if (!conversationId) return;

    unreadCountsRef.current[conversationId] = 0;

    queryClient.setQueriesData<ConversationSummary[]>({ queryKey: ["conversations"] }, (oldData) => {
      if (!oldData || !Array.isArray(oldData)) return oldData;

      return oldData.map((conv) =>
        String(conv.id) === conversationId ? { ...conv, unread_count: 0 } : conv
      );
    });

    queryClient.setQueriesData<{ notifications: TenantNotification[] }>(
      { queryKey: ["notifications"] },
      (oldData) => {
        if (!oldData || !Array.isArray(oldData.notifications)) return oldData;
        const now = new Date().toISOString();
        return {
          ...oldData,
          notifications: oldData.notifications.map((notification) =>
            notification.conversation_id && String(notification.conversation_id) === conversationId
              ? { ...notification, read_at: notification.read_at ?? now, status: notification.status ?? "read" }
              : notification
          ),
        };
      }
    );
    markConversationRead(conversationId);
  }, [queryClient, markConversationRead]);

  const playNotificationSound = useCallback(() => {
    try {
      if (typeof window === "undefined") return;
      const AudioCtor = (window as typeof window & { webkitAudioContext?: typeof AudioContext }).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtor) return;

      const ctx = audioContextRef.current || new AudioCtor();
      audioContextRef.current = ctx;

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = "triangle";
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.08;

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.15);
    } catch {
      // Ignore audio playback errors to avoid blocking UI
    }
  }, []);

  useEffect(() => {
    if (conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(String(conversations[0].id));
    }
  }, [conversations, selectedConversationId]);

  useEffect(() => {
    const targetId = searchParams?.get("conversationId");
    if (targetId && targetId !== selectedConversationId) {
      setSelectedConversationId(targetId);
      setMobileView("chat");
    }
  }, [searchParams, selectedConversationId]);

  useEffect(() => {
    if (selectedConversationId) {
      markConversationAsRead(selectedConversationId);
    }
  }, [selectedConversationId, markConversationAsRead]);

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

  useEffect(() => {
    if (activeConversation?.id) {
      markConversationAsRead(String(activeConversation.id));
    }
  }, [activeConversation?.id, markConversationAsRead]);

  useEffect(() => {
    if (!hasInitializedUnreadRef.current) {
      unreadCountsRef.current = conversationsWithEffectiveUnread.reduce<Record<string, number>>((acc, conv) => {
        acc[String(conv.id)] = conv.unread_count;
        return acc;
      }, {});
      hasInitializedUnreadRef.current = true;
      return;
    }

    const nextCounts: Record<string, number> = {};
    let shouldPlaySound = false;

    conversationsWithEffectiveUnread.forEach((conv) => {
      const id = String(conv.id);
      const previousCount = unreadCountsRef.current[id] ?? 0;
      nextCounts[id] = conv.unread_count;

      const isActive = selectedConversationId === id || activeConversation?.id === conv.id;

      if (!isActive && conv.unread_count > previousCount) {
        shouldPlaySound = true;
      }
    });

    unreadCountsRef.current = nextCounts;

    if (shouldPlaySound) {
      playNotificationSound();
    }
  }, [conversationsWithEffectiveUnread, selectedConversationId, activeConversation?.id, playNotificationSound]);

  const handleSendReply = async () => {
    if ((!replyText.trim() && attachments.length === 0) || !selectedConversationId) return;
    try {
      await sendReplyMutation.mutateAsync({ body: replyText.trim(), attachments });
      setReplyText("");
      setAttachments([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleConversationSelect = useCallback((id: string) => {
    setSelectedConversationId(id);
    markConversationAsRead(id);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileView("chat");
    }
  }, [markConversationAsRead]);

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    // Limit to 3 attachments and basic size guard (10MB each)
    const filtered = files.filter((file) => file.size <= 10 * 1024 * 1024);
    setAttachments((prev) => [...prev, ...filtered].slice(0, 3));
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleEmojiPicker = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  const handleEmojiSelect = (emoji: string) => {
    setReplyText((prev) => `${prev}${emoji}`);
    setShowEmojiPicker(false);
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
    <div className="h-[calc(100vh-120px)] -mx-4 -mt-2 -mb-8 overflow-hidden bg-white w-[calc(100%+2rem)] md:w-[calc(100%+3rem)] md:-mx-6">
      {/* Main Content - Three Panel Layout */}
      <div className="grid h-full gap-0 grid-cols-1 md:grid-cols-[320px_1fr_320px] w-full overflow-hidden">
        {/* Left Panel - Conversation List */}
        <section className={`flex flex-col h-full border-r border-gray-200 bg-white transition-transform duration-300 overflow-hidden ${
          mobileView === "chat" ? "hidden md:flex" : "flex"
        }`}>
          {/* Status Tabs */}
          <div className="flex-shrink-0 border-b border-gray-200 bg-white px-3 py-2 md:px-4 md:py-2.5">
            <div className="flex gap-1 flex-wrap">
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

          {/* Platform Filters */}
          {availablePlatforms.length > 0 && (
            <div className="flex-shrink-0 border-b border-gray-200 bg-white px-3 py-2 md:px-4 md:py-2.5">
              <div className="flex gap-1.5 flex-wrap">
                <button
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    activePlatformFilter === "All"
                      ? "bg-blue-100 text-primary border border-primary/20"
                      : "text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                  onClick={() => setActivePlatformFilter("All")}
                >
                  <AllMessagesIcon className="w-3.5 h-3.5" />
                  All
                </button>
                {availablePlatforms.map((platform) => {
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
                                     platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : "Unknown";
                  
                  return (
                    <button
                      key={platform}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                        isActive
                          ? "bg-blue-100 text-primary border border-primary/20"
                          : "text-gray-600 hover:bg-gray-100 border border-gray-200"
                      }`}
                      onClick={() => setActivePlatformFilter(platform)}
                    >
                      <PlatformIcon className="w-3.5 h-3.5" />
                      {platformName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Search */}
          <div className="flex-shrink-0 border-b border-gray-200 bg-white px-3 py-2 md:px-4 md:py-2.5">
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
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 md:p-6 text-center m-3">
                <p className="text-sm font-semibold text-rose-900">
                  {getUserFriendlyErrorMessage(error, {
                    action: 'loading conversations',
                    resource: 'conversations',
                  }) || ErrorMessages.conversation.load}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 text-xs text-rose-700 hover:text-rose-900 underline"
                >
                  Refresh page
                </button>
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
                      className={`group w-full px-3 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60 ${
                        isActive
                          ? "bg-blue-50 border-l-4 border-primary shadow-sm"
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
                              {(conversation.customer_name || "?").charAt(0).toUpperCase()}
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
                            <span className={`text-sm ${unread ? "font-semibold" : "font-medium"} text-gray-900 truncate`}>{conversation.customer_name}</span>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              {unread && (
                                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                  {conversation.unread_count > 9 ? "9+" : conversation.unread_count}
                                </span>
                              )}
                              <span className="text-xs text-gray-500">{formatTime(conversation.last_message_at)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {conversation.last_message_media?.type && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                                {conversation.last_message_media.type === 'audio' && '🎤 Audio'}
                                {conversation.last_message_media.type === 'image' && '📷 Image'}
                                {conversation.last_message_media.type === 'video' && '🎥 Video'}
                                {conversation.last_message_media.type === 'document' && '📄 Document'}
                                {conversation.last_message_media.type === 'sticker' && '😊 Sticker'}
                              </span>
                            )}
                            <p className="line-clamp-1 text-sm text-gray-600">{conversation.last_message || "No messages"}</p>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Center Panel - Chat Conversation */}
        <section className={`flex h-full flex-col bg-white border-r border-gray-200 transition-transform duration-300 overflow-hidden ${
          mobileView === "list" ? "hidden md:flex" : "flex"
        }`}>
          {activeConversation ? (
            <>
              {/* Chat Header - Fixed */}
              <header className="flex-shrink-0 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 z-10">
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
                      {(activeConversation.customer_name || "?").charAt(0).toUpperCase()}
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
                  <div className="px-4 py-2 text-center">
                    <span className="text-xs text-gray-500">
                      {new Date(messages[0].created_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                )}
                
                <div className="space-y-4 px-4 py-4 pb-4">
                  {messages.map((message: Message) => {
                    const isIncoming = message.direction === "incoming";
                    const isOutgoing = message.direction === "outgoing";
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isIncoming ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm ${
                            isIncoming
                              ? "bg-white border border-gray-100"
                              : "bg-primary text-white"
                          }`}
                          role="article"
                          aria-label={`${isIncoming ? 'Incoming' : 'Outgoing'} message`}
                        >
                          {/* Media Display - Render actual media when present */}
                          {message.media && message.media.type ? (
                            <div className="space-y-2">
                              <MessageMedia media={message.media} />
                              {/* Show content as additional text if it exists and is not just a placeholder description */}
                              {message.content && 
                               !message.content.match(/^\[(Voice note|Image|Video|Document|Sticker)\]:\s*/i) && (
                                <p className={`text-sm whitespace-pre-wrap break-words ${
                                  isOutgoing ? "text-white/90" : "text-gray-600"
                                }`}>
                                  {message.content}
                                </p>
                              )}
                            </div>
                          ) : (
                            /* Text Content - Only show if no media */
                            message.content && (
                              <p className={`text-sm whitespace-pre-wrap break-words ${
                                isOutgoing ? "text-white" : "text-gray-700"
                              }`}>
                                {message.content}
                              </p>
                            )
                          )}
                          
                          {/* Timestamp */}
                          <div className={`mt-2 text-xs ${
                            isOutgoing ? "text-white/70" : "text-gray-500"
                          }`}>
                            {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                          </div>
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
              <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-3 z-10">
                <div className="flex items-end gap-2">
                  <div className="relative">
                    <button 
                      type="button"
                      onClick={handleAttachmentClick}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label="Attach file"
                    >
                      <PaperClipIcon className="h-5 w-5" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFilesSelected}
                      aria-label="Upload attachments"
                      title="Upload attachments"
                      accept="image/*,video/*,audio/*,application/pdf"
                    />
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
                    placeholder="Type message here.."
                    aria-label="Message input"
                    aria-describedby="message-input-hint"
                    className="min-h-[44px] max-h-[120px] flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  />
                  <span id="message-input-hint" className="sr-only">
                    Press Cmd+Enter or Ctrl+Enter to send
                  </span>
                  <div className="relative">
                    <button 
                      type="button"
                      onClick={handleToggleEmojiPicker}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label="Add emoji"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-12 right-0 z-20 w-48 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                        <div className="grid grid-cols-6 gap-1 text-lg">
                          {["😀","😁","😂","😊","😍","🤔","🙌","🔥","👍","🎉","🙏","😅","😎","🤩","🥳","🤝","💡","📌"].map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              className="h-8 w-8 rounded hover:bg-gray-100"
                              onClick={() => handleEmojiSelect(emoji)}
                              aria-label={`Insert ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => void handleSendReply()}
                    type="button"
                    disabled={sendReplyMutation.isPending || (!replyText.trim() && attachments.length === 0) || !selectedConversationId}
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

                {attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {attachments.map((file, index) => (
                      <span key={`${file.name}-${index}`} className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 border border-gray-200">
                        <span className="truncate max-w-[140px]" title={file.name}>{file.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(index)}
                          className="rounded-full p-1 text-gray-500 hover:bg-gray-200"
                          aria-label={`Remove ${file.name}`}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-gray-500 px-4">
              <InboxIcon className="h-12 w-12 text-gray-400" />
              <p className="text-sm">Select a conversation to view messages</p>
            </div>
          )}
        </section>

        {/* Right Panel - Analytics or Chat Details */}
        <aside className={`hidden md:flex flex-col h-full border-l border-gray-200 bg-white transition-transform duration-300 overflow-hidden ${
          mobileView === "list" ? "hidden" : ""
        }`}>
          {activeConversation ? (
            <>
              {(() => {
                const platform = activeConversation.platform?.toLowerCase() || '';
                const showAnalytics = platform === 'instagram' || platform === 'facebook';
                const showChatDetails = platform === 'whatsapp' || platform === 'telegram' || !showAnalytics;

                if (showAnalytics) {
                  return (
                    <>
                      {/* Header - Fixed */}
                      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-3">
                        <h3 className="text-sm font-semibold text-gray-900">Platform Analytics</h3>
                      </div>
                      {/* Analytics Content - Scrollable */}
                      <div className="flex-1 overflow-y-auto min-h-0">
                        <PlatformAnalytics platform={platform} />
                      </div>
                    </>
                  );
                }

                if (showChatDetails) {
                  return (
                    <>
                      {/* Header - Fixed */}
                      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-3">
                        <h3 className="text-sm font-semibold text-gray-900">Chat Details</h3>
                      </div>
                      {/* Content - Scrollable */}
                      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
                {/* Contact Profile */}
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
                        {(activeConversation.customer_name || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{activeConversation.customer_name}</p>
                      {activeConversation.customer_phone ? (
                        <p className="text-xs text-gray-500">
                          {activeConversation.customer_country_code 
                            ? `+${activeConversation.customer_country_code} ${activeConversation.customer_dial_code || activeConversation.customer_phone}`
                            : activeConversation.customer_phone}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No phone number</p>
                      )}
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
                </div>

                {/* Contact Information */}
                <div className="mb-6">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact Information</h4>
                  <div className="space-y-2 text-xs">
                    {activeConversation.customer_phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Phone:</span>
                        <span className="text-gray-900 font-medium">
                          {activeConversation.customer_country_code 
                            ? `+${activeConversation.customer_country_code} ${activeConversation.customer_dial_code || activeConversation.customer_phone}`
                            : activeConversation.customer_phone}
                        </span>
                      </div>
                    )}
                    {activeConversation.customer_country_code && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Country Code:</span>
                        <span className="text-gray-900 font-medium">+{activeConversation.customer_country_code}</span>
                      </div>
                    )}
                    {activeConversation.customer_dial_code && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Dial Code:</span>
                        <span className="text-gray-900 font-medium">{activeConversation.customer_dial_code}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <div className="w-32">
                        <Select
                          value={activeConversation.status}
                          onChange={(value) => {
                            if (!value) return;
                            const newStatus = value as "active" | "resolved" | "archived";
                            updateStatusMutation.mutate({ status: newStatus });
                          }}
                          searchable={false}
                          buttonClassName="border-0 bg-transparent shadow-none px-0 py-0 text-xs font-medium text-gray-900 focus:ring-0"
                          options={[
                            { value: 'active', label: 'Assigned' },
                            { value: 'resolved', label: 'Resolved' },
                            { value: 'archived', label: 'Archived' },
                          ]}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Start chat:</span>
                      <span className="text-gray-900 font-medium">
                        {new Date(activeConversation.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Add Tag */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Add tag</h4>
                    <button 
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label="Add tag"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(activeConversation.tags) && activeConversation.tags.length > 0 ? (
                      activeConversation.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">No tags</span>
                    )}
                  </div>
                </div>

                {/* Assigned by */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned by</h4>
                    <button 
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label="Add assignee"
                    >
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
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Add Note</h4>
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
                    </>
                  );
                }

                return null;
              })()}
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
