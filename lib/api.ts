
const DEFAULT_API_BASE_URL = "https://api.brancr.com";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;

// Lightweight token accessor for client-side requests
export function getAuthToken(): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("token");
  } catch {
    return null;
  }
}

type ApiErrorBody = {
  error?: string;
  [key: string]: unknown;
};

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody | null;

  constructor(message: string, status: number, body: ApiErrorBody | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export type TenantNotification = {
  id: string | number;
  type?: string;
  title?: string;
  message?: string;
  category?: string;
  status?: string;
  created_at: string;
  read_at?: string | null;
  conversation_id?: string | number;
  escalation_id?: string | number;
  resource_id?: string | number;
  resource_type?: string;
  metadata?: Record<string, unknown>;
};

type ApiRequestOptions = RequestInit & {
  parseJson?: boolean;
};

function buildUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}

function buildHeaders(initHeaders?: HeadersInit, body?: BodyInit | null) {
  const defaultHeaders: HeadersInit = {};

  if (body instanceof FormData) {
    // Let the browser set the multipart/form-data headers
    return initHeaders ?? defaultHeaders;
  }

  return {
    "Content-Type": "application/json",
    ...defaultHeaders,
    ...initHeaders,
  };
}

async function parseError(response: Response): Promise<ApiError> {
  let body: ApiErrorBody | null = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  // Prefer explicit server-provided messages when available (message, error),
  // else include stringified body if helpful, otherwise fall back to statusText.
  const message =
    (body && (body as any).message) ||
    (body && (body as any).error) ||
    (body ? JSON.stringify(body) : undefined) ||
    response.statusText ||
    "Request failed";

  return new ApiError(message, response.status, body);
}

