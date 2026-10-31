import {
  type AddFavoriteRequest,
  type AdminOverview,
  type AdminPropertyListQuery,
  type AdminUser,
  type AdminUserListQuery,
  type AdminVisitListQuery,
  type AiSearchRequest,
  type AiSearchResponse,
  type AssignLeadRequest,
  type AuthenticatedUser,
  type Broker,
  type BuyerPreferences,
  type AdminDevelopmentListQuery,
  type AdminUnitListQuery,
  type AttributionReport,
  type AutomationRule,
  type AutomationType,
  type ChangePasswordRequest,
  type Commission,
  type CommissionListQuery,
  type CommissionsSummary,
  type Contact,
  type CreateAdminUserRequest,
  type CreateAdminUserResponse,
  type CreateBrokerRequest,
  type CreateContactRequest,
  type CreateDevelopmentBlockRequest,
  type CreateDevelopmentRequest,
  type CreateInteractionRequest,
  type CreateLeadNoteRequest,
  type CreatePropertyRequest,
  type CreateProposalRequest,
  type CreateRadarRequest,
  type CreateUnitRequest,
  type CreateVisitRequest,
  type DemandMatchQuery,
  type DemandMatchResult,
  type DevelopmentBlock,
  type DevelopmentDetail,
  type DevelopmentSummary,
  type Favorite,
  type ForgotPasswordRequest,
  type FunnelReport,
  type GenerateTourRequest,
  type ImportUnitsRequest,
  type ImportUnitsResponse,
  type IntegrationStatusEntry,
  type Lead,
  type LeadDetail,
  type LeadListQuery,
  type LoginRequest,
  type MarkCommissionReceivedRequest,
  type MatchResult,
  type Notification,
  type NotificationListQuery,
  type AssignOwnerLeadRequest,
  type CreateOwnerLeadNoteRequest,
  type CreateOwnerLeadRequest,
  type OwnerLead,
  type OwnerLeadDetail,
  type OwnerLeadListQuery,
  type PrivateMarketOffer,
  type PrivateMarketOfferAdmin,
  type PrivateMarketOfferListQuery,
  type PublishOwnerLeadRequest,
  type RequestPrivateMarketContactRequest,
  type UpdateOwnerLeadStageRequest,
  type VerifyPrivateMarketOfferRequest,
  type Proposal,
  type PropertyDetail,
  type PlatformSettings,
  type PropertyNearbyQuery,
  type PropertySearchQuery,
  type PropertySummary,
  type PushSubscriptionRequest,
  type Radar,
  type RecalculateMatchesRequest,
  type RegisterRequest,
  type ReportsQuery,
  type ResetPasswordRequest,
  type RunAutomationResult,
  type SessionResponse,
  type Tour,
  type Unit,
  type UpdateAdminUserRolesRequest,
  type UpdateAutomationRuleRequest,
  type UpdateBrokerRequest,
  type UpdateBuyerPreferencesRequest,
  type UpdateCommissionRateRequest,
  type UpdateDemandMatchThresholdRequest,
  type UpdateDevelopmentRequest,
  type UpdateLeadStageRequest,
  type UpdateMatchWeightsRequest,
  type UpdatePropertyRequest,
  type UpdateRadarSweepIntervalRequest,
  type UpdateUnitRequest,
  type VerifyEmailRequest,
  type VgvReport,
  type VgvReportQuery,
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

    changePassword: (payload: ChangePasswordRequest) =>
      this.request<{ changed: true }>("/auth/password", { method: "POST", body: JSON.stringify(payload) }),
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

  adminUsers = {
    list: (query: Partial<AdminUserListQuery> = {}) =>
      this.request<{ items: AdminUser[]; nextCursor: string | null }>(`/admin-users${toQueryString(query)}`),
    create: (payload: CreateAdminUserRequest) =>
      this.request<CreateAdminUserResponse>("/admin-users", { method: "POST", body: JSON.stringify(payload) }),
    updateRoles: (id: string, payload: UpdateAdminUserRolesRequest) =>
      this.request<AdminUser>(`/admin-users/${id}/roles`, { method: "PATCH", body: JSON.stringify(payload) }),
    revokeSessions: (id: string) => this.request<{ revoked: true }>(`/admin-users/${id}/revoke-sessions`, { method: "POST" }),
    suspend: (id: string) => this.request<AdminUser>(`/admin-users/${id}/suspend`, { method: "POST" }),
    reactivate: (id: string) => this.request<AdminUser>(`/admin-users/${id}/reactivate`, { method: "POST" }),
  };

  developments = {
    list: (query: Partial<AdminDevelopmentListQuery> = {}) =>
      this.request<{ items: DevelopmentSummary[]; nextCursor: string | null }>(`/developments${toQueryString(query)}`),
    detail: (id: string) => this.request<DevelopmentDetail>(`/developments/${id}`),
    create: (payload: CreateDevelopmentRequest) =>
      this.request<DevelopmentDetail>("/developments", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: string, payload: UpdateDevelopmentRequest) =>
      this.request<DevelopmentDetail>(`/developments/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
    addBlock: (id: string, payload: CreateDevelopmentBlockRequest) =>
      this.request<DevelopmentBlock>(`/developments/${id}/blocks`, { method: "POST", body: JSON.stringify(payload) }),
    removeBlock: (id: string, blockId: string) =>
      this.request<{ removed: true }>(`/developments/${id}/blocks/${blockId}`, { method: "DELETE" }),
  };

  units = {
    list: (query: Partial<AdminUnitListQuery> = {}) =>
      this.request<{ items: Unit[]; nextCursor: string | null }>(`/units${toQueryString(query)}`),
    create: (payload: CreateUnitRequest) => this.request<Unit>("/units", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: string, payload: UpdateUnitRequest) =>
      this.request<Unit>(`/units/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
    import: (payload: ImportUnitsRequest) =>
      this.request<ImportUnitsResponse>("/units/import", { method: "POST", body: JSON.stringify(payload) }),
  };

  commissions = {
    list: (query: Partial<CommissionListQuery> = {}) =>
      this.request<{ items: Commission[]; nextCursor: string | null }>(`/commissions${toQueryString(query)}`),
    summary: (query: Partial<ReportsQuery> = {}) => this.request<CommissionsSummary>(`/commissions/summary${toQueryString(query)}`),
    markReceived: (id: string, payload: MarkCommissionReceivedRequest) =>
      this.request<Commission>(`/commissions/${id}/mark-received`, { method: "POST", body: JSON.stringify(payload) }),
  };

  reports = {
    vgv: (query: Partial<VgvReportQuery> = {}) => this.request<VgvReport>(`/reports/vgv${toQueryString(query)}`),
    attribution: (query: Partial<ReportsQuery> = {}) => this.request<AttributionReport>(`/reports/attribution${toQueryString(query)}`),
    attributionCsvUrl: (query: Partial<ReportsQuery> = {}) => `${this.baseUrl}/reports/attribution/export.csv${toQueryString(query)}`,
    pdfUrl: (query: Partial<ReportsQuery> = {}) => `${this.baseUrl}/reports/export.pdf${toQueryString(query)}`,
  };

  automations = {
    list: () => this.request<{ items: AutomationRule[] }>("/automations"),
    update: (type: AutomationType, payload: UpdateAutomationRuleRequest) =>
      this.request<AutomationRule>(`/automations/${type}`, { method: "PATCH", body: JSON.stringify(payload) }),
    run: (type: AutomationType) => this.request<RunAutomationResult>(`/automations/${type}/run`, { method: "POST" }),
  };

  settings = {
    get: () => this.request<PlatformSettings>("/settings"),
    updateMatchWeights: (payload: UpdateMatchWeightsRequest) =>
      this.request<{ saved: true; recalculationEnqueuedFor: number }>("/settings/match-weights", { method: "PATCH", body: JSON.stringify(payload) }),
    updateCommissionRate: (payload: UpdateCommissionRateRequest) =>
      this.request<{ saved: true }>("/settings/commission-rate", { method: "PATCH", body: JSON.stringify(payload) }),
    updateRadarSweepInterval: (payload: UpdateRadarSweepIntervalRequest) =>
      this.request<{ saved: true }>("/settings/radar-sweep-interval", { method: "PATCH", body: JSON.stringify(payload) }),
    updateDemandMatchThreshold: (payload: UpdateDemandMatchThresholdRequest) =>
      this.request<{ saved: true }>("/settings/demand-match-threshold", { method: "PATCH", body: JSON.stringify(payload) }),
  };

  demandMatch = {
    get: (query: DemandMatchQuery) => this.request<DemandMatchResult>(`/demand-match${toQueryString(query)}`),
  };

  integrationsStatus = {
    list: () => this.request<{ items: IntegrationStatusEntry[] }>("/integrations-status"),
  };

  ownerLeads = {
    create: (payload: CreateOwnerLeadRequest) =>
      this.request<OwnerLeadDetail>("/owner-leads", { method: "POST", body: JSON.stringify(payload) }),
    mine: () => this.request<{ items: OwnerLead[] }>("/owner-leads/mine"),
    list: (query: Partial<OwnerLeadListQuery> = {}) =>
      this.request<{ items: OwnerLead[]; nextCursor: string | null }>(`/owner-leads${toQueryString(query)}`),
    detail: (id: string) => this.request<OwnerLeadDetail>(`/owner-leads/${id}`),
    updateStage: (id: string, payload: UpdateOwnerLeadStageRequest) =>
      this.request<OwnerLeadDetail>(`/owner-leads/${id}/stage`, { method: "PATCH", body: JSON.stringify(payload) }),
    assign: (id: string, payload: AssignOwnerLeadRequest) =>
      this.request<OwnerLeadDetail>(`/owner-leads/${id}/assign`, { method: "PATCH", body: JSON.stringify(payload) }),
    addNote: (id: string, payload: CreateOwnerLeadNoteRequest) =>
      this.request<OwnerLeadDetail>(`/owner-leads/${id}/notes`, { method: "POST", body: JSON.stringify(payload) }),
    publish: (id: string, payload: PublishOwnerLeadRequest = {}) =>
      this.request<OwnerLeadDetail>(`/owner-leads/${id}/publish`, { method: "POST", body: JSON.stringify(payload) }),
  };

  privateMarket = {
    list: (query: Partial<PrivateMarketOfferListQuery> = {}) =>
      this.request<{ items: PrivateMarketOffer[]; nextCursor: string | null }>(`/private-market${toQueryString(query)}`),
    byOwnerLeadId: (ownerLeadId: string) =>
      this.request<{ offer: PrivateMarketOfferAdmin | null }>(`/private-market/by-owner-lead/${ownerLeadId}`).then((r) => r.offer),
    verify: (id: string, payload: VerifyPrivateMarketOfferRequest) =>
      this.request<PrivateMarketOfferAdmin>(`/private-market/${id}/verify`, { method: "PATCH", body: JSON.stringify(payload) }),
    requestContact: (id: string, payload: RequestPrivateMarketContactRequest = { message: "" }) =>
      this.request<{ ok: true }>(`/private-market/${id}/request-contact`, { method: "POST", body: JSON.stringify(payload) }),
  };
}
