'use client';

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTenant } from "../../providers/TenantProvider";
import { mockConversations } from "../../data/mockData";

const FILTERS = ["All", "Open", "Pending", "Closed"];

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
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [selectedConversationId, setSelectedConversationId] = useState<string>(mockConversations[0]?.id ?? "");
  const [note, setNote] = useState("");

  const filteredConversations = useMemo(() => {
    if (activeFilter === "All") return mockConversations;
    return mockConversations.filter(
      (conversation) => conversation.status.toLowerCase() === activeFilter.toLowerCase()
    );
  }, [activeFilter]);

  const activeConversation = useMemo(
    () => mockConversations.find((conversation) => conversation.id === selectedConversationId),
    [selectedConversationId]
  );

  const messages = activeConversation?.messages ?? [];

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Inbox</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Manage conversations across WhatsApp, Instagram, Facebook, and Telegram from one collaborative workspace. Assign
            threads, close loops quickly, and keep customers delighted.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                activeFilter === filter
                  ? "border-primary bg-primary text-white shadow shadow-primary/30"
                  : "border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr] xl:grid-cols-[360px_1fr]">
        <section className="rounded-3xl border border-gray-200 bg-white/70 p-4 shadow-lg shadow-primary/5">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-semibold text-gray-900">Conversations</h2>
            <span className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500">
              {filteredConversations.length}
            </span>
          </div>
          <div className="mt-4 px-2">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs uppercase tracking-[0.3em] text-gray-400">
                🔍
              </span>
              <input
                type="search"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-10 py-2 text-sm text-gray-700 shadow-sm transition focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Search by name or tag…"
              />
            </div>
          </div>
          <div className="mt-4 space-y-2 overflow-y-auto px-1 pb-2 pt-1" style={{ maxHeight: "calc(100vh - 240px)" }}>
            {filteredConversations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                No conversations yet.
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const isActive = selectedConversationId === conversation.id;
                const unread = conversation.unreadCount > 0;
                return (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      isActive
                        ? "border-primary/40 bg-primary/10 shadow-sm shadow-primary/20"
                        : "border-transparent hover:border-gray-200 hover:bg-gray-50"
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
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500">{conversation.lastMessage}</p>
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
                            ? new Date(conversation.updatedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
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

        <section className="flex min-h-[70vh] flex-col gap-6 rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-lg shadow-primary/5">
          {activeConversation ? (
            <>
              <header className="flex flex-col gap-4 border-b border-gray-200 pb-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                    {activeConversation.contactName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{activeConversation.contactName}</h2>
                    <p className="text-sm text-gray-500">
                      via {activeConversation.channel.toUpperCase()} · Assigned to{" "}
                      <span className="font-medium text-gray-700">{tenant?.name ?? "You"}</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="https://t.me/brancrbot"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-primary hover:text-primary"
                  >
                    Open in Telegram
                  </Link>
                  <span className="rounded-full border border-gray-200 px-3 py-1 text-xs uppercase tracking-[0.3em] text-gray-500">
                    {activeConversation.status}
                  </span>
                </div>
              </header>

              <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="flex flex-col gap-4">
                  <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl bg-neutral-bg p-4">
                    {messages.map((message) => (
                      <article
                        key={message.id}
                        className={`max-w-xl rounded-2xl border border-gray-200 bg-white p-4 shadow-sm ${
                          message.author === "tenant" ? "ml-auto bg-primary/5" : ""
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
                        value="Messaging will be available once the Brancr API is live. Use Telegram for now."
                        readOnly
                        className="min-h-[140px] w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1">
                            Attachments supported via Telegram
                          </span>
                        </div>
                        <button
                          disabled
                          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white opacity-50 shadow-md shadow-primary/20"
                        >
                          Reply via API coming soon
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
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
                        <p>
                          {note || "Coordinate delivery with logistics team. Customer prefers morning drops. Add more notes once the API is ready."}
                        </p>
                        <textarea
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                          placeholder="Leave a reminder for your team…"
                          className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                        <p className="mt-2 text-[11px] text-gray-400">
                          Notes sync coming soon. Stick with Telegram for official log updates.
                        </p>
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
    </div>
  );
}


