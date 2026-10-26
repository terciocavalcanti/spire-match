import {
  type AddFavoriteRequest,
  type AdminOverview,
  type AdminPropertyListQuery,
  type AdminVisitListQuery,
  type AiSearchRequest,
  type AiSearchResponse,
  type AssignLeadRequest,
  type AuthenticatedUser,
  type Broker,
  type BuyerPreferences,
  type Contact,
  type CreateBrokerRequest,
  type CreateContactRequest,
  type CreateInteractionRequest,
  type CreateLeadNoteRequest,
  type CreatePropertyRequest,
  type CreateProposalRequest,
  type CreateRadarRequest,
  type CreateVisitRequest,
  type Favorite,
  type ForgotPasswordRequest,
  type FunnelReport,
  type GenerateTourRequest,
  type Lead,
  type LeadDetail,
  type LeadListQuery,
  type LoginRequest,
  type MatchResult,
  type Notification,
  type NotificationListQuery,
  type Proposal,
  type PropertyDetail,
  type PropertyNearbyQuery,
  type PropertySearchQuery,
  type PropertySummary,
  type PushSubscriptionRequest,
  type Radar,
  type RecalculateMatchesRequest,
  type RegisterRequest,
  type ResetPasswordRequest,
  type SessionResponse,
  type Tour,
  type UpdateBrokerRequest,
  type UpdateBuyerPreferencesRequest,
  type UpdateLeadStageRequest,
  type UpdatePropertyRequest,
  type VerifyEmailRequest,
  type Visit,
  type VisitSlot,
  apiErrorSchema,
  sessionResponseSchema,
} from "@spire/contracts";

import { SpireApiError } from "./errors";

