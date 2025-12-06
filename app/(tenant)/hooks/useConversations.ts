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
        
        // Map conversations - backend already groups by customer_id + platform for Instagram
        // Just handle customer name display with fallback
        return conversations.map((conversation) => {
          // Backend returns customer_name from customer.DisplayName
          // Use it directly, with a fallback if empty
          let customerName = conversation.customer_name;
          
          // If customer_name is empty or "Unknown contact", show a better fallback
          if (!customerName || customerName.trim() === "" || customerName === "Unknown contact") {
            const platform = (conversation.platform ?? "whatsapp").toLowerCase();
            if (platform === "instagram") {
              customerName = "Instagram User";
            } else {
              customerName = "Unknown contact";
            }
          }
          
          return {
            id: Number(conversation.id),
            customer_id: conversation.customer_id,
            customer_name: customerName,
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
          };
        });
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
        
        // Backend returns customer_name from customer.DisplayName
        // Use it directly, with a fallback if empty
        let customerName = response.customer_name;
        
        // If customer_name is empty or "Unknown contact", show a better fallback
        if (!customerName || customerName.trim() === "" || customerName === "Unknown contact") {
          const platform = (response.platform ?? "whatsapp").toLowerCase();
          if (platform === "instagram") {
            customerName = "Instagram User";
          } else {
            customerName = "Unknown contact";
          }
        }
        
        return {
          id: Number(response.id),
          customer_id: response.customer_id,
          customer_name: customerName,
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
    onSuccess: (response) => {
      toast.success("Reply sent");
      
      // Optimistically update the conversation cache with the new message
      if (response.interaction) {
        queryClient.setQueryData<ConversationDetail>(
          ["conversation", conversationId],
          (oldData) => {
            if (!oldData) return oldData;
            
            // Map the interaction to Message type
            // Backend already sets content correctly (final_reply for outgoing, content for incoming)
            const newMessage: Message = {
              id: response.interaction.id,
              direction: response.interaction.direction,
              message_type: response.interaction.message_type,
              content: response.interaction.content, // Backend handles the logic
              final_reply: response.interaction.final_reply,
              response_type: response.interaction.response_type,
              response_status: response.interaction.response_status,
              detected_intent: response.interaction.detected_intent,
              detected_tone: response.interaction.detected_tone,
              confidence: response.interaction.confidence,
              suggested_reply: response.interaction.suggested_reply,
              created_at: response.interaction.created_at,
              metadata: response.interaction.metadata,
            };
            
            // Add new message and sort by created_at ascending
            const updatedMessages = [...oldData.messages, newMessage].sort((a, b) => {
              const dateA = new Date(a.created_at).getTime();
              const dateB = new Date(b.created_at).getTime();
              return dateA - dateB;
            });
            
            return {
              ...oldData,
              messages: updatedMessages,
              updated_at: response.interaction.created_at,
            };
          }
        );
      }
      
      // Still invalidate to ensure we have the latest data
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

