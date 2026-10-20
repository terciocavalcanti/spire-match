"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SpireApiError } from "@spire/api-client";
import { passwordSchema } from "@spire/contracts";
import { Button, Input } from "@spire/ui-web";
import { useQueryClient } from "@tanstack/react-query";
import { Lock, Mail, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { CURRENT_USER_QUERY_KEY } from "@/hooks/use-current-user";
import { apiClient } from "@/lib/api-client";

const formSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome completo"),
    email: z.string().trim().toLowerCase().email("E-mail inválido"),
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptedTerms: z.literal(true, {
      errorMap: () => ({ message: "É preciso aceitar os termos para continuar" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

export function RegisterForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const { user } = await apiClient.auth.register({
        name: values.name,
        email: values.email,
        password: values.password,
        acceptedTermsAt: new Date().toISOString(),
      });
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
      router.push("/onboarding");
    } catch (error) {
      setServerError(
        error instanceof SpireApiError ? error.message : "Não foi possível criar sua conta. Tente novamente.",
      );
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Input
        id="name"
        placeholder="Seu nome completo"
        icon={<User className="h-5 w-5" aria-hidden />}
        error={errors.name?.message}
        {...register("name")}
      />
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
        type="password"
        placeholder="Crie uma senha (mín. 10 caracteres)"
        icon={<Lock className="h-5 w-5" aria-hidden />}
        error={errors.password?.message}
        {...register("password")}
      />
      <Input
        id="confirmPassword"
        type="password"
        placeholder="Confirme sua senha"
        icon={<Lock className="h-5 w-5" aria-hidden />}
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <label className="flex items-start gap-2 text-bodySm text-ink-secondary">
        <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-border-strong" {...register("acceptedTerms")} />
        <span>
          Li e aceito os{" "}
          <Link href="/termos" className="font-medium text-ink-primary underline underline-offset-2">
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" className="font-medium text-ink-primary underline underline-offset-2">
            Política de Privacidade
          </Link>
          .
        </span>
      </label>
      {errors.acceptedTerms && (
        <p role="alert" className="text-bodySm text-status-danger">
          {errors.acceptedTerms.message}
        </p>
      )}

      {serverError && (
        <p role="alert" className="rounded-xl bg-status-dangerBg px-4 py-3 text-bodySm text-status-danger">
          {serverError}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Criando conta…" : "Criar conta"}
        {!isSubmitting && <span aria-hidden>→</span>}
      </Button>

      <p className="text-center text-bodySm text-ink-secondary">
        Já tem uma conta?{" "}
        <Link href="/entrar" className="font-semibold text-ink-primary underline underline-offset-2">
          Entrar
        </Link>
      </p>
    </form>
  );
}
