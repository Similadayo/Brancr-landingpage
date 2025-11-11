const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

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

  conversations: () =>
    get<{
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
    }>("/api/tenant/conversations"),

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
    post<typeof payload, { message_id: string }>(`/api/tenant/conversations/${conversationId}/reply`, payload),

  assignConversation: (conversationId: string, payload: { assignee_id: string | null }) =>
    patch<typeof payload, { success: boolean }>(
      `/api/tenant/conversations/${conversationId}/assign`,
      payload
    ),

  updateConversationStatus: (conversationId: string, payload: { status: string }) =>
    patch<typeof payload, { success: boolean }>(`/api/tenant/conversations/${conversationId}/status`, payload),

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

  analytics: (params?: Record<string, string>) => {
    const query = params
      ? `?${new URLSearchParams(params).toString()}`
      : "";
    return get<Record<string, unknown>>(`/api/tenant/analytics${query}`);
  },

  templates: () =>
    get<{
      templates: Array<Record<string, unknown>>;
    }>("/api/tenant/templates"),

  teamMembers: () =>
    get<{
      members: Array<{
        id: string;
        name: string;
        email: string;
        role: string;
      }>;
    }>("/api/tenant/team"),

  inviteTeamMember: (payload: { email: string; role: string }) =>
    post<typeof payload, { invitation_id: string }>("/api/tenant/team/invite", payload),

  updateMemberRole: (memberId: string, payload: { role: string }) =>
    patch<typeof payload, { success: boolean }>(`/api/tenant/team/${memberId}`, payload),

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
};

