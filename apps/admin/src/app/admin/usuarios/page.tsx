"use client";

import type { AdminUser, Role } from "@spire/contracts";
import { STAFF_ROLES } from "@spire/contracts";
import { Button, EmptyState, Input } from "@spire/ui-web";
import { Copy, KeyRound, Plus, Search, ShieldCheck, UserX } from "lucide-react";
import { useState } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import {
  useAdminUsers,
  useCreateAdminUser,
  useRevokeAdminUserSessions,
  useSetAdminUserStatus,
  useUpdateAdminUserRoles,
} from "@/hooks/use-admin-users";
import { ROLE_LABELS } from "@/lib/role-labels";

const STATUS_LABELS: Record<AdminUser["status"], string> = {
  ACTIVE: "Ativo",
  SUSPENDED: "Suspenso",
  DELETED: "Excluído",
};

function RoleCheckboxes({ selected, onToggle }: { selected: Role[]; onToggle: (role: Role) => void }) {
  return (
    <div className="flex flex-wrap gap-3">
      {STAFF_ROLES.map((role) => (
        <label key={role} className="flex items-center gap-1.5 text-bodySm text-ink-secondary">
          <input
            type="checkbox"
            checked={selected.includes(role)}
            onChange={() => onToggle(role)}
            className="h-4 w-4 rounded border-border-strong"
          />
          {ROLE_LABELS[role]}
        </label>
      ))}
    </div>
  );
}

function CreateUserForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: (temp: string, email: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);
  const create = useCreateAdminUser();

  const toggleRole = (role: Role) =>
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));

  return (
    <form
      className="mt-6 flex flex-col gap-4 rounded-2xl border border-border-subtle bg-background-elevated p-5"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        if (roles.length === 0) {
          setError("Selecione ao menos um papel.");
          return;
        }
        create.mutate(
          { name, email, roles },
          {
            onSuccess: (res) => onCreated(res.temporaryPassword, res.email),
            onError: (err) => setError(err instanceof Error ? err.message : "Falha ao criar usuário"),
          },
        );
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input placeholder="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <p className="mb-2 text-bodySm font-medium text-ink-primary">Papéis</p>
        <RoleCheckboxes selected={roles} onToggle={toggleRole} />
      </div>
      {error && <p className="text-bodySm text-status-danger">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" size="sm" disabled={create.isPending}>
          {create.isPending ? "Criando..." : "Criar usuário"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function EditRolesRow({ user, onDone }: { user: AdminUser; onDone: () => void }) {
  const [roles, setRoles] = useState<Role[]>(user.roles.filter((r) => (STAFF_ROLES as readonly string[]).includes(r)));
  const [error, setError] = useState<string | null>(null);
  const updateRoles = useUpdateAdminUserRoles(user.id);

  const toggleRole = (role: Role) =>
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));

  return (
    <tr className="bg-background-subtle">
      <td colSpan={4} className="px-4 py-4">
        <div className="flex flex-col gap-3">
          <RoleCheckboxes selected={roles} onToggle={toggleRole} />
          {error && <p className="text-bodySm text-status-danger">{error}</p>}
          <div className="flex gap-3">
            <Button
              size="sm"
              disabled={updateRoles.isPending}
              onClick={() => {
                if (roles.length === 0) {
                  setError("Selecione ao menos um papel.");
                  return;
                }
                updateRoles.mutate(
                  { roles },
                  {
                    onSuccess: onDone,
                    onError: (err) => setError(err instanceof Error ? err.message : "Falha ao salvar papéis"),
                  },
                );
              }}
            >
              Salvar papéis
            </Button>
            <Button variant="outline" size="sm" onClick={onDone}>
              Cancelar
            </Button>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function UsuariosPage() {
  const [q, setQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createdCredential, setCreatedCredential] = useState<{ email: string; password: string } | null>(null);

  const { data, isLoading } = useAdminUsers({ q: q || undefined });
  const revokeSessions = useRevokeAdminUserSessions();
  const setStatus = useSetAdminUserStatus();

  const items = data?.items ?? [];

  return (
    <AdminShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink-primary">Usuários</h1>
          <p className="mt-1 text-bodyMd text-ink-secondary">Contas internas, papéis (RBAC) e revogação de sessões.</p>
        </div>
        {!createOpen && (
          <Button
            size="sm"
            onClick={() => {
              setCreatedCredential(null);
              setCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Novo usuário
          </Button>
        )}
      </div>

      {createdCredential && (
        <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-status-success/40 bg-status-success/10 px-5 py-4">
          <div>
            <p className="text-bodySm font-semibold text-ink-primary">
              Conta criada para {createdCredential.email}. Senha temporária (mostrada só agora, copie e envie com segurança):
            </p>
            <p className="mt-1 font-mono text-bodyMd text-ink-primary">{createdCredential.password}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void navigator.clipboard.writeText(createdCredential.password)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-background-elevated text-ink-secondary hover:text-ink-primary"
              aria-label="Copiar senha"
            >
              <Copy className="h-4 w-4" />
            </button>
            <Button variant="outline" size="sm" onClick={() => setCreatedCredential(null)}>
              Entendi
            </Button>
          </div>
        </div>
      )}

      {createOpen && (
        <CreateUserForm
          onCancel={() => setCreateOpen(false)}
          onCreated={(password, email) => {
            setCreateOpen(false);
            setCreatedCredential({ email, password });
          }}
        />
      )}

      <div className="mt-6 sm:w-80">
        <Input placeholder="Buscar por nome ou e-mail" icon={<Search className="h-4 w-4" aria-hidden />} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
        ) : items.length === 0 ? (
          <EmptyState title="Nenhum usuário interno encontrado" description="Crie a primeira conta de equipe com o botão acima." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border-subtle bg-background-elevated">
            <table className="w-full text-left">
              <thead className="border-b border-border-subtle bg-background-subtle text-caption uppercase tracking-wide text-ink-tertiary">
                <tr>
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">Papéis</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {items.map((user) =>
                  editingId === user.id ? (
                    <EditRolesRow key={user.id} user={user} onDone={() => setEditingId(null)} />
                  ) : (
                    <tr key={user.id} className="hover:bg-background-subtle">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink-primary">{user.name}</p>
                        <p className="text-bodySm text-ink-tertiary">{user.email}</p>
                        {user.mustChangePassword && (
                          <p className="mt-0.5 text-caption text-status-hot">Aguardando troca da senha temporária</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-bodySm text-ink-secondary">
                        {user.roles.map((r) => ROLE_LABELS[r]).join(", ") || "Sem papel"}
                      </td>
                      <td className="px-4 py-3 text-bodySm text-ink-secondary">{STATUS_LABELS[user.status]}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setEditingId(user.id)}
                            className="flex items-center gap-1 text-bodySm font-medium text-brand-olive hover:underline"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                            Papéis
                          </button>
                          <button
                            type="button"
                            disabled={revokeSessions.isPending}
                            onClick={() => revokeSessions.mutate(user.id)}
                            className="flex items-center gap-1 text-bodySm font-medium text-ink-secondary hover:underline"
                          >
                            <KeyRound className="h-3.5 w-3.5" aria-hidden />
                            Revogar sessões
                          </button>
                          <button
                            type="button"
                            disabled={setStatus.isPending}
                            onClick={() => setStatus.mutate({ id: user.id, status: user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" })}
                            className="flex items-center gap-1 text-bodySm font-medium text-status-danger hover:underline"
                          >
                            <UserX className="h-3.5 w-3.5" aria-hidden />
                            {user.status === "ACTIVE" ? "Suspender" : "Reativar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
