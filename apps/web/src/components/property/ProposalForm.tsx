"use client";

import type { PaymentMethod, PropertyDetail } from "@spire/contracts";
import { Button, Input } from "@spire/ui-web";
import { CheckCircle2, FileText } from "lucide-react";
import { useState } from "react";

import { useCreateProposal } from "@/hooks/use-proposals";

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  A_VISTA: "À vista",
  FINANCIAMENTO: "Financiamento",
  CONSORCIO: "Consórcio",
  PERMUTA: "Permuta",
};

export function ProposalForm({ property }: { property: PropertyDetail }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(property.price));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>(property.acceptedPaymentMethods[0]);
  const [message, setMessage] = useState("");
  const createProposal = useCreateProposal();

  if (createProposal.isSuccess) {
    return (
      <div className="flex items-start gap-3 border-t border-border-subtle py-5">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-status-success" />
        <div>
          <p className="font-display text-bodyLg text-ink-primary">Proposta enviada</p>
          <p className="mt-1 text-bodySm text-ink-secondary">Acompanhe o retorno em Minhas visitas.</p>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="border-t border-border-subtle py-5">
        <button type="button" onClick={() => setOpen(true)} className="text-bodyMd font-medium text-ink-primary underline">
          Fazer uma proposta
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-border-subtle py-5">
      <h2 className="font-display text-xl text-ink-primary">Fazer uma proposta</h2>
      <div className="mt-3 space-y-3">
        <div>
          <label className="text-bodySm font-medium text-ink-secondary">Valor da proposta</label>
          <div className="mt-1.5">
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        </div>

        {property.acceptedPaymentMethods.length > 0 && (
          <div>
            <label className="text-bodySm font-medium text-ink-secondary">Forma de pagamento</label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {property.acceptedPaymentMethods.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`rounded-pill px-4 py-1.5 text-bodySm font-medium ${
                    paymentMethod === method ? "bg-chip-activeBg text-chip-activeFg" : "bg-chip-inactiveBg text-chip-inactiveFg"
                  }`}
                >
                  {PAYMENT_METHOD_LABELS[method]}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="text-bodySm font-medium text-ink-secondary">Mensagem (opcional)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Condições, prazos ou observações para o corretor"
            className="mt-1.5 w-full rounded-xl border border-border-subtle bg-background-elevated px-4 py-3 text-bodyMd text-ink-primary placeholder:text-ink-tertiary focus:outline-none"
          />
        </div>

        {createProposal.isError && (
          <p className="text-bodySm text-status-danger">
            {createProposal.error instanceof Error ? createProposal.error.message : "Não foi possível enviar a proposta."}
          </p>
        )}

        <Button
          className="w-full"
          disabled={!amount || Number(amount) <= 0 || !paymentMethod || createProposal.isPending}
          onClick={() =>
            createProposal.mutate({
              propertyId: property.id,
              amount: Number(amount),
              paymentMethod: paymentMethod!,
              message: message.trim() || undefined,
            })
          }
        >
          <FileText className="h-4 w-4" />
          {createProposal.isPending ? "Enviando…" : "Enviar proposta"}
        </Button>
      </div>
    </div>
  );
}
