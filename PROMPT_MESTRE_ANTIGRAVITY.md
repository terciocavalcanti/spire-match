# SPIRE MATCH — PROMPT MESTRE DE IMPLEMENTAÇÃO INTEGRAL

**Destino:** Google Antigravity (agentes de engenharia, design, backend, QA, segurança e DevOps).  
**Idioma do sistema:** português brasileiro (`pt-BR`).  
**Moeda:** BRL; **timezone padrão:** `America/Recife`; persistir timestamps em UTC.  
**Escopo:** PRODUTO FINAL PRONTO PARA OPERAÇÃO REAL. NÃO É MVP, DEMONSTRAÇÃO, TEMPLATE, PROTÓTIPO OU FRONTEND ISOLADO.

## 0. ORDEM DE EXECUÇÃO INEGOCIÁVEL

Atue como **equipe sênior multidisciplinar**: Product Owner, arquiteto de software, designer de produto, engenheiro frontend, engenheiro backend, DBA/PostGIS, especialista em PWA, especialista em segurança/LGPD, QA, DevOps e analista comercial imobiliário.

Sua missão é **implementar integralmente, testar, documentar e preparar para produção** o sistema SPIRE MATCH, composto por (a) plataforma web responsiva PWA para compradores/proprietários; (b) painel comercial web para corretores, gestores, incorporadoras autorizadas e administradores; (c) API robusta e versionada; (d) serviços de matching, localização no navegador, notificações, CRM, relatórios, integrações e automações.

1. PRIMEIRO abra e examine **todas** as imagens em `design/referencias/`, começando por `01_fluxo_inicial.png` até `06_painel_comercial.png`. As imagens `07` a `11` mostram telas ampliadas, e a `12` registra a referência original. **Não diga que as examinou se a ferramenta de visualização não tiver conseguido abri-las.**
2. Depois, gere uma **matriz de fidelidade** ligando cada tela visual a uma rota, componente, caso de uso, endpoints e testes. Reproduza **os layouts das 24 telas das seis pranchas**, respeitando composição, espaçamentos, hierarquia visual, paleta, fontes compatíveis e interação. Extraia padrões visuais, mas NÃO reutilize diretamente a imagem inteira como background da interface. As telas devem ser DOM e componentes reais, acessíveis e responsivos.
3. Faça o planejamento técnico e documentação de implantação. Resolva somente ambiguidades impeditivas (como credenciais reais de provedores ou nome jurídico/identidade corporativa definitiva); para o restante, adote os padrões aqui definidos, documentando-os.
4. Execute a implementação por **marcos de trabalho**, mas **não encerre o projeto após um marco inicial**: a entrega solicitada é o sistema completo, em funcionamento e validado. Não chame parte incompleta de 'produto final'.
5. Implante ambientes **local, staging e produção**. Se não houver acesso/credenciais para produção ou APIs terceiras, deixe **código completo, integração desacoplada, testes de contrato, ambiente de homologação, `.env.example` e runbook precisos**; comunique expressamente os bloqueios reais, nunca alegue que algo está ativo quando não está.
6. Após cada marco, rode lint/typecheck/testes/build, inspeção visual por browser quando disponível, verifique API/banco real e registre evidências em `docs/qa/`.
7. **Não invente dados imobiliários, imóveis reais, preços de mercado, vendas, corretores, localizações exatas, indicadores de valorização, disponibilidade, ou capacidade de serviços externos.** Dados de exemplo devem ficar identificados como `DEMONSTRAÇÃO` no ambiente demo e nunca como produção.

## 1. VISÃO E REGRAS DE NEGÓCIO

**Promessa:** 'O imóvel certo, no lugar certo, na hora certa.' O SPIRE MATCH é uma plataforma de inteligência comercial imobiliária: cruza perfil do comprador, propriedades da carteira e eventos de interesse para produzir compatibilidade explicável, identificar e trabalhar oportunidades, converter em visitas, propostas e operações e melhorar captação de imóveis.

**Públicos:** visitantes não autenticados, compradores, proprietários interessados em captar, corretores, supervisores, gestores, administradores e parceiros de incorporadoras com permissão restrita.

**Jornadas reais:** descobrir → cadastrar perfil → ver Matches → buscar/mapear/filtrar → curtir/salvar/comparar → conversar/agendar → visitar → simular → propor → negociar → fechar ou continuar acompanhado. Para a imobiliária: cadastrar carteira → identificar demandas → qualificar leads → distribuir → contatar → agendar → visitar → propor → converter → mensurar resultados e receita.

**Receitas e resultados medidos:** comissão imobiliária de venda/locação conforme operação; aumento da captação; campanhas contratadas de incorporadoras; desempenho de campanhas e geração de oportunidades qualificadas; eventuais parcerias financeiras e serviços, respeitando contratos e regulação aplicável. Não cobrar automaticamente do comprador. Não vender dados pessoais de usuários. Distinguir VGV de comissão efetivamente recebida e de receita atribuída por metodologia de marketing.

## 2. FONTES VISUAIS — FIDELIDADE MÁXIMA

**Design anchor obrigatório:**
- `design/referencias/01_fluxo_inicial.png`: tela de boas-vindas, onboarding, login, Home.
- `design/referencias/02_exploracao_e_mapa.png`: busca, mapa, filtros e alerta de proximidade.
- `design/referencias/03_interacao_e_match.png`: swipe, favoritos, comparação e exclusivos.
- `design/referencias/04_conversao_e_atendimento.png`: detalhes, consultor, agenda e tour.
- `design/referencias/05_perfil_e_relacionamento.png`: perfil, notificações, radares e minhas visitas.
- `design/referencias/06_painel_comercial.png`: dashboard, lista de leads, detalhe CRM e agenda/funil.
- `design/referencias/07_home_detalhada.png`, `08_mapa_detalhado.png`, `09_swipe_detalhado.png`, `10_imovel_detalhado.png`, `11_dashboard_detalhado.png`: ampliação das cinco telas-chave; priorize precisão de microcomponentes nelas.
- `design/referencias/12_referencia_original_cliente.jpg`: referência estética inicial, secundária às onze imagens acima.

**Design system:** premium editorial, sofisticado e minimalista; base off-white/ivory, carvão/preto suave, oliva escuro, bege/taupe, verde de Match discreto; fotografia imobiliária protagonista; grande respiro, cards arredondados e suaves, bordas delicadas, ícones lineares; serif elegante em headings e sans legível no corpo; CTAs escuros; números e indicadores de compatibilidade visualmente claros. Faça tokens reais, evite cores/dimensões espalhadas em arquivos. Defina cores em tokens a partir das pranchas (aproximações iniciais e ajuste visual por screenshot), light theme e estrutura pronta para dark theme sem impor dark theme agora.

