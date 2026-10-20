"use client";

import { SpireApiError } from "@spire/api-client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";

type Status = "loading" | "success" | "error";

export function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>(token ? "loading" : "error");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    apiClient.auth
      .verifyEmail({ token })
      .then(() => setStatus("success"))
      .catch((error) => {
        setStatus("error");
        setMessage(error instanceof SpireApiError ? error.message : null);
      });
  }, [token]);

  if (status === "loading") {
    return <p className="text-bodyMd text-ink-secondary">Confirmando seu e-mail…</p>;
  }

  if (status === "success") {
    return (
      <div className="space-y-4">
        <p role="status" className="rounded-xl bg-status-successBg px-4 py-3 text-bodyMd text-status-success">
          E-mail confirmado com sucesso.
        </p>
        <Link href="/inicio" className="font-semibold text-ink-primary underline underline-offset-2">
          Ir para o início
        </Link>
      </div>
    );
  }

  return (
    <p role="alert" className="rounded-xl bg-status-dangerBg px-4 py-3 text-bodyMd text-status-danger">
      {message ?? "Link de verificação inválido ou expirado."}
    </p>
  );
}
