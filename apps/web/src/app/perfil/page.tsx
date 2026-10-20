"use client";

import { Card, EmptyState } from "@spire/ui-web";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { PreferencesForm } from "@/components/profile/PreferencesForm";
import { InstallPwaCard } from "@/components/pwa/InstallPwaCard";
import { CURRENT_USER_QUERY_KEY, useCurrentUser } from "@/hooks/use-current-user";
import { apiClient } from "@/lib/api-client";

export default function PerfilPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <AppShell>
        <div className="px-4 py-6 sm:px-6">
          <div className="h-24 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <div className="px-4 py-6 sm:px-6">
          <EmptyState
            title="Você não está conectado"
            description="Entre na sua conta para ver e editar seu perfil."
            action={
              <a
                href="/entrar"
                className="inline-flex h-12 items-center justify-center rounded-pill bg-brand-charcoal px-6 text-button text-ink-inverse"
              >
                Entrar
              </a>
            }
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-4 py-6 sm:px-6">
        <h1 className="font-display text-2xl text-ink-primary">Meu perfil</h1>

        <Card className="mt-6 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background-subtle text-xl font-semibold text-ink-secondary">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-display text-xl text-ink-primary">{user.name}</p>
              <p className="text-bodySm text-ink-secondary">{user.email}</p>
              <p className="mt-1 flex items-center gap-1 text-bodySm text-status-success">
                {user.emailVerifiedAt && (
                  <>
                    <ShieldCheck className="h-4 w-4" /> E-mail verificado
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-bodySm text-ink-secondary">
              <span>Seu perfil está {user.profileCompleteness}% completo</span>
            </div>
            <div className="mt-2 h-2 rounded-pill bg-background-subtle">
              <div
                className="h-2 rounded-pill bg-brand-olive"
                style={{ width: `${user.profileCompleteness}%` }}
              />
            </div>
          </div>
        </Card>

        <div className="mt-6">
          <InstallPwaCard />
        </div>

        <div className="mt-6">
          <h2 className="font-display text-xl text-ink-primary">Minhas preferências</h2>
          <p className="mt-1 text-bodySm text-ink-secondary">
            Usadas pelo Match Engine para calcular sua compatibilidade com os imóveis.
          </p>
          <div className="mt-4">
            <PreferencesForm />
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            await apiClient.auth.logout();
            queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
            router.push("/");
          }}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-pill border border-border-strong text-button text-ink-primary"
        >
          Sair da conta
        </button>
      </div>
    </AppShell>
  );
}
