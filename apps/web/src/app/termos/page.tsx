import type { Metadata } from "next";

export const metadata: Metadata = { title: "Termos de Uso" };

const SECTION_CLASS = "mt-8";

export default function TermosPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl text-ink-primary">Termos de Uso</h1>
      <p className="mt-2 text-bodySm text-ink-tertiary">Última atualização: Marco F (hardening e lançamento). Versão 1 — pendente de revisão jurídica final antes do lançamento comercial.</p>

      <p className="mt-6 text-bodyMd text-ink-secondary">
        Estes Termos regem o uso da plataforma VALORI MATCH (aplicativo do comprador e painel comercial). Ao criar uma conta,
        você concorda com as condições abaixo e com a <a href="/privacidade" className="text-brand-olive hover:underline">Política de Privacidade</a>.
      </p>

      <section className={SECTION_CLASS}>
        <h2 className="font-display text-xl text-ink-primary">1. O que é a VALORI MATCH</h2>
        <p className="mt-3 text-bodyMd text-ink-secondary">
          Uma plataforma de inteligência comercial imobiliária que conecta compradores a imóveis compatíveis (Match Engine),
          viabiliza contato com o time comercial, agendamento de visitas e envio de propostas, e permite que proprietários
          solicitem a captação de seus imóveis. A VALORI MATCH é intermediária — a negociação, visita e fechamento são sempre
          conduzidos por um corretor humano do time comercial.
        </p>
      </section>

      <section className={SECTION_CLASS}>
        <h2 className="font-display text-xl text-ink-primary">2. Cadastro e conta</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-bodyMd text-ink-secondary">
          <li>Você precisa fornecer informações verdadeiras no cadastro e manter sua senha em sigilo.</li>
          <li>Sua conta é pessoal e intransferível.</li>
          <li>Contas criadas pelo time comercial (equipe interna) recebem uma senha temporária e são obrigadas a trocá-la no primeiro acesso.</li>
        </ul>
      </section>

      <section className={SECTION_CLASS}>
        <h2 className="font-display text-xl text-ink-primary">3. O Match Engine e os scores de compatibilidade</h2>
        <p className="mt-3 text-bodyMd text-ink-secondary">
          O percentual de compatibilidade (Match) exibido em cada imóvel é calculado a partir das suas preferências
          declaradas (orçamento, bairro, metragem etc.) e do seu comportamento na plataforma. É uma estimativa de
          relevância, não uma garantia de disponibilidade, preço final ou condições de negociação — sempre confirme
          detalhes com um consultor antes de tomar uma decisão.
        </p>
      </section>

      <section className={SECTION_CLASS}>
        <h2 className="font-display text-xl text-ink-primary">4. Captação de imóveis e Mercado Privado</h2>
        <p className="mt-3 text-bodyMd text-ink-secondary">
          Ao solicitar a captação do seu imóvel, você autoriza a VALORI a avaliar as informações fornecidas. A divulgação
          pública de um imóvel (no catálogo ou no Mercado Privado anônimo) só acontece após aprovação do time comercial e,
          no caso do Mercado Privado, mediante seu opt-in explícito e separado. Você pode solicitar a remoção do seu imóvel
          a qualquer momento falando com um consultor.
        </p>
      </section>

      <section className={SECTION_CLASS}>
        <h2 className="font-display text-xl text-ink-primary">5. O simulador Decide</h2>
        <p className="mt-3 text-bodyMd text-ink-secondary">
          O simulador de financiamento disponível em Mercado é uma ferramenta educativa, calculada inteiramente no seu
          navegador a partir dos valores que você digita. Não é uma oferta, pré-aprovação ou taxa real de nenhuma
          instituição financeira — fale com seu banco ou com um consultor VALORI para condições efetivas.
        </p>
      </section>

      <section className={SECTION_CLASS}>
        <h2 className="font-display text-xl text-ink-primary">6. Conduta esperada</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-bodyMd text-ink-secondary">
          <li>Não usar a plataforma para fins ilícitos, fraudulentos ou para coletar dados de outros usuários.</li>
          <li>Não tentar acessar contas, imóveis privados ou áreas administrativas sem autorização.</li>
          <li>Tratar o time comercial e outros usuários com respeito nas interações intermediadas pela plataforma.</li>
        </ul>
      </section>

      <section className={SECTION_CLASS}>
        <h2 className="font-display text-xl text-ink-primary">7. Encerramento de conta</h2>
        <p className="mt-3 text-bodyMd text-ink-secondary">
          Você pode solicitar a exclusão da sua conta a qualquer momento em Perfil → Meus dados. A VALORI pode suspender
          contas que violem estes Termos. Veja a <a href="/privacidade" className="text-brand-olive hover:underline">Política de Privacidade</a> para
          detalhes sobre o que acontece com seus dados após a exclusão.
        </p>
      </section>

      <section className={SECTION_CLASS}>
        <h2 className="font-display text-xl text-ink-primary">8. Limitação de responsabilidade</h2>
        <p className="mt-3 text-bodyMd text-ink-secondary">
          A VALORI MATCH se esforça para manter as informações de imóveis atualizadas, mas não garante a exatidão absoluta
          de dados fornecidos por terceiros (proprietários, incorporadoras). A decisão final de compra, aluguel ou
          investimento é sempre do usuário, com apoio do time comercial.
        </p>
      </section>

      <p className="mt-10 text-caption text-ink-tertiary">
        Este documento descreve o funcionamento efetivamente implementado nesta versão da plataforma. Está pendente de
        revisão por um profissional jurídico antes do lançamento comercial definitivo.
      </p>
    </main>
  );
}
