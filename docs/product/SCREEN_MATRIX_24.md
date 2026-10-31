# Matriz das 24 telas de referência

Fonte: `docs/MATRIZ_24_TELAS.csv` (matriz original do Marco A). Coluna **Status** verificada nesta revisão (Marco F6) contra as rotas reais em `apps/web/src/app/` e `apps/admin/src/app/admin/` — todas as 24 existem e renderizam com dados reais da API, não placeholders.

| # | Prancha | Tela | Rota | Status |
|---|---|---|---|---|
| 1 | 01 | Splash / boas-vindas | `/` | Implementado |
| 2 | 01 | Onboarding / comprador | `/onboarding` | Implementado |
| 3 | 01 | Login / acesso | `/entrar` | Implementado |
| 4 | 01 | Home / Matches | `/inicio` | Implementado |
| 5 | 02 | Buscar / Explorar | `/explorar` | Implementado |
| 6 | 02 | Mapa inteligente | `/mapa` | Implementado |
| 7 | 02 | Filtros avançados | `/explorar/filtros` | Implementado |
| 8 | 02 | Alerta de oportunidade (Match Nearby) | `/matches/perto` | Implementado |
| 9 | 03 | Swipe / Descobrir | `/matches/descobrir` | Implementado |
| 10 | 03 | Favoritos | `/favoritos` | Implementado |
| 11 | 03 | Comparar imóveis | `/comparar` | Implementado |
| 12 | 03 | SPIRE Exclusive | `/exclusivos` | Implementado |
| 13 | 04 | Detalhe do imóvel | `/imoveis/[slug]` | Implementado |
| 14 | 04 | Atendimento / consultor | `/atendimento/[propertyId]` | Implementado |
| 15 | 04 | Agendar visita | `/visitas/agendar` | Implementado |
| 16 | 04 | Tour Inteligente | `/tour` | Implementado |
| 17 | 05 | Meu perfil | `/perfil` | Implementado |
| 18 | 05 | Centro de notificações | `/notificacoes` | Implementado |
| 19 | 05 | Meus radares | `/radares` | Implementado |
| 20 | 05 | Minhas visitas e atividades | `/minhas-visitas` | Implementado |
| 21 | 06 | Visão geral (admin) | `/admin` | Implementado |
| 22 | 06 | Leads / oportunidades | `/admin/leads` | Implementado |
| 23 | 06 | Detalhe do lead / CRM | `/admin/leads/[id]` | Implementado |
| 24 | 06 | Agenda / Funil | `/admin/agenda` + `/admin/funil` | Implementado (duas rotas, ver nota) |

## Notas de implementação

- **#24** foi dividido em duas rotas em vez de uma só: `/admin/agenda` (calendário de visitas/corretores) e `/admin/funil` (kanban do pipeline de leads). A matriz original já previa essa divisão ("Agenda / Funil" cobrindo dois conceitos); manter duas rotas evitou uma tela sobrecarregada e segue o padrão do resto do admin (uma responsabilidade por rota).
- Nenhuma das 24 telas é renderizada como captura de tela de fundo — todas são DOM real, componentes de `packages/ui-web`, consumindo a API em `/api/v1`.

## Telas adicionais entregues (fora das 24, previstas na seção 3 do prompt mestre ou adicionadas nos Marcos D/E/F)

Módulos admin: `/admin/imoveis`, `/admin/empreendimentos`, `/admin/unidades`, `/admin/proprietarios` (+ `/admin/proprietarios/[id]`), `/admin/captacoes`, `/admin/usuarios`, `/admin/corretores`, `/admin/incorporadoras`, `/admin/campanhas`, `/admin/relatorios`, `/admin/financeiro`, `/admin/conteudo`, `/admin/automacoes`, `/admin/notificacoes`, `/admin/integracoes`, `/admin/configuracoes`, `/admin/auditoria`, `/admin/privacidade`.

Comprador: `/tenho-um-imovel` (captação de proprietário), `/mercado` (Pulse — indicadores de mercado), `/mercado-privado` (Private Market off-market), `/parceiros` (Club), `/mensagens`, `/privacidade`, `/termos`.

`/admin/imoveis/novo` citada no prompt mestre como rota própria foi implementada como um formulário inline que expande dentro da própria `/admin/imoveis` (estado `formOpen`, ver `apps/admin/src/app/admin/imoveis/page.tsx`), não uma rota separada — mesmo padrão usado em Campanhas e outros CRUDs do admin.