**Invariantes visuais:**
- Header SPIRE/MATCH, botão de notificações, avatar, chips de filtros, cards com foto, selos `% MATCH`, preço BRL, bairro, metragem/quartos/vagas, barras inferiores elegantes.
- Navegação comprador principal: **Início, Explorar, Matches, Mensagens/Contato e Perfil**. Favoritos acessíveis por coração em cards, perfil e atalhos; manter a linguagem da prancha detalhada onde Favoritos ocupa slot visual de navegação. Resolver em design document como experiência coerente (sem criar duas navegações contraditórias) e manter acesso em no máximo um toque a Favoritos.
- Dashboard desktop com sidebar SPIRE, cards de KPI, funil, tabelas, calendário, lead scoring, estado de seleção e filtros.
- Reproduza nomes, textos, títulos e interações em pt-BR; dados/nomes/fotos de design são **exemplos demonstrativos**, não usuários reais nem dados de produção.
- Responsivo a partir de 320px mobile; tablet; desktop. Testar iOS Safari, Android Chrome, navegadores desktop.
- Componentes acessíveis com teclado, foco, aria, texto alternativo, WCAG 2.2 AA, contraste adequado, reduz movimento e fontes escaláveis.
- Faça avaliação de fidelidade com screenshots de telas renderizadas e comparativo `referência x implementação` em `docs/qa/visuais/`.

## 3. MATRIZ OBRIGATÓRIA DAS 24 TELAS DE REFERÊNCIA

Rotas a seguir são sugestões contratuais iniciais; ajuste grupos internos sem alterar URLs públicas sem documentar. Cada tela deve ter componentes reais e funcionar com dados da API, loading, vazio, erro, offline quando cabível, permissões e estados de sucesso.

### Prancha 01 — Fluxo inicial (`01_fluxo_inicial.png`)
1. **Splash / boas-vindas** → `/` ou `/boas-vindas`: foto ampla, slogan, CTA Começar; visitante pode explorar destaques e ir ao cadastro. Não bloquear SEO.
2. **Onboarding / perfil comprador** → `/onboarding`: wizard retomável, orçamento, bairros, metragem, quartos, vagas, objetivo (morar/investir), forma de pagamento, prazo e características; validação, salvar progresso, pular sem perder dados.
3. **Login / conta** → `/entrar` + `/cadastro`, `/recuperar-senha`, `/verificar-email`: e-mail/senha seguros, login Google/Apple opcional via OIDC somente quando credenciado, recuperar senha, sessão persistente e saída. Não alegar Google/Apple funcionais sem configuração.
4. **Home / Matches** → `/inicio`: cumprimento, Matches recomendados, imóveis em evidência, próximos quando autorizado, novidades/exclusivos, eventos, favoritos; CTA de ação; badges de compatibilidade.

### Prancha 02 — Exploração e mapa (`02_exploracao_e_mapa.png`)
5. **Busca/Explorar** → `/explorar`: busca por bairro/cidade/rua/nome do condomínio, autocomplete legítimo, chips/tipos, cards paginados ou infinite scrolling, ordenações, filtros, URLs compartilháveis.
6. **Mapa inteligente** → `/mapa`: MapLibre + fornecedor licenciado de mapas; marcadores e clusters; números representando score, geolocalização consentida, cartão flutuante de imóvel, raio configurável, acessibilidade com modo lista, ver imóvel/rotas.
7. **Filtros avançados** → `/explorar/filtros` ou dialog sobre `/explorar`: preço, bairros, metragem, quartos, vagas, tipo, finalidade, outros atributos, limpar/aplicar, persistência por URL e perfil.
8. **Alerta de oportunidade / Match Nearby** → `/matches/perto`: experiência visual equivalente ao mockup, mostrando distância autorizada no navegador e motivos do Match; abrir imóvel/dispensar. Não afirmar que o usuário está 'a 420 m' sem medir distância atual válida; se sem localização, CTA para habilitar ou selecionar bairro. Compatível com limitações da PWA (ver capítulo geolocalização).

### Prancha 03 — Interação e Match (`03_interacao_e_match.png`)
9. **Descobrir / Swipe** → `/matches/descobrir`: swipe left descartar, right demonstrar interesse, ação salvar no centro; equivalentes acessíveis por botões, undo protegido, trilha de eventos sem duplo registro, explicação do motivo do score.
10. **Favoritos** → `/favoritos`: listar, filtros e ordenações, comparar/remover, criar listas, desativados com aviso, navegar até imóvel.
11. **Comparar imóveis** → `/comparar`: até 3 na apresentação e seleção configurável, comparação real de valores/quartos/vagas/bairro/m²/condomínio/status/diferenciais/Score com dados faltantes claramente rotulados; compartilhar comparação privada.
12. **SPIRE Exclusive** → `/exclusivos`: inventário de imóveis exclusivos, pré-lançamentos e oportunidades com regras de visibilidade; selos autênticos; exclusividade/período, não exibir endereço privado sem autorização.

### Prancha 04 — Conversão e atendimento (`04_conversao_e_atendimento.png`)
13. **Detalhe do imóvel** → `/imoveis/[slug]`: galeria alta qualidade, vídeos/planta/tour se houver, preço, specs, localização em granularidade adequada, status de disponibilidade, score e 4+ motivos explicáveis, comparar/salvar/compartilhar, contato WhatsApp, agendar visita, financeiro básico, acessibilidade e SEO.
14. **Atendimento / consultor** → `/atendimento/[propertyId]`: dados públicos de corretor autorizado, horários, formulários, conversa ou histórico de mensagens consentidas, WhatsApp com deep link, solicitação de retorno/vídeo conforme serviço configurado; sem inventar 'online agora' ou atendimento 24h.
15. **Agendar visita** → `/visitas/agendar?imovel=...`: calendário com slots do corretor/propriedade, timezone, confirmação transacional para evitar colisões, reagendamento, cancelamento, notificações e lembretes, proprietário/gestor informados conforme regras.
16. **Tour Inteligente** → `/tour`: selecionar 2–5 imóveis, montar sequência e faixa de horários confirmáveis, otimizar usando custo de deslocamento de roteador autorizado; exibir estimativas e fontes, criar solicitações de agendamento, evitar prometer rota/horário impossíveis.

### Prancha 05 — Perfil e relacionamento (`05_perfil_e_relacionamento.png`)
17. **Meu perfil** → `/perfil`: dados pessoais, completude, preferências editáveis, finalidade, orçamento, bairros, privacidade, localização, comunicações, proteção da conta, exclusão/exportação de dados.
18. **Centro de notificações** → `/notificacoes`: inbox com categorias, novo Match, redução de preço, unidade disponível, visita confirmada, exclusivos, lidas/não lidas, abrir origem, preferências/frequência.
19. **Meus radares** → `/radares`: buscas salvas por região/faixa/tipo, gatilhos novos imóveis/preço/status compatível, frequência e canal, gerenciamento ativar/pausar/excluir, histórico, deduplicação.
20. **Minhas visitas/atividades** → `/minhas-visitas`: próximas, concluídas, canceladas, propostas, histórico, próximos passos, reagendamento/cancelamento e confirmação.