function toQueryString(params: Record<string, unknown> | undefined): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => search.append(key, String(v)));
    } else {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export interface SpireApiClientOptions {
  /** Ex.: "https://api.spirematch.com.br/api/v1" ou "http://localhost:4000/api/v1". */
  baseUrl: string;
  /** Permite injetar fetch customizado (testes, SSR, RN futuro). */
  fetchImpl?: typeof fetch;
}

/**
 * SDK TypeScript isomórfico — sem dependência de browser/Next, reutilizável
 * por `apps/web`, `apps/admin` e, no futuro, pelo app React Native.
 * Autenticação via cookie httpOnly (credentials: "include"); nenhum token
 * de sessão é manuseado diretamente pelo client.
 */
export class SpireApiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: SpireApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    // `fetch` nativo exige `this === window` (ou `undefined` em alguns runtimes) —
    // sem o bind, chamar `this.fetchImpl(...)` como método da classe dispara
    // "TypeError: Failed to execute 'fetch' on 'Window': Illegal invocation".
    this.fetchImpl = options.fetchImpl ?? fetch.bind(globalThis);
  }

  private async request<TResponse>(
    path: string,
    init: RequestInit = {},
  ): Promise<TResponse> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...init.headers,
      },
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const body = isJson ? await response.json() : undefined;

    if (!response.ok) {
      const parsed = apiErrorSchema.safeParse(body);
      if (parsed.success) {
        throw new SpireApiError(parsed.data);
      }
      throw new SpireApiError({
        statusCode: response.status,
        code: "UNKNOWN_ERROR",
        message: response.statusText || "Erro inesperado na API",
      });
    }

    return body as TResponse;
  }

  auth = {
    register: (payload: RegisterRequest) =>
      this.request<SessionResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      }).then((res) => sessionResponseSchema.parse(res)),

    login: (payload: LoginRequest) =>
      this.request<SessionResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      }).then((res) => sessionResponseSchema.parse(res)),

    logout: () => this.request<void>("/auth/logout", { method: "POST" }),

    forgotPassword: (payload: ForgotPasswordRequest) =>
      this.request<{ sent: boolean }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    resetPassword: (payload: ResetPasswordRequest) =>
      this.request<{ reset: boolean }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    verifyEmail: (payload: VerifyEmailRequest) =>
      this.request<{ verified: boolean }>("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  };

  me = {
    get: () =>
      this.request<{ user: AuthenticatedUser }>("/me", { method: "GET" }).then(
        (res) => res.user,
      ),
  };

  properties = {
    search: (query: Partial<PropertySearchQuery> = {}) =>
      this.request<{ items: PropertySummary[]; nextCursor: string | null }>(
        `/properties${toQueryString(query)}`,
      ),

    bySlug: (slug: string) => this.request<PropertyDetail>(`/properties/${slug}`),

    byId: (id: string) => this.request<PropertyDetail>(`/properties/by-id/${id}`),

    nearby: (query: PropertyNearbyQuery) =>
      this.request<{ items: Array<PropertySummary & { distanceMeters: number }> }>(
        `/properties/nearby${toQueryString(query)}`,
      ),
  };

  matches = {
    list: (query: { limit?: number; cursor?: string; lat?: number; lng?: number; minScore?: number } = {}) =>
      this.request<{ items: MatchResult[]; nextCursor: string | null }>(`/matches${toQueryString(query)}`),

    forProperty: (propertyId: string, query: { lat?: number; lng?: number } = {}) =>
      this.request<MatchResult>(`/matches/${propertyId}${toQueryString(query)}`),

    recalculate: (payload: RecalculateMatchesRequest = {}) =>
      this.request<{ recalculated: number; items: MatchResult[] }>("/matches/recalculate", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  };

  favorites = {
    list: () => this.request<{ items: Favorite[] }>("/favorites"),

    add: (payload: AddFavoriteRequest) =>
      this.request<{ added: true }>("/favorites", { method: "POST", body: JSON.stringify(payload) }),

    remove: (propertyId: string) =>
      this.request<{ removed: true }>(`/favorites/${propertyId}`, { method: "DELETE" }),
  };

  interactions = {
    create: (payload: CreateInteractionRequest) =>
      this.request<{ recorded: true }>("/interactions", { method: "POST", body: JSON.stringify(payload) }),
  };

  preferences = {
    get: () => this.request<BuyerPreferences>("/me/preferences"),

    update: (payload: UpdateBuyerPreferencesRequest) =>
      this.request<BuyerPreferences>("/me/preferences", { method: "PUT", body: JSON.stringify(payload) }),
  };

  aiSearch = {
    search: (payload: AiSearchRequest) =>
      this.request<AiSearchResponse>("/ai/search", { method: "POST", body: JSON.stringify(payload) }),
  };

  health = {
    live: () => this.request<{ status: "ok" }>("/health/live", { method: "GET" }),
    ready: () => this.request<{ status: "ok" | "degraded" }>("/health/ready", { method: "GET" }),
  };

  brokers = {
    list: () => this.request<{ items: Broker[] }>("/brokers"),
    byProperty: (propertyId: string) => this.request<{ broker: Broker | null }>(`/brokers/by-property/${propertyId}`),
    byId: (id: string) => this.request<Broker>(`/brokers/${id}`),
    create: (payload: CreateBrokerRequest) => this.request<Broker>("/brokers", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: string, payload: UpdateBrokerRequest) =>
      this.request<Broker>(`/brokers/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  };

  leads = {
    list: (query: Partial<LeadListQuery> = {}) =>
      this.request<{ items: Lead[]; nextCursor: string | null }>(`/leads${toQueryString(query)}`),
    overview: () => this.request<AdminOverview>("/leads/overview"),
    funnelReport: (days = 30) => this.request<FunnelReport>(`/leads/funnel-report${toQueryString({ days })}`),
    detail: (id: string) => this.request<LeadDetail>(`/leads/${id}`),
    updateStage: (id: string, payload: UpdateLeadStageRequest) =>
      this.request<LeadDetail>(`/leads/${id}/stage`, { method: "PATCH", body: JSON.stringify(payload) }),
    assign: (id: string, payload: AssignLeadRequest) =>
      this.request<LeadDetail>(`/leads/${id}/assign`, { method: "PATCH", body: JSON.stringify(payload) }),
    addNote: (id: string, payload: CreateLeadNoteRequest) =>
      this.request<LeadDetail>(`/leads/${id}/notes`, { method: "POST", body: JSON.stringify(payload) }),
  };

  adminProperties = {
    list: (query: Partial<AdminPropertyListQuery> = {}) =>
      this.request<{ items: PropertySummary[]; nextCursor: string | null }>(`/properties/admin${toQueryString(query)}`),
    create: (payload: CreatePropertyRequest) =>
      this.request<PropertyDetail>("/properties/admin", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: string, payload: UpdatePropertyRequest) =>
      this.request<PropertyDetail>(`/properties/admin/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  };

  adminVisits = {
    agenda: (query: Partial<AdminVisitListQuery> = {}) =>
      this.request<{ items: Visit[] }>(`/visits/admin${toQueryString(query)}`),
  };

  visits = {
    availability: (brokerId: string, date: string) =>
      this.request<{ slots: VisitSlot[] }>(`/visits/availability${toQueryString({ brokerId, date })}`),
    mine: () => this.request<{ items: Visit[] }>("/visits/mine"),
    schedule: (payload: CreateVisitRequest) =>
      this.request<Visit>("/visits", { method: "POST", body: JSON.stringify(payload) }),
    cancel: (id: string) => this.request<{ cancelled: true }>(`/visits/${id}`, { method: "DELETE" }),
  };

  proposals = {
    mine: () => this.request<{ items: Proposal[] }>("/proposals/mine"),
    create: (payload: CreateProposalRequest) =>
      this.request<Proposal>("/proposals", { method: "POST", body: JSON.stringify(payload) }),
  };

  contacts = {
    mine: () => this.request<{ items: Contact[] }>("/contacts/mine"),
    create: (payload: CreateContactRequest) =>
      this.request<Contact>("/contacts", { method: "POST", body: JSON.stringify(payload) }),
  };

  notifications = {
    list: (query: Partial<NotificationListQuery> = {}) =>
      this.request<{ items: Notification[]; nextCursor: string | null }>(`/notifications${toQueryString(query)}`),
    unreadCount: () => this.request<{ count: number }>("/notifications/unread-count"),
    markRead: (id: string) => this.request<{ read: true }>(`/notifications/${id}/read`, { method: "POST" }),
    markAllRead: () => this.request<{ read: true }>("/notifications/read-all", { method: "POST" }),
    vapidPublicKey: () => this.request<{ publicKey: string | null }>("/notifications/vapid-public-key"),
    subscribePush: (payload: PushSubscriptionRequest) =>
      this.request<{ subscribed: true }>("/notifications/push/subscribe", { method: "POST", body: JSON.stringify(payload) }),
    unsubscribePush: (endpoint: string) =>
      this.request<{ unsubscribed: true }>("/notifications/push/subscribe", {
        method: "DELETE",
        body: JSON.stringify({ endpoint }),
      }),
  };

  radars = {
    list: () => this.request<{ items: Radar[] }>("/radars"),
    create: (payload: CreateRadarRequest) => this.request<Radar>("/radars", { method: "POST", body: JSON.stringify(payload) }),
    check: (id: string) => this.request<{ newMatches: number }>(`/radars/${id}/check`, { method: "POST" }),
    remove: (id: string) => this.request<{ removed: true }>(`/radars/${id}`, { method: "DELETE" }),
  };

  tours = {
    generate: (payload: GenerateTourRequest) =>
      this.request<Tour>("/tours/generate", { method: "POST", body: JSON.stringify(payload) }),
  };
}
