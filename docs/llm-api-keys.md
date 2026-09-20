# Como gerar e configurar as chaves dos LLMs

O jogo tenta os provedores nesta ordem: **Gemini → Groq → Claude → frases locais**.
Uma chave ausente faz o provedor ser ignorado. Claude só é chamado se os provedores anteriores não responderem com texto válido. As chaves são usadas somente no servidor, em `api/commentary.ts`.

## 1. Gemini — provedor padrão

1. Entre no [Google AI Studio](https://aistudio.google.com/apikey) com sua conta Google.
2. Na página de chaves, clique em **Create API key** (Criar chave de API).
3. Selecione ou crie o projeto solicitado pelo diálogo e conclua a criação.
4. Copie a chave para `GEMINI_API_KEY` no arquivo de ambiente local.

O modelo padrão do projeto é `gemini-3.1-flash-lite`. A variável `GEMINI_MODEL` é opcional.
Consulte o [guia oficial de chaves](https://ai.google.dev/gemini-api/docs/api-key) e os [preços e condições do plano gratuito](https://ai.google.dev/gemini-api/docs/pricing). As cotas dependem do modelo e da conta.

## 2. Groq — primeiro fallback

1. Crie sua conta ou faça login no [console da Groq](https://console.groq.com/keys).
2. Abra **API Keys** e clique em **Create API Key**.
3. Informe um nome, como `tic-tac-toe`, e confirme.
4. Copie a chave para `GROQ_API_KEY` no arquivo de ambiente local.

O modelo padrão é `qwen/qwen3.8-27b`. A variável `GROQ_MODEL` é opcional.
Groq é um serviço diferente do Grok da xAI. Consulte o [guia oficial](https://console.groq.com/docs/quickstart) e os [limites do plano gratuito](https://console.groq.com/docs/rate-limits).

## 3. Claude — último fallback, opcional

1. Entre no [console da Anthropic](https://console.anthropic.com/).
2. Abra **Settings → API keys** e clique em **Create key**.
3. Preencha o nome e as opções solicitadas, incluindo a validade da chave quando apresentada.
4. Copie a chave para `ANTHROPIC_API_KEY` no arquivo de ambiente local.
5. Confira o saldo e a configuração de cobrança da API no console antes de habilitar esse fallback.

O modelo padrão é `claude-haiku-4-5`. A variável `ANTHROPIC_MODEL` é opcional.
Chamadas ao Claude usam a cobrança da sua conta de API. Deixe `ANTHROPIC_API_KEY` vazia para usar somente Gemini, Groq e frases locais. Consulte a [documentação oficial de autenticação](https://platform.claude.com/docs/en/manage-claude/authentication).

## Configuração local

Se ainda não tiver um arquivo de ambiente, copie `.env.example` para `.env.local`. Se já utiliza `.env`, edite esse arquivo sem sobrescrever suas chaves. Evite definir as mesmas variáveis com valores diferentes nos dois arquivos.

```dotenv
VITE_LLM_COMMENTARY=true

GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.1-flash-lite

GROQ_API_KEY=
GROQ_MODEL=qwen/qwen3.8-27b

# Opcional: último fallback, com cobrança da API Anthropic.
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-haiku-4-5
```

Preencha as chaves dos provedores desejados após o sinal `=`. Não é obrigatório configurar todos. As variáveis de modelo podem ser omitidas: o código aplica os padrões acima.

Inicie o frontend e a função de API com:

```bash
npx vercel dev
```

Reinicie o servidor após alterar as variáveis. `npm run dev` inicia apenas o frontend; sem a rota `/api/commentary`, ele usa frases locais.

## Configuração na Vercel

1. Abra o projeto e acesse **Settings → Environment Variables**.
2. Adicione `VITE_LLM_COMMENTARY=true` e as chaves dos provedores desejados.
3. Se quiser substituir os modelos padrão, adicione também as variáveis de modelo.
4. Selecione os ambientes desejados (por exemplo, Production e Preview) e faça um novo deploy.

O arquivo `.env` do computador não configura automaticamente o deploy. Nunca use prefixo `VITE_` nas chaves: esse prefixo disponibiliza valores ao frontend. `.env` e `.env.local` estão ignorados pelo Git; mantenha somente valores vazios ou exemplos em `.env.example`.

## Como conferir o funcionamento

Com `npx vercel dev` em execução, envie uma solicitação à porta indicada pelo servidor (substitua `3000` se necessário):

```bash
curl -i http://localhost:3000/api/commentary \
  -H 'Content-Type: application/json' \
  -d '{"event":"game_start","board":[null,null,null,null,null,null,null,null,null],"cell":null,"lang":"pt"}'
```

Uma resposta `200` com `{"text":"..."}` indica que algum provedor respondeu. Para validar um provedor específico, deixe apenas a chave dele configurada temporariamente, reinicie o servidor e repita o teste; depois restaure as demais configurações. O teste realiza uma chamada real e consome a cota ou o saldo do provedor.

| Resultado | O que conferir |
|---|---|
| `501` | Nenhuma chave foi carregada pelo servidor. |
| `502` | Todos os provedores configurados falharam: confira chave, acesso ao modelo, cota, saldo e conectividade. |
| `400` | O JSON enviado não corresponde ao formato esperado. |
| `404` | A rota de API não está sendo servida; confira o comando e a porta. |

Cada tentativa tem até 1,5 segundo; o frontend espera até 6 segundos no total. Uma chave válida também pode cair no fallback por lentidão. O jogo continuar falando não comprova acesso à API, pois ele possui frases locais.
