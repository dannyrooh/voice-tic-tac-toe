# Voice Tic-Tac-Toe · Jogo da Velha por Voz

Jogo da velha que você controla **falando** ("canto superior esquerdo!", "centro!", "novo jogo!"). Você joga contra uma **IA que responde em voz alta** e comenta a partida. Tem três níveis de dificuldade, e o mais difícil nunca perde.

> Speak your move, and an AI opponent answers out loud. It's built with React 19, TypeScript, the Web Speech API and minimax, with optional commentary written by Claude. [English below ↓](#english)

**▶ Demo:** _adicione aqui o link da Vercel depois do deploy_

<!-- Depois do deploy, grave um GIF curto jogando por voz e coloque aqui: ![demo](docs/demo.gif) -->

## O que tem aqui

| Recurso | Como funciona |
|---|---|
| 🎙️ **Comandos de voz** | Web Speech API em pt-BR ou en-US. O parser entende posições ("embaixo à direita", "top middle"), números ("cinco", "casa 9") e comandos ("novo jogo", "desfazer"). |
| 🔊 **A IA fala** | A síntese de voz lê os comentários da IA. O microfone ignora a própria voz da IA para não jogar sozinho. |
| 🧠 **Oponente com IA** | Minimax completo: o nível *Impossível* é imbatível (testado contra todas as partidas possíveis). O *Médio* bloqueia e ataca, mas erra. O *Fácil* é para relaxar. |
| 💬 **Comentários contextuais** | A IA percebe quando bloqueou você, quando criou uma ameaça ou uma armadilha dupla (*fork*), e quando a partida terminou em vitória ou empate. |
| ✨ **Claude (opcional)** | Com uma chave da Anthropic, os comentários passam a ser escritos pelo Claude por meio de uma função serverless. A chave nunca vai para o navegador. Sem chave, o jogo usa um banco de frases local. |
| ♿ **Acessível** | Dá para jogar por voz, clique ou teclado (1–9 e N). Tem `aria-live` nos status, respeita `prefers-reduced-motion` e o tema claro/escuro do sistema. |

## Rodando

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 41 testes (lógica, IA, parser de voz, comentários)
npm run build
```

O reconhecimento de voz funciona no **Chrome e no Edge** (e no Safari em parte). Em `localhost` ou HTTPS, o navegador pede permissão para usar o microfone.

### Comentários com Claude (opcional)

1. Faça o deploy na Vercel (ela detecta Vite e a pasta `api/` automaticamente).
2. Em *Settings → Environment Variables*, crie as variáveis:
   - `ANTHROPIC_API_KEY` = sua chave (fica só no servidor)
   - `VITE_LLM_COMMENTARY` = `true`
   - `ANTHROPIC_MODEL` (opcional, o padrão é `claude-haiku-4-5`)
3. Para testar localmente com a função, use `npx vercel dev`. O `npm run dev` roda só o frontend, que usa as frases locais.

Se a API falhar ou demorar mais de 4 s, o jogo volta para as frases locais e a partida não trava.

## Arquitetura

```
src/
  game/        lógica pura: tabuleiro, vitória/empate, minimax, reducer (placar, desfazer)
  voice/       parser de comandos, hook de reconhecimento de voz, síntese de voz
  commentary/  detecção de eventos (bloqueio, ameaça, fork…) + comentário local/LLM
  components/  tabuleiro
  App.tsx      orquestra turnos, voz, teclado e comentários
api/
  commentary.ts  função serverless (Vercel) que chama a API da Anthropic
```

As regras do jogo, a IA e o parser de voz são **TypeScript puro, sem React**, e por isso são fáceis de testar e de reaproveitar em um bot de voz por telefone ou WhatsApp, por exemplo.

## Histórico

Começou em 2022 como o tutorial oficial do React (componentes de classe, CRA). Em 2026 foi reescrito do zero para mostrar interfaces de voz e oponentes de IA com a stack atual.

---

## English

Tic-tac-toe you play **by voice**. Say "top left", "center" or "five", and an AI opponent replies out loud with context-aware trash talk. It detects when it blocked you, set a trap or won.

- **Voice input** through the Web Speech API (pt-BR / en-US) with a tolerant command parser
- **Voice output** through speech synthesis; the mic ignores the AI's own voice
- **Minimax AI** with 3 levels; *Unbeatable* is verified against every possible game
- **Optional Claude commentary** through a Vercel serverless function. The API key stays server-side, and the game falls back to a local phrase bank if the API fails
- React 19, TypeScript (strict), Vite, Vitest, GitHub Actions CI

```bash
npm install && npm run dev
```

MIT © dannyrooh
