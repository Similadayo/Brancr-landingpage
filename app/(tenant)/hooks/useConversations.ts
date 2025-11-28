'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { ApiError, tenantApi } from "@/lib/api";

export type ConversationSummary = {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_avatar?: string;
  platform: "whatsapp" | "instagram" | "facebook" | "tiktok" | "telegram" | "email";
  status: "active" | "resolved" | "archived";
  last_message: string;
  last_message_at: string;
  unread_count: number;
  created_at: string;
  updated_at: string;
  tags?: string[];
  assignee?: string | null;
};

export type Message = {
  id: number;
  direction: "incoming" | "outgoing";
  message_type: "text" | "image" | "video" | "comment";
  content: string;
  detected_intent?: string;
  detected_tone?: string;
  confidence?: number;
  response_type?: "auto_reply" | "escalated" | "manual";
  response_status?: "pending" | "approved" | "sent" | "rejected";
  suggested_reply?: string;
  final_reply?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
};

export type ConversationDetail = {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_avatar?: string;
  platform: string;
  status: "active" | "resolved" | "archived";
  messages: Message[];
  created_at: string;
  updated_at: string;
  tags?: string[];
  assignee?: string | null;
};

// Removed fallback data - use empty arrays/objects instead

export function useConversations(filters?: { platform?: string; status?: string; search?: string; limit?: number }) {
  return useQuery<ConversationSummary[], Error>({
    queryKey: ["conversations", filters],
    queryFn: async () => {
      try {
        const response = await tenantApi.conversations(filters);
        const conversations = response?.conversations;
        if (!Array.isArray(conversations)) {
          return [];
        }
        return conversations.map((conversation) => ({
          id: Number(conversation.id),
          customer_id: conversation.customer_id,
          customer_name: conversation.customer_name || "Unknown contact",
          customer_avatar: conversation.customer_avatar,
          platform: (conversation.platform ?? "whatsapp") as ConversationSummary["platform"],
          status: (conversation.status === "active" || conversation.status === "resolved" || conversation.status === "archived" 
            ? conversation.status 
            : "active") as ConversationSummary["status"],
          last_message: conversation.last_message || "",
          last_message_at: conversation.last_message_at || conversation.updated_at,
          unread_count: conversation.unread_count ?? 0,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
          tags: conversation.tags || [],
          assignee: conversation.assignee ?? null,
        }));
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return [];
        }
        throw error;
      }
    },
    refetchOnMount: "always",
    refetchInterval: 10000,
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
          id: Number(response.id),
          customer_id: response.customer_id,
          customer_name: response.customer_name || "Unknown contact",
          customer_avatar: response.customer_avatar,
          platform: response.platform,
          status: (response.status === "active" || response.status === "resolved" || response.status === "archived"
            ? response.status
            : "active") as ConversationDetail["status"],
          messages: Array.isArray(response.messages) ? response.messages.map((msg) => ({
            id: Number(msg.id),
            direction: msg.direction,
            message_type: msg.message_type,
            content: msg.content,
            detected_intent: msg.detected_intent,
            detected_tone: msg.detected_tone,
            confidence: msg.confidence,
            response_type: msg.response_type,
            response_status: msg.response_status,
            suggested_reply: msg.suggested_reply,
            final_reply: msg.final_reply,
            created_at: msg.created_at,
            metadata: msg.metadata,
          })) : [],
          created_at: response.created_at,
          updated_at: response.updated_at,
        };
      } catch (error) {
        throw error;
      }
    },
    refetchInterval: 10000,
  });
}

export function useSendReply(conversationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { body: string }) => {
      if (!conversationId) {
        throw new Error("No conversation selected");
      }
      return tenantApi.sendReply(conversationId, { message: payload.body });
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
    mutationFn: async (payload: { status: "active" | "resolved" | "archived" }) => {
      if (!conversationId) {
        throw new Error("No conversation selected");
      }
      return tenantApi.updateConversationStatus(conversationId, payload);
    },
    onSuccess: () => {
      toast.success("Conversation marked as updated");
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

export function useUpdateConversation(conversationId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { notes?: string; tags?: string[] }) => {
      if (!conversationId) throw new Error("No conversation selected");
      return tenantApi.updateConversation(conversationId, payload);
    },
    onSuccess: () => {
      toast.success("Conversation updated");
      void queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
    },
    onError: (error) => {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Unable to update conversation.");
    },
  });
}

export function useSuggestReplies(conversationId: string | null) {
  return useMutation({
    mutationFn: async () => {
      if (!conversationId) throw new Error("No conversation selected");
      return tenantApi.suggestReplies(conversationId);
    },
  });
}

