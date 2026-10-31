"use client";

import { Button, EmptyState, Input } from "@spire/ui-web";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Fragment, useState } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import { useAuditLogs } from "@/hooks/use-audit-logs";

const ENTITY_TYPE_LABELS: Record<string, string> = {
  user: "Usuário",
  lead: "Lead",
  owner_lead: "Captação",
  private_market_offer: "Oferta (Mercado Privado)",
  development_partner_access: "Acesso de incorporadora",
  platform_settings: "Configurações",
  data_subject_request: "Solicitação LGPD",
};

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Recife", dateStyle: "short", timeStyle: "medium" });

export default function AuditoriaPage() {
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useAuditLogs({
    action: action.trim() || undefined,
    entityType: entityType || undefined,
  });

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <AdminShell>
      <h1 className="font-display text-2xl text-ink-primary">Auditoria</h1>
      <p className="mt-1 text-bodyMd text-ink-secondary">
        Trilha de ações privilegiadas — mudança de papéis, estágios financeiros, publicação de captações, verificação do Mercado
        Privado, configurações da plataforma e solicitações LGPD.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:w-72">
          <Input placeholder="Buscar por ação (ex.: lead.stage)" value={action} onChange={(e) => setAction(e.target.value)} />
        </div>
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="h-12 w-full rounded-xl border border-border-subtle bg-background-elevated px-3 text-bodyMd text-ink-primary focus:border-brand-olive focus:outline-none sm:w-64"
        >
          <option value="">Todas as entidades</option>
          {Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
        ) : items.length === 0 ? (
          <EmptyState title="Nenhum registro encontrado" description="Ajuste os filtros ou aguarde novas ações privilegiadas." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border-subtle bg-background-elevated">
            <table className="w-full text-left">
              <thead className="border-b border-border-subtle bg-background-subtle text-caption uppercase tracking-wide text-ink-tertiary">
                <tr>
                  <th className="px-4 py-3">Quando</th>
                  <th className="px-4 py-3">Ator</th>
                  <th className="px-4 py-3">Ação</th>
                  <th className="px-4 py-3">Entidade</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {items.map((log) => (
                  <Fragment key={log.id}>
                    <tr className="hover:bg-background-subtle">
                      <td className="px-4 py-3 text-bodySm text-ink-secondary">{dateTimeFormatter.format(new Date(log.createdAt))}</td>
                      <td className="px-4 py-3 text-bodySm text-ink-secondary">{log.actorEmail ?? "Sistema"}</td>
                      <td className="px-4 py-3 font-mono text-caption text-ink-primary">{log.action}</td>
                      <td className="px-4 py-3 text-bodySm text-ink-secondary">{ENTITY_TYPE_LABELS[log.entityType] ?? log.entityType}</td>
                      <td className="px-4 py-3 text-right">
                        {log.metadata && (
                          <button
                            type="button"
                            onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                            aria-label="Ver detalhes"
                            className="text-ink-tertiary hover:text-ink-primary"
                          >
                            {expandedId === log.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedId === log.id && log.metadata && (
                      <tr>
                        <td colSpan={5} className="bg-background-subtle px-4 py-3">
                          <pre className="overflow-x-auto text-caption text-ink-secondary">{JSON.stringify(log.metadata, null, 2)}</pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {hasNextPage && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" size="sm" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
            {isFetchingNextPage ? "Carregando…" : "Carregar mais"}
          </Button>
        </div>
      )}
    </AdminShell>
  );
}
