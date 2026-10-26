"use client";

import { Button, Card, EmptyState, FilterChip } from "@spire/ui-web";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { useBrokerForProperty } from "@/hooks/use-brokers";
import { useScheduleVisit, useVisitAvailability } from "@/hooks/use-visits";
import { apiClient } from "@/lib/api-client";

function nextDays(count: number): { iso: string; weekday: string; day: string }[] {
  const days = [];
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    days.push({
      iso: date.toISOString().slice(0, 10),
      weekday: date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
      day: date.toLocaleDateString("pt-BR", { day: "2-digit" }),
    });
  }
  return days;
}

function AgendarVisitaContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("imovel");
  const days = useMemo(() => nextDays(14), []);

  const [selectedDate, setSelectedDate] = useState(days[0]!.iso);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const { data: property, isLoading: loadingProperty } = useQuery({
    queryKey: ["property", slug],
    queryFn: () => apiClient.properties.bySlug(slug!),
    enabled: Boolean(slug),
  });
  const { data: brokerData, isLoading: loadingBroker } = useBrokerForProperty(property?.id);
  const broker = brokerData?.broker ?? null;

  const { data: availability, isLoading: loadingSlots } = useVisitAvailability(broker?.id, selectedDate);
  const scheduleVisit = useScheduleVisit();

  if (!slug) {
    return (
      <AppShell>
        <div className="px-4 py-6 sm:px-6">
          <EmptyState title="Nenhum imóvel selecionado" description="Acesse esta tela a partir da página de um imóvel." />
        </div>
      </AppShell>
    );
  }

  if (loadingProperty || loadingBroker) {
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

  if (!broker) {
    return (
      <AppShell>
        <div className="px-4 py-6 sm:px-6">
          <EmptyState
            title="Consultor ainda não atribuído"
            description="Este imóvel ainda não tem um corretor autorizado vinculado — ainda não é possível agendar uma visita."
          />
        </div>
      </AppShell>
    );
  }

  if (scheduleVisit.isSuccess) {
    const when = new Date(scheduleVisit.data.scheduledAt).toLocaleString("pt-BR", {
      timeZone: "America/Recife",
      dateStyle: "full",
      timeStyle: "short",
    });
    return (
      <AppShell>
        <div className="px-4 py-6 sm:px-6">
          <Card className="flex items-start gap-3 p-5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-status-success" />
            <div>
              <p className="font-display text-bodyLg text-ink-primary">Visita confirmada</p>
              <p className="mt-1 text-bodySm text-ink-secondary">
                {property.title} com {broker.name}, {when}.
              </p>
              <Link href="/minhas-visitas" className="mt-3 inline-block text-bodySm font-medium text-ink-primary underline">
                Ver minhas visitas
              </Link>
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-4 py-6 sm:px-6">
        <h1 className="font-display text-2xl text-ink-primary">Agendar visita</h1>
        <p className="mt-1 text-bodySm text-ink-secondary">
          {property.title} · com {broker.name}
        </p>

        <h2 className="mt-6 text-bodySm font-semibold text-ink-primary">Escolha o dia</h2>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {days.map((d) => (
            <FilterChip
              key={d.iso}
              active={selectedDate === d.iso}
              onClick={() => {
                setSelectedDate(d.iso);
                setSelectedTime(null);
              }}
              className="flex-col gap-0 px-3 py-1 capitalize"
            >
              <span className="block text-[10px]">{d.weekday}</span>
              <span className="block">{d.day}</span>
            </FilterChip>
          ))}
        </div>

        <h2 className="mt-6 text-bodySm font-semibold text-ink-primary">Escolha o horário</h2>
        {loadingSlots ? (
          <div className="mt-2 h-12 animate-pulse rounded-xl bg-background-subtle" aria-hidden />
        ) : (
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {availability?.slots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                disabled={!slot.available}
                onClick={() => setSelectedTime(slot.time)}
                className={`h-11 rounded-xl text-bodySm font-medium transition-colors ${
                  selectedTime === slot.time
                    ? "bg-brand-charcoal text-ink-inverse"
                    : slot.available
                      ? "bg-background-subtle text-ink-primary"
                      : "bg-background-subtle text-ink-tertiary line-through opacity-50"
                }`}
              >
                {slot.time}
              </button>
            ))}
          </div>
        )}

        <h2 className="mt-6 text-bodySm font-semibold text-ink-primary">Observações (opcional)</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Alguma preferência de horário ou pergunta para o corretor?"
          className="mt-2 w-full rounded-xl border border-border-subtle bg-background-elevated px-4 py-3 text-bodyMd text-ink-primary placeholder:text-ink-tertiary focus:outline-none"
        />

        {scheduleVisit.isError && (
          <p className="mt-3 text-bodySm text-status-danger">
            {scheduleVisit.error instanceof Error ? scheduleVisit.error.message : "Não foi possível agendar — tente outro horário."}
          </p>
        )}

        <Button
          className="mt-4 w-full"
          disabled={!selectedTime || scheduleVisit.isPending}
          onClick={() => {
            if (!selectedTime) return;
            const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00-03:00`).toISOString();
            scheduleVisit.mutate({ propertyId: property.id, brokerId: broker.id, scheduledAt, notes: notes.trim() || undefined });
          }}
        >
          <CalendarCheck className="h-4 w-4" />
          {scheduleVisit.isPending ? "Agendando…" : "Confirmar visita"}
        </Button>
      </div>
    </AppShell>
  );
}

export default function AgendarVisitaPage() {
  return (
    <Suspense fallback={null}>
      <AgendarVisitaContent />
    </Suspense>
  );
}
