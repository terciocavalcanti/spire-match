"use client";

import { useSearchParams } from "next/navigation";

import { ResetPasswordForm } from "./ResetPasswordForm";

export function ResetPasswordTokenReader() {
  const searchParams = useSearchParams();
  return <ResetPasswordForm token={searchParams.get("token")} />;
}
