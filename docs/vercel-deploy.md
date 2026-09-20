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
4. Confira as opções de build abaixo. O projeto tem `package.json` na raiz. Esses valores já estão versionados em [`vercel.json`](../vercel.json), que prevalece sobre o que for digitado no painel.

| Opção | Valor para este projeto |
|---|---|
| Framework Preset | `Vite` |
| Root Directory | `./` (raiz do repositório) |
| Install Command | `npm ci` |
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

Esse primeiro deploy é manual, feito pelo painel. As publicações seguintes passam a ser automáticas assim que você configurar a seção abaixo.

## Deploy automático pelo GitHub Actions

Este repositório publica sozinho pelo workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). O deploy só acontece depois que `npm test` e `npm run build` passam, de modo que código quebrado não chega à produção:

| Evento no GitHub | O que acontece |
|---|---|
| Push na branch `main` | Testes e build; passando, deploy de **produção** |
| Execução manual em `main` | Mesmo fluxo do push, disparado por você no painel do Actions |
| Pull request | Testes e build; passando, deploy de **preview** e o link é comentado no PR |
| Testes falhando | O deploy não roda e o commit fica marcado como falho |
| Pull request vindo de um fork | Só os testes rodam; forks não recebem os secrets |

O arquivo [`vercel.json`](../vercel.json) traz `"git": { "deploymentEnabled": false }`. Isso desliga o gatilho automático da integração Git da Vercel para que o workflow seja o único responsável pelas publicações — sem ele, cada push geraria dois deploys, um deles sem passar pelos testes.

> **Há uma janela sem publicação nenhuma.** O gatilho da Vercel está desligado pelo `vercel.json`, e o workflow só consegue publicar depois que os três secrets existirem. Entre o primeiro deploy pelo painel e o fim da configuração abaixo, nenhum push chega ao ar. Se precisar publicar nesse intervalo, use **Redeploy** no painel.

### Configurar do zero

Siga na ordem. Os passos 2 e 3 precisam de acesso à conta da Vercel; o 4 exige permissão de administrador no repositório do GitHub.

#### 1. Confirme que o workflow existe

```bash
ls .github/workflows/ci.yml
```

Um fork já traz o arquivo. Se ele não existir — num repositório criado do zero, por exemplo —, copie-o deste repositório. O que importa na estrutura: os jobs `deploy-preview` e `deploy-production` declaram `needs: test`, e é essa linha que impede a publicação quando os testes falham. Os dois usam `--prebuilt`, ou seja, o build acontece no runner do GitHub e só a saída pronta é enviada à Vercel.

#### 2. Crie o Access Token

