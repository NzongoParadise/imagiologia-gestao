import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Painel de Chamadas | Gestão Hospitalar",
  description: "Ecrã de chamadas da sala de espera",
};

/**
 * Layout isolado para o painel de chamadas da sala de espera.
 * Não inclui sidebar nem header do dashboard — destinado a ser
 * projetado numa TV ou monitor secundário em modo ecrã inteiro.
 */
export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
