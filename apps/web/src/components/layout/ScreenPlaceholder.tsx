import { EmptyState } from "@spire/ui-web";
import { Construction } from "lucide-react";

export interface ScreenPlaceholderProps {
  title: string;
  description: string;
  /** Marco em que a integração real desta tela entra em funcionamento. */
  milestone: "B" | "C" | "D" | "E";
}

/**
 * Shell real (rota, layout, navegação) para telas cuja integração de dados
 * ainda não foi implementada. Nunca exibe dados fictícios como se fossem
 * reais — apenas informa com transparência o marco de entrega planejado
 * (ver docs/architecture/ e o plano aprovado).
 */
export function ScreenPlaceholder({ title, description, milestone }: ScreenPlaceholderProps) {
  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl text-ink-primary">{title}</h1>
      <div className="mt-6">
        <EmptyState
          icon={<Construction className="h-8 w-8" aria-hidden />}
          title="Integração em desenvolvimento"
          description={`${description} Esta tela já está roteada e no layout final; a integração com dados reais da API está planejada para o Marco ${milestone}.`}
        />
      </div>
    </div>
  );
}
