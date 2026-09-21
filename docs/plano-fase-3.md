# Plano da fase 3 — a próxima release

Planejamento da UI v3, a próxima release do jogo. Escrito para quem for
implementá-la: descreve o que entra, em que ordem, o que precisa ser decidido
antes de começar e como saber que cada fase terminou.

**Estado atual:** a v2 está publicada em
[voice-tic-tac-toe-mu.vercel.app](https://voice-tic-tac-toe-mu.vercel.app/).
O desenho da v3 existe em quatro artboards — desktop e celular, nos temas
escuro e claro — num canvas de design privado. Este documento é a versão
textual daquele desenho, para que o plano não dependa de acesso a ele.

## O que a v3 propõe

A v2 arrumou a hierarquia da interface. A v3 muda o gênero: o produto deixa de
ser um app com um tabuleiro e passa a ser uma partida.

- **HUD no topo** com rodada, idioma, som e ajustes.
- **Painel do jogador à esquerda** — placar em fonte de fliperama, sequência de
  vitórias, próximo desbloqueio.
- **Painel do adversário à direita** — a IA vira personagem, com nível, barra de
  força, fala em destaque e a dificuldade como seletor.
- **Tabuleiro ao centro**, 524×524 no desktop, em grade contínua.
- **Barra inferior** com a ação principal, dicas de comando e progresso até o
  próximo nível.

No celular os dois painéis viram uma faixa dupla acima do tabuleiro, e a ação
principal fica fixa no rodapé.

**Tipografia:** Chakra Petch para tudo, Press Start 2P apenas nos números.

**Temas:** o escuro é neon sobre preto, com cantos retos e bordas de 2px. O
claro não é o escuro invertido — é aço escovado, com três camadas de material
(elevado, rebaixado e a chapa de fundo) e cantos de 12 a 24px. Layout,
tipografia, tamanhos e hierarquia são idênticos nos dois; só o material muda.

## Decidir antes de começar

Três pontos travam o trabalho se ficarem em aberto.

### 1. A v3 não é só camada visual

A proposta inclui rodada numerada, sequência de vitórias, XP, nível da IA
desbloqueável, conquistas e timer da jogada. Isso é um sistema de progressão:
estado de domínio novo, ações novas no reducer, persistência nova e testes
novos. Pela estimativa deste plano, é mais trabalho que a repintura, não menos.
Tratar como "só CSS" leva a estouro de prazo no meio da fase 4.

### 2. Progressão e seletor de dificuldade se contradizem

A v3 tem uma barra de progresso "até o nível 3 da IA" **e** a dificuldade como
seletor livre. Hoje qualquer pessoa escolhe `Impossível` nas configurações a
qualquer momento. Ou o seletor passa a ser travado pela progressão — e aí uma
liberdade existente é removida — ou a barra é decorativa. As duas leituras dão
código diferente.

### 3. Um material ou dois

O desenho tem neon chapado no escuro e metal em relevo no claro. Funcionam como
dois modos da mesma máquina, mas não são gêmeos. A alternativa é levar o relevo
metálico também para o escuro.

Do ponto de vista de manutenção, dois materiais distintos custam menos que um
relevo que precise funcionar sobre preto: sombra interna e risco de luz
dependem de contraste com o fundo, e sobre `#0B0618` quase todo o efeito
desaparece ou precisa de valores próprios. É uma escolha de produto, não
técnica — mas o custo não é simétrico.

## As fases

### Fase 0 — fundação

Antes de qualquer pixel novo, porque a v3 triplica a superfície de interface.

- Corrigir a dívida de acessibilidade medida na produção da v2: o token
  `--faint` em 4.20:1 no tema claro (abaixo do mínimo AA de 4.5:1) e os três
  botões de ícone do cabeçalho em 40×40 (abaixo dos 44px).
- Verificação automática de contraste e alvo de toque no CI.
- Teste de componente. Hoje são **zero**: os 82 testes cobrem lógica de jogo,
  voz, armazenamento e dados de build, e nenhum toca em React.
- Regressão visual.

O argumento para essa ordem: todos os defeitos visuais da v2 — vão na tela de
vitória, dica de voz sobrevivendo ao fim da partida, botão transbordando no
desktop — foram encontrados por captura de tela manual. Numa superfície três
vezes maior, isso não escala.

### Fase 1 — tokens e material, sem mexer no layout

Dois conjuntos de tokens sob `:root` e `:root[data-theme="light"]`, preservando
os três estados (automático, claro, escuro) que o app já tem. Entrega um diff
pequeno e revisável, separando claramente CSS de lógica.

### Fase 2 — layout do desktop

Três colunas, HUD, painéis laterais, barra inferior.

### Fase 3 — layout do celular

Com orçamento de altura medido a cada passo e limite de linhas na fala da IA.

### Fase 4 — progressão

Rodada, sequência, XP, níveis e conquistas. Reducer e persistência com teste
antes da interface.

O carregador de preferências em `src/storage/preferences.ts` já valida campo a
campo, então os campos novos entram com padrão seguro **sem migração de schema
e sem perder o placar de quem já joga**. Manter esse padrão: nada de trocar a
chave do `localStorage`.

### Fase 5 — timer da jogada

Desligado por padrão e sem penalidade, apenas visual, como a proposta pede.

## Critérios de aceite

| Fase | Como saber que terminou |
|---|---|
| 0 | Todo texto ≥ 4.5:1 nos dois temas; todo alvo ≥ 44px; CI falha se isso regredir |
| 1 | Diff sem alteração de lógica; os três estados de tema seguem funcionando |
| 2 | Desktop conforme o artboard em 1280×900 |
| 3 | **≤ 844px em jogo no celular, sem rolagem** — o mesmo da v2 |
| 4 | Placar de quem já joga preservado após a atualização |
| 5 | Desligado por padrão; ligado, não altera o resultado da partida |

O critério da fase 3 é o mais importante e o mais fácil de perder. A v2 saiu de
1.386px para 844px, e esse foi seu maior ganho medido. A v3 acrescenta HUD,
faixa dupla, faixa de status com timer, fala da IA e rodapé fixo. O artboard
promete 844px, mas tem altura fixa e texto de exemplo: no app real a fala da IA
é variável e o LLM às vezes devolve frases longas. Sem limite de linhas e
medição a cada passo, a v3 volta a rolar.

## Custos a orçar

**Fontes.** Duas famílias novas (Chakra Petch em três pesos e Press Start 2P)
contra a Sora atual, que custa 25 KB. Press Start 2P só aparece em números: dá
para subsetar aos dígitos e cortar a maior parte do peso.

**Tema metálico.** Multiplica gradientes e sombras. Em aparelho antigo isso
pesa; medir em vez de estimar.

**Versão.** O `package.json` está em `2.0.0` desde antes da v2 da interface. A
v3 é a hora de virar `3.0.0` — a página Sobre passa a exibir isso sozinha.

## O que fica fora

Itens conhecidos que **não** entram nesta release, para não confundir escopo:

- A fala da IA que repete o título na tela de vitória (conteúdo em
  `src/i18n.ts`).
- Transcrição parcial da voz e indicação visual de escuta.
- Instalação como PWA.
