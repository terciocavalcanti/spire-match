# Receita e atribuição

Como receita e origem de leads são medidas no sistema real — e, igualmente importante, como **não** são medidas, para não sugerir uma precisão de atribuição que o produto não calcula hoje.

## O que é rastreado

- **Comissão por operação** (`apps/api/src/commissions/`): criada automaticamente quando um lead vira `GANHO`, com `baseAmount` (valor da operação), `rate` (taxa vigente no momento) e `previstoAmount` calculados na criação. Status evolui para `RECEBIDO` só com confirmação manual (valor e data reais) — nunca é marcada como recebida automaticamente.
- **VGV** (Valor Geral de Vendas): soma de `baseAmount` das comissões no período — sempre reportado separado de comissão prevista e de comissão recebida (`CommissionsService.summary`), nunca somado na mesma métrica.
- **Origem do lead ao nível de imóvel**: todo lead guarda `sourcePropertyId` — qual imóvel originou o primeiro contato (favorito, formulário, pedido de contato). Isso permite saber "este lead veio do imóvel X", mas não "este lead veio da campanha Y".
- **Estatística de campanha por empreendimento**: `CampaignsService.stats()` agrega leads/vendas/VGV de todas as unidades do empreendimento vinculado à campanha (`campaigns.developmentId → properties.developmentId → leads.sourcePropertyId`). Campanhas do mesmo empreendimento compartilham o mesmo número — é a mesma carteira de imóveis sendo medida, não duplicação de dado.
- **Campanha sem empreendimento vinculado**: retorna estatística zerada explicitamente (`{ leadsCount: 0, wonCount: 0, vgv: 0, linkedPropertiesCount: 0 }`) em vez de omitir o campo ou inventar um número — mesmo padrão de "zero honesto" usado no Demand Match.

## O que explicitamente NÃO é implementado

- **Atribuição por lead individual** (first-touch / last-touch / influenced), prevista na seção 4.7 do prompt mestre. Implementar de verdade exigiria captura de UTM/clique por campanha e associação a cada lead — infraestrutura que não existe neste sistema. A atribuição real hoje é por **empreendimento**, não por campanha individual nem por lead. Isso está documentado no próprio schema (`apps/api/src/database/schema/campaigns.ts`) para quem for estender essa funcionalidade depois.
- **Cobrança/pagamento automático de incorporadoras** — campanhas têm `budget` (orçamento acordado) como campo informativo; não há gateway de cobrança, fatura ou integração financeira.
- **Receita B2B de parcerias (financiamento/seguros/reformas)** — o diretório de parceiros (`/admin/parceiros`, `/parceiros`) registra indicações de lead consentidas, não um valor de receita por indicação paga.
- **Simulador financeiro com CET real** — o simulador (`/mercado` → Decide) é educacional, com premissas explícitas informadas pelo usuário; não há integração bancária para taxa/aprovação real.

## Por que isso importa para quem for ler os relatórios

Um relatório de `/admin/relatorios` ou `/admin/financeiro` que mostra "Campanha X gerou R$ 500k em VGV" está, na prática, reportando "o empreendimento vinculado à Campanha X gerou R$ 500k em VGV no período" — correto para decisões de portfólio por empreendimento, mas não deve ser lido como "a Campanha X causou essas vendas" se houver mais de uma campanha ativa para o mesmo empreendimento. Qualquer evolução futura que implemente UTM/clique por campanha deve atualizar este documento e `apps/api/src/database/schema/campaigns.ts` juntos.
