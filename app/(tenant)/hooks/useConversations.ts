'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { ApiError, tenantApi } from "@/lib/api";

export type ConversationSummary = {
  id: string;
  contactName: string;
  channel: "whatsapp" | "instagram" | "facebook" | "tiktok" | "telegram" | "email";
  preview: string;
  updatedAt: string;
  unreadCount: number;
  tags: string[];
  assignee?: string | null;
  status: "open" | "pending" | "closed";
};

export type ConversationDetail = {
  conversation: ConversationSummary;
  messages: Array<{
    id: string;
    author: "tenant" | "contact";
    authorName?: string;
    body: string;
    sentAt: string;
    attachments?: Array<Record<string, unknown>>;
  }>;
};

const FALLBACK_CONVERSATIONS: ConversationSummary[] = [
  {
    id: "1",
    contactName: "Amaka Interiors",
    channel: "whatsapp",
    preview: "Thanks for the quick response! Can we confirm delivery for Friday?",
    updatedAt: "2025-07-04T10:24:00Z",
    unreadCount: 1,
    tags: ["priority", "orders"],
    assignee: "Seyi",
    status: "open",
  },
  {
    id: "2",
    contactName: "Chef Bisi",
    channel: "instagram",
    preview: "Here’s the updated media kit you requested.",
    updatedAt: "2025-07-04T09:58:00Z",
    unreadCount: 0,
    tags: ["influencer"],
    assignee: "You",
    status: "pending",
  },
];

const FALLBACK_DETAILS: Record<string, ConversationDetail> = {
  "1": {
    conversation: FALLBACK_CONVERSATIONS[0],
    messages: [
      {
        id: "m1",
        author: "contact",
        authorName: "Amaka Interiors",
        body: "Thanks for the quick response! Can we confirm delivery for Friday?",
        sentAt: "2025-07-04T10:24:00Z",
      },
      {
        id: "m2",
        author: "tenant",
        authorName: "Seyi (You)",
        body: "Absolutely — I’ll schedule dispatch for 9AM and share the tracking link shortly.",
        sentAt: "2025-07-04T10:26:00Z",
      },
    ],
  },
  "2": {
    conversation: FALLBACK_CONVERSATIONS[1],
    messages: [
      {
        id: "m3",
        author: "contact",
        authorName: "Chef Bisi",
        body: "Here’s the updated media kit you requested.",
        sentAt: "2025-07-04T09:58:00Z",
      },
      {
        id: "m4",
        author: "tenant",
        authorName: "Ada (You)",
        body: "Thank you! Looks great — we’ll include it in the next promotion cycle.",
        sentAt: "2025-07-04T10:01:00Z",
      },
    ],
  },
};

export function useConversations() {
  return useQuery<ConversationSummary[], Error>({
    queryKey: ["conversations"],
    queryFn: async () => {
      try {
        const response = await tenantApi.conversations();
        return response.conversations.map((conversation) => ({
          id: conversation.id,
          contactName: conversation.contact_name ?? "Unknown contact",
          channel: (conversation.channel ?? "whatsapp") as ConversationSummary["channel"],
          preview: conversation.preview ?? "",
          updatedAt: conversation.updated_at ?? "",
          unreadCount: conversation.unread_count ?? 0,
          tags: conversation.tags ?? [],
          assignee: conversation.assignee ?? null,
          status: (conversation.status ?? "open") as ConversationSummary["status"],
        }));
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return FALLBACK_CONVERSATIONS;
        }
        throw error;
      }
    },
    refetchOnMount: "always",
  });
}

export function useConversation(conversationId: string | null) {
  return useQuery<ConversationDetail, Error>({
    queryKey: ["conversation", conversationId],
    enabled: Boolean(conversationId),
    queryFn: async () => {
      if (!conversationId) {
        throw new Error("conversationId is required");
      }
      try {
        const response = await tenantApi.conversation(conversationId);
        return {
          conversation: {
            id: response.conversation.id,
            contactName: response.conversation.contact_name ?? "Unknown contact",
            channel: (response.conversation.channel ?? "whatsapp") as ConversationSummary["channel"],
            preview: "",
            updatedAt: new Date().toISOString(),
            unreadCount: 0,
            tags: response.conversation.tags ?? [],
            assignee: response.conversation.assignee ?? null,
            status: (response.conversation.status ?? "open") as ConversationSummary["status"],
          },
          messages: response.messages.map((message) => ({
            id: message.id,
            author: message.author,
            authorName: message.author_name,
            body: message.body,
            sentAt: message.sent_at,
            attachments: message.attachments,
          })),
        };
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return FALLBACK_DETAILS[conversationId] ?? {
            conversation: FALLBACK_CONVERSATIONS[0],
            messages: [],
          };
        }
        throw error;
      }
    },
  });
}

export function useSendReply(conversationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { body: string }) => {
      if (!conversationId) {
        throw new Error("No conversation selected");
      }
      return tenantApi.sendReply(conversationId, payload);
    },
    onSuccess: () => {
      toast.success("Reply sent");
      void queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Unable to send reply. Please try again.");
      }
    },
  });
}

export function useAssignConversation(conversationId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { assignee_id: string | null }) => {
      if (!conversationId) {
        throw new Error("No conversation selected");
      }
      return tenantApi.assignConversation(conversationId, payload);
    },
    onSuccess: () => {
      toast.success("Conversation updated");
      void queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Unable to update conversation.");
      }
    },
  });
}

export function useUpdateConversationStatus(conversationId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { status: string }) => {
      if (!conversationId) {
        throw new Error("No conversation selected");
      }
      return tenantApi.updateConversationStatus(conversationId, payload);
    },
    onSuccess: (_, variables) => {
      toast.success(`Conversation marked as ${variables.status}`);
      void queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Unable to update status.");
      }
    },
  });
}

