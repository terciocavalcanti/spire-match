import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";

import "./globals.css";

import { Providers } from "./providers";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Painel comercial · SPIRE MATCH", template: "%s · SPIRE MATCH" },
  description: "Painel comercial SPIRE MATCH — leads, imóveis, agenda e inteligência comercial.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="font-body">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
