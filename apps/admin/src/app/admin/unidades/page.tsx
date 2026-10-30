"use client";

import type { CreateUnitRequest, UnitStatus } from "@spire/contracts";
import { UNIT_STATUSES } from "@spire/contracts";
import { Button, EmptyState, Input } from "@spire/ui-web";
import { Download, Plus, Search, Upload } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import { useAdminDevelopments } from "@/hooks/use-admin-developments";
import { useAdminUnits, useCreateUnit, useImportUnits, useUpdateUnit } from "@/hooks/use-admin-units";
import { parseCsv, toCsv, downloadCsv } from "@/lib/csv";
import { UNIT_STATUS_LABELS } from "@/lib/development-labels";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

type FormState = {
  developmentId: string;
  identifier: string;
  floor: string;
  areaSqm: string;
  bedrooms: string;
  parkingSpaces: string;
  price: string;
  status: UnitStatus;
};

function emptyForm(developmentId: string): FormState {
  return { developmentId, identifier: "", floor: "", areaSqm: "", bedrooms: "0", parkingSpaces: "0", price: "", status: "AVAILABLE" };
}

function UnitForm({
  initial,
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  initial: FormState;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (payload: CreateUnitRequest) => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const { data: devData } = useAdminDevelopments({ limit: 100 });
  const developments = devData?.items ?? [];

  return (
    <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-border-subtle bg-background-elevated p-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <select
          value={form.developmentId}
          onChange={(e) => set("developmentId", e.target.value)}
          className="h-14 rounded-xl border border-border-subtle bg-background-base px-4 text-bodyMd text-ink-primary sm:col-span-1"
        >
          <option value="">Selecione o empreendimento</option>
          {developments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <Input placeholder="Identificador (ex.: Apto 101)" value={form.identifier} onChange={(e) => set("identifier", e.target.value)} />
        <Input placeholder="Andar" type="number" value={form.floor} onChange={(e) => set("floor", e.target.value)} />
        <Input placeholder="Área (m²)" type="number" value={form.areaSqm} onChange={(e) => set("areaSqm", e.target.value)} />
        <Input placeholder="Quartos" type="number" value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} />
        <Input placeholder="Vagas" type="number" value={form.parkingSpaces} onChange={(e) => set("parkingSpaces", e.target.value)} />
        <Input placeholder="Preço (R$)" type="number" value={form.price} onChange={(e) => set("price", e.target.value)} />
        <select
          value={form.status}
          onChange={(e) => set("status", e.target.value as UnitStatus)}
          className="h-14 rounded-xl border border-border-subtle bg-background-base px-4 text-bodyMd text-ink-primary"
        >
          {UNIT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {UNIT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-3">
        <Button
          size="sm"
          disabled={isSubmitting || !form.developmentId || !form.identifier.trim() || !form.areaSqm || !form.price}
          onClick={() =>
            onSubmit({
              developmentId: form.developmentId,
              identifier: form.identifier,
              floor: form.floor ? Number(form.floor) : null,
              areaSqm: Number(form.areaSqm),
              bedrooms: Number(form.bedrooms) || 0,
              parkingSpaces: Number(form.parkingSpaces) || 0,
              price: Number(form.price),
              status: form.status,
            })
          }
        >
          {isSubmitting ? "Salvando..." : "Salvar unidade"}
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function UnidadesContent() {
  const searchParams = useSearchParams();
  const developmentIdFilter = searchParams.get("developmentId") ?? undefined;

  const [status, setStatus] = useState<UnitStatus | "ALL">("ALL");
  const [q, setQ] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useAdminUnits({
    developmentId: developmentIdFilter,
    status: status === "ALL" ? undefined : status,
    q: q || undefined,
    limit: 200,
  });
  const { data: devData } = useAdminDevelopments({ limit: 100 });
  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit(editingId ?? "");
  const importUnits = useImportUnits();

  const items = data?.items ?? [];
  const editingUnit = items.find((u) => u.id === editingId);
  const filteredDevelopmentName = devData?.items.find((d) => d.id === developmentIdFilter)?.name;

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const handleExport = () => {
    const headers = ["empreendimento", "identificador", "andar", "area_m2", "quartos", "vagas", "preco", "status"];
    const rows = items.map((u) => [
      u.developmentName,
      u.identifier,
      u.floor?.toString() ?? "",
      u.areaSqm.toString(),
      u.bedrooms.toString(),
      u.parkingSpaces.toString(),
      u.price.toString(),
      u.status,
    ]);
    downloadCsv(`unidades-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(headers, rows));
  };

  const handleImportFile = async (file: File) => {
    if (!developmentIdFilter) {
      setImportMessage("Selecione um empreendimento (filtro acima) antes de importar.");
      return;
    }
    const text = await file.text();
    const parsed = parseCsv(text);
    const rows = parsed.map((row) => ({
      identifier: row["identificador"],
      floor: row["andar"] ? Number(row["andar"]) : null,
      areaSqm: Number(row["area_m2"]),
      bedrooms: Number(row["quartos"] || 0),
      parkingSpaces: Number(row["vagas"] || 0),
      price: Number(row["preco"]),
      status: (row["status"] || "AVAILABLE").toUpperCase(),
    }));
    importUnits.mutate(
      { developmentId: developmentIdFilter, rows },
      {
        onSuccess: (res) => {
          setImportMessage(
            res.errors.length === 0
              ? `${res.imported} unidade(s) importada(s) com sucesso.`
              : `${res.imported} importada(s). ${res.errors.length} linha(s) com erro: ${res.errors.map((e) => `linha ${e.row} (${e.message})`).join("; ")}`,
          );
        },
        onError: () => setImportMessage("Falha ao importar o arquivo."),
      },
    );
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink-primary">Unidades</h1>
          <p className="mt-1 text-bodyMd text-ink-secondary">
            Disponibilidade, status e histórico de preço por unidade{filteredDevelopmentName ? ` — ${filteredDevelopmentName}` : ""}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={items.length === 0}>
            <Download className="h-4 w-4" aria-hidden />
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={importUnits.isPending}>
            <Upload className="h-4 w-4" aria-hidden />
            Importar CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
              e.target.value = "";
            }}
          />
          {!formOpen && (
            <Button
              size="sm"
              onClick={() => {
                setEditingId(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Nova unidade
            </Button>
          )}
        </div>
      </div>

      {importMessage && (
        <p className="mt-4 rounded-xl bg-background-subtle px-4 py-3 text-bodySm text-ink-secondary">{importMessage}</p>
      )}

      {formOpen && (
        <UnitForm
          key={editingId ?? "new"}
          initial={
            editingUnit
              ? {
                  developmentId: editingUnit.developmentId,
                  identifier: editingUnit.identifier,
                  floor: editingUnit.floor?.toString() ?? "",
                  areaSqm: editingUnit.areaSqm.toString(),
                  bedrooms: editingUnit.bedrooms.toString(),
                  parkingSpaces: editingUnit.parkingSpaces.toString(),
                  price: editingUnit.price.toString(),
                  status: editingUnit.status,
                }
              : emptyForm(developmentIdFilter ?? "")
          }
          isSubmitting={createUnit.isPending || updateUnit.isPending}
          onCancel={closeForm}
          onSubmit={(payload) => {
            if (editingId) {
              updateUnit.mutate(payload, { onSuccess: closeForm });
            } else {
              createUnit.mutate(payload, { onSuccess: closeForm });
            }
          }}
        />
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:w-80">
          <Input placeholder="Buscar por identificador" icon={<Search className="h-4 w-4" aria-hidden />} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatus("ALL")}
            className={`rounded-pill px-3 py-1.5 text-bodySm font-medium transition-colors ${status === "ALL" ? "bg-brand-charcoal text-ink-inverse" : "bg-background-subtle text-ink-secondary hover:bg-border-subtle"}`}
          >
            Todas
          </button>
          {UNIT_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-pill px-3 py-1.5 text-bodySm font-medium transition-colors ${status === s ? "bg-brand-charcoal text-ink-inverse" : "bg-background-subtle text-ink-secondary hover:bg-border-subtle"}`}
            >
              {UNIT_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
        ) : items.length === 0 ? (
          <EmptyState title="Nenhuma unidade encontrada" description="Ajuste os filtros ou cadastre uma nova unidade." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border-subtle bg-background-elevated">
            <table className="w-full text-left">
              <thead className="border-b border-border-subtle bg-background-subtle text-caption uppercase tracking-wide text-ink-tertiary">
                <tr>
                  <th className="px-4 py-3">Unidade</th>
                  <th className="px-4 py-3">Empreendimento</th>
                  <th className="px-4 py-3">Preço</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {items.map((unit) => (
                  <tr key={unit.id} className="hover:bg-background-subtle">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-primary">{unit.identifier}{unit.blockName ? ` · ${unit.blockName}` : ""}</p>
                      <p className="text-bodySm text-ink-tertiary">
                        {unit.areaSqm} m² · {unit.bedrooms} qts · {unit.parkingSpaces} vaga{unit.parkingSpaces === 1 ? "" : "s"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-bodySm text-ink-secondary">{unit.developmentName}</td>
                    <td className="px-4 py-3 text-bodySm text-ink-primary">{currencyFormatter.format(unit.price)}</td>
                    <td className="px-4 py-3 text-bodySm text-ink-secondary">{UNIT_STATUS_LABELS[unit.status]}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(unit.id);
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

export default function UnidadesPage() {
  return (
    <Suspense fallback={null}>
      <UnidadesContent />
    </Suspense>
  );
}
