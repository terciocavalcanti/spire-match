import type { Metadata } from "next";
import { Suspense } from "react";

import { VerifyEmailStatus } from "@/components/auth/VerifyEmailStatus";

export const metadata: Metadata = { title: "Verificar e-mail" };

export default function VerifyEmailPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <h1 className="font-display text-3xl text-ink-primary">Verificação de e-mail</h1>
      <div className="mt-8">
        <Suspense fallback={null}>
          <VerifyEmailStatus />
        </Suspense>
      </div>
    </main>
  );
}
