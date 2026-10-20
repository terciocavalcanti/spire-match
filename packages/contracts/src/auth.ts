import { z } from "zod";

import { roleSchema } from "./common";

export const passwordSchema = z
  .string()
  .min(10, "A senha deve ter ao menos 10 caracteres")
  .regex(/[a-zA-Z]/, "A senha deve conter ao menos uma letra")
  .regex(/[0-9]/, "A senha deve conter ao menos um número");

export const registerRequestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: passwordSchema,
  acceptedTermsAt: z.string().datetime(),
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const loginRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().default(false),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const forgotPasswordRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;

export const resetPasswordRequestSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;

export const verifyEmailRequestSchema = z.object({
  token: z.string().min(1),
});
export type VerifyEmailRequest = z.infer<typeof verifyEmailRequestSchema>;

export const authenticatedUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  emailVerifiedAt: z.string().datetime().nullable(),
  roles: z.array(roleSchema),
  avatarUrl: z.string().url().nullable(),
  profileCompleteness: z.number().min(0).max(100),
  createdAt: z.string().datetime(),
});
export type AuthenticatedUser = z.infer<typeof authenticatedUserSchema>;

export const sessionResponseSchema = z.object({
  user: authenticatedUserSchema,
});
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