### Prancha 06 — Painel comercial (`06_painel_comercial.png`)
21. **Visão geral / Indicadores** → `/admin`: KPIs de usuários/leads/leads quentes/visitas/propostas/vendas/VGV/comissões/receitas; filtros por período/equipe/empreendimento/origem; funil real e comparativos.
22. **Leads / Oportunidades** → `/admin/leads`: pesquisar, segmentar, filtros, responsável, lead score, Match Score (por par lead-imóvel), temperatura, status, lote (regras de permissão), exportar auditoria.
23. **Detalhe do Lead / CRM** → `/admin/leads/[id]`: perfil do comprador, evidências de consentimento, bairros, imóveis de interesse, razões de Match, timeline eventos, propostas, tarefas, contato, próximos passos recomendados, tags/anotações, trilha de auditoria.
24. **Agenda / Visitas / Funil** → `/admin/agenda` e `/admin/funil`: calendário equipes/slots, filtros, kanban/pipeline com status e histórico, avançar/reverter estágio com validação e motivo, integração de visitas.

**Telas adicionais obrigatórias**, no mesmo design system, embora não ilustradas diretamente nas seis pranchas: `/admin/imoveis`, `/admin/imoveis/novo`, `/admin/empreendimentos`, `/admin/unidades`, `/admin/proprietarios`, `/admin/captacoes`, `/admin/usuarios`, `/admin/corretores`, `/admin/incorporadoras`, `/admin/campanhas`, `/admin/relatorios`, `/admin/financeiro`, `/admin/conteudo`, `/admin/automacoes`, `/admin/notificacoes`, `/admin/integracoes`, `/admin/configuracoes`, `/admin/auditoria`, `/admin/privacidade`, e páginas essenciais de erros, termos, privacidade, preferências de comunicação, ajuda, FAQ, contato e instalação PWA. Criar UI consistente para modais, CRUDs, estados e confirmações desses módulos.

## 4. REQUISITOS DO PRODUTO FINAL — COMPORTAMENTO COMPLETO

### 4.1 Conta, perfil e qualificação
- Acesso público SEO com cadastro posterior; cadastro e verificação de e-mail; recuperação de senha; opção de OIDC quando habilitada; bloquear abuso, logar tentativas sensíveis; 2FA para administração (TOTP recomendado), revogação de sessões.
- Perfis por intenção (morar/investir/segunda residência), faixas e flexibilidade, regras para regiões, tipologias e prazos, limites financeiros e pagamento; status do perfil e atualização progressiva.
- Coletar dados mínimos e explicar finalidade; consentimentos separados para e-mail, WhatsApp, Web Push, localização, marketing e campanhas.
- Compartilhamento familiar opcional: lista colaborativa por convite com aceite, opiniões por imóvel, score agregado/consenso sem exibir dados financeiros individuais sem consentimento.

### 4.2 Carteira de imóveis e incorporadoras
- Modelar **Empreendimento → Torre/Bloco (opcional) → Unidade**, separando preço de empreendimento e da unidade; imóveis avulsos/usados; corretagem, locação e status; localização, fotos/plantas/documentos com permissões, comissão contratual e origem.
- CRUD completo com rascunho/revisão/publicação/arquivamento, disponibilidade, histórico de preço e alterações, importação CSV com validação e pré-visualização, exportação e uploads assinados.
- Fotos: formatos modernos responsivos, múltiplos tamanhos, ordem manual, capa, alt text, sem usar fotos com direitos não garantidos; tratamento de exclusividade e datas.
- Nunca indexar/publicar dados de proprietário, contato pessoal, documentos, unidade privada ou localização exata sem autorização apropriada.

### 4.3 Motor de compatibilidade SPIRE MATCH
- Implementar score 0–100 **por par comprador-imóvel**, com regras configuráveis, versão do cálculo, fatores/penalidades e explicações apresentáveis.
- Peso-base inicial configurável: orçamento 25%, região desejada 20%, proximidade atual 15% **somente quando disponível**, área 10%, quartos/características 10%, finalidade 5%, pagamento 5%, sinais de preferência 10%.
- Distância é fator contextual, **não obrigação**: quando faltar localização, reponderar pesos determinísticamente; não punir usuário por negar geolocalização.
- Critérios eliminatórios (imóvel vendido/inativo, incompatibilidade essencial explicitamente marcada pelo comprador, indisponibilidade) prevalecem; patrocinado não manipula score.
- Validar preço por unidade, condição, bairro, margem permitida de orçamento, metragem e objetivos com tratamento adequado de intervalos e missing data. Sem score artificial de 96% para imóvel objetivamente fora de restrições obrigatórias.
- Recalcular em alterações relevantes com jobs; armazenar histórico/versão e razões; indexar recomendações; garantir deduplicação.
- Interações: `VIEW`, `LIKE`, `DISLIKE`, `FAVORITE`, `SHARE`, `COMPARE`, `CONTACT`, `VISIT_REQUEST`, `SIMULATION`, `PROPOSAL`; diferenciação entre curtida/intenção comercial e favorito. Regras de aprendizado **transparentes**, sugestões revisáveis e confirmação do usuário para mudar seu perfil.

### 4.4 Busca, mapa e Match perto de mim
- Busca textual e geográfica PostGIS com bounding box, raio, índice espacial, filtros e score, paginação cursor, sugestão de busca e chips rápidos.
- Mapa com clustering, cards em bottom sheet, localização atual consentida, acessibilidade com listagem equivalente, atributos de tiles/mapping visíveis e uso licenciado do provedor; não depender do servidor de tiles público gratuito do OSM em produção de volume.
- Localização PWA somente **durante sessão visível e quando API do browser efetivamente oferece resultado**, via `getCurrentPosition()` e `watchPosition()` sob ação/permissão apropriada; economia de bateria, timeout, debounce/throttle, ignore posições de baixa precisão, aviso quando dados antigos.
- Cálculo de proximidade com raio configurável e score mínimo, exibindo alerta contextual **in-app** na tela de Match Nearby; fallback por bairro escolhido manualmente.
- Não implementar/alegar geofencing de background, despertar por entrada em região, rastreio contínuo com PWA fechada ou disparo de WhatsApp com base em localização não capturada legitimamente. Aplique notificações assíncronas **por eventos reais do servidor** (novos imóveis, preço, favoritos, disponibilidade, visitas), sem fingir acesso ao GPS fechado.

### 4.5 Favoritos, swipe, comparação, radares
- Likes/dislikes e desfazer dentro de regras, histórico, anti-duplicação, recomendações posteriores baseadas em eventos com explicabilidade.
- Favoritos e listas; comparação efetiva com preço por m², condomínio/IPTU quando disponível, area/quartos/garagens, score, links compartilháveis com regras de privacidade.
- Radar do usuário com intervalos e eventos por critérios verificáveis: novos imóveis, redução de preço efetivamente registrada, reentrada em disponibilidade, novos exclusivos autorizados. Notificações com frequência configurável/opt-out e anti-spam.
- SPIRE Exclusive com publicidade sinalizada, posição patrocinada separada de cálculo de score; pré-lançamentos e oportunidades privadas visíveis somente para público autorizado.

