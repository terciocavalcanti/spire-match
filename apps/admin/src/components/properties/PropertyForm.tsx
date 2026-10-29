"use client";

import type {
  Broker,
  CreatePropertyRequest,
  ExclusiveType,
  ListingPurpose,
  PaymentMethod,
  PropertyDetail,
  PropertyStatus,
  PropertyType,
} from "@spire/contracts";
import { PAYMENT_METHODS, PROPERTY_STATUSES, PROPERTY_TYPES } from "@spire/contracts";
import { Button, Input } from "@spire/ui-web";
import { useState } from "react";

import { LISTING_PURPOSE_LABELS, PAYMENT_METHOD_LABELS, PROPERTY_STATUS_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/property-labels";

const EXCLUSIVE_TYPE_LABELS: Record<ExclusiveType, string> = {
  EXCLUSIVO: "Exclusivo",
  PRE_LANCAMENTO: "Pré-lançamento",
  OPORTUNIDADE: "Oportunidade",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-bodySm text-ink-secondary">{label}</span>
      {children}
    </label>
  );
}

const selectClassName =
  "h-12 w-full rounded-xl border border-border-subtle bg-background-elevated px-3 text-bodyMd text-ink-primary focus:border-brand-olive focus:outline-none";

interface FormState {
  title: string;
  description: string;
  type: PropertyType;
  purpose: ListingPurpose;
  status: PropertyStatus;
  price: string;
  condominiumFee: string;
  iptu: string;
  areaSqm: string;
  bedrooms: string;
  bathrooms: string;
  parkingSpaces: string;
  neighborhood: string;
  city: string;
  state: string;
  lat: string;
  lng: string;
  coverImageUrl: string;
  features: string;
  acceptedPaymentMethods: PaymentMethod[];
  isExclusive: boolean;
  exclusiveType: ExclusiveType | "";
  isSponsored: boolean;
  brokerId: string;
}

function toFormState(property?: PropertyDetail): FormState {
  return {
    title: property?.title ?? "",
    description: property?.description ?? "",
    type: property?.type ?? "APARTAMENTO",
    purpose: property?.purpose ?? "MORAR",
    status: property?.status ?? "DRAFT",
    price: property ? String(property.price) : "",
    condominiumFee: property?.condominiumFee != null ? String(property.condominiumFee) : "",
    iptu: property?.iptu != null ? String(property.iptu) : "",
    areaSqm: property ? String(property.areaSqm) : "",
    bedrooms: property ? String(property.bedrooms) : "0",
    bathrooms: property ? String(property.bathrooms) : "0",
    parkingSpaces: property ? String(property.parkingSpaces) : "0",
    neighborhood: property?.neighborhood ?? "",
    city: property?.city ?? "",
    state: property?.state ?? "",
    lat: property?.location ? String(property.location.lat) : "",
    lng: property?.location ? String(property.location.lng) : "",
    coverImageUrl: property?.coverImageUrl ?? "",
    features: property?.features.join(", ") ?? "",
    acceptedPaymentMethods: property?.acceptedPaymentMethods ?? [],
    isExclusive: property?.isExclusive ?? false,
    exclusiveType: property?.exclusiveType ?? "",
    isSponsored: property?.isSponsored ?? false,
    brokerId: property?.brokerId ?? "",
  };
}

export interface PropertyFormProps {
  property?: PropertyDetail;
  brokers: Broker[];
  isSubmitting: boolean;
  onSubmit: (payload: CreatePropertyRequest) => void;
  onCancel: () => void;
}

