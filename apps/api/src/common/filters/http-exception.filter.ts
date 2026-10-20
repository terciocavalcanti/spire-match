import { randomUUID } from "node:crypto";

import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import type { ApiError } from "@spire/contracts";
import type { Response } from "express";


@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const requestId = randomUUID();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const parsedBody = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

      const payload: ApiError = {
        statusCode: status,
        code: (parsedBody.code as string | undefined) ?? defaultCodeForStatus(status),
        message: (parsedBody.message as string | undefined) ?? exception.message,
        details: parsedBody.details as Record<string, unknown> | undefined,
        requestId,
      };
      response.status(status).json(payload);
      return;
    }

     
    console.error(`[${requestId}] Erro não tratado:`, exception);
    const payload: ApiError = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: "INTERNAL_ERROR",
      message: "Erro interno. Nossa equipe foi notificada.",
      requestId,
    };
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(payload);
  }
}

function defaultCodeForStatus(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return "VALIDATION_ERROR";
    case HttpStatus.UNAUTHORIZED:
      return "UNAUTHORIZED";
    case HttpStatus.FORBIDDEN:
      return "FORBIDDEN";
    case HttpStatus.NOT_FOUND:
      return "NOT_FOUND";
    case HttpStatus.CONFLICT:
      return "CONFLICT";
    case HttpStatus.TOO_MANY_REQUESTS:
      return "RATE_LIMITED";
    default:
      return "ERROR";
  }
}
