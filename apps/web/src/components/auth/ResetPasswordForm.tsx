"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SpireApiError } from "@spire/api-client";
import { passwordSchema } from "@spire/contracts";
import { Button, Input } from "@spire/ui-web";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { apiClient } from "@/lib/api-client";

const formSchema = z.object({ password: passwordSchema });
type FormValues = z.infer<typeof formSchema>;

export function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  if (!token) {
    return (
      <p role="alert" className="rounded-xl bg-status-dangerBg px-4 py-3 text-bodyMd text-status-danger">
        Link de redefinição inválido. Solicite um novo em &ldquo;Esqueci minha senha&rdquo;.
      </p>
    );
  }

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit(async (values) => {
        setServerError(null);
        try {
          await apiClient.auth.resetPassword({ token, password: values.password });
          router.push("/entrar");
        } catch (error) {
          setServerError(
            error instanceof SpireApiError ? error.message : "Não foi possível redefinir sua senha.",
          );
        }
      })}
    >
      <Input
        id="password"
        type="password"
        placeholder="Nova senha (mín. 10 caracteres)"
        icon={<Lock className="h-5 w-5" aria-hidden />}
        error={errors.password?.message}
        {...register("password")}
      />
      {serverError && (
        <p role="alert" className="rounded-xl bg-status-dangerBg px-4 py-3 text-bodySm text-status-danger">
          {serverError}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Salvando…" : "Redefinir senha"}
      </Button>
    </form>
  );
}
