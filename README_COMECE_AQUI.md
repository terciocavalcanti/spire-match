# SPIRE MATCH — KIT PARA GOOGLE ANTIGRAVITY

Este kit foi preparado para implementar o **produto final SPIRE MATCH como PWA**, com painel comercial e API, arquitetura otimizada para Hostinger VPS KVM 2 e prontidão para uma futura aplicação React Native.

## Início em 4 passos

1. **Descompacte o ZIP em uma pasta vazia**, por exemplo `spire-match/`.
2. **Abra essa pasta como workspace no Antigravity.** Confirme que ele consegue abrir arquivos `design/referencias/*.png` e ler `PROMPT_MESTRE_ANTIGRAVITY.md`.
3. Na conversa do agente, cole a instrução curta:

   > Leia integralmente `PROMPT_MESTRE_ANTIGRAVITY.md`, `docs/MATRIZ_24_TELAS.csv`, `docs/GUIA_REFERENCIAS_VISUAIS.md` e todas as imagens em `design/referencias/`. Execute o plano e desenvolva o SPIRE MATCH como PRODUTO FINAL PWA e painel comercial. Reproduza as 24 telas conforme suas referências. Não entregue apenas MVP, wireframes nem frontend desconectado. Antes de começar, confirme quais arquivos conseguiu abrir, construa a matriz de fidelidade e prossiga à implementação completa com banco/API, testes e deploy Hostinger.

4. Acompanhe os marcos A–F do prompt. Exija testes, screenshots e implantação para declarar cada etapa concluída.

## Conteúdo

- **`PROMPT_MESTRE_ANTIGRAVITY.md`**: especificação detalhada, regras e critérios de aceitação.
- **`docs/MATRIZ_24_TELAS.csv`**: mapa de cada tela das seis pranchas para rota/funcionalidade.
- **`docs/GUIA_REFERENCIAS_VISUAIS.md`**: relação de arquivos e diretrizes de fidelidade.
- **`design/referencias/01..06`**: seis pranchas com quatro telas cada (24 telas).
- **`design/referencias/07..11`**: cinco telas-chave ampliadas.
- **`design/referencias/12`**: a imagem original enviada como referência de estilo.

## Limitações e requisitos externos

- O projeto **não inclui implementação executável ainda**: trata-se do kit de especificação e referências para o agente construir o produto.
- A **PWA não pode realizar geofencing nativo em segundo plano** com navegador fechado de maneira confiável. Alertas de proximidade serão apresentados com localização obtida quando o usuário estiver usando a PWA; notificações remotas serão baseadas em eventos legítimos no servidor.
- Ativação real de WhatsApp Business Cloud API, fornecedor de mapas/rotas, armazenamento S3, provedor de IA, serviço SMTP e DNS depende de contas e credenciais do contratante. As integrações devem ficar implementadas e testáveis sem alegar que estão ativas antes da configuração.
- Não exponha chaves, dados reais de clientes nem senhas na conversa do agente ou em commits. Use variáveis de ambiente e secrets.
- Os preços e nomes de imóveis nas referências visuais são apenas **dados ilustrativos** e não devem ser tratados como anúncios reais.

## Definição de escopo

- **Agora:** PWA comprador/proprietário, painel comercial web, backend API, banco, jobs, CRM, notificações, captação, Private Market, inteligência e relatórios.
- **Depois:** app Android/iOS React Native utilizando APIs e contratos já implementados; geofencing nativo de fundo será novo cliente/adaptador, não reconstrução do sistema.

## Documentação adicional

Para orientar o agente, o prompt exige que ele próprio gere arquitetura, ERD, OpenAPI, runbooks de deploy, matriz LGPD, evidências de QA, plano de restauração de backup e checklist de produção.
