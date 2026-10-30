"use client";

import type { CreateDevelopmentRequest, DevelopmentStatus } from "@spire/contracts";
import { DEVELOPMENT_STATUSES } from "@spire/contracts";
import { Button, EmptyState, Input } from "@spire/ui-web";
import { Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import {
  useAddDevelopmentBlock,
  useAdminDevelopments,
  useCreateDevelopment,
  useDevelopmentDetail,
  useRemoveDevelopmentBlock,
  useUpdateDevelopment,
} from "@/hooks/use-admin-developments";
import { DEVELOPMENT_STATUS_LABELS } from "@/lib/development-labels";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

type FormState = {
  name: string;
  description: string;
  status: DevelopmentStatus;
  incorporatorName: string;
  neighborhood: string;
  city: string;
  state: string;
  priceFrom: string;
  deliveryDate: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  status: "DRAFT",
  incorporatorName: "",
  neighborhood: "",
  city: "",
  state: "",
  priceFrom: "",
  deliveryDate: "",
};

function BlocksEditor({ developmentId }: { developmentId: string }) {
  const { data: detail } = useDevelopmentDetail(developmentId);
  const [name, setName] = useState("");
  const addBlock = useAddDevelopmentBlock(developmentId);
  const removeBlock = useRemoveDevelopmentBlock(developmentId);

  return (
    <div className="mt-4 rounded-xl border border-border-subtle p-4">
      <p className="mb-2 text-bodySm font-medium text-ink-primary">Torres / blocos</p>
      <div className="flex flex-wrap gap-2">
        {(detail?.blocks ?? []).map((block) => (
          <span key={block.id} className="flex items-center gap-1 rounded-pill bg-background-subtle px-3 py-1 text-bodySm text-ink-secondary">
            {block.name}
            <button type="button" onClick={() => removeBlock.mutate(block.id)} aria-label={`Remover ${block.name}`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {(detail?.blocks ?? []).length === 0 && <p className="text-bodySm text-ink-tertiary">Nenhum bloco cadastrado.</p>}
      </div>
      <div className="mt-3 flex gap-2">
        <Input placeholder="Ex.: Torre A" value={name} onChange={(e) => setName(e.target.value)} />
        <Button
          size="sm"
          variant="outline"
          disabled={!name.trim() || addBlock.isPending}
          onClick={() => {
            addBlock.mutate({ name }, { onSuccess: () => setName("") });
          }}
        >
          Adicionar
        </Button>
      </div>
    </div>
  );
}

function DevelopmentForm({
  initial,
  developmentId,
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  initial: FormState;
  developmentId: string | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (payload: CreateDevelopmentRequest) => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-border-subtle bg-background-elevated p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input placeholder="Nome do empreendimento" value={form.name} onChange={(e) => set("name", e.target.value)} />
        <Input placeholder="Incorporadora (opcional)" value={form.incorporatorName} onChange={(e) => set("incorporatorName", e.target.value)} />
        <Input placeholder="Bairro" value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
        <Input placeholder="Cidade" value={form.city} onChange={(e) => set("city", e.target.value)} />
        <Input placeholder="UF" maxLength={2} value={form.state} onChange={(e) => set("state", e.target.value)} />
        <Input placeholder="Preço a partir de (R$)" type="number" value={form.priceFrom} onChange={(e) => set("priceFrom", e.target.value)} />
        <Input placeholder="Entrega prevista (AAAA-MM-DD)" value={form.deliveryDate} onChange={(e) => set("deliveryDate", e.target.value)} />
        <select
          value={form.status}
          onChange={(e) => set("status", e.target.value as DevelopmentStatus)}
          className="h-14 rounded-xl border border-border-subtle bg-background-base px-4 text-bodyMd text-ink-primary"
        >
          {DEVELOPMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {DEVELOPMENT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <textarea
        placeholder="Descrição"
        value={form.description}
        onChange={(e) => set("description", e.target.value)}
        rows={3}
        className="rounded-xl border border-border-subtle bg-background-base px-4 py-3 text-bodyMd text-ink-primary"
      />

      {developmentId && <BlocksEditor developmentId={developmentId} />}

      <div className="flex gap-3">
        <Button
          size="sm"
          disabled={isSubmitting || !form.name.trim() || !form.neighborhood.trim() || !form.city.trim() || form.state.trim().length !== 2}
          onClick={() =>
            onSubmit({
              name: form.name,
              description: form.description,
              status: form.status,
              incorporatorName: form.incorporatorName || null,
              neighborhood: form.neighborhood,
              city: form.city,
              state: form.state,
              priceFrom: form.priceFrom ? Number(form.priceFrom) : null,
              deliveryDate: form.deliveryDate || null,
            })
          }
        >
          {isSubmitting ? "Salvando..." : developmentId ? "Salvar alterações" : "Criar empreendimento"}
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

export default function EmpreendimentosPage() {
  const [status, setStatus] = useState<DevelopmentStatus | "ALL">("ALL");
  const [q, setQ] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading } = useAdminDevelopments({ status: status === "ALL" ? undefined : status, q: q || undefined });
  const { data: editingDetail } = useDevelopmentDetail(editingId ?? undefined);
  const createDevelopment = useCreateDevelopment();
  const updateDevelopment = useUpdateDevelopment(editingId ?? "");

  const items = data?.items ?? [];

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink-primary">Empreendimentos</h1>
          <p className="mt-1 text-bodyMd text-ink-secondary">Empreendimento → torre/bloco → unidade, com preço de empreendimento separado.</p>
        </div>
        {!formOpen && (
          <Button
            size="sm"
            onClick={() => {
              setEditingId(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Novo empreendimento
          </Button>
        )}
      </div>

      {formOpen && (
        <DevelopmentForm
          key={editingId ?? "new"}
          developmentId={editingId}
          initial={
            editingId && editingDetail
              ? {
                  name: editingDetail.name,
                  description: editingDetail.description,
                  status: editingDetail.status,
                  incorporatorName: editingDetail.incorporatorName ?? "",
                  neighborhood: editingDetail.neighborhood,
                  city: editingDetail.city,
                  state: editingDetail.state,
                  priceFrom: editingDetail.priceFrom?.toString() ?? "",
                  deliveryDate: editingDetail.deliveryDate ?? "",
                }
              : EMPTY_FORM
          }
          isSubmitting={createDevelopment.isPending || updateDevelopment.isPending}
          onCancel={closeForm}
          onSubmit={(payload) => {
            if (editingId) {
              updateDevelopment.mutate(payload);
            } else {
              createDevelopment.mutate(payload, { onSuccess: closeForm });
            }
          }}
        />
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:w-80">
          <Input placeholder="Buscar por nome ou bairro" icon={<Search className="h-4 w-4" aria-hidden />} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatus("ALL")}
            className={`rounded-pill px-3 py-1.5 text-bodySm font-medium transition-colors ${status === "ALL" ? "bg-brand-charcoal text-ink-inverse" : "bg-background-subtle text-ink-secondary hover:bg-border-subtle"}`}
          >
            Todos
          </button>
          {DEVELOPMENT_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-pill px-3 py-1.5 text-bodySm font-medium transition-colors ${status === s ? "bg-brand-charcoal text-ink-inverse" : "bg-background-subtle text-ink-secondary hover:bg-border-subtle"}`}
            >
              {DEVELOPMENT_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
        ) : items.length === 0 ? (
          <EmptyState title="Nenhum empreendimento encontrado" description="Ajuste os filtros ou cadastre um novo empreendimento." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border-subtle bg-background-elevated">
            <table className="w-full text-left">
              <thead className="border-b border-border-subtle bg-background-subtle text-caption uppercase tracking-wide text-ink-tertiary">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">A partir de</th>
                  <th className="px-4 py-3">Unidades</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {items.map((dev) => (
                  <tr key={dev.id} className="hover:bg-background-subtle">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-primary">{dev.name}</p>
                      <p className="text-bodySm text-ink-tertiary">{dev.neighborhood}, {dev.city}</p>
                    </td>
                    <td className="px-4 py-3 text-bodySm text-ink-secondary">{DEVELOPMENT_STATUS_LABELS[dev.status]}</td>
                    <td className="px-4 py-3 text-bodySm text-ink-primary">{dev.priceFrom ? currencyFormatter.format(dev.priceFrom) : "—"}</td>
                    <td className="px-4 py-3 text-bodySm text-ink-secondary">
                      <Link href={`/admin/unidades?developmentId=${dev.id}`} className="text-brand-olive hover:underline">
                        {dev.unitsCount} unidade{dev.unitsCount === 1 ? "" : "s"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(dev.id);
                          setFormOpen(true);
                        }}
                        className="text-bodySm font-medium text-brand-olive hover:underline"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
