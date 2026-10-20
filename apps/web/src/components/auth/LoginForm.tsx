"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SpireApiError } from "@spire/api-client";
import { loginRequestSchema } from "@spire/contracts";
import { Button, Input } from "@spire/ui-web";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { CURRENT_USER_QUERY_KEY } from "@/hooks/use-current-user";
import { apiClient } from "@/lib/api-client";

type LoginFormInput = z.input<typeof loginRequestSchema>;

export function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInput>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const { user } = await apiClient.auth.login(loginRequestSchema.parse(values));
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
      router.push("/inicio");
    } catch (error) {
      setServerError(
        error instanceof SpireApiError ? error.message : "Não foi possível entrar. Tente novamente.",
      );
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Input
        id="email"
        type="email"
        placeholder="Seu e-mail"
        icon={<Mail className="h-5 w-5" aria-hidden />}
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        id="password"
        type={showPassword ? "text" : "password"}
        placeholder="Sua senha"
        icon={<Lock className="h-5 w-5" aria-hidden />}
        error={errors.password?.message}
        rightElement={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="text-ink-tertiary"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        }
        {...register("password")}
      />

      <div className="flex items-center justify-between text-bodySm">
        <label className="flex items-center gap-2 text-ink-secondary">
          <input type="checkbox" className="h-4 w-4 rounded border-border-strong" {...register("rememberMe")} />
          Manter-me conectado
        </label>
        <Link href="/recuperar-senha" className="font-medium text-ink-primary underline underline-offset-2">
          Esqueci minha senha
        </Link>
      </div>

      {serverError && (
        <p role="alert" className="rounded-xl bg-status-dangerBg px-4 py-3 text-bodySm text-status-danger">
          {serverError}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Entrando…" : "Entrar"}
        {!isSubmitting && <span aria-hidden>→</span>}
      </Button>

      <p className="text-center text-bodySm text-ink-secondary">
        Ainda não tem uma conta?{" "}
        <Link href="/cadastro" className="font-semibold text-ink-primary underline underline-offset-2">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
