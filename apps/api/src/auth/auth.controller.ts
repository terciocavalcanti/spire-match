import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import {
  type AuthenticatedUser,
  forgotPasswordRequestSchema,
  loginRequestSchema,
  registerRequestSchema,
  resetPasswordRequestSchema,
  verifyEmailRequestSchema,
} from "@spire/contracts";
import type { Request, Response } from "express";


import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import type { Env } from "../config/env";

import { AuthService } from "./auth.service";
import { CurrentUserId } from "./decorators/current-user-id.decorator";
import { SessionAuthGuard } from "./guards/session-auth.guard";

@ApiTags("auth")
@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  private setSessionCookie(res: Response, rawToken: string, expiresAt: Date): void {
    res.cookie(this.config.get("SESSION_COOKIE_NAME", { infer: true }), rawToken, {
      httpOnly: true,
      secure: this.config.get("SESSION_COOKIE_SECURE", { infer: true }),
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });
  }

  private clearSessionCookie(res: Response): void {
    res.clearCookie(this.config.get("SESSION_COOKIE_NAME", { infer: true }), { path: "/" });
  }

  @Post("auth/register")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(
    @Body(new ZodValidationPipe(registerRequestSchema)) body: ReturnType<typeof registerRequestSchema.parse>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: AuthenticatedUser }> {
    const result = await this.authService.register(body, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });
    this.setSessionCookie(res, result.session.rawToken, result.session.expiresAt);
    return { user: result.user };
  }

  @Post("auth/login")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(
    @Body(new ZodValidationPipe(loginRequestSchema)) body: ReturnType<typeof loginRequestSchema.parse>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: AuthenticatedUser }> {
    const result = await this.authService.login(body, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });
    this.setSessionCookie(res, result.session.rawToken, result.session.expiresAt);
    return { user: result.user };
  }

  @Post("auth/logout")
  @UseGuards(SessionAuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const cookieName = this.config.get("SESSION_COOKIE_NAME", { infer: true });
    const rawToken = req.cookies?.[cookieName];
    if (rawToken) await this.authService.logout(rawToken);
    this.clearSessionCookie(res);
  }

  @Post("auth/forgot-password")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordRequestSchema))
    body: ReturnType<typeof forgotPasswordRequestSchema.parse>,
  ): Promise<{ sent: boolean }> {
    await this.authService.requestPasswordReset(body.email);
    return { sent: true };
  }

  @Post("auth/reset-password")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async resetPassword(
    @Body(new ZodValidationPipe(resetPasswordRequestSchema))
    body: ReturnType<typeof resetPasswordRequestSchema.parse>,
  ): Promise<{ reset: boolean }> {
    await this.authService.resetPassword(body.token, body.password);
    return { reset: true };
  }

  @Post("auth/verify-email")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async verifyEmail(
    @Body(new ZodValidationPipe(verifyEmailRequestSchema)) body: ReturnType<typeof verifyEmailRequestSchema.parse>,
  ): Promise<{ verified: boolean }> {
    await this.authService.verifyEmail(body.token);
    return { verified: true };
  }

  @Get("me")
  @UseGuards(SessionAuthGuard)
  async me(@CurrentUserId() userId: string): Promise<{ user: AuthenticatedUser }> {
    const user = await this.authService.toAuthenticatedUser(userId);
    return { user };
  }
}
