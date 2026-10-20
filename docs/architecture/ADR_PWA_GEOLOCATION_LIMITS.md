# ADR — Limites de geolocalização em PWA

**Status:** Aceito · Marco A (reforçado nos Marcos B/C)

## Contexto

O SPIRE MATCH promete "Match perto de você" (tela 8, `/matches/perto`) e um
Mapa Inteligente com distância real. Navegadores modernos **não permitem**:

- Acesso a localização com a PWA fechada ou em segundo plano por tempo
  indeterminado.
- Geofencing nativo (despertar o app ao entrar numa região) fora de um app
  nativo instalado via loja, com permissões de background location.
- Garantia de entrega de Web Push correlacionada à posição GPS atual sem o
  usuário ter o app aberto/instalado.

O prompt mestre proíbe explicitamente alegar essas capacidades (seção 4.4) e
exige que a ausência de localização nunca penalize o score do comprador.

## Decisão

1. Localização é obtida **somente durante sessão visível**, via
   `navigator.geolocation.getCurrentPosition()` / `watchPosition()`, atrás de
   gesto do usuário e após explicação clara do motivo.
2. Interface `LocationProvider` (pacote `domain`, implementação em `web`):
   - `WebForegroundLocationProvider` — único provider ativo agora.
   - `NativeBackgroundGeofenceProvider` — tipo reservado para o futuro app
     React Native; **não implementado nem simulado** nesta fase.
3. O Match Engine (`packages/domain/src/match`) trata `currentLocation` como
   opcional. Quando ausente, o peso de proximidade (15%) é redistribuído
   determinísticamente entre os demais fatores (`reweightWithoutProximity`,
   testado em `score.test.ts`) — nunca reduz o score por ausência de GPS.
4. "Match perto de você" e o Mapa exibem distância **somente** quando há uma
   leitura de geolocalização válida e recente da sessão atual. Caso
   contrário, a UI oferece fallback por bairro selecionado manualmente — sem
   inventar "você está a X m".
5. Notificações de proximidade são sempre **eventos do servidor** disparados
   por mudanças reais de inventário (novo imóvel, preço, disponibilidade),
   nunca por rastreamento contínuo do dispositivo.

## Consequências

- Nenhuma feature desta plataforma depende de permissão de localização em
  segundo plano — a PWA funciona plenamente sem ela.
- Ao migrar para React Native, apenas um novo `LocationProvider` precisa ser
  implementado; o Match Engine e os contratos de API já são agnósticos à
  fonte da localização.