### 4.6 Relacionamento, contatos, visitas, propostas e pós-visita
- Página de contato com corretor real designado e retorno pendente; WhatsApp `wa.me` com texto apropriado e consentimentos; histórico no CRM sem forçar acesso indevido ao conteúdo privado de conversas externas.
- Disponibilidade de corretores e times cadastrada no sistema; visita `REQUESTED`, `CONFIRMED`, `RESCHEDULED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`; reservas atômicas, notificações, agendamento e conflitos.
- Smart Tour: rota otimizada quando houver provedor de rotas configurado; caso contrário, ordem por distância aproximada explicitamente identificada, e não ETA inventado. Confirmar disponibilidade individual dos imóveis e corretores antes de confirmar roteiro.
- Proposta: registrar valor, validade, imóvel/unidade, condições, comprador, responsáveis, `DRAFT/SUBMITTED/NEGOTIATING/ACCEPTED/REJECTED/EXPIRED/CANCELLED`; documentos com autenticação e auditoria; registros comerciais **não são contratos ou assinaturas eletrônicas juridicamente válidas sem integração/fluxo próprios**.
- Pós-visita: feedback comprador e corretor, follow-up e sugestões, tarefas comerciais.

### 4.7 CRM SPIRE e inteligência comercial
- Lead criado de formulário, favorito com consentimento/manifestação de interesse, contato, agendamento, campanha/importação autorizada; deduplicação de identidade e atribuição correta da origem.
- Lead Score **distinto** do Match Score; regras configuráveis de interação, recência, intenção, visitas/propostas, explicações e limitação de manipulação.
- Pipeline: `NEW`, `QUALIFYING`, `INTERESTED`, `VISIT_SCHEDULED`, `VISITED`, `PROPOSAL`, `NEGOTIATION`, `WON`, `LOST`; motivos de perda, responsável, tags, metas, tarefas, SLA comercial, filas de distribuição, histórico completo.
- Dashboard por período, equipe, campanha, corretor, imóvel, empreendimento, bairro; conversões por etapa, tempos, VGV, comissão prevista, comissão efetivamente recebida e fonte, sem misturar métricas.
- Receitas B2B: campanhas de incorporadoras e parcerias modeladas com contrato, período, verba, patrocinador, indicação de conteúdo patrocinado, indicadores e custos; precificação configurável sem automatizar cobrança externa sem contrato/acordo e autorização.
- Attribution: first-touch, last-touch e influenced, registrados separadamente; evitar dizer que todas as vendas foram 'geradas exclusivamente' pelo app só porque houve uma interação.

### 4.8 Proprietários, captação e Private Market
- Formulário autorizado de 'Tenho um imóvel', com dados mínimos, cadastro do imóvel, intenção de vender/alugar/aceitar proposta, consentimentos, envio para triagem e designação a corretor.
- Demand Match: análise agregada de buscas atuais por tipologia/bairro/preço, usando apenas amostras confiáveis, limiar mínimo de agregação e não expondo compradores identificáveis; não criar falsa mensagem 'há 27 compradores' sem base verificável e atualização temporal.
- Private Market / oportunidades off-market: opt-in explícito do proprietário, preço mínimo de interesse, prazo, regras de privacidade; filtro/verificação pelo comercial antes de tornar unidade elegível; anonimização e contato intermediado pela SPIRE.
- Processos comerciais de captação com pipeline, tarefas e histórico.

### 4.9 Campanhas, fontes de receita e incorporadoras
- CRUD e relatórios de campanha: tipo, empreendimento, canal, segmentação permitida, patrocinador, intervalo, orçamento, status, metas, atribuição e leads. Não compartilhar dados pessoais com incorporadoras sem base legal/consentimento e acordo apropriado.
- Área restrita para parceiros autorizados acompanharem exclusivamente resultados agregados de seus empreendimentos/campanhas.
- Parcerias de financiamento/seguros/arquitetura/reformas: diretório configurável, CTAs e leads consentidos; registrar indicação e receita acordada, sem afirmar que a SPIRE é correspondente financeiro ou seguradora sem enquadramento aplicável.
- Simulador financeiro educacional por preço/entrada/prazo/taxa informada, exibir CET somente se confirmado e premissas; não prometer aprovação ou taxa bancária sem integração real.

### 4.10 IA Concierge — funcionalidade real com alternativa
- Assistente de busca com intenção natural (`'quero apartamento com 3 quartos em Boa Viagem até R$ 1,3 milhão'`) que gera **JSON tipado validado** e chama a API de busca, sem SQL dinâmico gerado por IA.
- Responde apenas com imóveis e preços existentes no catálogo e explica ranking/limitações; sem alucinar imóveis, avaliações, valorização ou rotas; logs e privacidade minimizados.
- Provedor LLM por adapter, configurável/cobrado externamente e com alternativa determinística por filtros quando não configurado. Consentimento onde necessário; evitar enviar dados pessoais sem necessidade.
- Comparação em linguagem natural de imóveis já encontrados; recomendações com ressalvas e botões reais que levam às telas correspondentes.

### 4.11 Módulos de relacionamento próximos a Living Intelligence
- Pulse/mercado: cards e informações de mercado **somente com fonte, período, região, metodologia e cobertura de dados cadastrados/verificáveis**. Não inventar percentuais de valorização; ocultar/explicar indisponibilidade quando faltar dados.
- Radar e Decide: comparador de compra/aluguel, cálculo de financiamento educativo e custo estimado de moradia com premissas explícitas.
- Capital/estimativa de imóvel de proprietário: habilitar somente se metodologia/modelo/dados reais sustentarem faixa de confiança; caso contrário, indicar 'avaliação mediante contato com consultor' sem falsa estimativa automática.
- City/Life: mapa de serviços e mobilidade se provedor de POIs/rotas licenciado estiver disponível; nunca inventar duração de trajetos, lojas, escolas ou segurança do bairro.
- Club e parceiros: catálogo administrável de parceiros/benefícios reais com vigência, termos, reputação e consentimento. Não criar benefícios fictícios em produção.
- Módulos complementares não devem descaracterizar a navegação principal das 24 telas SPIRE MATCH.

## 5. CANAIS DE NOTIFICAÇÃO

Criar um `NotificationOrchestrator` com preferências, consentimento, políticas anti-spam, horários silenciosos no fuso do usuário, deduplicação, rate limit e logs de entrega.

**Canais:** inbox in-app; Web Push via padrão VAPID + Push API + Service Worker onde compatível; e-mail transacional por SMTP/API configurada; WhatsApp Business Platform oficial por adapter e templates aprovados. Webhooks Meta com assinatura/verificação e idempotência.

**Web Push no iOS:** instruir instalação/adicionar à tela inicial para capacidade suportada; permissão solicitada após gesto e explicação; fallback para inbox/WhatsApp/e-mail sem alegar recebimento garantido. Android/desktop testar suporte real. Permitir revogar `PushSubscription`, renovação, falhas e limpeza de inscrição expirada.

**WhatsApp:** armazenamento do opt-in específico (finalidade, evidência, versão, timestamp, canal), opt-out/STOP; mensagens iniciadas pela empresa por template conforme política; janela de atendimento respeitada; templates revisados, variáveis sanitarizadas, custo/limites do provedor registrados; não usar automação não oficial por navegador ou WhatsApp pessoal.