Abra [vercel.com/account/settings/tokens](https://vercel.com/account/settings/tokens) — clique no seu avatar, **Settings**, **Tokens**. Preencha nome, escopo e validade, e copie o valor: ele aparece uma única vez.

> **Atenção ao campo SCOPE.** Ele lista tanto times quanto projetos individuais. Escolher o projeto gera um token que lê a API REST mas com o qual a CLI da Vercel não funciona: toda operação dela começa resolvendo o usuário, e um token de projeto não resolve nenhum. O sintoma é `vercel pull` falhar com *Could not retrieve Project Settings* — ou, rodando com `--scope`, *Not able to load user because of unexpected error: User not found (404)*. **Selecione o time no SCOPE.** Na lista de tokens, a coluna *Scope* mostra qual foi escolhido: se aparecer o nome do projeto ali, o token não serve para o deploy. O comprimento do valor não distingue os dois tipos — só o escopo.

#### 3. Obtenha os dois identificadores

```bash
npx vercel link      # escolha a conta e o projeto quando perguntado
cat .vercel/project.json
```

A saída traz `"orgId"` (começa com `team_`) e `"projectId"` (começa com `prj_`). A pasta `.vercel/` está no `.gitignore` e não vai para o repositório. Os mesmos identificadores aparecem em **Project Settings → General** no painel, caso prefira copiá-los de lá.

#### 4. Grave os três secrets

Pelo painel do GitHub: **Settings → Secrets and variables → Actions → New repository secret**, um para cada nome abaixo. Pela [CLI do GitHub](https://cli.github.com/), no diretório do projeto:

```bash
gh secret set VERCEL_TOKEN                          # cole o valor quando pedir
gh secret set VERCEL_ORG_ID --body 'team_...'
gh secret set VERCEL_PROJECT_ID --body 'prj_...'
gh secret list
```

Sem `--body`, o `gh` lê da entrada padrão e o token não fica no histórico do shell. Os nomes precisam ser exatamente esses: são os que o workflow consulta.

| Secret | Origem |
|---|---|
| `VERCEL_TOKEN` | Passo 2 |
| `VERCEL_ORG_ID` | `orgId` do passo 3 |
| `VERCEL_PROJECT_ID` | `projectId` do passo 3 |

#### 5. Verifique antes de depender disso

Rode localmente os dois primeiros passos do workflow. Eles não publicam nada — o `pull` baixa configurações e o `build` compila para uma pasta local:

```bash
export VERCEL_ORG_ID=team_...
export VERCEL_PROJECT_ID=prj_...
npx vercel pull --yes --environment=production --token=SEU_TOKEN
npx vercel build --prod --token=SEU_TOKEN
```

O que esperar: `Downloaded project settings`, depois `Build completed successfully`. Confira também que a função entrou no pacote, senão `/api/commentary` responderá `404` em produção:

```bash
ls .vercel/output/functions/api
```

Limpe o que o teste deixou em disco — a cópia das variáveis de produção não precisa ficar na sua máquina:

```bash
rm -rf .vercel/output .vercel/.env.production.local
```

#### 6. Abra um pull request

Publique uma branch e abra um PR. Essa é a primeira execução real do pipeline: acompanhe em **Actions** e confira que o job *Testes e build* passa, que *Deploy de preview* publica e que *Deploy de produção* é pulado — ele só roda em `main`. Passando, o link do preview aparece comentado no PR. O merge em `main` dispara o mesmo fluxo com o job de produção.

### Previews protegidos por login

O link do preview pode responder `302` para `vercel.com/sso-api` em vez de abrir o jogo. É a **Deployment Protection**, ligada por padrão nos previews: quem estiver logado na conta da Vercel passa direto, e qualquer outra pessoa vê a tela de login. Para compartilhar o preview com quem não tem acesso ao projeto, desligue em **Project Settings → Deployment Protection**.

### Republicar sem alterar código

Ao mudar variáveis de ambiente no painel, o código continua o mesmo e nenhum push acontece — então o workflow não dispara. Use uma das opções:

- No GitHub, abra **Actions → CI & Deploy → Run workflow** e escolha a branch `main`. O fluxo roda os testes e republica a produção.
- Ou, no painel da Vercel, abra **Deployments**, selecione o deploy e use **Redeploy**. Confira se o ambiente escolhido corresponde às variáveis alteradas.
- Ou rode `npx vercel --prod` localmente, depois de `npx vercel link`. O `deploymentEnabled: false` desliga apenas o gatilho do Git; deploys pela CLI continuam funcionando.

Consulte a [documentação de deploys](https://vercel.com/docs/deployments) e o [fluxo Git da Vercel](https://vercel.com/docs/git).

## Resolver problemas

| Sintoma | O que conferir |
|---|---|
| Build falha | Abra os Build Logs; confira a raiz, os comandos e os erros de TypeScript ou dependências. |
| Nenhum deploy acontece no push | Os três secrets não existem, ou a branch não é `main`. Confira `gh secret list` e a aba **Actions**. |
| Workflow para antes do deploy | Os testes falharam: abra **Actions** no GitHub e veja o job *Testes e build*. |
| Preview pede login da Vercel | Deployment Protection ativa; veja *Previews protegidos por login*. |
| Workflow falha no `vercel pull` | Confira os três secrets. *Could not retrieve Project Settings* indica token do tipo errado: use um Access Token da conta, não um restrito ao projeto. |
| Dois deploys por push | A integração Git da Vercel continua ativa: confirme `"deploymentEnabled": false` no `vercel.json` e o redeploy dessa alteração. |
| Comentários sempre locais | Confira `VITE_LLM_COMMENTARY=true`, as chaves e se houve novo deploy após configurá-las. |
| `/api/commentary` retorna `501` | Nenhuma chave foi carregada na função. |
| `/api/commentary` retorna `502` | Os provedores configurados falharam; confira acesso ao modelo, cota, saldo e tempo de resposta. |
| `/api/commentary` retorna `404` | Confira se o deploy inclui a pasta `api/` na raiz do projeto. |
| Microfone não funciona | Confira permissões e use um navegador compatível, como Chrome ou Edge. |
| Mudança não aparece | Confira o commit e a branch do deploy servido pelo domínio de produção. |

Os limites da hospedagem e as cotas dos LLMs são independentes. O fallback Claude pode gerar cobrança na conta Anthropic; deixe a chave ausente se não quiser habilitá-lo.
