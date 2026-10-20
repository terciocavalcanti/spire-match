import { EmptyState } from "@spire/ui-web";
import { Construction } from "lucide-react";

export interface ScreenPlaceholderProps {
  title: string;
  description: string;
  milestone: "A" | "D" | "E" | "F";
}

export function ScreenPlaceholder({ title, description, milestone }: ScreenPlaceholderProps) {
  return (
    <div>
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
