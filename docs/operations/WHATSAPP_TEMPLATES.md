# Templates de WhatsApp

## Estado real: não há envio server-side implementado

Busca por "whatsapp" em todo `apps/api/src` encontra apenas:

- Duas variáveis de ambiente opcionais, nunca lidas por nenhum serviço de
  envio: `WHATSAPP_CLOUD_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`
  (`apps/api/src/config/env.ts`).
- `apps/api/src/integrations-status/integrations-status.service.ts`, que só
  reporta `ATIVO`/`PENDENTE` no painel admin verificando se essas duas
  variáveis estão preenchidas — nunca envia nada.
- Comentários explícitos em `notifications.service.ts` e
  `database/schema/notifications.ts` dizendo que e-mail/WhatsApp/LLM "ficam
  como adapters desligados até haver credencial real — nunca simulados como
  enviados".

**Não existe nenhum template de mensagem automatizada via WhatsApp Business
Cloud API nesta base de código.** Isso é uma lacuna real (ver
`docs/qa/GAPS_REPORT.md`), não um recurso implementado e não documentado.

## O único touchpoint real de WhatsApp hoje

`apps/web/src/app/atendimento/[propertyId]/page.tsx` — botão "Chamar no
WhatsApp" é um link `https://wa.me/<telefone-real-do-corretor>?text=...`
aberto pelo **navegador do comprador**, não uma chamada de API do servidor:

```
Olá, {broker.name}! Tenho interesse no imóvel {property.title}.
```

O número vem de `brokers.phone`, sempre um corretor real cadastrado —
`apps/api/src/database/seed-brokers.ts` documenta explicitamente que esse
CTA nunca deve usar um número fictício. Isso é, na prática, um deep-link
client-side para o próprio app de WhatsApp do usuário, não um canal de
notificação ou automação do lado do servidor.

## O que a Cloud API faria, se implementada

Caso `WHATSAPP_CLOUD_API_TOKEN`/`WHATSAPP_PHONE_NUMBER_ID` sejam
configurados em produção no futuro, os candidatos naturais a template
(mapeados aos tipos de notificação já existentes em
`docs/operations/NOTIFICATION_POLICY.md`) seriam:

| Template proposto | Tipo de notificação correspondente | Gatilho |
|---|---|---|
| Confirmação de visita | `VISIT_CONFIRMED` | Agendamento de visita bem-sucedido |
| Atualização de proposta | `PROPOSAL_UPDATE` | Proposta registrada/respondida |
| Novo imóvel no radar | `RADAR_HIT` | Varredura de radar encontra imóvel compatível |

Nenhum desses templates está registrado na Meta Business Platform nem
implementado em código — são apenas candidatos para quando a integração
real for priorizada.
