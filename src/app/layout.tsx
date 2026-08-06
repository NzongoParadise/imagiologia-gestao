import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers/session-provider";
import { SpeedInsights } from '@vercel/speed-insights/next';
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Sistema de Gestão de Imagiologia",
  description: "Sistema profissional para gestão de exames de imagiologia",
  keywords: ["imagiologia", "hospital", "exames", "pacientes", "radiologia"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" suppressHydrationWarning className={`${inter.variable} dark`}>
      <body className="antialiased">
        <Providers>{children}</Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}

