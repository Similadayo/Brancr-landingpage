export const mockChannels = [
  { id: "whatsapp", name: "WhatsApp Business", status: "connected", updatedAt: "2025-07-08T09:00:00Z" },
  { id: "instagram", name: "Instagram DM", status: "pending", updatedAt: "2025-07-06T14:45:00Z" },
  { id: "facebook", name: "Facebook Messenger", status: "not_connected", updatedAt: "2025-07-01T09:00:00Z" },
  { id: "tiktok", name: "TikTok Shop", status: "action_required", updatedAt: "2025-07-05T08:15:00Z" },
  { id: "telegram", name: "Telegram Bot", status: "connected", updatedAt: "2025-07-07T12:10:00Z" },
];

export const mockScheduledPosts = [
  {
    id: "post-001",
    name: "July Welcome Flow",
    channel: "WhatsApp",
    audience: "New subscribers",
    scheduledFor: "2025-07-09T11:00:00Z",
    status: "scheduled",
  },
  {
    id: "post-002",
    name: "Instagram Giveaway",
    channel: "Instagram",
    audience: "All followers",
    scheduledFor: "2025-07-10T15:30:00Z",
    status: "scheduled",
  },
  {
    id: "post-003",
    name: "VIP Restock Alert",
    channel: "WhatsApp",
    audience: "VIP customers",
    scheduledFor: "2025-07-08T09:30:00Z",
    status: "draft",
  },
];

export const mockConversations = [
  {
    id: "conv-001",
    contactName: "Amaka Interiors",
    channel: "whatsapp",
    status: "open",
    updatedAt: "2025-07-08T10:24:00Z",
    unreadCount: 1,
    tags: ["Priority", "Orders"],
    lastMessage: "Thanks for the quick response! Can we confirm delivery for Friday?",
    messages: [
      {
        id: "msg-001",
        author: "contact",
        authorName: "Amaka Interiors",
        body: "Thanks for the quick response! Can we confirm delivery for Friday?",
        sentAt: "2025-07-08T10:24:00Z",
      },
      {
        id: "msg-002",
        author: "tenant",
        authorName: "Seyi (You)",
        body: "Absolutely — I’ll schedule dispatch for 9AM and share the tracking link shortly.",
        sentAt: "2025-07-08T10:26:00Z",
      },
    ],
  },
  {
    id: "conv-002",
    contactName: "Chef Bisi",
    channel: "instagram",
    status: "pending",
    updatedAt: "2025-07-08T09:58:00Z",
    unreadCount: 0,
    tags: ["Influencer"],
    lastMessage: "Here’s the updated media kit you requested.",
    messages: [
      {
        id: "msg-003",
        author: "contact",
        authorName: "Chef Bisi",
        body: "Here’s the updated media kit you requested.",
        sentAt: "2025-07-08T09:58:00Z",
      },
    ],
  },
];

export const mockOnboardingStatus = {
  channelsConnected: true,
  teammateInvited: false,
  firstPostScheduled: true,
  notificationsConfigured: false,
};

export const mockAnalyticsSummary = {
  scheduledPosts: mockScheduledPosts.filter((post) => post.status === "scheduled").length,
  connectedChannels: mockChannels.filter((channel) => channel.status === "connected").length,
  aiCaptionsGenerated: 12,
};

export const mockResponseDistribution = [
  { label: "< 5 min", value: 62 },
  { label: "5 - 30 min", value: 23 },
  { label: "30 - 120 min", value: 9 },
  { label: "2+ hours", value: 6 },
];