**Eventos de notificação:** `NEW_MATCH`, `PRICE_DROP`, `NEW_AVAILABLE_UNIT`, `FAVORITE_STATUS_CHANGED`, `RADAR_MATCH`, `EXCLUSIVE_ELIGIBLE`, `VISIT_REQUESTED`, `VISIT_CONFIRMED`, `VISIT_REMINDER`, `PROPOSAL_UPDATED`, `CONTACT_FOLLOWUP`. Criar idempotency key evento+usuário+canal+janela e preferência editável.

## 6. STACK OBRIGATÓRIA — OTIMIZADA PARA HOSTINGER VPS KVM 2

**Frontend comprador:** Next.js (App Router, última versão estável verificável), React, TypeScript strict; Tailwind CSS e biblioteca de componentes acessíveis headless (p.ex. Radix/shadcn/ui), TanStack Query quando justificado, React Hook Form + Zod, animações suaves com Framer Motion/Motion (respeitar reduced motion). Evitar dependências gigantes e bibliotecas UI pesadas.

**Admin:** Next.js + React + TypeScript, visual independente mas design tokens compartilhados. Charts leves, tabelas com paginação server-side, calendário funcional.

**API:** NestJS + TypeScript em monólito modular, REST `/api/v1` com Swagger/OpenAPI gerado, DTOs e schemas Zod quando viável, validação e tratamento global de erros. Não confiar em validações somente do frontend.

**Banco:** PostgreSQL + extensão PostGIS, migrations SQL versionadas, queries geográficas parametrizadas com índice GiST para ponto, índices de busca/status, transações adequadas. ORM/query layer: Drizzle ORM com SQL parametrizado explícito para recursos PostGIS quando necessário (ou biblioteca equivalente validada). Evitar dependência de SaaS gerenciado caro.

**Jobs/filas:** Redis + BullMQ worker com jobs persistentes, retry exponencial, dead-letter/estado falhado, observabilidade, locks, idempotência e processamento seguro de eventos usando outbox transacional em PostgreSQL quando aplicável.

**Mapas:** MapLibre GL JS + tiles/rotas/POI de provedor licenciado e configurável (sem uso indevido da infraestrutura pública OSM). Atribuição visível.

**Imagens:** storage compatível S3 de baixo custo e independente da aplicação (Cloudflare R2, Backblaze B2, MinIO externo ou equivalente); upload assinado, CDN se disponível; alternativa local apenas para dev/staging, sem prometer capacidade infinita do disco VPS.

**PWA:** manifest completo, service worker, ícones adaptativos, Apple touch icon, standalone, splash adequada, experiência offline parcial com cache mínimo e modo degradado, atualização sem quebrar sessões, prompts de instalação respeitosos. Se usar `next-pwa`/Workbox/Serwist ou equivalente, verificar compatibilidade com a versão estável de Next.js em uso.

**Autenticação:** backend próprio com Argon2id, sessões seguras, cookies httpOnly/Secure/SameSite para web (BFF ou domain strategy explícita), refresh token rotation quando aplicável, RBAC/ABAC. Deixar adapters OIDC para Google/Apple e fluxo de tokens para futuro app mobile **sem compartilhar refresh tokens em localStorage**.

**Infra:** Hostinger KVM 2 (planejar orçamento de **2 vCPU, 8 GB RAM, 100 GB NVMe**; confirmar capacidade contratada antes de configurar), Ubuntu LTS, Docker Engine + Docker Compose, reverse proxy Caddy (HTTPS automático), Cloudflare DNS/proteção opcional, firewall, SSH com chaves, GitHub Actions builds em runner remoto. NÃO utilizar Kubernetes, Cloud Run, Cloud SQL, Pub/Sub, Firebase Firestore ou infraestrutura GCP exigida para o app funcionar.

**Deploy:** imagens Docker multi-stage build, produção com builds feitos fora da VPS para poupar CPU/RAM, volumes persistentes, migrations transacionais, checks de saúde, rollbacks, backups offsite criptografados de banco e mídia, teste periódico de restore.

## 7. MONOREPO PREPARADO PARA MOBILE FUTURO

Crie estrutura real:

```text
spire-match/
  apps/
    web/                  # PWA comprador/proprietário, Next.js
    admin/                # painel SPIRE, Next.js
    api/                  # NestJS REST /api/v1
    worker/               # BullMQ (pode compartilhar bootstrap Nest se justificado)
  packages/
    contracts/            # esquemas Zod + types API DTO/versionamento
    api-client/           # SDK TypeScript puro, sem dependência browser/Next
    domain/               # Match, preços, estado, validações PURAS e testáveis
    design-tokens/        # cores, radii, tipografia, espaçamento sem CSS específico
    ui-web/               # componentes web; NÃO tentar compartilhar DOM com RN
    configs/              # eslint, tsconfig, prettier
  infrastructure/
    docker/
    caddy/
    scripts/
    github-actions/
    monitoring/
  design/referencias/     # imagens ancoradas a este prompt
  docs/
    architecture/
    product/
    ui/
    api/
    database/
    security/
    qa/
    deployment/
    operations/
  .env.example
  README.md
  pnpm-workspace.yaml
  turbo.json
```

**Mobile-ready desde o início:** Contratos versionados, SDK isomórfico TS, autenticação interoperável, business logic no backend, domínio puro, rotas e deep links, APIs documentadas, push por adapters independentes (`WEB_PUSH`, `NATIVE_PUSH`, `WHATSAPP`, `EMAIL`), user-agent/capability detection, `LocationProvider` interface (`WebForegroundLocationProvider` agora; `NativeBackgroundGeofenceProvider` só no futuro). NÃO desenvolver agora app de loja ou simular APK/IPA. O cliente móvel futuro poderá ser React Native (idealmente com Expo Dev Client + Swift/Kotlin necessários) sem refazer banco/API/painel; não assumir compartilhamento automático de componentes React web.

## 8. DADOS E MODELO RELACIONAL — IMPLEMENTAR MIGRATIONS REAIS

Crie modelagem normalizada e migrations para, no mínimo, as entidades abaixo. Em todas as tabelas relevantes incluir UUID id, created_at, updated_at, status, soft delete quando cabível, indexes, foreign keys, ownership e auditoria. UUID e datas devem obedecer contrato consistente.

**Contas/identidade:** `users`, `user_sessions`, `auth_identities`, `password_reset_tokens`, `email_verifications`, `roles`, `permissions`, `role_assignments`, `consents`, `consent_documents`, `communication_preferences`, `devices`, `push_subscriptions`, `location_preferences`.

**Perfil/compra:** `buyer_profiles`, `buyer_neighborhood_preferences`, `buyer_feature_preferences`, `buyer_financing_preferences`, `saved_searches`, `radar_subscriptions`, `favorite_lists`, `favorite_items`, `swipe_events`, `user_interactions`, `compare_lists`, `shared_groups`, `shared_group_members`, `shared_opinions`.

**Carteira:** `developments`, `development_phases`, `buildings`, `property_units`, `properties`, `property_features`, `property_feature_values`, `property_images`, `property_media`, `property_documents`, `property_status_history`, `property_price_history`, `property_availability_history`, `property_owners`, `owner_property_authorizations`, `property_import_jobs`.

