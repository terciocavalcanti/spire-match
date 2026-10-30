"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SpireApiError } from "@spire/api-client";
import { changePasswordRequestSchema } from "@spire/contracts";
import { Button, Input } from "@spire/ui-web";
import { useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { CURRENT_USER_QUERY_KEY } from "@/hooks/use-current-user";
import { apiClient } from "@/lib/api-client";

type ChangePasswordInput = z.input<typeof changePasswordRequestSchema>;

export function ChangePasswordForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordRequestSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await apiClient.auth.changePassword(changePasswordRequestSchema.parse(values));
      await queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
      router.replace("/admin");
    } catch (error) {
      setServerError(error instanceof SpireApiError ? error.message : "Não foi possível trocar a senha. Tente novamente.");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Input
        id="currentPassword"
        type="password"
        placeholder="Senha temporária atual"
        icon={<Lock className="h-5 w-5" aria-hidden />}
        error={errors.currentPassword?.message}
        {...register("currentPassword")}
      />
      <Input
        id="newPassword"
        type="password"
        placeholder="Nova senha"
        icon={<Lock className="h-5 w-5" aria-hidden />}
        error={errors.newPassword?.message}
        {...register("newPassword")}
      />
      <p className="text-caption text-ink-tertiary">Mínimo de 10 caracteres, com ao menos uma letra e um número.</p>

      {serverError && (
        <p role="alert" className="rounded-xl bg-status-dangerBg px-4 py-3 text-bodySm text-status-danger">
          {serverError}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : "Definir nova senha"}
      </Button>
    </form>
  );
}
