import {
  type AddFavoriteRequest,
  type AiSearchRequest,
  type AiSearchResponse,
  type AuthenticatedUser,
  type BuyerPreferences,
  type CreateInteractionRequest,
  type Favorite,
  type ForgotPasswordRequest,
  type LoginRequest,
  type MatchResult,
  type PropertyDetail,
  type PropertyNearbyQuery,
  type PropertySearchQuery,
  type PropertySummary,
  type RecalculateMatchesRequest,
  type RegisterRequest,
  type ResetPasswordRequest,
  type SessionResponse,
  type UpdateBuyerPreferencesRequest,
  type VerifyEmailRequest,
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
}
