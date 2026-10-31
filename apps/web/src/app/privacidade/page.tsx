import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de Privacidade" };

const SECTION_CLASS = "mt-8";

export default function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl text-ink-primary">Política de Privacidade</h1>
      <p className="mt-2 text-bodySm text-ink-tertiary">Última atualização: Marco F (hardening e lançamento). Versão 1 — pendente de revisão jurídica final antes do lançamento comercial.</p>

      <p className="mt-6 text-bodyMd text-ink-secondary">
        A VALORI MATCH trata dados pessoais para conectar compradores e proprietários de imóveis ao time comercial da
        plataforma, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD). Esta política descreve,
        de forma honesta e específica a este sistema, quais dados coletamos, por quê, por quanto tempo e quais direitos você
        tem sobre eles.
      </p>

      <section className={SECTION_CLASS}>
        <h2 className="font-display text-xl text-ink-primary">1. Quais dados coletamos</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-bodyMd text-ink-secondary">
          <li><strong>Cadastro:</strong> nome, e-mail e senha (armazenada só como hash, nunca em texto puro).</li>
          <li><strong>Preferências de compra:</strong> orçamento, bairros de interesse, metragem, quartos, forma de pagamento e características desejadas — usadas pelo Match Engine para calcular compatibilidade com imóveis.</li>
          <li><strong>Atividade na plataforma:</strong> imóveis visualizados, favoritados e comparados; buscas realizadas; interações com o assistente de busca.</li>
          <li><strong>Contato comercial:</strong> pedidos de contato, visitas agendadas e propostas enviadas — ficam associados ao seu histórico comercial (CRM) para que o time de corretores possa te atender.</li>
          <li><strong>Dados de proprietário (se aplicável):</strong> quando você solicita a captação do seu imóvel, coletamos dados do imóvel e, com seu consentimento explícito, podemos divulgá-lo de forma anônima no Mercado Privado (sem endereço exato, fotos ou seu nome).</li>
          <li><strong>Técnicos:</strong> cookies de sessão (necessários para login) e, quando você autoriza, inscrição para notificações push no navegador.</li>
        </ul>
        <p className="mt-3 text-bodyMd text-ink-secondary">
          Nunca coletamos dados sensíveis (saúde, biometria, orientação, religião etc.) nem compartilhamos seus dados com
          terceiros para fins de publicidade.
        </p>
      </section>

      <section className={SECTION_CLASS}>
        <h2 className="font-display text-xl text-ink-primary">2. Por que tratamos esses dados (base legal)</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-bodyMd text-ink-secondary">
          <li><strong>Execução de contrato</strong> (art. 7º, V): operar sua conta, calcular compatibilidade e viabilizar o atendimento comercial que você solicitou.</li>
          <li><strong>Consentimento</strong> (art. 7º, I): divulgação do seu imóvel no Mercado Privado e notificações push — sempre opt-in explícito, revogável a qualquer momento.</li>
          <li><strong>Legítimo interesse</strong> (art. 7º, IX): melhorar a relevância dos imóveis sugeridos a partir do seu comportamento de navegação na própria plataforma.</li>
        </ul>
      </section>

      <section className={SECTION_CLASS}>
        <h2 className="font-display text-xl text-ink-primary">3. Com quem compartilhamos</h2>
        <p className="mt-3 text-bodyMd text-ink-secondary">
          Seus dados de contato e preferências são visíveis ao time comercial da VALORI (corretores e gestores) para viabilizar
          o atendimento. Ofertas do Mercado Privado nunca expõem o proprietário ao comprador — todo contato é intermediado
          pela VALORI. Não vendemos nem alugamos dados pessoais a terceiros.
        </p>
      </section>

      <section className={SECTION_CLASS}>
        <h2 className="font-display text-xl text-ink-primary">4. Por quanto tempo guardamos seus dados</h2>
        <p className="mt-3 text-bodyMd text-ink-secondary">
          Mantemos seus dados enquanto sua conta estiver ativa e pelo prazo de retenção configurado pelo time de privacidade
          da VALORI (ajustável em{" "}
          <span className="font-medium text-ink-primary">Admin → Configurações</span>, visível em{" "}
          <span className="font-medium text-ink-primary">Admin → Privacidade</span>), salvo quando a lei exigir prazo maior
          (ex.: obrigações fiscais sobre comissões). Registros financeiros já concluídos (ex.: comissões pagas) podem ser
          mantidos de forma anonimizada após a exclusão da sua conta, para cumprir obrigação legal — sem mais te identificar.
        </p>
      </section>

      <section className={SECTION_CLASS}>
        <h2 className="font-display text-xl text-ink-primary">5. Seus direitos como titular</h2>
        <p className="mt-3 text-bodyMd text-ink-secondary">
          Você pode, a qualquer momento, em <span className="font-medium text-ink-primary">Perfil → Meus dados</span>:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-bodyMd text-ink-secondary">
          <li><strong>Baixar seus dados</strong> — gera e entrega na hora um arquivo com tudo o que guardamos sobre você.</li>
          <li><strong>Solicitar a exclusão da sua conta</strong> — anonimiza seu nome e e-mail e encerra sua sessão; passa por uma confirmação do time comercial antes de ser concluída, para evitar exclusões acidentais ou fraudulentas.</li>
        </ul>
        <p className="mt-3 text-bodyMd text-ink-secondary">
          Para qualquer outra solicitação (correção de dados, informações sobre compartilhamento, revogação de consentimento
          específico), fale com um consultor pelo próprio app.
        </p>
      </section>

      <section className={SECTION_CLASS}>
        <h2 className="font-display text-xl text-ink-primary">6. Segurança</h2>
        <p className="mt-3 text-bodyMd text-ink-secondary">
          Senhas são armazenadas com hash (nunca em texto puro), conexões usam HTTPS, e o acesso a dados pessoais no painel
          administrativo é restrito por papel — cada ação privilegiada (mudança de papel de usuário, verificação de ofertas,
          exclusão de conta) fica registrada em uma trilha de auditoria interna.
        </p>
      </section>

      <p className="mt-10 text-caption text-ink-tertiary">
        Este documento descreve o tratamento de dados efetivamente implementado nesta versão da plataforma. Está pendente de
        revisão por um profissional jurídico antes do lançamento comercial definitivo.
      </p>
    </main>
  );
}
