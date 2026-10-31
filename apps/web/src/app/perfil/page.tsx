"use client";

import { Button, Card, EmptyState } from "@spire/ui-web";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChevronRight, Download, EyeOff, Handshake, Key, ShieldCheck, Trash2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { PreferencesForm } from "@/components/profile/PreferencesForm";
import { InstallPwaCard } from "@/components/pwa/InstallPwaCard";
import { PushNotificationsCard } from "@/components/pwa/PushNotificationsCard";
import { CURRENT_USER_QUERY_KEY, useCurrentUser } from "@/hooks/use-current-user";
import { useCreateDataRequest, useMyDataRequests } from "@/hooks/use-data-subject-requests";
import { apiClient } from "@/lib/api-client";

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function MyDataCard() {
  const { data: myRequests } = useMyDataRequests();
  const createRequest = useCreateDataRequest();
  const [confirmingDeletion, setConfirmingDeletion] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const hasPendingDeletion = myRequests?.items.some((r) => r.type === "EXCLUSAO" && r.status === "PENDENTE") ?? false;

  return (
    <Card className="p-4">
      <h2 className="text-bodyMd font-medium text-ink-primary">Meus dados</h2>
      <p className="mt-1 text-bodySm text-ink-secondary">Baixe uma cópia dos seus dados ou solicite a exclusão da sua conta.</p>

      <Button
        variant="outline"
        size="sm"
        className="mt-3 w-full"
        disabled={createRequest.isPending}
        onClick={() => {
          setExportMessage(null);
          createRequest.mutate(
            { type: "EXPORTACAO" },
            {
              onSuccess: (res) => {
                downloadJson(res.exportData, `meus-dados-valorimatch-${new Date().toISOString().slice(0, 10)}.json`);
                setExportMessage("Download iniciado.");
              },
              onError: () => setExportMessage("Não foi possível gerar a exportação — tente novamente."),
            },
          )
        }}
      >
        <Download className="h-4 w-4" aria-hidden />
        Baixar meus dados
      </Button>
      {exportMessage && <p className="mt-2 text-caption text-ink-tertiary">{exportMessage}</p>}

      {hasPendingDeletion ? (
        <p className="mt-3 text-bodySm text-status-warm">Sua solicitação de exclusão está pendente — o time comercial vai analisar.</p>
      ) : confirmingDeletion ? (
        <div className="mt-3 rounded-xl border border-status-danger/30 bg-status-dangerBg/40 p-3">
          <p className="flex items-start gap-2 text-bodySm text-status-danger">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Isso é irreversível: sua conta será anonimizada e sua sessão encerrada. A solicitação passa antes pelo time
            comercial.
          </p>
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              disabled={createRequest.isPending}
              onClick={() => createRequest.mutate({ type: "EXCLUSAO" }, { onSuccess: () => setConfirmingDeletion(false) })}
            >
              Confirmar solicitação
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfirmingDeletion(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmingDeletion(true)}
          className="mt-3 flex items-center gap-2 text-bodySm font-medium text-status-danger"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          Solicitar exclusão da minha conta
        </button>
      )}
    </Card>
  );
}

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

        <div className="mt-6 space-y-3">
          <InstallPwaCard />
          <PushNotificationsCard />
          <Link href="/tenho-um-imovel">
            <Card className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-ink-secondary" aria-hidden />
                <div>
                  <p className="text-bodyMd font-medium text-ink-primary">Tenho um imóvel</p>
                  <p className="text-bodySm text-ink-secondary">Solicite a captação e avaliação do seu imóvel</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-ink-tertiary" aria-hidden />
            </Card>
          </Link>
          <Link href="/mercado-privado">
            <Card className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <EyeOff className="h-5 w-5 text-ink-secondary" aria-hidden />
                <div>
                  <p className="text-bodyMd font-medium text-ink-primary">Mercado Privado</p>
                  <p className="text-bodySm text-ink-secondary">Oportunidades off-market verificadas pela VALORI</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-ink-tertiary" aria-hidden />
            </Card>
          </Link>
          <Link href="/mercado">
            <Card className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-ink-secondary" aria-hidden />
                <div>
                  <p className="text-bodyMd font-medium text-ink-primary">Mercado</p>
                  <p className="text-bodySm text-ink-secondary">Indicadores reais e simulador de financiamento</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-ink-tertiary" aria-hidden />
            </Card>
          </Link>
          <Link href="/parceiros">
            <Card className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Handshake className="h-5 w-5 text-ink-secondary" aria-hidden />
                <div>
                  <p className="text-bodyMd font-medium text-ink-primary">Parceiros</p>
                  <p className="text-bodySm text-ink-secondary">Benefícios de financiamento, seguros e reforma</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-ink-tertiary" aria-hidden />
            </Card>
          </Link>
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

        <div className="mt-6">
          <MyDataCard />
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