export function PropertyForm({ property, brokers, isSubmitting, onSubmit, onCancel }: PropertyFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(property));
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const togglePaymentMethod = (method: PaymentMethod) =>
    set(
      "acceptedPaymentMethods",
      form.acceptedPaymentMethods.includes(method)
        ? form.acceptedPaymentMethods.filter((m) => m !== method)
        : [...form.acceptedPaymentMethods, method],
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim() || !form.price || !form.areaSqm || !form.neighborhood.trim() || !form.city.trim() || form.state.trim().length !== 2) {
      setError("Preencha título, preço, área, bairro, cidade e UF (2 letras) antes de salvar.");
      return;
    }

    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      purpose: form.purpose,
      status: form.status,
      price: Number(form.price),
      condominiumFee: form.condominiumFee ? Number(form.condominiumFee) : null,
      iptu: form.iptu ? Number(form.iptu) : null,
      areaSqm: Number(form.areaSqm),
      bedrooms: Number(form.bedrooms || 0),
      bathrooms: Number(form.bathrooms || 0),
      parkingSpaces: Number(form.parkingSpaces || 0),
      neighborhood: form.neighborhood.trim(),
      city: form.city.trim(),
      state: form.state.trim().toUpperCase(),
      lat: form.lat ? Number(form.lat) : null,
      lng: form.lng ? Number(form.lng) : null,
      coverImageUrl: form.coverImageUrl.trim() || null,
      features: form.features
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean),
      acceptedPaymentMethods: form.acceptedPaymentMethods,
      isExclusive: form.isExclusive,
      exclusiveType: form.isExclusive && form.exclusiveType ? form.exclusiveType : null,
      isSponsored: form.isSponsored,
      brokerId: form.brokerId || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border-subtle bg-background-elevated p-5">
      <h2 className="font-display text-lg text-ink-primary">{property ? "Editar imóvel" : "Novo imóvel"}</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Título">
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="Corretor responsável">
          <select value={form.brokerId} onChange={(e) => set("brokerId", e.target.value)} className={selectClassName}>
            <option value="">Sem corretor atribuído</option>
            {brokers.map((broker) => (
              <option key={broker.id} value={broker.id}>
                {broker.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Descrição">
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-border-subtle bg-background-elevated p-3 text-bodyMd text-ink-primary focus:border-brand-olive focus:outline-none"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Tipo">
          <select value={form.type} onChange={(e) => set("type", e.target.value as PropertyType)} className={selectClassName}>
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {PROPERTY_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Finalidade">
          <select value={form.purpose} onChange={(e) => set("purpose", e.target.value as ListingPurpose)} className={selectClassName}>
            {(Object.entries(LISTING_PURPOSE_LABELS) as Array<[ListingPurpose, string]>).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={(e) => set("status", e.target.value as PropertyStatus)} className={selectClassName}>
            {PROPERTY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PROPERTY_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="UF">
          <Input value={form.state} onChange={(e) => set("state", e.target.value.toUpperCase())} maxLength={2} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Preço (R$)">
          <Input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} />
        </Field>
        <Field label="Condomínio (R$)">
          <Input type="number" value={form.condominiumFee} onChange={(e) => set("condominiumFee", e.target.value)} />
        </Field>
        <Field label="IPTU (R$)">
          <Input type="number" value={form.iptu} onChange={(e) => set("iptu", e.target.value)} />
        </Field>
        <Field label="Área (m²)">
          <Input type="number" value={form.areaSqm} onChange={(e) => set("areaSqm", e.target.value)} />
        </Field>
        <Field label="Quartos">
          <Input type="number" value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} />
        </Field>
        <Field label="Banheiros">
          <Input type="number" value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} />
        </Field>
        <Field label="Vagas">
          <Input type="number" value={form.parkingSpaces} onChange={(e) => set("parkingSpaces", e.target.value)} />
        </Field>
        <Field label="Bairro">
          <Input value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
        </Field>
        <Field label="Cidade">
          <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
        </Field>
        <Field label="Latitude">
          <Input type="number" value={form.lat} onChange={(e) => set("lat", e.target.value)} />
        </Field>
        <Field label="Longitude">
          <Input type="number" value={form.lng} onChange={(e) => set("lng", e.target.value)} />
        </Field>
        <Field label="URL da imagem de capa">
          <Input value={form.coverImageUrl} onChange={(e) => set("coverImageUrl", e.target.value)} />
        </Field>
      </div>

      <Field label="Diferenciais (separados por vírgula)">
        <Input value={form.features} onChange={(e) => set("features", e.target.value)} placeholder="Varanda gourmet, Piscina, Academia" />
      </Field>

      <div>
        <span className="mb-2 block text-bodySm text-ink-secondary">Formas de pagamento aceitas</span>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => togglePaymentMethod(method)}
              className={`rounded-pill px-3 py-1.5 text-bodySm font-medium transition-colors ${
                form.acceptedPaymentMethods.includes(method)
                  ? "bg-brand-charcoal text-ink-inverse"
                  : "bg-background-subtle text-ink-secondary hover:bg-border-subtle"
              }`}
            >
              {PAYMENT_METHOD_LABELS[method]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-bodySm text-ink-secondary">
          <input type="checkbox" checked={form.isExclusive} onChange={(e) => set("isExclusive", e.target.checked)} className="h-4 w-4 rounded border-border-strong" />
          VALORI Exclusive
        </label>
        {form.isExclusive && (
          <select
            value={form.exclusiveType}
            onChange={(e) => set("exclusiveType", e.target.value as ExclusiveType)}
            className="h-10 rounded-xl border border-border-subtle bg-background-elevated px-3 text-bodySm text-ink-primary focus:border-brand-olive focus:outline-none"
          >
            <option value="">Selecionar tipo…</option>
            {(Object.entries(EXCLUSIVE_TYPE_LABELS) as Array<[ExclusiveType, string]>).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        )}
        <label className="flex items-center gap-2 text-bodySm text-ink-secondary">
          <input type="checkbox" checked={form.isSponsored} onChange={(e) => set("isSponsored", e.target.checked)} className="h-4 w-4 rounded border-border-strong" />
          Destaque patrocinado
        </label>
      </div>

      {error && <p className="text-bodySm text-status-danger">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando…" : property ? "Salvar alterações" : "Criar imóvel"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
