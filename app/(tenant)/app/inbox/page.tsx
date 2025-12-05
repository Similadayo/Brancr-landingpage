'use client';

import { useMemo, useState } from "react";
import Image from "next/image";
import { useTenant } from "../../providers/TenantProvider";
import { useConversations } from "@/app/(tenant)/hooks/useConversations";
import type { ConversationSummary } from "@/app/(tenant)/hooks/useConversations";
import {
  InboxIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  FacebookIcon,
  InstagramIcon,
  WhatsAppIcon,
  TelegramIcon,
  AllMessagesIcon,
} from "../../components/icons";

const STATUS_FILTERS = ["All", "Unsigned", "Assigned", "Resolved"];

export default function InboxPage() {
  const { tenant } = useTenant();
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Build filters for API
  const apiFilters = useMemo(() => {
    const filters: { status?: string; search?: string } = {};
    if (activeStatusFilter !== "All") {
      const statusMap: Record<string, string> = {
        "Unsigned": "active",
        "Assigned": "active",
        "Resolved": "resolved",
      };
      filters.status = statusMap[activeStatusFilter] || activeStatusFilter.toLowerCase();
    }
    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }
    return filters;
  }, [activeStatusFilter, searchQuery]);

  const { data: conversationsData, isLoading, error } = useConversations(apiFilters);
  
  const conversations = useMemo(() => {
    return Array.isArray(conversationsData) ? conversationsData : [];
  }, [conversationsData]);

  // Sort conversations by last message time
  const sortedConversations = useMemo(() => {
    const sorted = [...conversations];
    return sorted.sort((a, b) => {
      if (a.unread_count > 0 && b.unread_count === 0) return -1;
      if (a.unread_count === 0 && b.unread_count > 0) return 1;
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    });
  }, [conversations]);

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
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white w-full">
      {/* Top Header Bar */}
      <header className="flex-shrink-0 border-b border-gray-200 bg-white px-3 py-2.5 md:px-4 md:py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-base md:text-lg font-semibold text-gray-900">Inbox</h1>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative hidden md:block">
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
              <span className="hidden md:inline text-sm font-medium text-gray-700">CS Niki Ayu</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Conversation List Only */}
      <div className="flex min-h-0 flex-1 w-full overflow-hidden">
        <section className="flex flex-col w-full bg-white">
          {/* Tabs */}
          <div className="flex-shrink-0 border-b border-gray-200 bg-white px-3 py-2 md:px-4 md:py-2.5">
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
          <div className="min-h-0 flex-1 overflow-y-auto">
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
                      className="group w-full px-3 py-3 text-left transition-colors hover:bg-gray-50"
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
      </div>
    </div>
  );
}