**Geo/match:** `property_geo` (ou colunas espaciais nas properties), `match_rulesets`, `match_rule_weights`, `match_results`, `match_reasons`, `match_recalculations`, `location_match_events` (mínimo necessário), `property_search_index` (se justificar), `neighborhoods` e `city_regions` com geometrias quando disponíveis.

**CRM/vendas:** `leads`, `lead_scores`, `lead_assignments`, `lead_status_history`, `lead_notes`, `lead_tasks`, `lead_interactions`, `broker_profiles`, `broker_availability`, `visits`, `visit_history`, `tours`, `tour_stops`, `proposals`, `proposal_history`, `deals`, `commissions`, `revenue_attributions`, `referral_sources`, `campaigns`, `campaign_properties`, `campaign_stats`, `organizations`, `organizations_members`, `developer_partner_profiles`.

**Captação:** `owner_leads`, `capture_opportunities`, `private_market_offers`, `private_market_consents`, `demand_aggregate_snapshots` (somente agregado e amostras seguras).

**Comunicação/auditoria:** `notifications`, `notification_deliveries`, `notification_templates`, `webhook_events`, `outbox_events`, `jobs_audit`, `contact_requests`, `messages` (somente mensagens próprias/legitimamente armazenáveis), `support_requests`, `audit_logs`, `data_export_requests`, `data_deletion_requests`.

**Content/market:** `content_articles`, `market_indicators` (fonte, período, método), `partners`, `partner_benefits`, `financial_simulations` se persistência autorizada, `system_settings`, `feature_flags`.

Modelos devem definir valores e enums claros: `PropertyStatus`, `UnitStatus`, `PropertyType`, `LeadStage`, `VisitStatus`, `ProposalStatus`, `ConsentPurpose`, `NotificationChannel`, `MatchReasonType`. Dinheiro sempre `numeric/decimal` (não float), coordenadas geográficas em `geography(Point,4326)` ou estratégia equivalente com GiST, BRL, áreas decimais em m², telefone E.164 normalizado, timestamps UTC. Definir unicidade `user+property+event` quando apropriado e evitar gravação de dados duplicados.

## 9. CONTRATO DE API V1 — FUNCIONAL, SEGURO E DOCUMENTADO

Implementar endpoints reais com OpenAPI, exemplos de requests/responses e testes (incluindo erros, permissões, paginação), no mínimo por domínios:

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
GET    /api/v1/me
PATCH  /api/v1/me
GET    /api/v1/me/preferences
PUT    /api/v1/me/preferences
GET    /api/v1/me/consents
PUT    /api/v1/me/consents
POST   /api/v1/me/export
POST   /api/v1/me/delete-request
GET    /api/v1/properties
GET    /api/v1/properties/:slug
GET    /api/v1/properties/nearby?lat=&lng=&radius=&filters=
GET    /api/v1/developments
GET    /api/v1/units/:id
GET    /api/v1/matches
GET    /api/v1/matches/:propertyId
POST   /api/v1/matches/recalculate
POST   /api/v1/interactions
GET    /api/v1/favorites
POST   /api/v1/favorites
DELETE /api/v1/favorites/:propertyId
GET    /api/v1/compare
PUT    /api/v1/compare
GET    /api/v1/radars
POST   /api/v1/radars
PATCH  /api/v1/radars/:id
DELETE /api/v1/radars/:id
GET    /api/v1/visits
POST   /api/v1/visits
PATCH  /api/v1/visits/:id
GET    /api/v1/tours
POST   /api/v1/tours/preview
POST   /api/v1/tours
POST   /api/v1/contact-requests
GET    /api/v1/notifications
POST   /api/v1/notifications/read
POST   /api/v1/push-subscriptions
DELETE /api/v1/push-subscriptions/:id
GET    /api/v1/exclusives
POST   /api/v1/owner-leads
POST   /api/v1/private-market-offers
POST   /api/v1/ai/search
POST   /api/v1/finance/simulate
GET    /api/v1/market/indicators
GET    /api/v1/admin/dashboard
GET    /api/v1/admin/leads
GET    /api/v1/admin/leads/:id
PATCH  /api/v1/admin/leads/:id
POST   /api/v1/admin/leads/:id/assign
POST   /api/v1/admin/leads/:id/tasks
GET    /api/v1/admin/calendar
GET    /api/v1/admin/pipeline
GET    /api/v1/admin/reports
GET/POST/PATCH/DELETE endpoints admin para propriedades, unidades,
  empreendimentos, corretores, horários, campanhas, parceiro,
  categorias, mídias, proprietários, captações, regras de Match,
  notificações, integrações, perfis de acesso e configurações.
