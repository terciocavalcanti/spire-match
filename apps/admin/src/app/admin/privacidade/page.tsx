"use client";

import type { DataSubjectRequest } from "@spire/contracts";
import { Button, EmptyState } from "@spire/ui-web";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import { useDataSubjectRequests, useResolveDataSubjectRequest } from "@/hooks/use-data-subject-requests";
import { usePlatformSettings } from "@/hooks/use-settings";

const TYPE_LABELS: Record<DataSubjectRequest["type"], string> = {
  EXPORTACAO: "Exportação de dados",
  EXCLUSAO: "Exclusão de conta",
};

const STATUS_LABELS: Record<DataSubjectRequest["status"], string> = {
  PENDENTE: "Pendente",
  CONCLUIDO: "Concluído",
  REJEITADO: "Rejeitado",
};

const STATUS_CLASSES: Record<DataSubjectRequest["status"], string> = {
  PENDENTE: "bg-status-warmBg text-status-warm",
  CONCLUIDO: "bg-status-successBg text-status-success",
  REJEITADO: "bg-status-dangerBg text-status-danger",
};

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Recife", dateStyle: "short", timeStyle: "short" });

function PendingDeletionRow({ request }: { request: DataSubjectRequest }) {
  const [mode, setMode] = useState<"idle" | "confirming" | "rejecting">("idle");
  const [reason, setReason] = useState("");
  const resolve = useResolveDataSubjectRequest(request.id);

  if (mode === "confirming") {
    return (
      <div className="mt-2 rounded-xl border border-status-danger/30 bg-status-dangerBg/40 p-3">
        <p className="flex items-start gap-2 text-bodySm text-status-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Isso anonimiza a conta de {request.userEmail} e revoga a sessão — não pode ser desfeito. Confirmar mesmo assim?
        </p>
        <div className="mt-2 flex gap-2">
          <Button size="sm" disabled={resolve.isPending} onClick={() => resolve.mutate({ status: "CONCLUIDO" })}>
            {resolve.isPending ? "Confirmando…" : "Sim, excluir e anonimizar"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setMode("idle")}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "rejecting") {
    return (
      <div className="mt-2 space-y-2">
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Motivo da rejeição (obrigatório)"
          className="h-10 w-full rounded-xl border border-border-subtle bg-background-elevated px-3 text-bodySm text-ink-primary placeholder:text-ink-tertiary focus:border-brand-olive focus:outline-none"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={!reason.trim() || resolve.isPending}
            onClick={() => resolve.mutate({ status: "REJEITADO", rejectionReason: reason.trim() })}
          >
            Confirmar rejeição
          </Button>
          <Button size="sm" variant="outline" onClick={() => setMode("idle")}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 flex gap-2">
      <Button size="sm" onClick={() => setMode("confirming")}>
        Confirmar exclusão
      </Button>
      <Button size="sm" variant="outline" onClick={() => setMode("rejecting")}>
        Rejeitar
      </Button>
    </div>
  );
}

export default function PrivacidadeAdminPage() {
  const { data, isLoading } = useDataSubjectRequests();
  const { data: settings } = usePlatformSettings();
  const items = data?.items ?? [];

  return (
    <AdminShell>
      <h1 className="font-display text-2xl text-ink-primary">Privacidade</h1>
      <p className="mt-1 text-bodyMd text-ink-secondary">
        Solicitações LGPD de titulares de dados — exportações já são concluídas na hora pelo próprio comprador; exclusões de
        conta exigem confirmação do time comercial.
        {settings && ` Prazo de retenção configurado: ${settings.dataRetentionDays} dias.`}
      </p>

      <div className="mt-6">
        {isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
        ) : items.length === 0 ? (
          <EmptyState title="Nenhuma solicitação ainda" description="Pedidos de exportação ou exclusão de dados aparecem aqui." />
        ) : (
          <div className="space-y-3">
            {items.map((request) => (
              <div key={request.id} className="rounded-2xl border border-border-subtle bg-background-elevated p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink-primary">{request.userEmail}</p>
                    <p className="text-caption text-ink-tertiary">
                      {TYPE_LABELS[request.type]} · solicitado em {dateTimeFormatter.format(new Date(request.requestedAt))}
                    </p>
                  </div>
                  <span className={`rounded-pill px-2.5 py-1 text-caption font-medium ${STATUS_CLASSES[request.status]}`}>
                    {STATUS_LABELS[request.status]}
                  </span>
                </div>
                {request.rejectionReason && <p className="mt-2 text-bodySm text-status-danger">Motivo: {request.rejectionReason}</p>}
                {request.status === "PENDENTE" && request.type === "EXCLUSAO" && <PendingDeletionRow request={request} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
