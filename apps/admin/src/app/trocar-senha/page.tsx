"use client";

import { SpireMark } from "@spire/ui-web";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function TrocarSenhaPage() {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace("/entrar");
    else if (!user.mustChangePassword) router.replace("/admin");
  }, [isLoading, user, router]);

  if (isLoading || !user || !user.mustChangePassword) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background-base">
        <div className="h-10 w-10 animate-pulse rounded-full bg-background-subtle" aria-hidden />
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 flex items-center gap-2 text-ink-primary">
        <SpireMark className="h-6 w-6" />
        <span className="font-display text-lg tracking-[0.2em]">VALORI MATCH</span>
      </div>

      <h1 className="font-display text-3xl text-ink-primary">Troque sua senha</h1>
      <p className="mt-2 text-bodyLg text-ink-secondary">
        Sua conta foi criada com uma senha temporária. Defina uma nova senha para continuar.
      </p>

      <div className="mt-8">
        <ChangePasswordForm />
      </div>
    </main>
  );
}
