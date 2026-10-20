import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetPasswordTokenReader } from "@/components/auth/ResetPasswordTokenReader";

export const metadata: Metadata = { title: "Redefinir senha" };

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <h1 className="font-display text-3xl text-ink-primary">Redefinir senha</h1>
      <p className="mt-2 text-bodyLg text-ink-secondary">Escolha uma nova senha para sua conta.</p>
      <div className="mt-8">
        <Suspense fallback={null}>
          <ResetPasswordTokenReader />
        </Suspense>
      </div>
    </main>
  );
}
