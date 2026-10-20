"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordRequestSchema, type ForgotPasswordRequest } from "@spire/contracts";
import { Button, Input } from "@spire/ui-web";
import { Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { apiClient } from "@/lib/api-client";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordRequest>({ resolver: zodResolver(forgotPasswordRequestSchema) });

  if (sent) {
    return (
      <p role="status" className="rounded-xl bg-status-successBg px-4 py-3 text-bodyMd text-status-success">
        Se existir uma conta com este e-mail, enviamos um link para redefinir a senha.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        await apiClient.auth.forgotPassword(values);
        setSent(true);
      })}
      noValidate
      className="space-y-4"
    >
      <Input
        id="email"
        type="email"
        placeholder="Seu e-mail"
        icon={<Mail className="h-5 w-5" aria-hidden />}
        error={errors.email?.message}
        {...register("email")}
      />
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Enviando…" : "Enviar link de recuperação"}
      </Button>
    </form>
  );
}
