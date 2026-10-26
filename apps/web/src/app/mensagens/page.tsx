"use client";

import { Card, EmptyState } from "@spire/ui-web";
import Link from "next/link";

import { AppShell } from "@/components/layout/AppShell";
import { useMyContacts } from "@/hooks/use-contacts";

export default function MensagensPage() {
  const { data, isLoading } = useMyContacts();
  const items = data?.items ?? [];

  return (
    <AppShell>
      <div className="px-4 py-6 sm:px-6">
        <h1 className="font-display text-2xl text-ink-primary">Mensagens</h1>
        <p className="mt-1 text-bodySm text-ink-secondary">Histórico de contato com consultores, por imóvel.</p>

        {isLoading ? (
          <div className="mt-6 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="Nenhuma mensagem ainda"
              description="Toque em “Fale com consultor” na página de um imóvel para começar uma conversa."
            />
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {items.map((contact) => (
              <Card key={contact.id} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/imoveis/${contact.property.slug}`} className="truncate text-bodyMd font-medium text-ink-primary">
                    {contact.property.title}
                  </Link>
                  <span className="shrink-0 text-caption text-ink-tertiary">
                    {new Date(contact.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <p className="mt-0.5 text-caption text-ink-secondary">com {contact.broker.name}</p>
                <p className="mt-2 text-bodySm text-ink-secondary">&ldquo;{contact.message}&rdquo;</p>
                <Link href={`/atendimento/${contact.propertyId}`} className="mt-2 inline-block text-caption font-medium text-ink-primary underline">
                  Enviar nova mensagem
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
