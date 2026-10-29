import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";

import "./globals.css";

import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

import { Providers } from "./providers";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "VALORI MATCH — O imóvel certo, no lugar certo, na hora certa",
    template: "%s · VALORI MATCH",
  },
  description:
    "VALORI MATCH cruza seu perfil com a carteira de imóveis certa para você: compatibilidade explicável, visitas e atendimento especializado.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VALORI MATCH",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F7F4EC",
  // Necessário para que env(safe-area-inset-*) resolva para valores reais em
  // vez de 0px — sem isso a navegação inferior e outros elementos fixos
  // podem ficar atrás da barra de gestos do sistema em telas sem bordas.
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="font-body">
        <Providers>{children}</Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
