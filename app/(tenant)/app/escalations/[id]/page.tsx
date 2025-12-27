'use client';

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useEscalation,
  useApproveEscalationReply,
  useSendEscalationReply,
  useIgnoreEscalation,
  useResolveEscalation,
} from "@/app/(tenant)/hooks/useEscalations";
import { ChevronLeftIcon } from "../../../components/icons";

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  normal: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
  critical: "bg-purple-100 text-purple-700",
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "bg-fuchsia-100 text-fuchsia-700",
  facebook: "bg-blue-100 text-blue-700",
  whatsapp: "bg-emerald-100 text-emerald-700",
  tiktok: "bg-neutral-900 text-white",
  telegram: "bg-sky-100 text-sky-700",
  email: "bg-purple-100 text-purple-700",
};

export default function EscalationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const escalationId = params?.id ? Number(params.id) : null;

  const { data: escalationDetail, isLoading, error } = useEscalation(escalationId);
  const approveMutation = useApproveEscalationReply(escalationId);
  const sendReplyMutation = useSendEscalationReply(escalationId);
  const ignoreMutation = useIgnoreEscalation(escalationId);
  const resolveMutation = useResolveEscalation(escalationId);

  const [replyText, setReplyText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize reply text with suggested reply
  if (escalationDetail && !isInitialized) {
    setReplyText(escalationDetail.escalation.suggestedReply || "");
    setIsInitialized(true);
  }

  if (!escalationId) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-500">Invalid escalation ID</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (error || !escalationDetail) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-900">
        {error?.message ?? "Escalation not found"}
      </div>
    );
  }

  const { escalation, customer, conversationHistory } = escalationDetail;
  
  // Safety checks
  if (!escalation) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-900">
        Escalation data is incomplete
      </div>
    );
  }
  
  const customerName = customer?.name || escalation.customerName || "Unknown Customer";
  const customerUsername = customer?.username || escalation.customerUsername;
  const customerPlatform = customer?.platform || escalation.platform;

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync();
      router.push("/app/escalations");
    } catch {
      // Error handled by mutation
    }
  };

  const handleSendCustom = async () => {
    if (!replyText.trim()) return;
    try {
      await sendReplyMutation.mutateAsync({ reply: replyText.trim(), edit: isEditing });
      router.push("/app/escalations");
    } catch {
      // Error handled by mutation
    }
  };

  const handleIgnore = async () => {
    try {
      await ignoreMutation.mutateAsync();
      router.push("/app/escalations");
    } catch {
      // Error handled by mutation
    }
  };

  const handleResolve = async () => {
    try {
      await resolveMutation.mutateAsync();
      router.push("/app/escalations");
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Modern Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-warning-600 via-warning-600/95 to-warning-700/90 p-6 shadow-xl dark:border-gray-700 dark:from-warning-600 dark:via-warning-600/90 dark:to-warning-700/80 sm:p-8 md:p-10">
        <div className="absolute inset-0 opacity-10 dark:opacity-20">
          <div className="absolute inset-0 dark:hidden" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
          <div className="absolute inset-0 hidden dark:block" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <Link
              href="/app/escalations"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/40 bg-white/25 backdrop-blur-sm text-white transition hover:border-white/60 hover:bg-white/35"
              aria-label="Back to escalations"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">Escalation Details</h1>
              <p className="mt-1 text-sm text-white">{customerName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Customer Info Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-400">Customer</h2>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
                {customerName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{customerName}</h3>
                {customerUsername && <p className="text-sm text-gray-500">@{customerUsername}</p>}
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
                      PLATFORM_COLORS[customerPlatform.toLowerCase()] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {customerPlatform}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
                      PRIORITY_COLORS[escalation.priority] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {escalation.priority}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Original Message */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-400">Original Message</h2>
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="whitespace-pre-line text-sm text-gray-700">{escalation.message}</p>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
              <span>Intent: <span className="font-semibold text-gray-700">{escalation.intent}</span></span>
              <span>Tone: <span className="font-semibold text-gray-700">{escalation.tone}</span></span>
              <span>Confidence: <span className="font-semibold text-gray-700">{Math.round(escalation.confidence * 100)}%</span></span>
            </div>
          </div>

          {/* AI Suggested Reply */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-400">AI Suggested Reply</h2>
              <button
                onClick={() => {
                  setIsEditing(!isEditing);
                  if (!isEditing) {
                    setReplyText(escalation.suggestedReply);
                  }
                }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-primary hover:text-primary"
              >
                {isEditing ? "Cancel Edit" : "Edit"}
              </button>
            </div>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={!isEditing && !replyText}
              rows={6}
              className="mt-4 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50"
              placeholder="AI suggested reply will appear here..."
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={() => void handleApprove()}
                disabled={approveMutation.isPending}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {approveMutation.isPending ? "Sending..." : "Approve & Send"}
              </button>
              <button
                onClick={() => void handleSendCustom()}
                disabled={sendReplyMutation.isPending || !replyText.trim()}
                className="rounded-xl border border-primary bg-white px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sendReplyMutation.isPending ? "Sending..." : isEditing ? "Send Edited Reply" : "Send Custom Reply"}
              </button>
              <button
                onClick={() => void handleIgnore()}
                disabled={ignoreMutation.isPending}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {ignoreMutation.isPending ? "Ignoring..." : "Ignore"}
              </button>
              <button
                onClick={() => void handleResolve()}
                disabled={resolveMutation.isPending}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resolveMutation.isPending ? "Resolving..." : "Resolve"}
              </button>
            </div>
          </div>

          {/* Conversation History */}
          {conversationHistory && conversationHistory.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-400">Conversation History</h2>
              <div className="mt-4 space-y-4">
                {conversationHistory.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-xl border border-gray-200 p-4 ${
                      message.author === "tenant" ? "ml-auto max-w-xl bg-primary/5" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-500">
                        {message.author === "tenant" ? "You" : customerName}
                      </p>
                      <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400">
                        {new Date(message.sentAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{message.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">Escalation Info</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Created</p>
                <p className="mt-1 text-gray-700">
                  {new Date(escalation.createdAt).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Priority</p>
                <p className="mt-1">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
                      PRIORITY_COLORS[escalation.priority] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {escalation.priority}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Platform</p>
                <p className="mt-1">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
                      PLATFORM_COLORS[escalation.platform.toLowerCase()] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {escalation.platform}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Conversation ID</p>
                <Link
                  href={`/app/inbox?conversation=${escalation.conversationId}`}
                  className="mt-1 text-primary hover:underline"
                >
                  #{escalation.conversationId}
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

