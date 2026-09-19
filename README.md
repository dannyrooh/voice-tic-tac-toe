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

## Como a voz funciona

A voz **não usa biblioteca externa nem chave de API**. Tudo roda com a [Web Speech API](https://developer.mozilla.org/docs/Web/API/Web_Speech_API), que já vem no navegador.

```
microfone → SpeechRecognition → texto → parseCommand → jogada → IA joga → speechSynthesis (fala)
```

1. **Ouvir** ([`src/voice/useSpeechRecognition.ts`](src/voice/useSpeechRecognition.ts)): é um hook React sobre `SpeechRecognition` (`webkitSpeechRecognition` no Chrome e no Edge).
   - Usa `continuous = true`, então continua ouvindo depois de cada frase.
   - Entrega só os resultados finais.
   - Reinicia sozinho quando o navegador encerra a sessão por silêncio.
   - Se o idioma mudar no meio da partida, reinicia com o idioma novo (`pt-BR` ou `en-US`).
2. **Entender** ([`src/voice/parseCommand.ts`](src/voice/parseCommand.ts)): é TypeScript puro.
   - Normaliza o texto: minúsculas, sem acentos e sem pontuação.
   - Reconhece posições ("canto superior esquerdo", "centro", "top middle"), números de 1 a 9 ("cinco", "casa 9") e comandos ("novo jogo", "desfazer").
3. **Falar** ([`src/voice/speak.ts`](src/voice/speak.ts)): usa `speechSynthesis`.
   - Lê o comentário da IA com uma voz do sistema no idioma escolhido.
   - Enquanto a IA fala, `isAiSpeaking()` fica ativo e o jogo ignora o que o microfone capta, para que a IA não "jogue" com a própria voz.

**Requisitos da voz:**
- **Navegador:** Chrome ou Edge. O Firefox não tem `SpeechRecognition`, então nele dá para jogar por clique ou teclado.
- **Endereço:** `localhost` ou HTTPS, com permissão de microfone.
- **Internet:** no Chrome, o áudio é transcrito pelos servidores do Google.
- **Voz em português:** para a IA falar em pt-BR, o sistema precisa ter uma voz pt-BR instalada. No Windows ela normalmente já vem.

## Comentários com Claude (opcional)

Sem configuração nenhuma, a IA comenta a partida com um banco de frases local. Com uma chave da Anthropic, os comentários passam a ser escritos pelo Claude. A chamada passa pela função serverless [`api/commentary.ts`](api/commentary.ts), e a chave **nunca vai para o navegador**.

### Como adicionar a chave

1. Crie uma chave em [console.anthropic.com](https://console.anthropic.com/) → *API Keys*. Ela começa com `sk-ant-`.
2. Faça o deploy na Vercel. Ela detecta o Vite e a pasta `api/` automaticamente.
3. Em *Project Settings → Environment Variables*, crie estas variáveis e faça o redeploy:

   | Variável | Valor | Onde é usada |
   |---|---|---|
   | `ANTHROPIC_API_KEY` | `sk-ant-...` | Só no servidor. **Nunca** use o prefixo `VITE_`, porque isso expõe a chave no navegador. |
   | `VITE_LLM_COMMENTARY` | `true` | No frontend. Faz o app chamar `/api/commentary`. |
   | `ANTHROPIC_MODEL` | opcional, o padrão é `claude-haiku-4-5` | Só no servidor. |

4. **Para rodar localmente com o Claude:**
   - Copie o [`.env.example`](.env.example) para `.env.local`.
   - Preencha a chave.
   - Rode `npx vercel dev`.

   O `npm run dev` roda só o frontend. Sem a rota `/api/commentary`, ele usa as frases locais.

Se a API falhar ou demorar mais de 4 s, o jogo volta para as frases locais e a partida não trava.

### Modelo

- **Modelo padrão:** `claude-haiku-4-5` (Claude Haiku 4.5). É o que o código usa quando `ANTHROPIC_MODEL` não está definido.
- **Modelo mínimo recomendado (setembro de 2026):** **Claude Haiku 4.5**. É o menor e mais barato modelo atual da Anthropic (US$ 1 por milhão de tokens de entrada e US$ 5 por milhão de saída). A tarefa é uma frase de no máximo 14 palavras, então um modelo maior não traz ganho perceptível. Cada comentário custa uma fração de centavo.
- **Outros modelos:** `claude-sonnet-4-6` funciona sem mudanças no código. Já **Claude Opus 5 e Claude Sonnet 5** pensam antes de responder (*adaptive thinking*) por padrão. Com o limite de `max_tokens: 80` da função, o raciocínio pode consumir todos os tokens e a resposta vir vazia. Nesse caso o jogo cai nas frases locais. Para usar esses modelos, ajuste o `max_tokens` em [`api/commentary.ts`](api/commentary.ts).

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
- **No API key needed for voice**: speech recognition and synthesis are built into the browser (Chrome/Edge)
- **Optional Claude commentary** through a Vercel serverless function. The API key stays server-side, and the game falls back to a local phrase bank if the API fails. To enable it:
  - Set `ANTHROPIC_API_KEY` (server-only) and `VITE_LLM_COMMENTARY=true` in Vercel, or in `.env.local` with `npx vercel dev`.
  - The default model is `claude-haiku-4-5`, the smallest current Claude model as of Sep 2026 and the recommended minimum.
- React 19, TypeScript (strict), Vite, Vitest, GitHub Actions CI

```bash
npm install && npm run dev
```

MIT © dannyrooh