POST   /api/v1/webhooks/whatsapp       # autenticar/verificar assinatura
GET    /api/v1/health/live
GET    /api/v1/health/ready
```

**Observação:** rutas literais como `/properties/nearby` precisam preceder resolução de `/:slug`. Impor limites para radius/paginação, validação estrita e autenticação em dados privados. Evitar suposta API 'pública' de métricas CRM. Gerar SDK a partir de OpenAPI ou schemas compartilhados, com compatibilidade mobile.

**Exemplo Match response:**

```json
{
  "propertyId": "uuid",
  "score": 94,
  "rulesetVersion": "1.0.0",
  "reasons": [
    { "code": "BUDGET_FIT", "label": "Dentro do seu orçamento" },
    { "code": "PREFERRED_AREA", "label": "No bairro que você procura" }
  ],
  "distanceMeters": null,
  "distanceSource": null,
  "propertyStatus": "AVAILABLE",
  "computedAt": "2026-10-20T13:00:00Z"
}
```

**Distância nula é legítima** quando localização foi negada/desconhecida. Nenhum texto inventado de proximidade deve ser exibido nesse caso.

## 10. PWA: INSTALAÇÃO, PUSH, OFFLINE E SEO

- Entregar `manifest.webmanifest` (nome, short name, start_url, scope, `display: standalone`, theme/background, ícones 192/512 e maskable, screenshots se suportado, descrições), favicons Apple/Android.
- Detectar capacidades por navegador: instalação Android desktop quando suportada; iOS orientar 'Compartilhar > Adicionar à Tela de Início' quando for o fluxo aplicável. Não criar prompt automático repetitivo.
- Service Worker: cache de shell, componentes e imagens públicas adequadas com versionamento e limites; não cachear HTML privado/CRM/API de autenticação nem dados pessoais em cache público; apresentar fallback offline, botão tentar novamente.
- Preferências do usuário e contatos podem exigir online para transações; não prometer offline completo; favoritos podem usar fila offline local somente com controle de idempotência, feedback e isolamento por sessão.
- Push apenas após permissão/instalação suportada; reintegração de subscription expirada, fallback canais e diagnósticos de entrega.
- Compartilhamento via Web Share API/fallback copiar link; deep links para propriedade/match/radar/visita; URLs canônicas e OG por imóvel sem dados privados, sitemap do conteúdo indexável, robots e status corretos, páginas privadas noindex.
- Performance: LCP/INP/CLS dentro das metas Core Web Vitals nas rotas principais e métricas aferidas, bundle dividido, lazy map/AI, imagens avif/webp, SSR/ISR cuidadoso e não vazar cache de usuários.

## 11. PAINEL ADMINISTRATIVO COMPLETO

Desenvolver interfaces reais com navegação lateral e permissões por módulo:

1. **Visão geral:** cards KPI, períodos, equipes, meta x resultado, funil, desempenho, imóveis populares, conversões, comissões e VGV.
2. **Leads:** tabela avançada com filtros/etapas, distribuição automática/manual, ações em lote autorizadas, exportações auditadas, SLA, contatos e histórico.
3. **Detalhe do lead:** Match e Lead Score explicados, origem e consentimento, propriedades, timeline, CRM, tarefas, anotações, próximos passos.
4. **Agenda:** calendário de corretores/visitas e tours, conflitos, agendas e reservas, fases do funil.
5. **Imóveis/empreendimentos/unidades:** CRUD, import/export, preview, revisão, preço/status, fotos e dados completos.
6. **Proprietários/captações/off-market:** autorização, fluxo de captação, encaminhamento ao corretor, demanda agregada.
7. **Corretores/gestores:** contas, times, disponibilidade, metas, performance e papéis.
8. **Campanhas/incorporadoras:** contratos/campanhas, segmentos permitidos, filtros, métricas, leads consentidos, performance, mídia patrocinada identificada.
9. **Notificações/automação:** templates, canais, taxa de falha, envios autorizados, opt-out e análise de entregabilidade.
10. **Relatórios/financeiro:** VGV, previsões de comissão, recebido, atribuição, custos de campanha, ROI com metodologia, export PDF/CSV se necessário.
11. **Conteúdo/informação de mercado:** gerenciar textos, anúncios editoriais, fontes e validade de indicadores, privacidade.
12. **Configurações e auditoria:** roles/permissões, regras de score, feature flags, parâmetros de fila, alertas e integradores; trilha de mudanças e logs de acesso.

**RBAC mínimo:** `VISITOR`, `BUYER`, `OWNER`, `BROKER`, `SALES_MANAGER`, `ADMIN`, `SUPER_ADMIN`, `DEVELOPER_PARTNER`. Restringir dados por equipes e empresas; contratos multi-organização preparados com `organization_id` nos agregados pertinentes, sem expor carteiras entre concorrentes.

## 12. SEGURANÇA, LGPD, GOVERNANÇA

- Aplicar minimização de dados, bases legais revisáveis, finalidades distintas, consentimentos granulados com versão, reversão e comprovante.
- Área 'Privacidade' com preferências de canais/localização, exportação dos dados, pedido de exclusão, política, responsável/contacto; prazos de retenção parametrizados e tratamento de requisições LGPD.
- Para localização, não registrar trilha contínua crua, não vender dados, não compartilhar posição exata com corretores/incorporadoras sem finalidade e autorização. Eventos de proximidade limitados e com TTL/retention apropriados.
- Login seguro, Argon2id, rate limiting, captcha só para sinais de abuso, proteção CSRF para rotas com cookies, CORS estrito, headers seguros, CSP ajustada a mapas/fontes, sanitização XSS, SQL parametrizado, secrets exclusivamente environment/secret files fora do git, servidor com least privilege, auditoria de tarefas privilegiadas.
- Soft delete não substitui exclusão de dados; definir remoção/anônimos reais quando exigido e cronograma de eliminação de backups compatível com retenção documentada.
- Política explícita de gestão de incidentes e vazamento; PII mascarada em logs, consentimento de telefone para WhatsApp, opt-out e descadastro.
- Não permitir criação de anúncios discriminatórios; score técnico imobiliário baseado em atributos da compra, não inferências sobre dados pessoais sensíveis ou atributos protegidos.

## 13. QUALIDADE, TESTES E PERFORMANCE — OBRIGATÓRIOS

Cobertura real de unidades, integrações, frontend e E2E:

- Unit Match: pesos, faltas de campos, indisponibilidade, orçamento rígido, localização negada, idade dos dados, alterações de preços, favoritos, reponderação e estabilidade da pontuação.
- PostGIS integration: raio, bounding box, precisão distância, índice, região/bairro, cidades, escala de milhares de propriedades.
- API: login, sessão, privacidade entre contas, roles, paginação, filtros, erros de validação, idempotência, webhook replay, uploads, importação, criação/edição.
- CRM: pipeline, atribuição de lead, duplicação, visita concorrente, relatório de receita com comissão efetivamente recebida separada de previsão.
- PWA: instalação, service worker, cache/offline seguro, atualização, browser permission denied, localização aproximada/inexistente, iOS Web Push quando instalado e suportado, navegador sem Push.
- Notificações: consentimento ausente, limites frequência, timezones, templates, rejeições, status entregue/erro e dedupe.
- UI: Playwright desktop + mobile viewport para todas as 24 telas e principais extras; screenshots e diffs com aprovação humana quando houver variação legítima; testes axe-core de acessibilidade; responsividade (320/375/390/768/1024/1440).
- E2E obrigatório: comprador cria perfil → vê Match real → curte → favorito → compara → contato → agenda; corretor vê lead → acompanha visita → envia proposta → registra fechamento → gestor vê receita atribuída.
- E2E de proprietário: solicita captação → corretor aprova → imóvel privado entra em circuito autorizado → comprador pede contato → CRM registra.
- Dados demo SEPARADOS, não testando em produção nem deixando dados falsos visíveis ao público.
- Executar testes de carga moderada e registrar latências, consumo de RAM/CPU e capacidade antes de afirmar usuários simultâneos suportados. Medir p95 de endpoints críticos e otimizar queries N+1.

## 14. HOSTINGER: PRODUÇÃO DE BAIXO CUSTO SEM FRAGILIDADE

- Planejar quatro processos principais: `web`, `admin`, `api` e `worker`, além de `postgres`, `redis` e `caddy`; definir limites de memória adequados ao KVM 2 e pools de conexão reduzidos. Worker pode ser combinado com API se recursos reais exigirem e documentação justificar.
- Não armazenar milhares de mídias nem backups somente no disco principal do VPS. Banco com volume e backup offsite criptografado e automático; armazenar mídia em S3-compatible provider, com custos declarados.
- NUNCA desenvolver build de produção gigantesco diretamente no VPS se CI remoto puder gerar as imagens; tag imutável por commit, rollback, migrations com backup/compatibilidade.
- Caddy atrás de Cloudflare opcional, SSL seguro fim a fim, DNS/zone administrável; não assumir propriedade de domínio ou contas sem confirmação.
- Firewall só 22 restrito, 80/443; banco Redis/PG inacessíveis da internet; SSH root desativado quando adequado e contas com sudo; fail2ban ou equivalente; atualização de segurança controlada.
- Healthchecks, readiness e liveness, registro estruturado, rotação de logs, uptime monitor externo, alertas e métricas simples. Aumentar VPS ou separar banco quando métricas justificarem; NÃO inventar números de capacidade.
- Entregar `docker-compose.yml`, `.env.example`, `Caddyfile`, scripts backup/restore, instruções DNS e SSL, pipeline CI/CD, rollout/rollback, status e política de operação.

## 15. DOCUMENTAÇÃO FINAL INDISPENSÁVEL

Gerar, manter atualizados e entregar:

```text
docs/product/PRD.md
docs/product/SCREEN_MATRIX_24.md
docs/product/USER_JOURNEYS.md
docs/product/BUSINESS_RULES.md
docs/product/REVENUE_AND_ATTRIBUTION.md
docs/ui/DESIGN_SYSTEM.md
docs/ui/VISUAL_FIDELITY_REPORT.md
docs/architecture/ARCHITECTURE.md
docs/architecture/ADR_WEB_PWA_NATIVE_FUTURE.md
docs/architecture/ADR_PWA_GEOLOCATION_LIMITS.md
docs/database/ERD.md
docs/database/MIGRATIONS_AND_INDEXES.md
docs/api/OPENAPI.md
apps/api/openapi.json
docs/security/LGPD_DATA_MAP.md
docs/security/RBAC.md
docs/security/THREAT_MODEL.md
docs/operations/NOTIFICATION_POLICY.md
docs/operations/WHATSAPP_TEMPLATES.md
docs/operations/PROVIDER_CONFIGURATION.md
docs/qa/TEST_PLAN.md
docs/qa/TEST_RESULTS.md
docs/qa/VISUAL_DIFFS.md
docs/deployment/LOCAL_DEV.md
docs/deployment/HOSTINGER_KVM2.md
docs/deployment/CI_CD.md
docs/deployment/BACKUP_RESTORE.md
docs/deployment/ROLLBACK.md
docs/deployment/PRODUCTION_LAUNCH_CHECKLIST.md
docs/architecture/MOBILE_MIGRATION_READINESS.md
README.md
.env.example
```

Não deixe `README` genérico. As instruções devem ser reproduzíveis em máquina nova com Docker e variáveis mínimas. Explicitar custos/credenciais externas obrigatórias e quais integrações não estão habilitadas ainda.

## 16. EXECUÇÃO POR MARCOS (SEM REDUZIR O ESCOPO)

**Marco A — Fundação e fidelidade visual:** leitura de referências e matrizes, design tokens, auth, layout, navegação, scaffolding real, base do banco e CI. Validar screenshots.

**Marco B — Experiência comprador integral:** onboarding, catálogo, Match Engine, Home, mapa, filtros, swipe, favoritos, comparação, exclusivos, AI Concierge, perfil e PWA; integração com dados reais do backend.

**Marco C — Conversão e notificações:** contato, visitas, disponibilidade de corretores, Smart Tour, propostas, comunicações, radares, Web Push, e-mail e integração oficial WhatsApp configurável.

**Marco D — Operação comercial completa:** CRM, leads, lead score, imóveis/empreendimentos/unidades, corretores, funil, calendário, campanhas, métricas, receita/comissões, relatórios, admin e permissões.

**Marco E — Captação e relacionamento:** proprietário, Demand Match agregado, Private Market autorizado, campanhas incorporadoras, parceiras, módulos Pulse/Decide/Capital/City/Club com dados e serviços legítimos.

**Marco F — Hardening e lançamento:** LGPD, testes integrais, auditoria de permissões, load/performance, PWA cross-device, acessibilidade, backups, restore, logs, rollback, homologação, deploy, manuais operacionais e relatório de lacunas.

Ao final de **cada** marco apresentar: entregas concluídas, rotas exercitadas, testes rodados, capturas de tela, problemas e mudanças. Continuar ao marco seguinte sem chamar o trabalho de concluído antes do Marco F.

## 17. CRITÉRIO FINAL DE ACEITAÇÃO — NÃO NEGOCIÁVEL

A entrega é aceita somente se:

- **Todas as 24 telas visuais** tiverem versão web funcional, coerente com imagens fornecidas, sem serem screenshots de fundo, e com testes de interface.
- Todos os módulos administrativos adicionais essenciais estiverem completos; CRUD real e regras de autorização funcionando.
- Usuário real puder cadastrar perfil, pesquisar/mapear, obter score explicável, interagir, comparar, receber Match contextual quando abrir PWA, falar com corretor, agendar visita e acompanhar operação.
- Corretor puder gerenciar lead, estágio, visita, proposta e registrar fechamento; gestor puder ver funil, VGV, comissões e atribuição.
- Proprietários puderem solicitar captação e private market mediante consentimento; o comercial puder moderar e intermediar.
- PWA for instalável onde suportada, funcionar com HTTPS, ter modo offline parcial honesto, e Web Push quando tecnicamente disponível e autorizado.
- Não houver promessa enganosa de geofencing em segundo plano, preços/mercado fictícios ou WhatsApp ativo sem credenciais aprovadas.
- Esquemas/migrations, APIs, testes, controle de acesso, privacidade, documentação e deploy Hostinger estejam presentes e validados.
- Estrutura de contratos SDK/áreas/identidades/notificações suportar implementação posterior de React Native **sem reescrever o core**.
- Todos os dados demonstrativos estiverem identificados como tal e isolados de produção; integrações reais só relatadas como ativas após validação.
- Produção só for declarada 'pronta' com checklist de operação e testes de restauração de backup concluídos.

## 18. SUA PRIMEIRA RESPOSTA E PRIMEIRAS AÇÕES COMO AGENTE

Ao receber este prompt e arquivos:

1. Abra de fato as 12 referências visuais. Liste quais arquivos foram lidos e em quais houve falha.
2. Faça a tabela `24 telas x rotas x funcionalidades x backend x testes`, e identifique lacunas adicionais.
3. Crie a árvore de monorepo, planos de migração do banco, a lista de módulos com dependências e as ADRs de PWA e localização.
4. Explique sucintamente as decisões que serão tomadas; **não aguarde autorização para decisões cobertas por este documento**.
5. Inicie imediatamente a implementação real, conectada ao banco. Não pare após entregar planejamento, wireframes, telas estáticas ou apenas uma Home.
6. Não substitua integrações por botões inertes. Serviços sem credenciais devem ser marcados claramente como pendentes de ativação externa, com testes simulados bem sinalizados para desenvolvimento.
7. Ao concluir, entregue instruções executáveis para subir o sistema localmente e na Hostinger, contas demo somente de homologação, matriz de testes e relatório de conformidade de 24 telas.

**PRINCÍPIO FINAL:** SPIRE MATCH precisa parecer uma marca imobiliária premium e, sobretudo, funcionar como um sistema comercial real. A estética encanta; o Match qualifica; o atendimento converte; a inteligência comercial comprova o resultado.

---

## REFERÊNCIAS TÉCNICAS AUTORITATIVAS PARA VERIFICAR DURANTE IMPLEMENTAÇÃO

- Next.js self-hosting: https://nextjs.org/docs/app/guides/self-hosting
- Geolocation Web API: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
- Web Push para web apps na Tela de Início Apple: https://webkit.org/blog/13878/
- Web Push API: https://developer.mozilla.org/en-US/docs/Web/API/Push_API
- PWA instalação/manifest: https://web.dev/learn/pwa/
- MapLibre GL JS: https://maplibre.org/maplibre-gl-js/docs/
- PostGIS: https://postgis.net/documentation/
- WhatsApp Business Platform políticas: https://business.whatsapp.com/policy

Verifique atualidade e compatibilidade das versões estáveis antes de implementar; não aplique tutoriais obsoletos cegamente.
