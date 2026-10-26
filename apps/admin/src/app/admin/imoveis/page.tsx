"use client";

import type { PropertyStatus } from "@spire/contracts";
import { PROPERTY_STATUSES } from "@spire/contracts";
import { Button, EmptyState, Input } from "@spire/ui-web";
import { Plus, Search } from "lucide-react";
import { useState } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import { PropertyForm } from "@/components/properties/PropertyForm";
import { useBrokers } from "@/hooks/use-admin-brokers";
import { useAdminProperties, useCreateProperty, usePropertyDetail, useUpdateProperty } from "@/hooks/use-admin-properties";
import { PROPERTY_STATUS_LABELS } from "@/lib/property-labels";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export default function ImoveisPage() {
  const [status, setStatus] = useState<PropertyStatus | "ALL">("ALL");
  const [q, setQ] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading } = useAdminProperties({ status: status === "ALL" ? undefined : status, q: q || undefined });
  const { data: brokersData } = useBrokers();
  const { data: editingProperty } = usePropertyDetail(editingId ?? undefined);
  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty(editingId ?? "");

  const properties = data?.items ?? [];
  const brokers = brokersData?.items ?? [];

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink-primary">Imóveis</h1>
          <p className="mt-1 text-bodyMd text-ink-secondary">Catálogo completo com status, preço e corretor responsável.</p>
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
            Novo imóvel
          </Button>
        )}
      </div>

      {formOpen && (
        <div className="mt-6">
          {editingId && !editingProperty ? (
            <div className="h-64 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
          ) : (
            <PropertyForm
              property={editingProperty}
              brokers={brokers}
              isSubmitting={createProperty.isPending || updateProperty.isPending}
              onCancel={closeForm}
              onSubmit={(payload) => {
                if (editingId) {
                  updateProperty.mutate(payload, { onSuccess: closeForm });
                } else {
                  createProperty.mutate(payload, { onSuccess: closeForm });
                }
              }}
            />
          )}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:w-80">
          <Input placeholder="Buscar por título" icon={<Search className="h-4 w-4" aria-hidden />} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatus("ALL")}
            className={`rounded-pill px-3 py-1.5 text-bodySm font-medium transition-colors ${
              status === "ALL" ? "bg-brand-charcoal text-ink-inverse" : "bg-background-subtle text-ink-secondary hover:bg-border-subtle"
            }`}
          >
            Todos
          </button>
          {PROPERTY_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-pill px-3 py-1.5 text-bodySm font-medium transition-colors ${
                status === s ? "bg-brand-charcoal text-ink-inverse" : "bg-background-subtle text-ink-secondary hover:bg-border-subtle"
              }`}
            >
              {PROPERTY_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
        ) : properties.length === 0 ? (
          <EmptyState title="Nenhum imóvel encontrado" description="Ajuste os filtros ou cadastre um novo imóvel." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border-subtle bg-background-elevated">
            <table className="w-full text-left">
              <thead className="border-b border-border-subtle bg-background-subtle text-caption uppercase tracking-wide text-ink-tertiary">
                <tr>
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Preço</th>
                  <th className="px-4 py-3">Localização</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {properties.map((property) => (
                  <tr key={property.id} className="hover:bg-background-subtle">
                    <td className="px-4 py-3 font-medium text-ink-primary">{property.title}</td>
                    <td className="px-4 py-3 text-bodySm text-ink-secondary">{PROPERTY_STATUS_LABELS[property.status]}</td>
                    <td className="px-4 py-3 text-bodySm text-ink-primary">{currencyFormatter.format(property.price)}</td>
                    <td className="px-4 py-3 text-bodySm text-ink-secondary">
                      {property.neighborhood}, {property.city}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(property.id);
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
