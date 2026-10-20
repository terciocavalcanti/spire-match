import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <h1 className="font-display text-3xl text-ink-primary">Recuperar senha</h1>
      <p className="mt-2 text-bodyLg text-ink-secondary">
        Informe o e-mail da sua conta para receber o link de redefinição.
      </p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
