const DEFAULT_API_BASE_URL = "https://api.brancr.com";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;

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

  const message = body?.error || response.statusText || "Request failed";
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

  return (await response.json()) as TResponse;
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
  }) => post<typeof payload, { tenant_id: number; name: string; email: string }>("/api/auth/signup", payload),

  login: (payload: { email: string; password: string }) =>
    post<typeof payload, { tenant_id: number; name: string; email: string }>("/api/auth/login", payload),

  logout: () => post<undefined, void>("/api/auth/logout"),

  me: () =>
    get<{
      tenant_id: number;
      name: string;
      email: string;
      plan: string;
      status: string;
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
    }>("/api/auth/me"),

  requestPasswordReset: (payload: { email: string }) =>
    post<typeof payload, void>("/api/auth/forgot-password", payload, { parseJson: false }),
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

  conversations: (params?: { platform?: string; status?: string; search?: string }) => {
    const query = params
      ? `?${new URLSearchParams(
          Object.entries(params).filter(([_, v]) => v !== undefined && v !== '') as [string, string][]
        ).toString()}`
      : "";
    return get<{
      conversations: Array<{
        id: string;
        contact_name: string;
        channel: string;
        preview: string;
        updated_at: string;
        unread_count: number;
        tags: string[];
        assignee?: string | null;
        status: string;
      }>;
    }>(`/api/tenant/conversations${query}`);
  },

  conversation: (conversationId: string) =>
    get<{
      conversation: {
        id: string;
        contact_name: string;
        channel: string;
        tags: string[];
        assignee?: string | null;
        status: string;
        metadata?: Record<string, unknown>;
      };
      messages: Array<{
        id: string;
        author: "tenant" | "contact";
        author_name?: string;
        body: string;
        sent_at: string;
        attachments?: Array<Record<string, unknown>>;
      }>;
    }>(`/api/tenant/conversations/${conversationId}`),

  sendReply: (conversationId: string, payload: { body: string; attachments?: Array<Record<string, unknown>> }) =>
    post<typeof payload, { message_id: string }>(`/api/tenant/conversations/${conversationId}/replies`, payload),

  assignConversation: (conversationId: string, payload: { assignee_id: string | null }) =>
    patch<typeof payload, { success: boolean }>(
      `/api/tenant/conversations/${conversationId}/assign`,
      payload
    ),

  updateConversationStatus: (conversationId: string, payload: { status: string }) =>
    patch<typeof payload, { success: boolean }>(`/api/tenant/conversations/${conversationId}/status`, payload),

  updateConversation: (conversationId: string, payload: { notes?: string; tags?: string[] }) =>
    patch<typeof payload, { success: boolean }>(`/api/tenant/conversations/${conversationId}`, payload),

  suggestReplies: (conversationId: string) =>
    post<undefined, { suggestions: string[] }>(`/api/tenant/conversations/${conversationId}/suggest-reply`),

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
      scheduled_posts_count: number;
      posted_count: number;
      conversations_count: number;
      interactions_count: number;
      platform_breakdown: Array<{
        platform: string;
        scheduled_posts: number;
        posted: number;
        conversations: number;
        interactions: number;
      }>;
    }>(`/api/tenant/analytics${query}`);
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
      plan: string;
      amount: number;
      currency: string;
      cadence: "monthly" | "annual";
      trial_days_remaining?: number;
    }>("/api/tenant/billing"),

  usage: () =>
    get<{
      conversations: { used: number; limit: number };
      seats: { used: number; limit: number };
    }>("/api/tenant/usage"),

  // Integrations endpoints
  integrations: () =>
    get<{
      integrations: Array<{
        id: string;
        platform: string;
        connected: boolean;
        username?: string;
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
  scheduledPosts: () =>
    get<{
      posts: Array<{
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
      }>;
    }>("/api/tenant/scheduled-posts"),

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
  mediaList: (params?: { type?: string; tags?: string; campaign?: string; q?: string; page?: string }) => {
    const query = params
      ? `?${new URLSearchParams(
          Object.entries(params).filter(([_, v]) => v !== undefined && v !== "") as [string, string][]
        ).toString()}`
      : "";
    return get<{
      assets: Array<{
        id: string;
        type: "image" | "video" | "carousel";
        url: string;
        thumbnail_url?: string;
        tags?: string[];
        caption?: string;
        created_at: string;
      }>;
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
    name: string;
    caption: string;
    media_asset_ids: string[];
    platforms: string[];
    scheduled_at: string;
  }) => post<typeof payload, { success: boolean; post_id: string }>(`/api/tenant/posts`, payload),

  publishNow: (postId: string) =>
    post<undefined, { success: boolean }>(`/api/tenant/posts/${postId}/publish-now`),

  generateCaption: (payload: {
    media_asset_ids: string[];
    tone?: string;
    include_hashtags?: boolean;
  }) => post<typeof payload, { caption: string }>(`/api/tenant/posts/generate-caption`, payload),

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

  requestWhatsAppNumber: (payload: { phone_number: string }) =>
    post<typeof payload, { phone_number_id: string }>("/api/tenant/whatsapp/request-number", payload),

  verifyWhatsAppNumber: (payload: { phone_number_id: string; verification_code: string }) =>
    post<typeof payload, { success: boolean; message: string }>("/api/tenant/whatsapp/verify-number", payload),

  checkWhatsAppNumber: (payload: { phone_number: string }) =>
    post<typeof payload, { ready: boolean; message?: string }>("/api/tenant/whatsapp/check-number", payload),

  // Onboarding endpoints
  onboardingStatus: () =>
    get<{
      step: "business_profile" | "persona" | "business_details" | "social_connect";
      complete: boolean;
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
        menu_items?: Array<{ name: string; category: string; price: string; description: string }>;
        faqs?: Array<{ question: string; answer: string }>;
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
};

