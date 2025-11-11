'use client';

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { useTenant } from "../../providers/TenantProvider";
import {
  ConversationSummary,
  useAssignConversation,
  useConversation,
  useConversations,
  useSendReply,
  useUpdateConversationStatus,
} from "../../hooks/useConversations";

const FILTERS = ["All", "Open", "Pending", "Closed"];

const CHANNEL_COLORS: Record<ConversationSummary["channel"], string> = {
  whatsapp: "bg-emerald-100 text-emerald-700",
  instagram: "bg-fuchsia-100 text-fuchsia-700",
  facebook: "bg-blue-100 text-blue-700",
  tiktok: "bg-neutral-900 text-white",
  telegram: "bg-sky-100 text-sky-700",
  email: "bg-purple-100 text-purple-700",
};

export default function InboxPage() {
  const { tenant } = useTenant();
  const conversationsQuery = useConversations();
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");

  const filteredConversations = useMemo(() => {
    if (!conversationsQuery.data) return [];
    if (activeFilter === "All") return conversationsQuery.data;
    return conversationsQuery.data.filter(
      (conversation) => conversation.status.toLowerCase() === activeFilter.toLowerCase()
    );
  }, [conversationsQuery.data, activeFilter]);

  useEffect(() => {
    if (!selectedConversation && conversationsQuery.data?.length) {
      setSelectedConversation(conversationsQuery.data[0].id);
    }
  }, [selectedConversation, conversationsQuery.data]);

  const conversationQuery = useConversation(selectedConversation);
  const sendReplyMutation = useSendReply(selectedConversation);
  const closeConversationMutation = useUpdateConversationStatus(selectedConversation);
  const assignConversationMutation = useAssignConversation(selectedConversation);

  const messages = conversationQuery.data?.messages ?? [];
  const activeConversation = conversationQuery.data?.conversation;

  const handleSendReply = () => {
    if (!replyBody.trim()) {
      toast.error("Write a message before sending.");
      return;
    }

    sendReplyMutation.mutate(
      { body: replyBody.trim() },
      {
        onSuccess: () => setReplyBody(""),
      }
    );
  };

  const handleCloseConversation = () => {
    closeConversationMutation.mutate({ status: "closed" });
  };

  const handleAssignToMe = () => {
    if (!tenant?.tenant_id) return;
    assignConversationMutation.mutate({ assignee_id: String(tenant.tenant_id) });
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <section className="w-full rounded-2xl border border-gray-200 bg-white shadow-sm lg:w-80 xl:w-96">
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Conversations</h2>
            <span className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500">
              {filteredConversations.length}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  activeFilter === filter
                    ? "bg-primary text-white shadow shadow-primary/30"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <input
              type="search"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Search by name or tag…"
            />
          </div>
        </div>

        <div className="max-h-[calc(100vh-220px)] overflow-y-auto p-2">
          {conversationsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="mb-2 animate-pulse rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="h-3 w-32 rounded-full bg-gray-200" />
                <div className="mt-2 h-3 w-48 rounded-full bg-gray-200" />
              </div>
            ))
          ) : filteredConversations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
              No conversations yet.
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const isActive = selectedConversation === conversation.id;
              const unread = conversation.unreadCount > 0;
              return (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                    isActive ? "bg-primary/10 border border-primary/20" : "hover:bg-gray-50"
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
                        {conversation.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400">
                        {conversation.updatedAt
                          ? new Date(conversation.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "--"}
                      </p>
                      {unread ? (
                        <span className="mt-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                          {conversation.unreadCount}
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

      <section className="flex min-h-[70vh] flex-1 flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {conversationQuery.isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-gray-500">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <p className="text-sm">Loading conversation…</p>
          </div>
        ) : conversationQuery.isError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-gray-500">
            <p className="text-sm">We couldn’t load this conversation.</p>
            <button
              onClick={() => conversationQuery.refetch()}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-primary hover:text-primary"
            >
              Retry
            </button>
          </div>
        ) : activeConversation ? (
          <>
            <header className="flex flex-col gap-3 border-b border-gray-200 pb-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                  {activeConversation.contactName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{activeConversation.contactName}</h2>
                  <p className="text-sm text-gray-500">
                    via {activeConversation.channel.toUpperCase()} • Assigned to{" "}
                    <span className="font-medium text-gray-700">{activeConversation.assignee ?? "Unassigned"}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleAssignToMe}
                  disabled={assignConversationMutation.isPending}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {assignConversationMutation.isPending ? "Assigning…" : "Assign to me"}
                </button>
                <button
                  onClick={handleCloseConversation}
                  disabled={closeConversationMutation.isPending}
                  className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
                >
                  {closeConversationMutation.isPending ? "Closing…" : "Close conversation"}
                </button>
              </div>
              <span className="rounded-full border border-gray-200 px-3 py-1 text-xs uppercase tracking-[0.3em] text-gray-500">
                {activeConversation.status}
              </span>
            </header>

            <div className="flex flex-1 flex-col gap-6 lg:flex-row">
              <div className="flex flex-1 flex-col gap-4">
                <div className="flex-1 space-y-4 overflow-y-auto rounded-xl bg-neutral-bg p-4">
                  {messages.map((message) => (
                    <article
                      key={message.id}
                      className={`max-w-xl rounded-2xl border border-gray-200 bg-white p-4 shadow-sm ${
                        message.author === "tenant" ? "ml-auto" : ""
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
                    <textarea
                      value={replyBody}
                      onChange={(event) => setReplyBody(event.target.value)}
                      className="min-h-[120px] w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Write a reply or use an AI suggestion…"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <button className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 transition hover:border-primary hover:text-primary">
                          <span aria-hidden>+</span> Attachment
                        </button>
                        <button className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 transition hover:border-primary hover:text-primary">
                          AI Suggest
                        </button>
                      </div>
                      <button
                        onClick={handleSendReply}
                        disabled={sendReplyMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
                      >
                        {sendReplyMutation.isPending ? "Sending…" : "Send reply"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <aside className="w-full rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:h-full lg:w-80">
                <h3 className="text-sm font-semibold text-gray-900">Conversation details</h3>
                <div className="mt-4 space-y-4 text-xs text-gray-600">
                  <div>
                    <p className="uppercase tracking-[0.3em] text-gray-400">Contact</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{activeConversation.contactName}</p>
                    <p className="text-xs text-gray-500">Channel ID: 234-0101</p>
                  </div>

                  <div>
                    <p className="uppercase tracking-[0.3em] text-gray-400">Tags</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {activeConversation.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                      {activeConversation.tags.length === 0 ? (
                        <span className="text-xs text-gray-500">No tags yet.</span>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <p className="uppercase tracking-[0.3em] text-gray-400">Latest campaign touch</p>
                    <p className="mt-1 text-sm text-gray-600">
                      Added to “Holiday Promo” broadcast on 4 July 2025 • 12:30
                    </p>
                  </div>

                  <div>
                    <p className="uppercase tracking-[0.3em] text-gray-400">Notes</p>
                    <div className="mt-2 rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-600">
                      <p>Coordinate delivery with logistics team. Customer prefers morning drops.</p>
                      <button
                        onClick={() => toast.success("Notes coming soon")}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80"
                      >
                        Add note <span aria-hidden>+</span>
                      </button>
                    </div>
                  </div>
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
  );
}


