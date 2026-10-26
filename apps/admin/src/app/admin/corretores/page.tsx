"use client";

import type { Broker } from "@spire/contracts";
import { Button, EmptyState, Input } from "@spire/ui-web";
import { Plus } from "lucide-react";
import { useState } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import { useBrokers, useCreateBroker, useUpdateBroker } from "@/hooks/use-admin-brokers";

interface BrokerFormState {
  name: string;
  email: string;
  phone: string;
  creci: string;
  bio: string;
}

function toFormState(broker?: Broker): BrokerFormState {
  return {
    name: broker?.name ?? "",
    email: broker?.email ?? "",
    phone: broker?.phone ?? "",
    creci: broker?.creci ?? "",
    bio: broker?.bio ?? "",
  };
}

export default function CorretoresPage() {
  const { data, isLoading } = useBrokers();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Broker | null>(null);
  const [form, setForm] = useState<BrokerFormState>(() => toFormState());
  const [error, setError] = useState<string | null>(null);

  const createBroker = useCreateBroker();
  const updateBroker = useUpdateBroker(editing?.id ?? "");
  const brokers = data?.items ?? [];

  const openCreate = () => {
    setEditing(null);
    setForm(toFormState());
    setFormOpen(true);
  };

  const openEdit = (broker: Broker) => {
    setEditing(broker);
    setForm(toFormState(broker));
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setError(null);
  };

  const set = <K extends keyof BrokerFormState>(key: K, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError("Informe nome e e-mail do corretor.");
      return;
    }
    setError(null);
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      creci: form.creci.trim() || null,
      bio: form.bio.trim(),
    };
    const onSuccess = () => closeForm();
    const onError = () => setError("Não foi possível salvar — verifique se o e-mail já está em uso.");
    if (editing) {
      updateBroker.mutate(payload, { onSuccess, onError });
    } else {
      createBroker.mutate(payload, { onSuccess, onError });
    }
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink-primary">Corretores</h1>
          <p className="mt-1 text-bodyMd text-ink-secondary">Time comercial responsável pelo atendimento e visitas.</p>
        </div>
        {!formOpen && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden />
            Novo corretor
          </Button>
        )}
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-border-subtle bg-background-elevated p-5">
          <h2 className="font-display text-lg text-ink-primary">{editing ? "Editar corretor" : "Novo corretor"}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-bodySm text-ink-secondary">Nome</span>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-bodySm text-ink-secondary">E-mail</span>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-bodySm text-ink-secondary">Telefone</span>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-bodySm text-ink-secondary">CRECI</span>
              <Input value={form.creci} onChange={(e) => set("creci", e.target.value)} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-bodySm text-ink-secondary">Bio</span>
            <textarea
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border-subtle bg-background-elevated p-3 text-bodyMd text-ink-primary focus:border-brand-olive focus:outline-none"
            />
          </label>
          {error && <p className="text-bodySm text-status-danger">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" disabled={createBroker.isPending || updateBroker.isPending}>
              {createBroker.isPending || updateBroker.isPending ? "Salvando…" : editing ? "Salvar alterações" : "Criar corretor"}
            </Button>
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6">
        {isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
        ) : brokers.length === 0 ? (
          <EmptyState title="Nenhum corretor cadastrado" description="Cadastre o time comercial para atribuir leads e visitas." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border-subtle bg-background-elevated">
            <table className="w-full text-left">
              <thead className="border-b border-border-subtle bg-background-subtle text-caption uppercase tracking-wide text-ink-tertiary">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Telefone</th>
                  <th className="px-4 py-3">CRECI</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {brokers.map((broker) => (
                  <tr key={broker.id} className="hover:bg-background-subtle">
                    <td className="px-4 py-3 font-medium text-ink-primary">{broker.name}</td>
                    <td className="px-4 py-3 text-bodySm text-ink-secondary">{broker.email}</td>
                    <td className="px-4 py-3 text-bodySm text-ink-secondary">{broker.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-bodySm text-ink-secondary">{broker.creci ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => openEdit(broker)} className="text-bodySm font-medium text-brand-olive hover:underline">
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
