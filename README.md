# Voice Tic-Tac-Toe · Jogo da Velha por Voz

Jogo da velha que você controla **falando** ("canto superior esquerdo!", "centro!", "novo jogo!"). Você joga contra uma **IA que responde em voz alta** e comenta a partida. Tem três níveis de dificuldade, e o mais difícil nunca perde.

> Speak your move, and an AI opponent answers out loud. It's built with React 19, TypeScript, the Web Speech API and minimax, with optional Gemini commentary, Groq fallback and Claude as the last provider. [English below ↓](#english)

**▶ Demo:** _adicione aqui o link da Vercel depois do deploy_

<!-- Depois do deploy, grave um GIF curto jogando por voz e coloque aqui: ![demo](docs/demo.gif) -->

## O que tem aqui

| Recurso | Como funciona |
|---|---|
| 🎙️ **Comandos de voz** | Web Speech API em pt-BR ou en-US. O parser entende posições ("embaixo à direita", "top middle"), números ("cinco", "casa 9") e comandos ("novo jogo", "desfazer"). |
| 🔊 **A IA fala** | A síntese de voz lê os comentários da IA. O microfone ignora a própria voz da IA para não jogar sozinho. |
| 🧠 **Oponente com IA** | Minimax completo: o nível *Impossível* é imbatível (testado contra todas as partidas possíveis). O *Médio* bloqueia e ataca, mas erra. O *Fácil* é para relaxar. |
| 💬 **Comentários contextuais** | A IA percebe quando bloqueou você, quando criou uma ameaça ou uma armadilha dupla (*fork*), e quando a partida terminou em vitória ou empate. |
| ✨ **LLM (opcional)** | Gemini 3.1 Flash-Lite gera os comentários; Groq é o primeiro fallback e Claude o último. As chaves ficam na função serverless. Sem API disponível, o jogo usa frases locais. |
| ♿ **Acessível** | Dá para jogar por voz, clique ou teclado (1–9 e N). Tem `aria-live` nos status, respeita `prefers-reduced-motion` e o tema claro/escuro do sistema. |

## Rodando

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # lógica, IA, parser de voz, comentários e fallback de APIs
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

## Comentários com Gemini, Groq e Claude (opcional)

O provedor padrão é **Gemini 3.1 Flash-Lite** (`gemini-3.1-flash-lite`). Se ele falhar, exceder a cota, retornar uma resposta vazia ou demorar mais de 1,5 s, a função tenta **Groq** (`qwen/qwen3.8-27b`). Somente se ambos falharem ou não tiverem chave, tenta **Claude Haiku 4.5** (`claude-haiku-4-5`). Se nenhum responder, o jogo usa seu banco de frases local.

Cada provedor tem um timeout de 1,5 s; o frontend mantém o limite total de 6 s, incluindo o transporte. Uma resposta mais lenta cai nas frases locais para não travar a partida. Se apenas uma chave estiver configurada, somente esse provedor será chamado. Sem chaves, o jogo continua funcionando com frases locais.

### Configuração

Veja o [guia para gerar e configurar as chaves dos LLMs](docs/llm-api-keys.md), com instruções para Gemini, Groq e Claude, execução local, Vercel e diagnóstico de erros.

1. Crie uma chave do Gemini no [Google AI Studio](https://aistudio.google.com/apikey).
2. Opcionalmente, crie uma chave na [Groq](https://console.groq.com/keys) para o primeiro fallback e uma chave da Anthropic em [console.anthropic.com](https://console.anthropic.com/) para habilitar o último fallback, Claude.
3. Na Vercel, configure em *Project Settings → Environment Variables* e faça o redeploy:

   | Variável | Valor | Onde é usada |
   |---|---|---|
   | `VITE_LLM_COMMENTARY` | `true` | Frontend: habilita `/api/commentary`. |
   | `GEMINI_API_KEY` | Sua chave do Google AI Studio | Somente servidor. |
   | `GEMINI_MODEL` | Opcional; padrão `gemini-3.1-flash-lite` | Somente servidor. |
   | `GROQ_API_KEY` | Opcional; sua chave Groq | Somente servidor; primeiro fallback. |
   | `GROQ_MODEL` | Opcional; padrão `qwen/qwen3.8-27b` | Somente servidor. |
   | `ANTHROPIC_API_KEY` | Opcional; sua chave Anthropic | Somente servidor; habilita o fallback. |
   | `ANTHROPIC_MODEL` | Opcional; padrão `claude-haiku-4-5` | Somente servidor. |

**Nunca use o prefixo `VITE_` nas chaves de API**, pois isso as expõe ao navegador.

O Gemini oferece um plano gratuito sujeito a cotas e disponibilidade; consulte os [preços oficiais](https://ai.google.dev/gemini-api/docs/pricing). O fallback Claude usa a cobrança da sua conta Anthropic quando acionado. Para usar Gemini, Groq e frases locais, deixe `ANTHROPIC_API_KEY` vazia.

### Desenvolvimento local

Se ainda não tiver um arquivo de ambiente, copie [`.env.example`](.env.example) para `.env.local`; se já usa `.env`, mantenha-o. Preencha as chaves desejadas e rode `npx vercel dev` para servir o frontend e a função [`api/commentary.ts`](api/commentary.ts).

`npm run dev` serve somente o frontend; sem `/api/commentary`, os comentários usam as frases locais. Para desativar chamadas de LLM, configure `VITE_LLM_COMMENTARY=false`.

O Gemini usa `thinkingLevel: minimal` e até 128 tokens de saída; a Groq usa até 256 tokens de saída e o Claude usa até 80 tokens. O prompt pede uma frase de até 14 palavras em português ou inglês. Modelos alternativos devem ser compatíveis com essas opções.

## Arquitetura

```
src/
  game/        lógica pura: tabuleiro, vitória/empate, minimax, reducer (placar, desfazer)
  voice/       parser de comandos, hook de reconhecimento de voz, síntese de voz
  commentary/  detecção de eventos (bloqueio, ameaça, fork…) + comentário local/LLM
  components/  tabuleiro
  App.tsx      orquestra turnos, voz, teclado e comentários
api/
  commentary.ts  função serverless (Vercel): Gemini → Groq → Claude → frases locais no frontend
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
- **API key setup:** see the [step-by-step guide (Portuguese)](docs/llm-api-keys.md).
- **Optional Gemini commentary with Groq, then Claude fallback** through a Vercel serverless function. API keys stay server-side. Gemini errors, empty responses or timeouts trigger Groq, then Claude; if none succeeds, the game uses local phrases.
  - Set `VITE_LLM_COMMENTARY=true` and `GEMINI_API_KEY` in Vercel, or in `.env.local` with `npx vercel dev`.
  - Default: `gemini-3.1-flash-lite`; override with `GEMINI_MODEL`.
  - Optionally set `GROQ_API_KEY` for the first fallback (`qwen/qwen3.8-27b`); override with `GROQ_MODEL`.
  - Optionally set `ANTHROPIC_API_KEY` for the last fallback to `claude-haiku-4-5`; override with `ANTHROPIC_MODEL`. Claude requests use your Anthropic API billing.
  - Each provider has a 1.5-second timeout; the frontend has a 6-second total deadline. A single configured provider also works.
- React 19, TypeScript (strict), Vite, Vitest, GitHub Actions CI

```bash
npm install && npm run dev
```

MIT © dannyrooh
