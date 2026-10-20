# Guia das referências visuais SPIRE MATCH

## Regra prioritária

As seis pranchas numeradas de 01 a 06 representam **24 telas distintas**, conforme a sequência visual da esquerda para a direita e de cima para baixo. Reproduzir cada tela como HTML/React responsivo real, não como imagem estática. As telas 07–11 fornecem aproximações ampliadas para ajudar com microdetalhes. A original (12) serve como referência estética histórica, não sobrepõe as pranchas SPIRE.

| Arquivo | Telas | Descrição |
|---|---|---|
| `01_fluxo_inicial.png` | 1–4 | Splash, onboarding, acesso, Home |
| `02_exploracao_e_mapa.png` | 5–8 | Busca, mapa, filtros, oportunidade perto |
| `03_interacao_e_match.png` | 9–12 | Swipe, favoritos, comparação, SPIRE Exclusive |
| `04_conversao_e_atendimento.png` | 13–16 | Detalhes, consultor, agendamento, Smart Tour |
| `05_perfil_e_relacionamento.png` | 17–20 | Perfil, notificações, radar, minhas visitas |
| `06_painel_comercial.png` | 21–24 | KPIs, Leads, CRM, Agenda/Funil |
| `07_home_detalhada.png` | detalhe 4 | Home aprofundada |
| `08_mapa_detalhado.png` | detalhe 6 | Mapa aprofundado |
| `09_swipe_detalhado.png` | detalhe 9 | Swipe aprofundado |
| `10_imovel_detalhado.png` | detalhe 13 | Detalhes de imóvel aprofundados |
| `11_dashboard_detalhado.png` | detalhe 21 | Dashboard aprofundado |
| `12_referencia_original_cliente.jpg` | referência | Estética de imóveis e mapas de referência inicial |

## Regras para fidelidade

1. Usar layout, localização dos cards, proporção de imagens, distância entre elementos, paleta, tipografia e ordem das informações como forte referência.
2. Preservar identidade premium sem confiar cegamente em erros tipográficos pontuais de geradores de imagem; UI deve usar ortografia pt-BR correta.
3. Os mockups exibem estilos de navegação distintos em algumas pranchas. Consolidar uma navegação funcional única coerente e documentar a decisão na matriz, sem perder acesso rápido a favoritos, mensagens/contato e Matches.
4. Todos os preços/nomes/endereços/fotos das imagens são **fictícios/ilustrativos até validação com a imobiliária**. Nunca publicar como anúncios reais.
5. Construir design tokens e componentes: `SpireHeader`, `MatchBadge`, `PropertyCard`, `PropertyDetails`, `PropertyGallery`, `FilterChip`, `BottomNavigation`, `PropertyMap`, `SwipeDeck`, `CompareGrid`, `VisitCalendar`, `TourBuilder`, `AdminSidebar`, `KpiCard`, `SalesFunnel`, `LeadScoreBadge`, `LeadActivityTimeline`.
6. Validar em viewport móvel 390 × 844 e desktop 1440 × 900, além de tablet; screenshots de comparação e estados de carregamento.
