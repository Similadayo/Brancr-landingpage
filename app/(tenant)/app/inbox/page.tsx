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
  useDeleteConversation,
  useBulkDeleteConversations,
} from "@/app/(tenant)/hooks/useConversations";
import type { TenantNotification } from "@/lib/api";
import { getUserFriendlyErrorMessage, ErrorMessages } from "@/lib/error-messages";
import { tenantApi } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useQuery } from '@tanstack/react-query';
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
  XIcon,
  FacebookIcon,
  InstagramIcon,
  WhatsAppIcon,
  TelegramIcon,
  AllMessagesIcon,
  PlusIcon,
  TrashIcon,
} from "../../components/icons";

const STATUS_FILTERS = ["All", "Unsigned", "Assigned", "Resolved"];

export default function InboxPage() {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>("All");
  const [activePlatformFilter, setActivePlatformFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
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

  // Multi-select mode for bulk delete
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Delete mutations
  const { mutate: deleteConversation, isPending: isDeleting } = useDeleteConversation();
  const { mutate: bulkDeleteConversations, isPending: isBulkDeleting } = useBulkDeleteConversations();

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

  // Handle single delete
  const handleDeleteConversation = useCallback((id: string) => {
    if (!id) return;
    if (confirm('Delete this conversation? This cannot be undone.')) {
      deleteConversation(id, {
        onSuccess: () => {
          // Clear selection if it was the active one
          if (selectedConversationId === id) {
            setSelectedConversationId(null);
            setMobileView('list');
          }
        },
      });
    }
  }, [deleteConversation, selectedConversationId]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    if (confirm(`Delete ${selectedIds.size} conversation${selectedIds.size !== 1 ? 's' : ''}? This cannot be undone.`)) {
      bulkDeleteConversations(Array.from(selectedIds), {
        onSuccess: () => {
          setSelectedIds(new Set());
          setSelectMode(false);
          if (selectedConversationId && selectedIds.has(selectedConversationId)) {
            setSelectedConversationId(null);
            setMobileView('list');
          }
        },
      });
    }
  }, [bulkDeleteConversations, selectedIds, selectedConversationId]);

  // Toggle selection
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

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

  // Tenant-level AI mode
  const { data: tenantAIModeData } = useQuery({ queryKey: ['ai_mode'], queryFn: () => tenantApi.getAIMode(), enabled: Boolean(activeConversation) });
  const tenantAIMode = tenantAIModeData?.mode ?? 'ai';
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
    <div className="h-[calc(100vh-120px)] -mx-4 -mt-2 -mb-8 overflow-hidden bg-white dark:bg-gray-700 w-[calc(100%+2rem)] md:w-[calc(100%+3rem)] md:-mx-6">
      {/* Main Content - Three Panel Layout */}
      <div className="grid h-full gap-0 grid-cols-1 md:grid-cols-[320px_1fr_320px] w-full overflow-hidden">
        {/* Left Panel - Conversation List */}
        <section className={`flex flex-col h-full border-r border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 transition-transform duration-300 overflow-hidden ${mobileView === "chat" ? "hidden md:flex" : "flex"
          }`}>
          {/* Status Tabs */}
          <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 md:px-4 md:py-2.5">
            <div className="flex gap-1 flex-wrap">
              {STATUS_FILTERS.map((tab) => {
                const isActive = activeStatusFilter === tab || (tab === "All" && activeStatusFilter === "All");
                return (
                  <button
                    key={tab}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${isActive
                      ? "bg-accent text-white shadow-sm dark:bg-white dark:text-gray-900"
                      : "text-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
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
            <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 md:px-4 md:py-2.5">
              <div className="flex gap-1.5 flex-wrap">
                <button
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${activePlatformFilter === "All"
                    ? "bg-accent/10 dark:bg-accent/20 text-accent dark:text-accent-400 border border-accent/20 dark:border-accent/30"
                    : "text-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
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
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${isActive
                        ? "bg-accent/10 dark:bg-accent/20 text-accent dark:text-accent-400 border border-accent/20 dark:border-accent/30"
                        : "text-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
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
          <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 md:px-4 md:py-2.5">
            <div className="relative">
              <MagnifyingGlassIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name"
                className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-11 pr-10 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 transition hover:border-gray-400 dark:hover:border-gray-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <FunnelIcon
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Multi-Select Action Bar */}
          {selectMode && (
            <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-600 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedIds.size === sortedConversations.length && sortedConversations.length > 0}
                  onChange={() => {
                    if (selectedIds.size === sortedConversations.length) {
                      setSelectedIds(new Set());
                    } else {
                      setSelectedIds(new Set(sortedConversations.map(c => String(c.id))));
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {selectedIds.size} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedIds.size === 0 || isBulkDeleting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete ({selectedIds.size})
                </button>
                <button
                  onClick={() => {
                    setSelectMode(false);
                    setSelectedIds(new Set());
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Select Mode Toggle */}
          {!selectMode && sortedConversations.length > 0 && (
            <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 flex justify-end">
              <button
                onClick={() => setSelectMode(true)}
                className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                Select
              </button>
            </div>
          )}

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />
              </div>
            ) : error ? (
              <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-4 md:p-6 text-center m-3">
                <p className="text-sm font-semibold text-rose-900 dark:text-rose-300">
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
              <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 p-6 md:p-8 text-center m-3">
                <InboxIcon className="mx-auto h-10 w-10 md:h-12 md:w-12 text-gray-400 dark:text-gray-400" />
                <p className="mt-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {searchQuery || activeStatusFilter !== "All"
                    ? "No conversations found"
                    : "No conversations yet"}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                  {searchQuery || activeStatusFilter !== "All"
                    ? "Try adjusting your filters"
                    : "Conversations will appear here when customers reach out"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
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
                      onClick={() => {
                        if (selectMode) {
                          toggleSelection(String(conversation.id));
                        } else {
                          handleConversationSelect(String(conversation.id));
                        }
                      }}
                      className={`group w-full px-3 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent/60 ${isActive
                        ? "bg-accent/5 dark:bg-accent/10 border-l-4 border-accent shadow-sm"
                        : selectedIds.has(String(conversation.id))
                          ? "bg-rose-50 dark:bg-rose-900/10"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox in select mode */}
                        {selectMode && (
                          <div className="flex-shrink-0 pt-0.5">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(String(conversation.id))}
                              onChange={() => toggleSelection(String(conversation.id))}
                              onClick={(e) => e.stopPropagation()}
                              className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                            />
                          </div>
                        )}
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
                          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-gray-700 border-2 border-white dark:border-gray-600">
                            <PlatformIcon className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                          </div>
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-sm ${unread ? "font-semibold" : "font-medium"} text-gray-900 dark:text-gray-100 truncate`}>{conversation.customer_name}</span>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              {unread && (
                                <span className="badge badge-primary text-[11px]">
                                  {conversation.unread_count > 9 ? "9+" : conversation.unread_count}
                                </span>
                              )}
                              <span className="text-xs text-gray-500 dark:text-gray-300">{formatTime(conversation.last_message_at)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {conversation.last_message_media?.type && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:text-gray-300">
                                {conversation.last_message_media.type === 'audio' && '🎤 Audio'}
                                {conversation.last_message_media.type === 'image' && '📷 Image'}
                                {conversation.last_message_media.type === 'video' && '🎥 Video'}
                                {conversation.last_message_media.type === 'document' && '📄 Document'}
                                {conversation.last_message_media.type === 'sticker' && '😊 Sticker'}
                              </span>
                            )}
                            <p className="line-clamp-1 text-sm text-gray-600 dark:text-gray-300">{conversation.last_message || "No messages"}</p>
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
        <section className={`flex h-full flex-col bg-white dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600 transition-transform duration-300 overflow-hidden ${mobileView === "list" ? "hidden md:flex" : "flex"
          }`}>
          {activeConversation ? (
            <>
              {/* Chat Header - Fixed */}
              <header className="flex-shrink-0 flex items-center justify-between border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 z-10">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Back button - Mobile only */}
                  {mobileView === "chat" && (
                    <button
                      onClick={() => setMobileView("list")}
                      className="flex-shrink-0 rounded-lg p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors md:hidden"
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
                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{activeConversation.customer_name}</h2>
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
                            <PlatformIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{activeConversation.platform}</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    aria-label="Favorite conversation"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteConversation(selectedConversationId!)}
                    disabled={isDeleting || !selectedConversationId}
                    className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Delete conversation"
                    title="Delete conversation"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateStatusMutation.mutate({ status: 'resolved' as any });
                      setMobileView('list');
                    }}
                    disabled={updateStatusMutation.isPending || !selectedConversationId}
                    className="rounded-lg p-2 text-gray-600 dark:text-gray-300 transition-colors hover:bg-gray-100 dark:hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Close case"
                    title="Close case"
                  >
                    <XIcon className="h-5 w-5" />
                  </button>
                </div>
              </header>

              {/* Messages - Scrollable */}
              <div className="flex-1 overflow-y-auto bg-gray-50 min-h-0 scrollbar-thin">
                {/* Date separator */}
                {messages.length > 0 && (
                  <div className="px-4 py-2 text-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
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
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm ${isIncoming
                            ? "bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600"
                            : "bg-accent text-white dark:bg-white dark:text-gray-100"
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
                                  <p className={`text-sm whitespace-pre-wrap break-words ${isOutgoing ? "text-white/90" : "text-gray-600 dark:text-gray-300"
                                    }`}>
                                    {message.content}
                                  </p>
                                )}
                            </div>
                          ) : (
                            /* Text Content - Only show if no media */
                            message.content && (
                              <p className={`text-sm whitespace-pre-wrap break-words ${isOutgoing ? "text-white" : "text-gray-700 dark:text-gray-200"
                                }`}>
                                {message.content}
                              </p>
                            )
                          )}

                          {/* Timestamp */}
                          <div className={`mt-2 text-xs ${isOutgoing ? "text-white/70" : "text-gray-500 dark:text-gray-300"
                            }`}>
                            {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {messages.length === 0 && (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-sm text-gray-500 dark:text-gray-300">No messages yet</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input - Fixed */}
              <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 z-10">
                <div className="flex items-end gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={handleAttachmentClick}
                      className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
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
                    className="min-h-[44px] max-h-[120px] flex-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 transition-all focus:border-accent focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  />
                  <span id="message-input-hint" className="sr-only">
                    Press Cmd+Enter or Ctrl+Enter to send
                  </span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={handleToggleEmojiPicker}
                      className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                      aria-label="Add emoji"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-12 right-0 z-20 w-48 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 shadow-lg">
                        <div className="grid grid-cols-6 gap-1 text-lg">
                          {["😀", "😁", "😂", "😊", "😍", "🤔", "🙌", "🔥", "👍", "🎉", "🙏", "😅", "😎", "🤩", "🥳", "🤝", "💡", "📌"].map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              className="h-8 w-8 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
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
                    className="btn-primary min-h-[44px] flex-shrink-0"
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
                      <span key={`${file.name}-${index}`} className="inline-flex items-center gap-2 rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                        <span className="truncate max-w-[140px]" title={file.name}>{file.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(index)}
                          className="rounded-full p-1 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
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
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-gray-500 dark:text-gray-300 px-4">
              <InboxIcon className="h-12 w-12 text-gray-400 dark:text-gray-400" />
              <p className="text-sm">Select a conversation to view messages</p>
            </div>
          )}
        </section>

        {/* Right Panel - Analytics or Chat Details */}
        <aside className={`hidden md:flex flex-col h-full border-l border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 transition-transform duration-300 overflow-hidden ${mobileView === "list" ? "hidden" : ""
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
                      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Platform Analytics</h3>
                      </div>
                      {/* Analytics Content - Scrollable */}
                      <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin">
                        <PlatformAnalytics platform={platform} />
                      </div>
                    </>
                  );
                }

                if (showChatDetails) {
                  return (
                    <>
                      {/* Header - Fixed */}
                      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Chat Details</h3>
                      </div>
                      {/* Content - Scrollable */}
                      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0 scrollbar-thin">
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
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-base font-medium text-gray-600 dark:text-gray-300 flex-shrink-0">
                                {(activeConversation.customer_name || "?").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{activeConversation.customer_name}</p>
                              {activeConversation.customer_phone ? (
                                <p className="text-xs text-gray-500 dark:text-gray-300">
                                  {activeConversation.customer_country_code
                                    ? `+${activeConversation.customer_country_code} ${activeConversation.customer_dial_code || activeConversation.customer_phone}`
                                    : activeConversation.customer_phone}
                                </p>
                              ) : (
                                <p className="text-xs text-gray-400 dark:text-gray-400 italic">No phone number</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 mb-4">
                            <button className="btn-primary text-xs flex-1">
                              Call
                            </button>
                            <button className="flex-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                              Chat
                            </button>
                          </div>
                        </div>

                        {/* AI Mode (tenant-wide only) */}
                        <div className="mb-6">
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-3">AI Mode</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-300">Tenant-wide setting: <span className="font-semibold">{tenantAIMode === 'ai' ? 'AI' : 'Human'}</span></p>
                        </div>

                        {/* Contact Information */}
                        <div className="mb-6">
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-3">Contact Information</h4>
                          <div className="space-y-2 text-xs">
                            {activeConversation.customer_phone && (
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-300">Phone:</span>
                                <span className="text-gray-900 dark:text-gray-100 font-medium">
                                  {activeConversation.customer_country_code
                                    ? `+${activeConversation.customer_country_code} ${activeConversation.customer_dial_code || activeConversation.customer_phone}`
                                    : activeConversation.customer_phone}
                                </span>
                              </div>
                            )}
                            {activeConversation.customer_country_code && (
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-300">Country Code:</span>
                                <span className="text-gray-900 dark:text-gray-100 font-medium">+{activeConversation.customer_country_code}</span>
                              </div>
                            )}
                            {activeConversation.customer_dial_code && (
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-300">Dial Code:</span>
                                <span className="text-gray-900 dark:text-gray-100 font-medium">{activeConversation.customer_dial_code}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex justify-between mt-3">
                            <span className="text-gray-500 dark:text-gray-300">Start chat:</span>
                            <span className="text-gray-900 dark:text-gray-100 font-medium">
                              {new Date(activeConversation.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                            </span>
                          </div>
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
              <p className="text-sm text-gray-500 dark:text-gray-300">Select a conversation</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
