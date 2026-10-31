"use client";

import { Button, Card, EmptyState } from "@spire/ui-web";
import { Factory, Trash2 } from "lucide-react";
import { useState } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import { useAdminDevelopments } from "@/hooks/use-admin-developments";
import { useAdminUsers } from "@/hooks/use-admin-users";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  useDevelopmentPartnerAccessList,
  useGrantDevelopmentPartnerAccess,
  useMyDevelopmentPartnerAccess,
  useRevokeDevelopmentPartnerAccess,
} from "@/hooks/use-development-partner-access";
import { isDeveloperPartnerOnly } from "@/lib/roles";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function DeveloperPartnerView() {
  const { data, isLoading } = useMyDevelopmentPartnerAccess();
  const items = data?.items ?? [];

  if (isLoading) return <div className="mt-6 h-64 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />;
  if (items.length === 0) {
    return (
      <div className="mt-6">
        <EmptyState
          icon={<Factory className="h-8 w-8" aria-hidden />}
          title="Nenhum empreendimento liberado"
          description="Quando o time comercial liberar acesso a um empreendimento, ele aparece aqui com os números reais."
        />
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      {items.map((item) => (
        <Card key={item.developmentId} className="p-5">
          <h2 className="font-display text-lg text-ink-primary">{item.developmentName}</h2>
          {item.stats.linkedPropertiesCount === 0 ? (
            <p className="mt-3 text-bodySm text-ink-tertiary">
              Nenhuma unidade deste empreendimento está vinculada ao catálogo ainda — resultados ficam disponíveis assim que o
              time comercial fizer o vínculo.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-caption text-ink-tertiary">Leads</p>
                <p className="font-display text-xl text-ink-primary">{item.stats.leadsCount}</p>
              </div>
              <div>
                <p className="text-caption text-ink-tertiary">Vendas</p>
                <p className="font-display text-xl text-ink-primary">{item.stats.wonCount}</p>
              </div>
              <div>
                <p className="text-caption text-ink-tertiary">VGV</p>
                <p className="font-display text-xl text-ink-primary">{currencyFormatter.format(item.stats.vgv)}</p>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function AccessManagementView() {
  const { data: accessData, isLoading } = useDevelopmentPartnerAccessList();
  const { data: developmentsData } = useAdminDevelopments({ limit: 100 });
  const { data: usersData } = useAdminUsers({ limit: 100 });
  const grant = useGrantDevelopmentPartnerAccess();
  const revoke = useRevokeDevelopmentPartnerAccess();

  const [developmentId, setDevelopmentId] = useState("");
  const [userId, setUserId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const accessList = accessData?.items ?? [];
  const developments = developmentsData?.items ?? [];
  const partnerUsers = (usersData?.items ?? []).filter((u) => u.roles.includes("DEVELOPER_PARTNER"));

  return (
    <div className="mt-6 space-y-6">
      <Card className="p-5">
        <h2 className="font-display text-lg text-ink-primary">Conceder acesso</h2>
        <p className="mt-1 text-bodySm text-ink-secondary">
          O usuário precisa já ter o papel Incorporadora atribuído em{" "}
          <a href="/admin/usuarios" className="text-brand-olive hover:underline">
            Usuários
          </a>
          .
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-caption text-ink-tertiary">Empreendimento</label>
            <select
              value={developmentId}
              onChange={(e) => setDevelopmentId(e.target.value)}
              className="mt-1 h-10 w-64 rounded-xl border border-border-subtle bg-background-base px-3 text-bodySm text-ink-primary"
            >
              <option value="">Selecionar…</option>
              {developments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-caption text-ink-tertiary">Usuário (papel Incorporadora)</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 h-10 w-64 rounded-xl border border-border-subtle bg-background-base px-3 text-bodySm text-ink-primary"
            >
              <option value="">Selecionar…</option>
              {partnerUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <Button
            size="sm"
            disabled={!developmentId || !userId || grant.isPending}
            onClick={() => {
              setError(null);
              grant.mutate(
                { developmentId, userId },
                {
                  onSuccess: () => {
                    setDevelopmentId("");
                    setUserId("");
                  },
                  onError: (err) => setError(err instanceof Error ? err.message : "Falha ao conceder acesso"),
                },
              );
            }}
          >
            {grant.isPending ? "Concedendo…" : "Conceder acesso"}
          </Button>
        </div>
        {partnerUsers.length === 0 && (
          <p className="mt-3 text-bodySm text-status-warm">Nenhum usuário com o papel Incorporadora cadastrado ainda.</p>
        )}
        {error && <p className="mt-3 text-bodySm text-status-danger">{error}</p>}
      </Card>

      <Card className="p-5">
        <h2 className="font-display text-lg text-ink-primary">Acessos concedidos</h2>
        {isLoading ? (
          <div className="mt-4 h-32 animate-pulse rounded-xl bg-background-subtle" aria-hidden />
        ) : accessList.length === 0 ? (
          <p className="mt-3 text-bodySm text-ink-tertiary">Nenhum acesso concedido ainda.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-border-subtle">
            <table className="w-full text-left">
              <thead className="border-b border-border-subtle bg-background-subtle text-caption uppercase tracking-wide text-ink-tertiary">
                <tr>
                  <th className="px-4 py-3">Empreendimento</th>
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {accessList.map((access) => (
                  <tr key={access.id}>
                    <td className="px-4 py-3 text-bodySm text-ink-primary">{access.developmentName}</td>
                    <td className="px-4 py-3 text-bodySm text-ink-secondary">
                      {access.userName} ({access.userEmail})
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => revoke.mutate(access.id)}
                        disabled={revoke.isPending}
                        aria-label="Revogar acesso"
                        className="text-ink-tertiary hover:text-status-danger"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function IncorporadorasPage() {
  const { data: user } = useCurrentUser();
  const partnerOnly = isDeveloperPartnerOnly(user?.roles);

  return (
    <AdminShell>
      <h1 className="font-display text-2xl text-ink-primary">Incorporadoras</h1>
      <p className="mt-1 text-bodyMd text-ink-secondary">
        {partnerOnly
          ? "Resultados reais dos seus empreendimentos liberados."
          : "Parceiros autorizados com acesso restrito a resultados agregados de seus próprios empreendimentos."}
      </p>

      {partnerOnly ? <DeveloperPartnerView /> : <AccessManagementView />}
    </AdminShell>
  );
}
