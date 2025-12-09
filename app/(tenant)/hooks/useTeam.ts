'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { ApiError, tenantApi } from "@/lib/api";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
  joined_at?: string;
};

export function useTeamMembers() {
  return useQuery<{ members: TeamMember[]; coming_soon?: boolean } | TeamMember[], Error>({
    queryKey: ["team", "members"],
    queryFn: async () => {
      try {
        const response = await tenantApi.teamMembers();
        // Check for "coming soon" flag
        if ('coming_soon' in response && response.coming_soon) {
          return { members: [], coming_soon: true };
        }
        // Handle both response formats
        const members = Array.isArray(response) 
          ? response 
          : (response.members || []).map((member: any) => ({
              id: member.id,
              name: member.name,
              email: member.email,
              role: member.role,
              status: member.status,
              joined_at: member.joined_at,
            }));
        return { members, coming_soon: false };
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.status === 404) {
            return { members: [], coming_soon: false };
          }
          if (error.status === 501 || error.body?.coming_soon) {
            return { members: [], coming_soon: true };
          }
        }
        throw error;
      }
    },
    refetchOnMount: "always",
  });
}

export function useInviteTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { email: string; role: string }) => {
      return tenantApi.inviteTeamMember(payload);
    },
    onSuccess: () => {
      toast.success("Invitation sent successfully");
      void queryClient.invalidateQueries({ queryKey: ["team", "members"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        if (error.status === 501) {
          toast.error("Team management is coming soon. This feature is not yet available.");
        } else {
          toast.error(error.message || "Failed to send invitation");
        }
      } else {
        toast.error("Unable to send invitation. Please try again.");
      }
    },
  });
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      payload,
    }: {
      memberId: string;
      payload: { role?: string; status?: string };
    }) => {
      return tenantApi.updateTeamMember(memberId, payload);
    },
    onSuccess: () => {
      toast.success("Team member updated successfully");
      void queryClient.invalidateQueries({ queryKey: ["team", "members"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        if (error.status === 501) {
          toast.error("Team management is coming soon. This feature is not yet available.");
        } else {
          toast.error(error.message || "Failed to update team member");
        }
      } else {
        toast.error("Unable to update team member. Please try again.");
      }
    },
  });
}

export function useDeleteTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      return tenantApi.deleteTeamMember(memberId);
    },
    onSuccess: () => {
      toast.success("Team member removed successfully");
      void queryClient.invalidateQueries({ queryKey: ["team", "members"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        if (error.status === 501) {
          toast.error("Team management is coming soon. This feature is not yet available.");
        } else {
          toast.error(error.message || "Failed to remove team member");
        }
      } else {
        toast.error("Unable to remove team member. Please try again.");
      }
    },
  });
}

