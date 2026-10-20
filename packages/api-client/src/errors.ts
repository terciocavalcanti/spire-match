import type { ApiError } from "@spire/contracts";

export class SpireApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: Record<string, unknown>;
  readonly requestId?: string;

  constructor(error: ApiError) {
    super(error.message);
    this.name = "SpireApiError";
    this.statusCode = error.statusCode;
    this.code = error.code;
    this.details = error.details;
    this.requestId = error.requestId;
  }
}
