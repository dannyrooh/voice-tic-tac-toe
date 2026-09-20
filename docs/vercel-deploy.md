# Vercel: conta e deploy do jogo

**Aplicação publicada:** [Voice Tic-Tac-Toe](https://voice-tic-tac-toe-mu.vercel.app/).

## O que é a Vercel

A Vercel é uma plataforma para publicar aplicações web. Neste projeto, ela entrega o frontend React compilado pelo Vite e executa a função `api/commentary.ts` no servidor para consultar os LLMs sem expor as chaves ao navegador.

Um **deploy** é uma versão publicada da aplicação. **Production** é a versão principal; **Preview** permite conferir alterações de uma branch antes de integrá-las. Veja os [conceitos de deploy da Vercel](https://vercel.com/docs/deployments).

## Criar uma conta

1. Acesse [vercel.com/signup](https://vercel.com/signup).
2. Escolha a opção de cadastro com GitHub e autentique-se.
3. Conclua as informações e verificações solicitadas pela Vercel.
4. Escolha o plano adequado ao seu uso; confira as condições e limites na [página de planos](https://vercel.com/pricing).
5. Ao conectar o GitHub, autorize acesso ao repositório que será publicado.

O cadastro e a conexão com GitHub permitem importar o código pelo painel, sem instalar a CLI. Consulte o [guia inicial oficial](https://vercel.com/docs/getting-started-with-vercel).

## Importar o projeto

Se você já tem este projeto na Vercel, abra-o no painel e siga para a configuração de variáveis; não precisa importar novamente.

1. Abra [New Project](https://vercel.com/new) ou **Add New → Project** no painel.
2. Na seção de importação do GitHub, procure `dannyrooh/voice-tic-tac-toe` e clique em **Import**. Para publicar sua própria cópia, faça um fork no GitHub e importe esse fork.
3. Se o repositório não aparecer, ajuste as permissões da integração com GitHub.
4. Confira as opções de build abaixo. O projeto tem `package.json` na raiz.

| Opção | Valor para este projeto |
|---|---|
| Framework Preset | `Vite` |
| Root Directory | `./` (raiz do repositório) |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Confira também se a branch de produção é `main`. A integração Git usa essa branch para publicar a versão principal. Referências: [Vite na Vercel](https://vercel.com/docs/frameworks/frontend/vite) e [deploy por Git](https://vercel.com/docs/git).

## Configurar as chaves e os modelos

Antes de publicar, abra **Environment Variables** na importação ou **Settings → Environment Variables** no projeto existente. Preencha os valores abaixo usando suas próprias chaves:

| Variável | Valor / finalidade |
|---|---|
| `VITE_LLM_COMMENTARY` | `true` para habilitar comentários gerados por LLM |
| `GEMINI_API_KEY` | Chave do provedor principal |
| `GROQ_API_KEY` | Opcional: chave do primeiro fallback |
| `ANTHROPIC_API_KEY` | Opcional: chave do último fallback |
| `GEMINI_MODEL` | Opcional; padrão `gemini-3.1-flash-lite` |
| `GROQ_MODEL` | Opcional; padrão `qwen/qwen3.8-27b` |
| `ANTHROPIC_MODEL` | Opcional; padrão `claude-haiku-4-5` |

Selecione **Production** para a aplicação principal e **Preview** se quiser testar as APIs nas versões de branches. As variáveis de modelo podem ser omitidas. Provedores sem chave são ignorados; sem nenhum provedor disponível, o jogo usa frases locais.

O `.env` do computador não é enviado pelo Git. Cadastre os valores no painel e nunca use o prefixo `VITE_` nas chaves: esse prefixo disponibiliza a variável ao frontend. Para gerar as chaves, veja o [guia dos LLMs](llm-api-keys.md).

Após alterar variáveis, crie um novo deploy para aplicá-las. Veja a [documentação de variáveis de ambiente](https://vercel.com/docs/environment-variables).

## Fazer o primeiro deploy

1. Com as opções e variáveis configuradas, clique em **Deploy**.
2. Acompanhe os logs de instalação e build até a conclusão.
3. Abra o endereço disponibilizado pela Vercel. Uma cópia sua terá um endereço próprio.
4. Teste uma partida por clique e, em um navegador compatível, permita o microfone para testar a voz.
5. Para verificar os comentários remotos, abra as ferramentas de desenvolvedor do navegador e confira a requisição `POST /api/commentary` na aba Network: uma resposta `200` com texto indica sucesso de algum provedor.

O jogo falar não comprova uso de um LLM: ele também fala as frases locais quando a API falha. A ordem das tentativas é Gemini → Groq → Claude, seguida das frases locais. Cada provedor tem até 1,5 segundo; o frontend espera até 6 segundos.

## Atualizações e redeploy

Com o GitHub conectado, pushes na branch de produção geram novas publicações. Alterações em outras branches podem gerar previews para revisão antes do merge. Consulte o [fluxo Git da Vercel](https://vercel.com/docs/git).

Para republicar após alterar variáveis, abra **Deployments**, selecione o deploy e use **Redeploy**. Confira se o ambiente escolhido corresponde às variáveis alteradas. Consulte a [documentação de deploys](https://vercel.com/docs/deployments).

## Resolver problemas

| Sintoma | O que conferir |
|---|---|
| Build falha | Abra os Build Logs; confira a raiz, os comandos e os erros de TypeScript ou dependências. |
| Comentários sempre locais | Confira `VITE_LLM_COMMENTARY=true`, as chaves e se houve novo deploy após configurá-las. |
| `/api/commentary` retorna `501` | Nenhuma chave foi carregada na função. |
| `/api/commentary` retorna `502` | Os provedores configurados falharam; confira acesso ao modelo, cota, saldo e tempo de resposta. |
| `/api/commentary` retorna `404` | Confira se o deploy inclui a pasta `api/` na raiz do projeto. |
| Microfone não funciona | Confira permissões e use um navegador compatível, como Chrome ou Edge. |
| Mudança não aparece | Confira o commit e a branch do deploy servido pelo domínio de produção. |

Os limites da hospedagem e as cotas dos LLMs são independentes. O fallback Claude pode gerar cobrança na conta Anthropic; deixe a chave ausente se não quiser habilitá-lo.
