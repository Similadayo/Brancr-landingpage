'use client';

import { useQuery } from "@tanstack/react-query";
import { ApiError, tenantApi } from "@/lib/api";

export type CampaignSummary = {
  id: string;
  name: string;
  status: "draft" | "scheduled" | "active" | "completed";
  channel: "whatsapp" | "instagram" | "facebook" | "tiktok";
  scheduledFor: string | null;
  audience: string;
  metrics?: {
    sent: number;
    openRate: number;
    clickRate: number;
  };
};

const FALLBACK_CAMPAIGNS: CampaignSummary[] = [
  {
    id: "cmp-001",
    name: "July Welcome Flow",
    status: "active",
    channel: "whatsapp",
    scheduledFor: "2025-07-03T10:00:00Z",
    audience: "New subscribers (last 30 days)",
    metrics: { sent: 320, openRate: 72, clickRate: 31 },
  },
  {
    id: "cmp-002",
    name: "Instagram Giveaway",
    status: "scheduled",
    channel: "instagram",
    scheduledFor: "2025-07-07T14:30:00Z",
    audience: "All followers",
  },
  {
    id: "cmp-003",
    name: "VIP Restock Alert",
    status: "completed",
    channel: "whatsapp",
    scheduledFor: "2025-06-29T08:15:00Z",
    audience: "VIP customers",
    metrics: { sent: 180, openRate: 84, clickRate: 46 },
  },
];

export function useCampaigns() {
  return useQuery<CampaignSummary[], Error>({
    queryKey: ["campaigns"],
    queryFn: async () => {
      try {
        const response = await tenantApi.campaigns();
        return response.campaigns.map((campaign) => ({
          id: campaign.id,
          name: campaign.name,
          status: (campaign.status ?? "draft") as CampaignSummary["status"],
          channel: (campaign.channel ?? "whatsapp") as CampaignSummary["channel"],
          scheduledFor: campaign.scheduled_for ?? null,
          audience: campaign.audience ?? "Audience not specified",
          metrics: campaign.metrics
            ? {
                sent: campaign.metrics.sent,
                openRate: campaign.metrics.open_rate,
                clickRate: campaign.metrics.click_rate,
              }
            : undefined,
        }));
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return FALLBACK_CAMPAIGNS;
        }
        throw error;
      }
    },
  });
}