export async function apiFetch<TResponse = unknown>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<TResponse> {
  const { parseJson = true, headers, body, ...rest } = options;
  const url = buildUrl(path);

  const response = await fetch(url, {
    credentials: "include",
    ...rest,
    headers: buildHeaders(headers, body ?? null),
    body,
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  if (!parseJson || response.status === 204) {
    return undefined as TResponse;
  }

  const text = await response.text();
  if (!text) {
    return undefined as TResponse;
  }

  try {
    return JSON.parse(text) as TResponse;
  } catch (e) {
    console.error("Failed to parse JSON response:", text);
    // If it's 2xx but failed to parse, we might want to return text or throw.
    // Given the context, throwing seems appropriate to catch malformed server responses.
    throw new ApiError("Failed to parse API response", response.status);
  }
}

// Convenience helpers for common HTTP verbs
export function get<TResponse = unknown>(path: string, options?: ApiRequestOptions) {
  return apiFetch<TResponse>(path, { method: "GET", ...options });
}

export function post<TBody = unknown, TResponse = unknown>(
  path: string,
  body?: TBody,
  options?: ApiRequestOptions
) {
  return apiFetch<TResponse>(path, {
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    ...options,
  });
}

export function patch<TBody = unknown, TResponse = unknown>(
  path: string,
  body?: TBody,
  options?: ApiRequestOptions
) {
  return apiFetch<TResponse>(path, {
    method: "PATCH",
    body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    ...options,
  });
}

export function put<TBody = unknown, TResponse = unknown>(
  path: string,
  body?: TBody,
  options?: ApiRequestOptions
) {
  return apiFetch<TResponse>(path, {
    method: "PUT",
    body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    ...options,
  });
}

export function del<TResponse = unknown>(path: string, options?: ApiRequestOptions) {
  return apiFetch<TResponse>(path, { method: "DELETE", ...options });
}

export const authApi = {
  signup: (payload: {
    name: string;
    email: string;
    password: string;
    company_name: string;
    phone: string;
  }) => post<typeof payload, {
    success: boolean;
    tenant_id: string;
    name: string;
    email: string;
    email_verified: boolean;
    verification_required: boolean;
    onboarding_required: boolean;
    redirect_to: string;
    message: string;
  }>("/api/auth/signup", payload),

  login: (payload: { email: string; password: string }) =>
    post<typeof payload, {
      success: boolean;
      tenant_id: string;
      name: string;
      email: string;
      email_verified: boolean;
      onboarding_required: boolean;
      redirect_to: string;
      message: string;
    }>("/api/auth/login", payload),

  logout: () => post<undefined, void>("/api/auth/logout"),

  me: async () => {
    // Normalize auth/me payloads — some servers return a nested `tenant` object with `id`,
    // while others include `tenant_id` at the top level. Make the client tolerant to both.
    const raw = await get<{
      tenant_id?: string;
      tenant?: { id?: string };
      name?: string;
      email?: string;
      email_verified?: boolean;
      plan?: string;
      status?: string;
      onboarding?: {
        complete: boolean;
        step?: "business_profile" | "persona" | "business_details" | "social_connect";
      };
      integrations?: {
        total: number;
        connected: number;
        platforms: string[];
      };
      scheduled_posts?: {
        total: number;
        posted: number;
      };
    }>("/api/auth/me");

    // If tenant_id is not present at the top level but there's a nested tenant.id, copy it over.
    if ((raw as any)?.tenant && (raw as any).tenant.id && !(raw as any).tenant_id) {
      (raw as any).tenant_id = (raw as any).tenant.id;
    }

    return raw as any;
  },

  verifyEmail: (payload: { token: string }) =>
    post<typeof payload, { success: boolean; message: string }>("/api/auth/verify-email", payload),

  resendVerification: (payload: { email: string }) =>
    post<typeof payload, { success: boolean; message: string }>("/api/auth/resend-verification", payload),

  forgotPassword: (payload: { email: string }) =>
    post<typeof payload, { success: boolean; message: string }>("/api/auth/forgot-password", payload),

  resetPassword: (payload: { token: string; new_password: string }) =>
    post<typeof payload, { success: boolean; message: string }>("/api/auth/reset-password", payload),

  changePassword: (payload: { current_password: string; new_password: string }) =>
    post<typeof payload, { success: boolean; message: string }>("/api/auth/change-password", payload),
};

export const tenantApi = {
  overview: () =>
    get<{
      conversations: number;
      scheduledPosts: number;
    }>("/api/tenant/overview"),

  socialAccounts: () =>
    get<{
      accounts: Array<Record<string, unknown>>;
    }>("/api/tenant/social-accounts"),

  socialAccountHistory: () =>
    get<{
      entries: Array<{ id: string; action: string; at: string }>;
    }>("/api/tenant/social-accounts/history"),

  conversations: (params?: { platform?: string; status?: string; search?: string; limit?: number }) => {
    const query = params
      ? `?${new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]) as [string, string][]
      ).toString()}`
      : "";
    return get<{
      conversations: Array<{
        id: string;
        customer_id: string;
        customer_name: string;
        customer_avatar?: string;
        customer_phone?: string;
        customer_country_code?: string;
        customer_dial_code?: string;
        platform: string;
        status: string;
        last_message: string;
        last_message_at: string;
        last_message_media?: {
          url?: string;
          stored_url?: string;
          type?: string;
          transcription?: string;
          image_analysis?: string;
          document_text?: string;
          filename?: string;
          caption?: string;
        } | null;
        unread_count: number;
        created_at: string;
        updated_at: string;
        tags?: string[];
        assignee?: string | null;
      }>;
    }>(`/api/tenant/conversations${query}`);
  },

  conversation: (conversationId: string) =>
    get<{
      id: string;
      customer_id: string;
      customer_name: string;
      customer_avatar?: string;
      customer_phone?: string;
      customer_country_code?: string;
      customer_dial_code?: string;
      platform: string;
      status: string;
      messages: Array<{
        id: string;
        direction: "incoming" | "outgoing";
        message_type: "text" | "image" | "video" | "comment" | "audio" | "document" | "sticker";
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
        media?: {
          url?: string;
          stored_url?: string;
          type?: string;
          transcription?: string;
          image_analysis?: string;
          document_text?: string;
          filename?: string;
          caption?: string;
        } | null;
      }>;
      created_at: string;
      updated_at: string;
    }>(`/api/tenant/conversations/${conversationId}`),

  markConversationRead: (conversationId: string) =>
    post<undefined, { success: boolean }>(`/api/tenant/conversations/${conversationId}/read`),

  sendReply: (conversationId: string, payload: { message: string; attachments?: File[] } | FormData) => {
    let body: FormData | { message: string; attachments?: File[] } = payload;

    if (!(payload instanceof FormData) && payload.attachments?.length) {
      const formData = new FormData();
      formData.append('message', payload.message);
      payload.attachments.forEach((file) => {
        formData.append('attachments', file);
      });
      body = formData;
    }

    return post<typeof body, {
      success: boolean;
      message: string;
      interaction: {
        id: string;
        direction: "incoming" | "outgoing";
        message_type: "text" | "image" | "video" | "comment" | "audio" | "document" | "sticker";
        content: string;
        final_reply?: string;
        response_type?: "auto_reply" | "escalated" | "manual";
        response_status?: "pending" | "approved" | "sent" | "rejected";
        created_at: string;
        detected_intent?: string;
        detected_tone?: string;
        confidence?: number;
        suggested_reply?: string;
        metadata?: Record<string, unknown>;
        media?: {
          url?: string;
          stored_url?: string;
          type?: string;
          transcription?: string;
          image_analysis?: string;
          document_text?: string;
          filename?: string;
          caption?: string;
        } | null;
      };
    }>(`/api/tenant/conversations/${conversationId}/replies`, body);
  },

  assignConversation: (conversationId: string, payload: { assignee_id: string | null }) =>
    patch<typeof payload, { success: boolean }>(
      `/api/tenant/conversations/${conversationId}/assign`,
      payload
    ),

  updateConversationStatus: (conversationId: string, payload: { status: "active" | "resolved" | "archived" }) =>
    patch<typeof payload, { success: boolean }>(`/api/tenant/conversations/${conversationId}`, payload),

  updateConversation: (conversationId: string, payload: { notes?: string; tags?: string[] }) =>
    patch<typeof payload, { success: boolean }>(`/api/tenant/conversations/${conversationId}`, payload),

  deleteConversation: (conversationId: string) =>
    del<{ success: boolean }>(`/api/tenant/conversations/${conversationId}`),

  bulkDeleteConversations: (ids: string[]) =>
    del<{ success: boolean; deleted: number }>(`/api/tenant/conversations`, { body: JSON.stringify({ ids }) }),

  suggestReplies: (conversationId: string) =>
    post<undefined, { suggestions: Array<{ reply: string; tone?: string; confidence?: number }> }>(`/api/tenant/conversations/${conversationId}/suggest-replies`),

  campaignStats: () =>
    get<{
      scheduled: number;
      published: number;
      draft: number;
    }>("/api/tenant/campaigns/stats"),

  campaigns: () =>
    get<{
      campaigns: Array<{
        id: string;
        name: string;
        status: string;
        channel: string;
        scheduled_for: string | null;
        audience: string;
        metrics?: {
          sent: number;
          open_rate: number;
          click_rate: number;
        };
      }>;
    }>("/api/tenant/campaigns"),

  campaign: (campaignId: string) =>
    get<{
      campaign: Record<string, unknown>;
    }>(`/api/tenant/campaigns/${campaignId}`),

  analytics: (params?: { platform?: string; start_date?: string; end_date?: string }) => {
    const query = params
      ? `?${new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== '') as [string, string][]
      ).toString()}`
      : "";
    return get<{
      summary: {
        scheduled_posts: number;
        posted: number;
        conversations: number;
        interactions: number;
        has_data: boolean;
      };
      engagement: {
        total_impressions: number;
        total_reach: number;
        total_likes: number;
        total_comments: number;
        total_shares: number;
        avg_engagement_rate: number;
        posts_with_analytics: number;
      };
      response_distribution: {
        auto_reply: { count: number; percentage: number };
        manual: { count: number; percentage: number };
        escalated: { count: number; percentage: number };
      };
      response_time_distribution: {
        data: {
          under_1_min: { count: number; percentage: number };
          "1_to_5_min": { count: number; percentage: number };
          "5_to_15_min": { count: number; percentage: number };
          over_15_min: { count: number; percentage: number };
        };
        has_data: boolean;
        total: number;
      };
      volume_by_channel: {
        data: Array<{
          platform: string;
          count: number;
          percentage: number;
        }>;
        has_data: boolean;
        total: number;
      };
      platforms: Array<{
        platform: string;
        posts: number;
        conversations: number;
        impressions: number;
        reach: number;
        likes: number;
        comments: number;
        shares: number;
        engagement_rate: number;
      }>;
      date_range: {
        start: string;
        end: string;
      };
    }>(`/api/tenant/analytics${query}`);
  },

  performanceSummary: (params?: { period?: string }) => {
    const query = params
      ? `?${new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== "") as [string, string][]
      ).toString()}`
      : "";
    return get<{
      period: string;
      engagement_rate: number | null;
      total_impressions: number;
      total_reach: number;
      total_likes: number;
      total_comments: number;
      total_shares: number;
      total_posts: number;
      top_performing_post: {
        id: string;
        name: string;
        platform: string;
        impressions: number;
        reach: number;
        likes: number;
        comments: number;
        shares: number;
        engagement_rate: number;
        posted_at: string;
      } | null;
      platform_breakdown: Record<string, {
        posts: number;
        impressions: number;
        reach: number;
        likes: number;
        comments: number;
      }>;
    }>(`/api/tenant/analytics/performance${query}`);
  },

  // Templates CRUD endpoints
  templates: () =>
    get<{
      templates: Array<{
        id: string;
        name: string;
        category: string;
        description?: string;
        body: string;
        platforms: string[];
        uses?: number;
        created_at: string;
        updated_at: string;
      }>;
    }>("/api/tenant/templates"),

  template: (templateId: string) =>
    get<{
      template: {
        id: string;
        name: string;
        category: string;
        description?: string;
        body: string;
        platforms: string[];
        uses?: number;
        created_at: string;
        updated_at: string;
      };
    }>(`/api/tenant/templates/${templateId}`),

  createTemplate: (payload: {
    name: string;
    category: string;
    description?: string;
    body: string;
    platforms: string[];
  }) =>
    post<typeof payload, {
      template: {
        id: string;
        name: string;
        category: string;
        description?: string;
        body: string;
        platforms: string[];
        created_at: string;
        updated_at: string;
      };
    }>("/api/tenant/templates", payload),

  updateTemplate: (templateId: string, payload: {
    name?: string;
    category?: string;
    description?: string;
    body?: string;
    platforms?: string[];
  }) =>
    put<typeof payload, {
      template: {
        id: string;
        name: string;
        category: string;
        description?: string;
        body: string;
        platforms: string[];
        updated_at: string;
      };
    }>(`/api/tenant/templates/${templateId}`, payload),

  deleteTemplate: (templateId: string) =>
    del<{ success: boolean }>(`/api/tenant/templates/${templateId}`),



  // Team management endpoints (some return 501 Not Implemented)
  teamMembers: () =>
    get<{
      members: Array<{
        id: string;
        name: string;
        email: string;
        role: string;
        status?: string;
        joined_at?: string;
      }>;
      coming_soon?: boolean;
    }>("/api/tenant/team/members"),

  teamMember: (memberId: string) =>
    get<{
      member: {
        id: string;
        name: string;
        email: string;
        role: string;
        status?: string;
        joined_at?: string;
      };
    }>(`/api/tenant/team/members/${memberId}`),

  inviteTeamMember: (payload: { email: string; role: string }) =>
    post<typeof payload, { invitation_id?: string; success?: boolean; message?: string }>(
      "/api/tenant/team/invite",
      payload
    ),

  updateTeamMember: (memberId: string, payload: { role?: string; status?: string }) =>
    put<typeof payload, { success?: boolean; message?: string }>(
      `/api/tenant/team/members/${memberId}`,
      payload
    ),

  deleteTeamMember: (memberId: string) =>
    del<{ success?: boolean; message?: string }>(`/api/tenant/team/members/${memberId}`),

  teamRoles: () =>
    get<{ roles: Array<{ id: string; name: string; description?: string }> }>(`/api/tenant/team/roles`),

  teamInvitations: () =>
    get<{ invitations: Array<{ id: string; email: string; role: string; sent_at: string }> }>(`/api/tenant/team/invitations`),

  revokeInvitation: (invitationId: string) =>
    del<{ success?: boolean }>(`/api/tenant/team/invitations/${invitationId}`),

  apiKeys: () =>
    get<{
      keys: Array<{
        id: string;
        name: string;
        scope: string;
        created_at: string;
      }>;
    }>("/api/tenant/api-keys"),

  createApiKey: (payload: { name: string; scope: string }) =>
    post<typeof payload, { id: string; token: string }>("/api/tenant/api-keys", payload),

  revokeApiKey: (keyId: string) => del<{ success: boolean }>(`/api/tenant/api-keys/${keyId}`),

  updateWebhook: (payload: { url: string }) =>
    patch<typeof payload, { success: boolean }>("/api/tenant/webhooks", payload),

  refreshSocialAccounts: () =>
    post<undefined, { success: boolean }>("/api/tenant/social-accounts/refresh"),

  billing: () =>
    get<{
      plan: {
        type: string;
        name: string;
        price: number;
        currency: string;
        billing_period: string;
        features: string[];
      };
      trial: {
        is_trial: boolean;
        days_remaining: number;
        ends_at: string | null;
      };
      subscription: {
        status: 'trial' | 'active' | 'paused' | 'cancelled' | 'suspended';
        expires_at: string | null;
        last_payment?: {
          amount: number;
          currency: string;
          date: string;
        };
      };
    }>("/api/tenant/billing"),

  usage: () =>
    get<{
      conversations: { used: number; limit: number };
      active_seats: { used: number; limit: number };
    }>("/api/tenant/usage"),

  escalationSettings: () =>
    get<{
      enabled: boolean;
      escalation_behavior: "always_on" | "configurable" | "advanced";
      is_configurable: boolean;
    }>("/api/tenant/settings/escalation"),

  updateEscalationSettings: (payload: { enabled: boolean }) =>
    put<typeof payload, { success: boolean; enabled: boolean }>(
      "/api/tenant/settings/escalation",
      payload
    ),

  // Integrations endpoints
  integrations: () =>
    get<{
      integrations: Array<{
        id: string;
        platform: string;
        connected: boolean;
        username?: string;
        page_name?: string;
        instagram_handle?: string;
        external_id?: string;
        page_id?: string;
        mode?: string;
        expires_at?: string;
        created_at: string;
        updated_at: string;
      }>;
    }>("/api/tenant/integrations"),

  integration: (platform: string) =>
    get<{
      integration: {
        id: string;
        platform: string;
        connected: boolean;
        username?: string;
        page_name?: string;
        instagram_handle?: string;
        external_id?: string;
        page_id?: string;
        mode?: string;
        expires_at?: string;
        created_at: string;
        updated_at: string;
      };
    }>(`/api/tenant/integrations/${platform}`),

  verifyIntegration: (platform: string) =>
    post<undefined, { success: boolean; message?: string }>(`/api/tenant/integrations/${platform}/verify`),

  disconnectIntegration: (platform: string) =>
    del<{ success: boolean }>(`/api/tenant/integrations/${platform}`),

  repairIntegration: (platform: string) =>
    post<undefined, { success: boolean; message?: string }>(`/api/tenant/integrations/${platform}/repair`),

  // Scheduled posts endpoints
  scheduledPosts: (params?: { status?: string; page?: number; limit?: number }) => {
    const query = params
      ? `?${new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== "") as [string, string][]
      ).toString()}`
      : "";
    return get<{
      data: Array<{
        id: string;
        name: string;
        caption: string;
        status: "scheduled" | "posting" | "posted" | "failed" | "partial_failed" | "draft" | "cancelled";
        scheduled_at: string | null;
        platforms: string[];
        media_asset_ids: string[];
        attempts: number;
        last_error?: string;
        created_at: string;
        posted_at?: string | null;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
      };
      // Backward compatibility: also support old format with scheduled_posts array
      scheduled_posts?: Array<{
        id: string;
        name: string;
        caption: string;
        status: "scheduled" | "posting" | "posted" | "failed" | "partial_failed" | "draft" | "cancelled";
        scheduled_at: string | null;
        platforms: string[];
        media_asset_ids: string[];
        attempts: number;
        last_error?: string;
        created_at: string;
        posted_at?: string | null;
      }>;
    }>(`/api/tenant/scheduled-posts${query}`);
  },

  scheduledPost: (postId: string) =>
    get<{
      post: {
        id: string;
        name: string;
        caption: string;
        status: "scheduled" | "posting" | "posted" | "failed" | "cancelled";
        scheduled_at: string;
        platforms: string[];
        media_asset_ids: string[];
        attempts: number;
        last_error?: string;
        created_at: string;
        posted_at?: string;
      };
    }>(`/api/tenant/scheduled-posts/${postId}`),

  updateScheduledPost: (
    postId: string,
    payload: {
      caption?: string;
      scheduled_at?: string;
      platforms?: string[];
    }
  ) =>
    put<typeof payload, { success: boolean; post: Record<string, unknown> }>(
      `/api/tenant/scheduled-posts/${postId}`,
      payload
    ),

  cancelScheduledPost: (postId: string) =>
    del<{ success: boolean }>(`/api/tenant/scheduled-posts/${postId}`),

  // Calendar endpoints (Phase 2)
  calendar: (params?: { start_date?: string; end_date?: string; platform?: string }) => {
    const query = params
      ? `?${new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== "") as [string, string][]
      ).toString()}`
      : "";
    return get<{
      entries: Array<{
        id: string;
        date: string;
        time?: string | null;
        name: string;
        platforms: string[];
        status: string;
        media_count?: number;
      }>;
    }>(`/api/tenant/calendar${query}`);
  },

  // Media Library endpoints (Phase 2)
  mediaList: (params?: { type?: string; tag?: string; campaign?: string; q?: string; limit?: number }) => {
    const query = params
      ? `?${new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== "") as [string, string][]
      ).toString()}`
      : "";
    return get<{
      items: Array<{
        id: number;
        type: "image" | "video" | "carousel";
        name: string;
        carousel_name?: string | null;
        caption?: string | null;
        urls: string[];
        status: string;
        scheduled_at?: string | null;
        platforms: string[];
        tags: string[];
        campaign?: string | null;
        created_at: string;
        updated_at: string;
      }>;
      count: number;
    }>(`/api/tenant/media${query}`);
  },

  mediaUpload: (form: FormData) =>
    apiFetch<{ success: boolean; assets: Array<Record<string, unknown>> }>(`/api/tenant/media`, {
      method: "POST",
      body: form,
    }),

  mediaDelete: (assetId: string) => del<{ success: boolean }>(`/api/tenant/media/${assetId}`),

  mediaUpdate: (assetId: string, payload: { tags?: string[]; caption?: string; campaign?: string | null }) =>
    put<typeof payload, { success: boolean }>(`/api/tenant/media/${assetId}`, payload),

  // Post Creation (Phase 2)
  createPost: (payload: {
    name?: string;
    caption?: string;
    media_ids: (number | string)[]; // Array of media asset IDs
    platforms: string[]; // Required: At least one platform
    scheduled_at?: string | null; // "now", RFC3339 date, or null for immediate publishing
    enhance_caption?: boolean; // If true, AI enhances the caption; if false or omitted, uses caption as-is
    // TikTok-specific options
    tiktok_disable_duet?: boolean;
    tiktok_disable_stitch?: boolean;
    tiktok_disable_comment?: boolean;
    tiktok_schedule_time?: string; // RFC3339 format, TikTok-specific schedule
  }) => post<typeof payload, {
    id: string;
    status: "scheduled" | "posting" | "posted" | "failed";
    publishing_now?: boolean;
  }>(`/api/tenant/posts`, payload),

  publishPost: (postId: number | string) =>
    post<undefined, {
      success: boolean;
      message?: string;
      post_id: string;
      status: string;
    }>(`/api/tenant/posts/${postId}/publish`),

  generateCaption: (payload: {
    media_ids: (number | string)[]; // Array of media asset IDs
    tone?: string;
    include_hashtags?: boolean;
  }) => post<typeof payload, { caption: string }>(`/api/tenant/posts/generate-caption`, payload),

  // Caption generation and enhancement endpoints
  generateCaptionFromMedia: (payload: {
    media_asset_id: number | string;
    platform: string;
    media_type: string;
    image_urls?: string[];
  }) => post<typeof payload, { caption: string }>(`/api/tenant/posts/generate-caption`, payload),

  generateCaptionFromKeywords: (payload: {
    keywords: string;
    platform: string;
    media_type: string;
    image_urls?: string[];
  }) => post<typeof payload, { caption: string }>(`/api/tenant/captions/generate-from-keywords`, payload),

  rephraseCaption: (payload: {
    original_caption: string;
    platform: string;
    media_type: string;
    image_urls?: string[];
  }) => post<typeof payload, { caption: string }>(`/api/tenant/captions/rephrase`, payload),

  fineTuneCaption: (payload: {
    original_caption: string;
    platform: string;
    media_type: string;
    image_urls?: string[];
  }) => post<typeof payload, { caption: string }>(`/api/tenant/captions/fine-tune`, payload),

  optimalTimes: (params: { platforms: string[]; date: string }) =>
    get<{ times: Array<{ at: string; score: number }> }>(
      `/api/tenant/posts/optimal-times?${new URLSearchParams({
        date: params.date,
        platforms: params.platforms.join(","),
      }).toString()}`
    ),

  // Bulk Uploads (Phase 3)
  bulkUploads: () =>
    get<{
      sessions: Array<{
        id: string;
        status: "pending" | "processing" | "completed" | "failed" | "cancelled";
        split_strategy?: string;
        schedule_strategy?: string;
        items_count?: number;
        created_at: string;
      }>;
    }>(`/api/tenant/bulk-uploads`),

  bulkUpload: (id: string) =>
    get<{
      session: {
        id: string;
        status: string;
        split_strategy?: string;
        schedule_strategy?: string;
        items_count?: number;
        created_at: string;
      };
      items: Array<{
        id: string;
        media_asset_id: string;
        caption?: string;
        status: string;
      }>;
    }>(`/api/tenant/bulk-uploads/${id}`),

  createBulkUpload: (form: FormData) =>
    apiFetch<{ session_id: string }>(`/api/tenant/bulk-uploads`, { method: "POST", body: form }),

  updateBulkUpload: (id: string, payload: { split_strategy?: string; schedule_strategy?: string }) =>
    put<typeof payload, { success: boolean }>(`/api/tenant/bulk-uploads/${id}`, payload),

  cancelBulkUpload: (id: string) => del<{ success: boolean }>(`/api/tenant/bulk-uploads/${id}`),

  // WhatsApp phone number endpoints
  whatsappNumbers: () =>
    get<{
      available_numbers: Array<{
        id: string;
        phone_number_id: string;
        phone_number: string;
        verified_name?: string;
        status?: "available" | "assigned" | "suspended";
        quality_rating?: "green" | "yellow" | "red" | "high" | "medium" | "low";
      }>;
      current?: {
        id: string;
        phone_number_id: string;
        phone_number: string;
        verified_name?: string;
        quality_rating?: "green" | "yellow" | "red" | "high" | "medium" | "low";
        assigned_at?: string;
      };
    }>("/api/tenant/whatsapp/numbers"),

  whatsappCurrent: () =>
    get<{
      assigned: boolean;
      phone_number?: string;
      phone_number_id?: string;
      verified_name?: string;
      quality_rating?: "green" | "yellow" | "red" | "high" | "medium" | "low";
      assigned_at?: string;
    }>("/api/tenant/whatsapp/current"),

  assignWhatsAppNumber: (phoneNumberId: string) =>
    post<undefined, { success: boolean; phone_number: string }>(
      `/api/tenant/whatsapp/numbers/${phoneNumberId}/assign`
    ),

  disconnectWhatsApp: () =>
    post<undefined, { success: boolean }>("/api/tenant/whatsapp/disconnect"),

  requestWhatsAppNumber: (payload: { phone_number: string; code_method: "SMS" | "VOICE" }) =>
    post<typeof payload, { request_id: number }>("/api/tenant/whatsapp/request-number", payload),

  verifyWhatsAppNumber: (payload: { request_id: number; verification_code: string }) =>
    post<typeof payload, { success: boolean; message: string }>("/api/tenant/whatsapp/verify-number", payload),

  checkWhatsAppNumber: (payload: { phone_number: string }) =>
    post<typeof payload, { ready: boolean; message?: string }>("/api/tenant/whatsapp/check-number", payload),

  connectWhatsApp: (payload: { provider?: "meta_embedded" | "gupshup" | "respondio" | "auto"; phone_number?: string; channel_id?: string }) =>
    post<typeof payload, {
      success: boolean;
      provider: string;
      onboarding_url?: string;
      message: string;
      note?: string;
      app_id?: string; // For Gupshup
      phone_number?: string; // For instant connections
    }>("/api/tenant/whatsapp/connect", payload),

  whatsappConnectionStatus: () =>
    get<{
      connected: boolean;
      provider?: "meta_embedded" | "respondio" | "gupshup_partner" | "none";
      phone_number?: string;
      phone_number_id?: string;
      external_id?: string; // For meta_embedded
      status?: "connected" | "not_connected" | "pending_onboarding" | "pending_verification" | "failed" | "live";
      message?: string;
      channel_id?: string; // For respondio
      app_id?: string; // For gupshup_partner
    }>("/api/tenant/whatsapp/connection-status"),

  whatsappRefresh: () =>
    post<undefined, {
      success: boolean;
      data?: {
        status?: "live" | "pending_onboarding" | "pending_verification" | "failed";
        waba_id?: string;
        phone_number?: string;
        business_id?: string;
        phone_number_id?: string;
        subscription_id?: string;
      };
      status?: "live" | "pending_onboarding" | "pending_verification" | "failed"; // Fallback for top-level status
      phone_number?: string; // Fallback for top-level phone_number
      message?: string;
    }>("/api/tenant/whatsapp/refresh"),

  whatsappRefreshStatus: () =>
    post<undefined, {
      connected: boolean;
      provider?: "meta_embedded" | "respondio" | "gupshup_partner" | "none";
      phone_number?: string;
      phone_number_id?: string;
      external_id?: string;
      status?: "connected" | "not_connected" | "pending_onboarding" | "pending_verification" | "live" | "failed";
      message?: string;
      channel_id?: string;
      app_id?: string;
      updated: boolean; // Indicates if status was updated
    }>("/api/tenant/whatsapp/refresh-status"),

  // WhatsApp profile picture endpoints
  whatsappProfilePicture: () =>
    get<{
      success: true;
      photo_url: string;
      message: string;
    }>("/api/tenant/whatsapp/profile/picture"),

  updateWhatsAppProfilePicture: (file: File) =>
    apiFetch<{
      success: true;
      message: string;
    }>(`/api/tenant/whatsapp/profile/picture`, {
      method: "PUT",
      body: (() => {
        const formData = new FormData();
        formData.append('image', file);
        return formData;
      })(),
    }),

  // WhatsApp profile endpoints
  whatsappProfile: () =>
    get<{
      success: true;
      profile: {
        address: string;
        profileEmail: string;
        desc: string;
        vertical: string;
        website1: string;
        website2: string;
      };
      message: string;
    }>("/api/tenant/whatsapp/profile"),

  updateWhatsAppProfile: (updates: {
    add_line1?: string;
    add_line2?: string;
    city?: string;
    state?: string;
    pin_code?: string;
    country?: string;
    vertical?: "OTHER" | "AUTO" | "BEAUTY" | "APPAREL" | "EDU" | "ENTERTAIN" | "EVENT_PLAN" | "FINANCE" | "GROCERY" | "GOVT" | "HOTEL" | "HEALTH" | "NONPROFIT" | "PROF_SERVICES" | "RETAIL" | "TRAVEL" | "RESTAURANT";
    website1?: string;
    website2?: string;
    desc?: string;
    profile_email?: string;
  }) =>
    put<typeof updates, {
      success: true;
      profile: {
        address: string;
        profileEmail: string;
        desc: string;
        vertical: string;
        website1: string;
        website2: string;
      };
      message: string;
    }>("/api/tenant/whatsapp/profile", updates),

  whatsappProfileAbout: () =>
    get<{
      success: true;
      about: string;
      message: string;
    }>("/api/tenant/whatsapp/profile/about"),

  updateWhatsAppProfileAbout: (about: string) =>
    put<{ about: string }, {
      success: true;
      about: string;
      message: string;
    }>("/api/tenant/whatsapp/profile/about", { about }),

  // WhatsApp profile sync endpoints
  previewWhatsAppProfileSync: () =>
    get<{
      success: boolean;
      preview: {
        fields: Array<{
          name: string;
          brancr_value: string;
          whatsapp_value?: string;
          will_change: boolean;
        }>;
        summary: string;
      };
      message: string;
    }>("/api/tenant/whatsapp/profile/sync/preview"),

  syncBrancrToWhatsApp: () =>
    post<never, {
      success: boolean;
      profile: any;
      message: string;
    }>("/api/tenant/whatsapp/profile/sync"),

  // Onboarding endpoints
  onboardingStatus: () =>
    get<{
      step: "industry" | "business_profile" | "persona" | "business_details" | "social_connect" | "complete";
      complete: boolean;
      tenant_name?: string;
      business_profile?: {
        id: number;
        name: string;
        industry: string;
        description: string;
        location: string;
        website?: string;
        operating_hours?: string;
      };
      persona?: {
        tenant_id: number;
        bot_name: string;
        tone: string;
        language: string;
        humor?: boolean;
        style_notes?: string;
      };
      business_details?: {
        menu_items?: Array<{
          id?: number;
          name: string;
          category: string;
          price: string;
          description: string;
        }>;
        faqs?: Array<{
          id?: number;
          question: string;
          answer: string;
        }>;
        keywords?: string;
        knowledge_base?: string;
      };
      has_telegram_bot?: boolean;
    }>("/api/tenant/onboarding/status"),

  onboardingBusinessProfile: (payload: {
    name: string;
    industry: string;
    description: string;
    location: string;
    website?: string;
    operating_hours?: string;
  }) =>
    post<typeof payload, { success: boolean; message: string; next_step: string }>(
      "/api/tenant/onboarding/business-profile",
      payload
    ),

  onboardingPersona: (payload: {
    bot_name: string;
    tone: string;
    language: string;
    humor?: boolean;
    style_notes?: string;
  }) =>
    post<typeof payload, { success: boolean; message: string; next_step: string }>(
      "/api/tenant/onboarding/persona",
      payload
    ),

  onboardingBusinessDetails: (payload: {
    menu_items?: Array<{ name: string; category: string; price: string; description: string }>;
    faqs?: Array<{ question: string; answer: string }>;
    keywords?: string;
    knowledge_base?: string;
  }) =>
    post<typeof payload, { success: boolean; message: string; next_step: string }>(
      "/api/tenant/onboarding/business-details",
      payload
    ),

  onboardingComplete: () =>
    post<undefined, { success: boolean; message: string; redirect_to?: string }>(
      "/api/tenant/onboarding/complete"
    ),

  // Settings endpoints
  updateBusinessProfile: (payload: {
    name: string;
    industry: string;
    description: string;
    location: string;
    website?: string;
    operating_hours?: string;
  }) =>
    put<typeof payload, { success: boolean; message?: string }>(
      "/api/tenant/settings/business-profile",
      payload
    ),

  updatePersona: (payload: {
    bot_name: string;
    tone: string;
    language: string;
    humor?: boolean;
    style_notes?: string;
  }) =>
    put<typeof payload, { success: boolean; message?: string }>(
      "/api/tenant/settings/persona",
      payload
    ),

  // Drafts API (autosave/restore)
  createDraft: (payload: { key: string; content: unknown; metadata?: unknown; owner_id?: number }) =>
    post<typeof payload, { id: string; key: string; content: unknown; metadata?: unknown; owner_id?: number; created_at: string; updated_at: string }>(
      "/api/tenant/drafts",
      payload
    ),

  updateDraft: (id: string, payload: { content: unknown; metadata?: unknown }) =>
    put<typeof payload, { id: string; key: string; content: unknown; metadata?: unknown; owner_id?: number; created_at: string; updated_at: string }>(
      `/api/tenant/drafts/${id}`,
      payload
    ),

  getDrafts: (key?: string) =>
    get<{ drafts: Array<{ id: string; key: string; content: unknown; metadata?: unknown; owner_id?: number; created_at: string; updated_at: string }> }>(
      `/api/tenant/drafts${key ? `?key=${encodeURIComponent(key)}` : ""}`
    ),

  getDraft: (id: string) =>
    get<{ id: string; key: string; content: unknown; metadata?: unknown; owner_id?: number; created_at: string; updated_at: string }>(
      `/api/tenant/drafts/${id}`
    ),

  deleteDraft: (id: string) =>
    del<undefined>(`/api/tenant/drafts/${id}`),

  // AI Mode endpoints
  getAIMode: async () => {
    // Some backend deployments do not expose a GET /tenant/settings/ai-mode (only PUT is implemented).
    // To avoid noisy 405 responses in environments where the GET route is not available,
    // optionally skip the GET entirely unless the runtime opt-in flag is set.
    const doGet = process.env.NEXT_PUBLIC_SUPPORTS_AIMODE_GET === 'true';
    if (!doGet) {
      // Default to 'ai' when no server-side GET is available. Consumers should call `updateAIMode`
      // to change mode; this avoids unnecessary 405 logs and keeps the UI functional.
      return { mode: 'ai', updated_at: undefined, updated_by: undefined } as { mode: 'ai' | 'human'; updated_at?: string; updated_by?: string };
    }

    try {
      return await get<{ mode: 'ai' | 'human'; updated_at?: string; updated_by?: string }>(
        '/api/tenant/settings/ai-mode'
      );
    } catch (err) {
      // If the backend doesn't support ai-mode (405) or the call is not allowed,
      // gracefully fall back to a default to avoid breaking the client UI.
      // This keeps the app functional in environments where this feature isn't enabled.
      if (err && typeof err === 'object' && (err as any).status === 405) {
        // Log to observability for backend follow-up
        try {
          const { captureException } = await import('./observability');
          captureException(new Error('AI mode endpoint 405'), { action: 'getAIMode', status: 405 });
        } catch { }
        // Return a shape compatible with callers that may access updated_at/updated_by
        return { mode: 'ai', updated_at: undefined, updated_by: undefined } as { mode: 'ai' | 'human'; updated_at?: string; updated_by?: string };
      }
      throw err;
    }
  },
  updateAIMode: (mode: 'ai' | 'human') =>
    put<{ mode: 'ai' | 'human' }, { success: boolean; mode: 'ai' | 'human'; updated_at?: string; updated_by?: string }>(
      '/api/tenant/settings/ai-mode',
      { mode }
    ),



  updateBusinessDetails: (payload: {
    menu_items?: Array<{
      id?: number; // Include ID if updating existing, omit for new
      name: string;
      category: string;
      price: string;
      description: string;
    }>;
    faqs?: Array<{
      id?: number; // Include ID if updating existing, omit for new
      question: string;
      answer: string;
    }>;
    keywords?: string;
    knowledge_base?: string;
  }) =>
    put<typeof payload, { success: boolean; message?: string }>(
      "/api/tenant/settings/business-details",
      payload
    ),

  // Escalations endpoints
  escalations: (params?: { priority?: "low" | "normal" | "high" | "urgent" | "critical"; limit?: number }) => {
    const query = params
      ? `?${new URLSearchParams(
        Object.entries(params)
          .filter(([_, v]) => v !== undefined && v !== null)
          .map(([k, v]) => [k, String(v)] as [string, string])
      ).toString()}`
      : "";
    return get<{
      escalations: Array<{
        id: string;
        interaction_id: string;
        customer_id: string;
        customer_name: string;
        customer_username?: string;
        platform: string;
        message: string;
        intent: string;
        tone: string;
        confidence: number;
        suggested_reply: string;
        created_at: string;
        conversation_id: string;
        priority: "low" | "normal" | "high" | "urgent" | "critical";
      }>;
      count: number;
    }>(`/api/tenant/escalations${query}`);
  },

  escalation: (escalationId: string | number) =>
    get<{
      escalation: {
        id: string;
        interaction_id: string;
        customer_id: string;
        customer_name: string;
        customer_username?: string;
        platform: string;
        message: string;
        intent: string;
        tone: string;
        confidence: number;
        suggested_reply: string;
        created_at: string;
        conversation_id: string;
        priority: "low" | "normal" | "high" | "urgent" | "critical";
      };
      customer: {
        id: string;
        name: string;
        username?: string;
        platform: string;
      };
      conversation_history: Array<{
        id: string;
        author: "tenant" | "customer";
        body: string;
        sent_at: string;
      }>;
      interactions: Array<{
        id: string;
        type: string;
        created_at: string;
      }>;
    }>(`/api/tenant/escalations/${escalationId}`),

  approveEscalationReply: (escalationId: string | number) =>
    post<undefined, { success: boolean; message?: string }>(`/api/tenant/escalations/${escalationId}/approve`),

  sendEscalationReply: (escalationId: string | number, payload: { reply: string }, edit?: boolean) => {
    const query = edit ? "?edit=true" : "";
    return post<typeof payload, { success: boolean; message?: string }>(
      `/api/tenant/escalations/${escalationId}/reply${query}`,
      payload
    );
  },

  ignoreEscalation: (escalationId: string | number) =>
    post<undefined, { success: boolean; message?: string }>(`/api/tenant/escalations/${escalationId}/ignore`),

  resolveEscalation: (escalationId: string | number) =>
    post<undefined, { success: boolean; message?: string }>(`/api/tenant/escalations/${escalationId}/resolve`),

  escalationStats: (params?: { start_date?: string; end_date?: string }) => {
    const query = params
      ? `?${new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== "") as [string, string][]
      ).toString()}`
      : "";
    return get<{
      total: number;
      pending: number;
      resolved: number;
      avg_response_time: string;
    }>(`/api/tenant/escalations/stats${query}`);
  },

  // TikTok API endpoints
  tiktokVideos: (params?: { max_count?: number; cursor?: string }) => {
    const query = params
      ? `?${new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== "") as [string, string][]
      ).toString()}`
      : "";
    return get<{
      videos: Array<{
        video_id: string;
        title?: string;
        description?: string;
        cover_image_url?: string;
        duration?: number;
        create_time?: number;
        publish_time?: number;
        status?: string;
        statistics?: {
          view_count?: number;
          like_count?: number;
          comment_count?: number;
          share_count?: number;
        };
      }>;
      cursor?: string;
      has_more?: boolean;
    }>(`/api/tenant/tiktok/videos${query}`);
  },

  tiktokVideo: (videoId: string) =>
    get<{
      video_id: string;
      title?: string;
      description?: string;
      cover_image_url?: string;
      duration?: number;
      create_time?: number;
      publish_time?: number;
      status?: string;
      statistics?: {
        view_count?: number;
        like_count?: number;
        comment_count?: number;
        share_count?: number;
      };
      video_url?: string;
      embed_html?: string;
    }>(`/api/tenant/tiktok/videos/${videoId}`),

  tiktokVideoStatus: (publishId: string) =>
    get<{
      publish_id: string;
      status: "processing" | "published" | "failed";
      video_id?: string;
      failure_reason?: string;
    }>(`/api/tenant/tiktok/videos/status/${publishId}`),

  deleteTiktokVideo: (videoId: string) =>
    apiFetch<{ success: boolean; message?: string }>(`/api/tenant/tiktok/videos/${videoId}`, {
      method: "DELETE",
    }),

  tiktokVideoAnalytics: (videoId: string) =>
    get<{
      video_id: string;
      analytics: {
        views?: number;
        likes?: number;
        comments?: number;
        shares?: number;
        play_time?: number;
        average_watch_time?: number;
        traffic_source?: Array<{
          source: string;
          count: number;
        }>;
        audience_territory?: Array<{
          territory: string;
          count: number;
        }>;
      };
      period?: {
        start_date: string;
        end_date: string;
      };
    }>(`/api/tenant/tiktok/videos/${videoId}/analytics`),

  tiktokAnalytics: (params?: { start_date?: string; end_date?: string }) => {
    const query = params
      ? `?${new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== "") as [string, string][]
      ).toString()}`
      : "";
    return get<{
      total_views: number;
      total_likes: number;
      total_comments: number;
      total_shares: number;
      total_videos: number;
      average_engagement_rate?: number;
      period: {
        start_date: string;
        end_date: string;
      };
      top_videos?: Array<{
        video_id: string;
        title?: string;
        views: number;
        likes: number;
        comments: number;
        shares: number;
      }>;
    }>(`/api/tenant/tiktok/analytics${query}`);
  },

  tiktokComments: (videoId: string, params?: { max_count?: number; cursor?: string }) => {
    const query = params
      ? `?${new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== "") as [string, string][]
      ).toString()}`
      : "";
    return get<{
      comments: Array<{
        comment_id: string;
        video_id: string;
        text: string;
        user: {
          user_id: string;
          username?: string;
          display_name?: string;
          avatar_url?: string;
        };
        like_count?: number;
        reply_count?: number;
        create_time: number;
        is_pinned?: boolean;
        is_author_replied?: boolean;
      }>;
      cursor?: string;
      has_more?: boolean;
    }>(`/api/tenant/tiktok/videos/${videoId}/comments${query}`);
  },

  replyToTiktokComment: (videoId: string, commentId: string, payload: { text: string }) =>
    post<typeof payload, {
      success: boolean;
      message?: string;
      reply?: {
        comment_id: string;
        video_id: string;
        text: string;
        create_time: number;
      };
    }>(`/api/tenant/tiktok/videos/${videoId}/comments/${commentId}/reply`, payload),

  // Industry management endpoints
  getIndustries: () =>
    get<{
      industries: Array<{
        id: string;
        name: string;
        category: string;
        description: string;
        has_products: boolean;
        has_menu: boolean;
        has_services: boolean;
      }>;
    }>("/api/tenant/industries"),

  getTenantIndustry: () =>
    get<{
      industry_id: string;
      industry_name: string;
      capabilities: {
        has_products: boolean;
        has_menu: boolean;
        has_services: boolean;
      };
    }>("/api/tenant/industry"),

  setTenantIndustry: (payload: { industry_id: string }) =>
    post<typeof payload, {
      success: boolean;
      industry: {
        id: string;
        name: string;
        category: string;
        description: string;
        has_products: boolean;
        has_menu: boolean;
        has_services: boolean;
      };
    }>("/api/tenant/industry", payload),

  // Product management endpoints (E-commerce)
  products: (params?: { category?: string; search?: string; limit?: number }) => {
    const query = params
      ? `?${new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== "") as [string, string][]
      ).toString()}`
      : "";
    return get<{
      products: Array<{
        id: string;
        name: string;
        description?: string;
        price: number;
        currency: string;
        category?: string;
        stock_count?: number;
        availability: "in_stock" | "out_of_stock" | "low_stock";
        is_active: boolean;
        variants?: Record<string, string[]>;
        tags?: string[];
        images?: string[];
        created_at: string;
        updated_at: string;
      }>;
    }>(`/api/tenant/products${query}`);
  },

  createProduct: (payload: {
    name: string;
    description?: string;
    price: number;
    currency?: string;
    category?: string;
    stock_count?: number;
    variants?: Record<string, string[]>;
    tags?: string[];
    images?: string[];
  }) =>
    post<typeof payload, {
      success: boolean;
      product: {
        id: string;
        name: string;
        description?: string;
        price: number;
        currency: string;
        category?: string;
        stock_count?: number;
        availability: "in_stock" | "out_of_stock" | "low_stock";
        is_active: boolean;
        variants?: Record<string, string[]>;
        tags?: string[];
        images?: string[];
        created_at: string;
        updated_at: string;
      };
    }>("/api/tenant/products", payload),

  updateProduct: (productId: string | number, payload: {
    name?: string;
    description?: string;
    price?: number;
    currency?: string;
    category?: string;
    stock_count?: number;
    availability?: "in_stock" | "out_of_stock" | "low_stock";
    is_active?: boolean;
    variants?: Record<string, string[]>;
    tags?: string[];
    images?: string[];
  }) =>
    put<typeof payload, {
      success: boolean;
      product: {
        id: string;
        name: string;
        description?: string;
        price: number;
        currency: string;
        category?: string;
        stock_count?: number;
        availability: "in_stock" | "out_of_stock" | "low_stock";
        is_active: boolean;
        variants?: Record<string, string[]>;
        tags?: string[];
        images?: string[];
        created_at: string;
        updated_at: string;
      };
    }>(`/api/tenant/products/${productId}`, payload),

  deleteProduct: (productId: string | number) =>
    del<{ success: boolean; message?: string }>(`/api/tenant/products/${productId}`),

  // Menu item management endpoints (Restaurants)
  menuItems: (params?: { category?: string; search?: string; limit?: number }) => {
    const query = params
      ? `?${new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== "") as [string, string][]
      ).toString()}`
      : "";
    return get<{
      menu_items: Array<{
        id: string;
        name: string;
        description?: string;
        price: number;
        currency: string;
        category?: string;
        preparation_time?: number;
        dietary_info?: string[];
        spice_level?: "mild" | "medium" | "hot" | "very_hot";
        availability: "available" | "unavailable" | "limited";
        is_active: boolean;
        images?: string[];
        created_at: string;
        updated_at: string;
      }>;
    }>(`/api/tenant/menu-items${query}`);
  },

  createMenuItem: (payload: {
    name: string;
    description?: string;
    price: number;
    currency?: string;
    category?: string;
    preparation_time?: number;
    dietary_info?: string[];
    spice_level?: "mild" | "medium" | "hot" | "very_hot";
    images?: string[];
  }) =>
    post<typeof payload, {
      success: boolean;
      menu_item: {
        id: string;
        name: string;
        description?: string;
        price: number;
        currency: string;
        category?: string;
        preparation_time?: number;
        dietary_info?: string[];
        spice_level?: "mild" | "medium" | "hot" | "very_hot";
        availability: "available" | "unavailable" | "limited";
        is_active: boolean;
        images?: string[];
        created_at: string;
        updated_at: string;
      };
    }>("/api/tenant/menu-items", payload),

  updateMenuItem: (menuItemId: string | number, payload: {
    name?: string;
    description?: string;
    price?: number;
    currency?: string;
    category?: string;
    preparation_time?: number;
    dietary_info?: string[];
    spice_level?: "mild" | "medium" | "hot" | "very_hot";
    availability?: "available" | "unavailable" | "limited";
    is_active?: boolean;
    images?: string[];
  }) =>
    put<typeof payload, {
      success: boolean;
      menu_item: {
        id: string;
        name: string;
        description?: string;
        price: number;
        currency: string;
        category?: string;
        preparation_time?: number;
        dietary_info?: string[];
        spice_level?: "mild" | "medium" | "hot" | "very_hot";
        availability: "available" | "unavailable" | "limited";
        is_active: boolean;
        images?: string[];
        created_at: string;
        updated_at: string;
      };
    }>(`/api/tenant/menu-items/${menuItemId}`, payload),

  deleteMenuItem: (menuItemId: string | number) =>
    del<{ success: boolean; message?: string }>(`/api/tenant/menu-items/${menuItemId}`),

  parseMenuText: (payload: { text: string; default_currency?: string }) =>
    post<typeof payload, {
      success: boolean;
      parsed_count: number;
      items: Array<{
        name: string;
        description?: string;
        price: number;
        currency: string;
        category?: string;
        dietary_info?: string[];
        spice_level?: string;
      }>;
      errors: string[];
    }>("/api/tenant/menu-items/parse-text", payload),

  parseMenuFile: (formData: FormData) =>
    post<FormData, {
      success: boolean;
      parsed_count: number;
      items: Array<{
        name: string;
        description?: string;
        price: number;
        currency: string;
        category?: string;
        dietary_info?: string[];
        spice_level?: string;
      }>;
      errors: string[];
      file_name: string;
      file_type: string;
    }>("/api/tenant/menu-items/parse-file", formData),

  // Service management endpoints (Consultants/Agencies)
  services: (params?: { category?: string; search?: string; limit?: number }) => {
    const query = params
      ? `?${new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== "") as [string, string][]
      ).toString()}`
      : "";
    return get<{
      services: Array<{
        id: string;
        name: string;
        description?: string;
        pricing: {
          type: "hourly" | "fixed" | "package";
          rate?: number;
        };
        packages?: Array<{
          name: string;
          price: number;
          duration: string;
          description?: string;
        }>;
        duration?: string;
        deliverables?: string[];
        category?: string;
        is_active: boolean;
        created_at: string;
        updated_at: string;
      }>;
    }>(`/api/tenant/services${query}`);
  },

  createService: (payload: {
    name: string;
    description?: string;
    pricing: {
      type: "hourly" | "fixed" | "package";
      rate?: number;
    };
    packages?: Array<{
      name: string;
      price: number;
      duration: string;
      description?: string;
    }>;
    duration?: string;
    deliverables?: string[];
    category?: string;
  }) =>
    post<typeof payload, {
      success: boolean;
      service: {
        id: string;
        name: string;
        description?: string;
        pricing: {
          type: "hourly" | "fixed" | "package";
          rate?: number;
        };
        packages?: Array<{
          name: string;
          price: number;
          duration: string;
          description?: string;
        }>;
        duration?: string;
        deliverables?: string[];
        category?: string;
        is_active: boolean;
        created_at: string;
        updated_at: string;
      };
    }>("/api/tenant/services", payload),

  updateService: (serviceId: string | number, payload: {
    name?: string;
    description?: string;
    pricing?: {
      type: "hourly" | "fixed" | "package";
      rate?: number;
    };
    packages?: Array<{
      name: string;
      price: number;
      duration: string;
      description?: string;
    }>;
    duration?: string;
    deliverables?: string[];
    category?: string;
    is_active?: boolean;
  }) =>
    put<typeof payload, {
      success: boolean;
      service: {
        id: string;
        name: string;
        description?: string;
        pricing: {
          type: "hourly" | "fixed" | "package";
          rate?: number;
        };
        packages?: Array<{
          name: string;
          price: number;
          duration: string;
          description?: string;
        }>;
        duration?: string;
        deliverables?: string[];
        category?: string;
        is_active: boolean;
        created_at: string;
        updated_at: string;
      };
    }>(`/api/tenant/services/${serviceId}`, payload),

  deleteService: (serviceId: string | number) =>
    del<{ success: boolean; message?: string }>(`/api/tenant/services/${serviceId}`),

  // Onboarding industry step
  onboardingIndustry: (payload: { industry_id: string }) =>
    post<typeof payload, { success: boolean; message: string; next_step: string }>(
      "/api/tenant/onboarding/industry",
      payload
    ),

  // Magic Profile endpoint
  magicProfile: (payload: { url?: string; description?: string }) =>
    post<typeof payload, {
      success: boolean;
      profile: {
        name: string;
        description: string;
        industry: string;
        persona: {
          tone: string;
          audience: string;
          values: string[];
        };
        confidence: "high" | "medium" | "low";
      };
      message?: string;
    }>("/api/tenant/onboarding/magic-profile", payload),

  // Payment Account Management endpoints
  paymentAccounts: () =>
    get<{
      payment_accounts: Array<{
        id: string;
        account_type: "bank" | "mobile_money" | "cash";
        bank_name?: string;
        account_number?: string;
        account_name: string;
        provider?: string;
        phone_number?: string;
        description?: string;
        is_default: boolean;
        is_active: boolean;
        created_at: string;
        updated_at: string;
      }>;
    }>("/api/tenant/payment-accounts"),

  paymentAccount: (accountId: number) =>
    get<{
      id: number;
      account_type: "bank" | "mobile_money" | "cash";
      bank_name?: string;
      account_number?: string;
      account_name: string;
      provider?: string;
      phone_number?: string;
      description?: string;
      is_default: boolean;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    }>(`/api/tenant/payment-accounts/${accountId}`),

  createPaymentAccount: (payload: {
    account_type: "bank" | "mobile_money" | "cash";
    bank_name?: string;
    account_number?: string;
    account_name: string;
    provider?: string;
    phone_number?: string;
    description?: string;
    is_default?: boolean;
  }) =>
    post<typeof payload, {
      success: boolean;
      payment_account: {
        id: number;
        account_type: "bank" | "mobile_money" | "cash";
        bank_name?: string;
        account_number?: string;
        account_name: string;
        provider?: string;
        phone_number?: string;
        description?: string;
        is_default: boolean;
        is_active: boolean;
        created_at: string;
        updated_at: string;
      };
    }>("/api/tenant/payment-accounts", payload),

  updatePaymentAccount: (accountId: number, payload: {
    bank_name?: string;
    account_number?: string;
    account_name?: string;
    provider?: string;
    phone_number?: string;
    description?: string;
    is_default?: boolean;
    is_active?: boolean;
  }) =>
    put<typeof payload, {
      success: boolean;
      payment_account: {
        id: number;
        account_type: "bank" | "mobile_money" | "cash";
        bank_name?: string;
        account_number?: string;
        account_name: string;
        provider?: string;
        phone_number?: string;
        description?: string;
        is_default: boolean;
        is_active: boolean;
        created_at: string;
        updated_at: string;
      };
    }>(`/api/tenant/payment-accounts/${accountId}`, payload),

  deletePaymentAccount: (accountId: number) =>
    del<{ success: boolean; message?: string }>(`/api/tenant/payment-accounts/${accountId}`),

  setDefaultPaymentAccount: (accountId: number) =>
    put<undefined, { success: boolean; message?: string }>(`/api/tenant/payment-accounts/${accountId}/set-default`),

  // Order Management endpoints
  orders: (params?: { status?: string; platform?: string; limit?: number; offset?: number }) => {
    const query = params
      ? `?${new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== "") as [string, string][]
      ).toString()}`
      : "";
    return get<{
      orders: Array<{
        id: string;
        order_number: string;
        payment_reference: string;
        customer_name: string;
        customer_phone?: string;
        customer_email?: string;
        total_amount: number;
        currency: string;
        status: "pending" | "confirmed" | "processing" | "completed" | "cancelled";
        platform: string;
        items: Array<{
          name: string;
          quantity: number;
          unit_price: number;
          total_price: number;
        }>;
        created_at: string;
        updated_at: string;
      }>;
      count: number;
    }>(`/api/tenant/orders${query}`);
  },

  order: (orderId: string | number) =>
    get<{
      id: string;
      order_number: string;
      payment_reference: string;
      customer_name: string;
      customer_phone?: string;
      customer_email?: string;
      total_amount: number;
      currency: string;
      status: "pending" | "confirmed" | "processing" | "completed" | "cancelled";
      platform: string;
      items: Array<{
        name: string;
        quantity: number;
        unit_price: number;
        total_price: number;
      }>;
      payment_instructions?: string;
      notes?: string;
      created_at: string;
      updated_at: string;
    }>(`/api/tenant/orders/${orderId}`),

  updateOrder: (orderId: string | number, payload: {
    status?: "pending" | "confirmed" | "processing" | "completed" | "cancelled";
    notes?: string;
  }) =>
    put<typeof payload, {
      success: boolean;
      order: {
        id: string;
        order_number: string;
        payment_reference: string;
        customer_name: string;
        customer_phone?: string;
        customer_email?: string;
        total_amount: number;
        currency: string;
        status: "pending" | "confirmed" | "processing" | "completed" | "cancelled";
        platform: string;
        items: Array<{
          name: string;
          quantity: number;
          unit_price: number;
          total_price: number;
        }>;
        payment_instructions?: string;
        notes?: string;
        created_at: string;
        updated_at: string;
      };
    }>(`/api/tenant/orders/${orderId}`, payload),

  confirmOrderPayment: (orderId: string | number, payload: {
    payment_reference: string;
    notes?: string;
  }) =>
    put<typeof payload, {
      success: boolean;
      message?: string;
      order: {
        id: string;
        status: "confirmed" | "processing" | "completed";
        payment_verified: boolean;
      };
    }>(`/api/tenant/orders/${orderId}/confirm-payment`, payload),

  orderStats: () =>
    get<{
      total_orders: number;
      pending_orders: number;
      completed_orders: number;
      total_revenue: number;
      average_order_value: number;
      currency: string;
    }>("/api/tenant/orders/stats"),

  // Payment Verification endpoints
  payments: (params?: { status?: string; verification_status?: string; limit?: number; offset?: number }) => {
    const query = params
      ? `?${new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== "") as [string, string][]
      ).toString()}`
      : "";
    return get<{
      payments: Array<{
        id: number;
        order_id: number;
        order_number: string;
        payment_reference: string;
        amount: number;
        currency: string;
        status: "pending" | "verified" | "confirmed" | "disputed" | "failed";
        verification_status: "pending" | "verified" | "disputed";
        customer_name: string;
        customer_phone?: string;
        created_at: string;
        verified_at?: string;
        receipt_id?: string;
        receipt_url?: string;
      }>;
      count: number;
    }>(`/api/tenant/payments${query}`);
  },

  payment: (paymentId: number) =>
    get<{
      id: number;
      order_id: number;
      order_number: string;
      payment_reference: string;
      amount: number;
      currency: string;
      status: "pending" | "verified" | "confirmed" | "disputed" | "failed";
      verification_status: "pending" | "verified" | "disputed";
      customer_name: string;
      customer_phone?: string;
      payment_method?: string;
      transaction_id?: string;
      notes?: string;
      created_at: string;
      verified_at?: string;
      disputed_at?: string;
      receipt_id?: string;
      receipt_url?: string;
    }>(`/api/tenant/payments/${paymentId}`),

  verifyPayment: (paymentId: number, payload: {
    transaction_id?: string;
    notes?: string;
  }) =>
    put<typeof payload, {
      success: boolean;
      message?: string;
      payment: {
        id: number;
        order_id: number;
        status: "verified" | "confirmed";
        verification_status: "verified";
        verified_at: string;
        receipt_id?: string;
        receipt_url?: string;
      };
    }>(`/api/tenant/payments/${paymentId}/verify`, payload),

  disputePayment: (paymentId: number, payload: {
    reason?: string;
    notes?: string;
  }) =>
    put<typeof payload, {
      success: boolean;
      message?: string;
      payment: {
        id: number;
        verification_status: "disputed";
        disputed_at: string;
      };
    }>(`/api/tenant/payments/${paymentId}/dispute`, payload),

  // Telegram endpoints
  getTelegramConnectLink: () =>
    get<{ link: string }>(`/api/tenant/telegram-connect-link`),

  // Portal Token Management
  generatePortalToken: (orderId: string | number) =>
    get<{
      portal_token: string;
      portal_url: string;
      expires_at?: string;
      message?: string;
    }>(`/api/tenant/orders/${orderId}/portal-token`),

  // Receipt Management
  generateReceipt: (paymentId: number) =>
    post<undefined, {
      success: boolean;
      receipt_id: string;
      receipt_url: string;
      message?: string;
    }>(`/api/tenant/payments/${paymentId}/generate-receipt`),

  // Tenant Notifications
  getNotifications: (params?: {
    status?: "unread" | "read" | "all";
    type?: string;
    since?: string;
    limit?: number;
    offset?: number;
    cursor?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.status && params.status !== "all") {
      queryParams.append("status", params.status);
    }
    if (params?.type) {
      queryParams.append("type", params.type);
    }
    if (params?.since) {
      queryParams.append("since", params.since);
    }
    if (params?.limit) {
      queryParams.append("limit", params.limit.toString());
    }
    if (params?.offset) {
      queryParams.append("offset", params.offset.toString());
    }
    if (params?.cursor) {
      queryParams.append("cursor", params.cursor);
    }
    const query = queryParams.toString();

    return get<{
      notifications: TenantNotification[];
      unread_count?: number;
      total?: number;
      next_cursor?: string | null;
    }>(`/api/tenant/notifications${query ? `?${query}` : ""}`);
  },

  getNotificationCounts: () =>
    get<{
      total?: number;
      unread?: number;
    }>("/api/tenant/notifications/counts"),

  markNotificationRead: (notificationId: string | number) =>
    post<undefined, {
      success: boolean;
      notification?: TenantNotification;
      unread_count?: number;
    }>(`/api/tenant/notifications/${notificationId}/read`),

  markAllNotificationsRead: () =>
    post<undefined, {
      success?: boolean;
      updated?: number;
      unread_count?: number;
    }>("/api/tenant/notifications/read-all"),

  // Tenant Alerts
  getAlerts: (params?: {
    unread?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.unread) {
      queryParams.append("unread", "true");
    }
    if (params?.limit) {
      queryParams.append("limit", params.limit.toString());
    }
    if (params?.offset) {
      queryParams.append("offset", params.offset.toString());
    }
    const query = queryParams.toString();

    return get<Array<{
      id: number;
      tenant_id: number;
      type: string;
      severity: string;
      title: string;
      message: string;
      action_url?: string;
      action_label?: string;
      sent_email: boolean;
      sent_telegram: boolean;
      sent_in_app: boolean;
      email_sent_at?: string;
      telegram_sent_at?: string;
      in_app_created_at?: string;
      created_at: string;
      read_at?: string | null;
      metadata?: string;
    }>>(`/api/tenant/alerts${query ? `?${query}` : ""}`);
  },

  getAlertCounts: () =>
    get<{
      total?: number;
      unread?: number;
    }>("/api/tenant/alerts/counts"),

  markAlertRead: (alertId: number) =>
    post<undefined, {
      success: boolean;
      alert?: {
        id: number;
        read_at: string;
      };
      unread_count?: number;
    }>(`/api/tenant/alerts/${alertId}/read`),

  markAllAlertsRead: () =>
    post<undefined, {
      success?: boolean;
      updated?: number;
      unread_count?: number;
    }>("/api/tenant/alerts/read-all"),

  // Notification Settings
  getNotificationSettings: () =>
    get<{
      email_notifications: {
        enabled: boolean;
        order_status_changes: boolean;
        payment_confirmations: boolean;
        receipt_generated: boolean;
      };
      webhook: {
        enabled: boolean;
        url: string;
        events: string[];
        secret?: string;
      };
    }>("/api/tenant/settings/notifications"),

  updateNotificationSettings: (payload: {
    email_notifications?: {
      enabled?: boolean;
      order_status_changes?: boolean;
      payment_confirmations?: boolean;
      receipt_generated?: boolean;
    };
    webhook?: {
      enabled?: boolean;
      url?: string;
      events?: string[];
      secret?: string;
    };
  }) =>
    put<typeof payload, {
      success: boolean;
      message?: string;
    }>("/api/tenant/settings/notifications", payload),

  testNotifications: () =>
    post<undefined, {
      email_sent: boolean;
      webhook_sent: boolean;
      message?: string;
    }>("/api/tenant/settings/notifications/test"),

  // Negotiation Settings
  getNegotiationSettings: () =>
    get<{
      negotiation_mode: "disabled" | "range";
      negotiation_min_price?: number;
      negotiation_max_price?: number;
    }>("/api/tenant/settings/negotiation"),

  updateNegotiationSettings: (payload: {
    negotiation_mode?: "disabled" | "range";
    negotiation_min_price?: number;
    negotiation_max_price?: number;
  }) =>
    put<typeof payload, {
      success: boolean;
      message?: string;
    }>("/api/tenant/settings/negotiation", payload),

  // Customer Portal APIs (Public - no auth required)
  portalOrder: (token: string) =>
    get<{
      order: {
        id: number;
        order_number: string;
        payment_reference: string;
        status: "pending" | "confirmed" | "processing" | "completed" | "cancelled";
        total_amount: number;
        currency: string;
        items: Array<{
          name: string;
          quantity: number;
          unit_price: number;
          total_price: number;
        }>;
        customer_name: string;
        customer_phone?: string;
        customer_email?: string;
        platform: string;
        created_at: string;
        confirmed_at?: string;
        completed_at?: string;
      };
      payment: {
        id: number;
        payment_reference: string;
        amount: number;
        currency: string;
        payment_method?: string;
        status: string;
        receipt_id?: string;
        receipt_url?: string;
        created_at: string;
      };
      business: {
        name: string;
        email: string;
        phone: string;
        location?: string;
      };
    }>(`/api/portal/order?token=${token}`),

  portalReceipt: (token: string) =>
    apiFetch<Blob | string>(`/api/portal/receipt?token=${token}`, {
      parseJson: false,
    }),

  portalOrders: (token: string) =>
    get<{
      orders: Array<{
        id: number;
        order_number: string;
        payment_reference: string;
        status: string;
        total_amount: number;
        currency: string;
        items: Array<{
          name: string;
          quantity: number;
          unit_price: number;
          total_price: number;
        }>;
        created_at: string;
        confirmed_at?: string;
        completed_at?: string;
      }>;
      count: number;
    }>(`/api/portal/orders?token=${token}`),

  // OAuth Endpoints (redirect-based, return URLs for window.location)
  getMetaOAuthUrl: (params: {
    tenant_id?: number;
    platforms?: string; // Comma-separated: "instagram,facebook" or single "instagram"
    platform?: string; // Alternative to platforms (single platform)
    success_redirect?: string;
    page_id?: string;
    instagram_id?: string;
    business_id?: string;
    phone_number_id?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params.tenant_id !== undefined) queryParams.append('tenant_id', params.tenant_id.toString());
    if (params.platforms) queryParams.append('platforms', params.platforms);
    if (params.platform) queryParams.append('platform', params.platform);
    if (params.success_redirect) queryParams.append('success_redirect', params.success_redirect);
    if (params.page_id) queryParams.append('page_id', params.page_id);
    if (params.instagram_id) queryParams.append('instagram_id', params.instagram_id);
    if (params.business_id) queryParams.append('business_id', params.business_id);
    if (params.phone_number_id) queryParams.append('phone_number_id', params.phone_number_id);
    return `${API_BASE_URL}/api/oauth/meta/start?${queryParams.toString()}`;
  },

  getTikTokOAuthUrl: (params: {
    tenant_id?: number;
    success_redirect?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params.tenant_id !== undefined) queryParams.append('tenant_id', params.tenant_id.toString());
    if (params.success_redirect) queryParams.append('success_redirect', params.success_redirect);
    return `${API_BASE_URL}/api/oauth/tiktok/start?${queryParams.toString()}`;
  },

  getInstagramOAuthUrl: (params: {
    tenant_id?: number;
    success_redirect?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params.tenant_id !== undefined) queryParams.append('tenant_id', params.tenant_id.toString());
    if (params.success_redirect) queryParams.append('success_redirect', params.success_redirect);
    return `${API_BASE_URL}/api/oauth/instagram/start?${queryParams.toString()}`;
  },

  // Instagram Insights endpoints
  getInstagramAccountInsights: (params?: {
    metrics?: string;
    period?: 'day' | 'week' | 'days_28' | 'lifetime';
    save?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    // Only add metrics if provided (let backend use defaults if not specified)
    if (params?.metrics && params.metrics.trim()) {
      queryParams.append('metrics', params.metrics);
    }
    if (params?.period) queryParams.append('period', params.period);
    if (params?.save !== undefined) queryParams.append('save', params.save.toString());
    return get<{
      success: boolean;
      insights: Array<{
        name: string;
        period: string;
        title: string;
        description: string;
        id: string;
        values: Array<{
          value: number;
          end_time?: string;
        }>;
      }>;
      account_id: string;
      period: string;
    }>(`/api/tenant/instagram/insights/account${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
  },

  getInstagramMediaInsights: (mediaId: string, params?: {
    metrics?: string;
    period?: 'day' | 'week' | 'days_28' | 'lifetime';
    save?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.metrics) queryParams.append('metrics', params.metrics);
    if (params?.period) queryParams.append('period', params.period);
    if (params?.save !== undefined) queryParams.append('save', params.save.toString());
    return get<{
      success: boolean;
      insights: Array<{
        name: string;
        period: string;
        title: string;
        description: string;
        id: string;
        values: Array<{
          value: number;
          end_time?: string;
        }>;
      }>;
      media_id: string;
      period: string;
    }>(`/api/tenant/instagram/insights/media/${mediaId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
  },
};

