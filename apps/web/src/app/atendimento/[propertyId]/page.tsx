"use client";

import { Button, Card, EmptyState } from "@spire/ui-web";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { useBrokerForProperty } from "@/hooks/use-brokers";
import { useCreateContact } from "@/hooks/use-contacts";
import { apiClient } from "@/lib/api-client";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "").concat(parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "").toUpperCase();
}

export default function AtendimentoPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(params);
  const [message, setMessage] = useState("");

  const { data: property, isLoading: loadingProperty } = useQuery({
    queryKey: ["property", "by-id", propertyId],
    queryFn: () => apiClient.properties.byId(propertyId),
  });
  const { data: brokerData, isLoading: loadingBroker } = useBrokerForProperty(propertyId);
  const createContact = useCreateContact();

  const broker = brokerData?.broker ?? null;
  const isLoading = loadingProperty || loadingBroker;

  if (isLoading) {
    return (
      <AppShell>
        <div className="px-4 py-6 sm:px-6">
          <div className="h-32 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
        </div>
      </AppShell>
    );
  }

  if (!property) {
    return (
      <AppShell>
        <div className="px-4 py-6 sm:px-6">
          <EmptyState title="Imóvel não encontrado" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-4 py-6 sm:px-6">
        <h1 className="font-display text-2xl text-ink-primary">Fale com um consultor</h1>
        <p className="mt-1 text-bodySm text-ink-secondary">
          {property.title} · {currencyFormatter.format(property.price)}
        </p>

        {!broker ? (
          <div className="mt-6">
            <EmptyState
              title="Consultor ainda não atribuído"
              description="Este imóvel ainda não tem um corretor autorizado vinculado na plataforma — assim que houver, você poderá falar diretamente com ele por aqui."
            />
          </div>
        ) : (
          <>
            <Card className="mt-6 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background-subtle text-lg font-semibold text-ink-secondary">
                  {broker.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={broker.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    initials(broker.name)
                  )}
                </div>
                <div>
                  <p className="font-display text-lg text-ink-primary">{broker.name}</p>
                  {broker.creci && <p className="text-caption text-ink-tertiary">{broker.creci}</p>}
                </div>
              </div>
              {broker.bio && <p className="mt-3 text-bodySm text-ink-secondary">{broker.bio}</p>}
            </Card>

            {createContact.isSuccess ? (
              <Card className="mt-6 flex items-start gap-3 p-5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-status-success" />
                <div>
                  <p className="font-display text-bodyLg text-ink-primary">Mensagem enviada</p>
                  <p className="mt-1 text-bodySm text-ink-secondary">
                    {broker.name} recebeu seu contato sobre este imóvel.{" "}
                    <Link href="/mensagens" className="font-medium text-ink-primary underline">
                      Ver minhas mensagens
                    </Link>
                  </p>
                </div>
              </Card>
            ) : (
              <form
                className="mt-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!message.trim()) return;
                  createContact.mutate({ propertyId, channel: "PLATFORM", message: message.trim() });
                }}
              >
                <label htmlFor="contact-message" className="text-bodySm font-medium text-ink-primary">
                  Sua mensagem
                </label>
                <textarea
                  id="contact-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder={`Olá! Tenho interesse no imóvel ${property.title}, podemos conversar?`}
                  className="mt-2 w-full rounded-xl border border-border-subtle bg-background-elevated px-4 py-3 text-bodyMd text-ink-primary placeholder:text-ink-tertiary focus:outline-none"
                />
                <Button type="submit" className="mt-3 w-full" disabled={!message.trim() || createContact.isPending}>
                  <MessageCircle className="h-4 w-4" />
                  {createContact.isPending ? "Enviando…" : "Enviar mensagem"}
                </Button>

                {broker.phone && (
                  <a
                    href={`https://wa.me/${broker.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                      `Olá, ${broker.name}! Tenho interesse no imóvel ${property.title}.`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 flex h-12 w-full items-center justify-center rounded-pill border border-border-strong text-button text-ink-primary"
                  >
                    Chamar no WhatsApp
                  </a>
                )}
              </form>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
