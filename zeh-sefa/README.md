# API da SEFA-PA (DEC) — diagnóstico e configuração

Material de trabalho para destravar a integração do Zeh com o DEC (Domicílio
Eletrônico do Contribuinte da SEFA-PA), parada em `Account is not fully set up`.

> Este material foi escrito para ser copiado para o `C:\Zeh`. Ele mora aqui
> porque foi produzido numa sessão que só tinha acesso ao repositório do site.

### Semântica dos erros de `/vinculos` (do Swagger, 21/08)

Útil para quando o token funcionar — evita ler o próximo erro como regressão:

| Código | Significado publicado |
|---|---|
| 200 | Lista de vínculos retornada com sucesso |
| 401 | Token JWT inválido, ausente ou **usuário não encontrado no token** |
| 403 | **Usuário autenticado, porém sem vínculo** ou autorização para o recurso |
| 500 | Erro interno do servidor |

O 403 é o que interessa: ele separa "seu acesso não funciona" de "seu acesso
funciona mas não está ligado à LPM". São etapas diferentes do mesmo caminho, e
ver um 403 depois de resolver o token é progresso, não retrocesso.

O 401 mencionar "usuário não encontrado no token" reforça que a API espera
identidade no token — o que, com mTLS, o certificado deve suprir.

**Atalho de teste:** a página do Swagger tem "Try it out". Como o Chrome do Leo
carrega o certificado (Web PKI), o mTLS provavelmente sai de graça por ali —
mas exige um token colado em "Authorize", que é justamente o que falta. Fica
como validação rápida assim que o token sair.

## CORREÇÃO (21/08) — o DEC exige mTLS

A página **Documentação** do portal (`apis.sefa.pa.gov.br/docs`) traz uma
exigência que a página "Como começar" não menciona:

> "Algumas APIs, como por exemplo a do **DEC (Domicílio Eletrônico do
> Contribuinte)**, exigem autenticação com **mTLS**, usando certificado digital
> **e-CPF ou e-CNPJ**. Quando esse requisito existir, ele será informado na
> documentação específica da API. Para consumir essas APIs, você deve realizar
> a **requisição de autenticação também com o certificado digital**, além do
> Client ID e Client Secret."

"Requisição de autenticação" é a chamada de **token**, não só a chamada da API.
O "Como começar" é genérico para todo o catálogo; a exigência do DEC vive só
aqui.

**Consequência:** o teste que produziu `Client not enabled to retrieve service
account` foi feito **sem certificado** e portanto não é conclusivo. Refazer com
mTLS antes de qualquer conclusão — inclusive antes de abrir o chamado.

**Isto também derruba a hipótese do `authorization_code`** levantada abaixo: se
a SEFA documenta mTLS + Client ID + Client Secret, o fluxo pretendido é mesmo
`client_credentials`, e o certificado é o que identifica a empresa no lugar do
CPF/CNPJ de uma pessoa. O que a seção seguinte diz sobre `/vinculos` continua
valendo como observação, mas deixa de ser indício de outro fluxo: em mTLS o
Keycloak pode mapear o certificado para a identidade, o que explicaria o campo.

**Como refazer o teste:** preencher `SEFA_CERT_PFX` e `SEFA_CERT_SENHA` no
`.env` e rodar `node diagnostico-sefa.mjs`. A bateria já compara com e sem
certificado — a tentativa **A** é a que vale agora, e o contraste com a **C**
mostra o que o certificado muda.

**Se o erro persistir idêntico com mTLS**, aí sim o chamado, e mais forte
ainda: seguindo à risca a documentação deles, com certificado, três aplicações
ativas e adesão habilitada.

**Ainda não lido:** a página `/docs` tem um "Passo a passo para integração"
numerado que continua abaixo da dobra. Pode conter host ou porta específicos
para mTLS — gateways costumam expor o endpoint mTLS em endereço separado.
Vale ler o restante antes de concluir qualquer coisa.

## Resultado dos testes (21/08) — o erro mudou

Com a URL correta e as três aplicações, a resposta passou a ser:

```json
{ "error": "unauthorized_client",
  "error_description": "Client not enabled to retrieve service account" }
```

Isso encerra a hipótese anterior. **A URL de token já estava certa no
`dec.service.ts`** — não era isso. E este erro é de natureza diferente do
`Account is not fully set up`: aquele era pendência de cadastro de usuário;
este é ausência de `serviceAccountsEnabled` no client. São duas coisas
distintas, e a segunda é a que vale agora.

### O que isso revela sobre a arquitetura do portal

O portal é **Red Hat 3scale** (visível no título da aba) com Keycloak como
provedor. No 3scale, o componente **Zync** replica cada "aplicação" do portal
como um client no Keycloak. O Zync cria esses clients para o fluxo de
**redirecionamento** — com `redirect_uri` — e **não** habilita
`serviceAccountsEnabled`.

Isso explica de uma vez três observações soltas:

- **Por que as três aplicações falham igual:** não é uma delas que está
  quebrada; é o molde. Toda aplicação criada por aquele portal nasce sem
  service account.
- **Por que duas aplicações se chamam `https://zeh.web.app`:** o campo é a
  `redirect_uri`. Nome de aplicação sendo URL é a assinatura do fluxo
  `authorization_code`.
- **Por que `/vinculos` fala em "CPF/CNPJ do usuário presente no token":**
  um token de service account não carrega CPF/CNPJ de pessoa. A API foi
  desenhada esperando um token de **usuário**, não de máquina.

Somando: há indício razoável de que **o fluxo pretendido para o DEC seja
`authorization_code`**, e que a página "Como começar" — genérica para todas as
APIs do portal — esteja simplesmente errada para esta.

### O teste que separa as duas hipóteses

Ainda não testado, e barato. O `/auth` foi testado antes **em outro host**,
quando `apis-auth.sefa.pa.gov.br` ainda não era conhecido; o 403 registrado no
`CONTEXTO_ZEH.md` não vale para este host.

```
https://apis-auth.sefa.pa.gov.br/protocol/openid-connect/auth
  ?client_id=<CLIENT_ID>
  &response_type=code
  &scope=openid
  &redirect_uri=<a redirect_uri exata cadastrada na aplicação>
```

Abrir no navegador (que é onde o Web PKI vive):

- **Tela de login/consentimento** → o fluxo é `authorization_code`. Daí em
  diante: trocar o `code` por token, guardar o `refresh_token` no Secret
  Manager e renovar. O login humano acontece uma vez, não a cada consulta.
- **403 do gateway** → o fluxo de redirecionamento também está fechado, e
  nenhum caminho de integração está aberto hoje. Aí é chamado, com prova.
- **`invalid_redirect_uri`** → o fluxo existe e o problema é só a URI
  cadastrada. Ajustável no portal, por você.

### Consequência de projeto, se for `authorization_code`

O Zeh passa a precisar de um consentimento inicial pelo navegador e de guardar
o `refresh_token`. Duas coisas a considerar quando chegar lá:

- **Rotação:** muitos realms invalidam o refresh token a cada uso, devolvendo
  um novo. Gravar o novo a cada renovação, ou o acesso morre na segunda vez.
- **Expiração:** se o refresh também expirar, o sistema precisa avisar que o
  login precisa ser refeito — em vez de falhar calado. Vale a mesma regra do
  `enviadoContadorEm` do plano de e-mail: falha silenciosa é a que machuca.

Isso, aliás, não conflita com a regra de nunca manifestar automaticamente —
pelo contrário, encaixa: já havia decisão de manter o humano no circuito.

## Fatos confirmados no portal (20/08/2026)

Levantados direto do portal de integrações da SEFA (`apis.sefa.pa.gov.br`),
que é um sistema **separado** do portal do contribuinte. Isso substitui
qualquer suposição feita antes de ter acesso a ele.

**Endpoint de token** — publicado por eles em "Como começar", passo 4:

```
POST https://apis-auth.sefa.pa.gov.br/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
client_id=...
client_secret=...
```

Dois detalhes que valem atenção:

- O host é **`apis-auth`**, não o host do portal do contribuinte. Se o Zeh
  estiver pedindo token no realm do portal do contribuinte, o
  `Account is not fully set up` é explicado inteiro: naquele realm existe
  uma conta de **pessoa** (criada via gov.br/CPF) com cadastro incompleto.
  Esta é hoje a hipótese mais forte.
- O caminho **não tem `/realms/{realm}`**. É `/protocol/openid-connect/token`
  direto — o host já resolve o realm. Uma URL montada no formato Keycloak
  padrão bate em outro lugar.

**Sem certificado.** O exemplo oficial é `client_credentials` puro, sem mTLS
e sem escopo. O certificado A1 segue necessário para o portal (via extensão
Web PKI), mas não para a API.

**Base da API:** `https://apis-publicas-gw.sefa.pa.gov.br/dec`
(sem token responde `Authentication parameters missing`).

**Esquema de segurança do Swagger:** `bearer-keycloak` (http, Bearer) — a API
só recebe o token pronto, não participa da obtenção dele.

**Primeiro serviço:** `GET /vinculos` — "retorna os vínculos vinculados ao
CPF/CNPJ do usuário presente no token JWT". A modelagem é orientada a
*usuário com vínculos*, não a *empresa*: o token precisa carregar um
CPF/CNPJ que tenha vínculo com a LPM.

**Adesão:** o DEC aparece como **Habilitada**, plano Default. Descartado como
causa.

**Aplicações:** havia **três** aplicações ativas para o DEC (`5d203797`,
`de5204df`, `804b5f36`). Conferir que o `client_id` e o `client_secret` em
uso pertencem ao **mesmo** cadastro — pares trocados entre aplicações são
uma causa comum e silenciosa.

### O que testar primeiro

Comparar a URL de token configurada hoje no Zeh com a de cima. Se forem
diferentes, é uma linha de configuração — e não depende da SEFA atender.
Se forem iguais e o erro persistir, aí sim é cadastro do lado deles, e o
chamado vai com uma prova bem mais forte.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `diagnostico-sefa.mjs` | Roda a bateria de tentativas de token e diz onde quebra |
| `.env.example` | Modelo de configuração — copie para `.env` e preencha |
| `CHAMADO-SEFA.md` | Texto pronto do chamado, caso o portal não resolva |

## Como rodar

```bash
cd zeh-sefa
cp .env.example .env      # no Windows: copy .env.example .env
# preencha o .env
node diagnostico-sefa.mjs
```

Não precisa instalar nada — só Node 18 ou mais novo. O script **não altera
nada** e **não abre mensagem nenhuma do DEC**; ele só pede token e, se
conseguir, faz uma leitura.

Para anexar no chamado: `node diagnostico-sefa.mjs --json`. Essa saída omite
client secret e senha de certificado.

---

## O diagnóstico

### O que `Account is not fully set up` quer dizer

O provedor de identidade da SEFA é um **Keycloak**. Essa mensagem tem um
significado exato no código dele, e vale a pena ler devagar porque ela elimina
várias hipóteses de uma vez:

> As credenciais foram **aceitas**. A identidade foi **resolvida**. O token foi
> recusado porque essa identidade tem **pendência de cadastro em aberto**.

O Keycloak chama essas pendências de *required actions*. As mais comuns são:

- perfil incompleto — em versões recentes, **basta faltar nome ou sobrenome**
- e-mail não verificado
- senha provisória que precisa ser trocada no primeiro acesso
- termo de uso não aceito
- segundo fator configurado como obrigatório e ainda não cadastrado

### O que isso descarta

Isto é o mais útil do diagnóstico — três suspeitas que consumiriam dias:

- **Não é o Client ID nem o Client Secret.** Credencial errada retorna
  `invalid_client`, não `invalid_grant`.
- **Não é o certificado digital.** Se o certificado fosse recusado, a conexão
  TLS cairia antes, ou viria erro de handshake — não uma mensagem sobre a
  *conta*.
- **Não é o formato da requisição.** Requisição malformada retorna
  `invalid_request` ou `unsupported_grant_type`.

O erro é sobre a **conta**, no lado deles.

### Por que a conta provavelmente está incompleta

A anotação do `CONTEXTO_ZEH.md` tem a explicação mais provável: a conta do
Portal de Serviços foi criada entrando pelo **gov.br (CPF)**, enquanto a
integração autentica com o **e-CNPJ da empresa**.

Para o Keycloak, são **duas identidades diferentes**. A que veio do gov.br está
completa — foi o gov.br que preencheu. A que corresponde ao e-CNPJ nasceu no
primeiro contato da API, sem passar por tela nenhuma, e por isso está sem os
campos obrigatórios.

E aí entra a armadilha: a tela que normalmente limparia essas pendências é o
`/protocol/openid-connect/auth`, que **responde 403 no gateway deles** — você já
registrou isso. Ou seja, o caminho normal de autocorreção está fechado.

### O que a bateria de testes separa

O script roda as combinações lado a lado justamente porque o veredito vem da
**comparação**, não de uma tentativa isolada:

| Teste | Envio | O que a resposta revela |
|---|---|---|
| A | `client_credentials`, secret no corpo, com mTLS | o caminho do manual |
| B | `client_credentials`, secret em `Basic`, com mTLS | se o client é `client_secret_basic` |
| C | `client_credentials`, secret no corpo, sem mTLS | **se o certificado importa** |
| D | `password` com CNPJ como usuário | só se o manual mandar |
| E | chamada real à API com o token obtido | se o token vale para o DEC |

A leitura que interessa:

- **C dá o mesmo erro que A** → o certificado não está sendo levado em conta na
  autenticação; o gargalo é a conta, e você pode parar de mexer no certificado.
- **C dá erro diferente de A** → o mTLS é exigido e está funcionando; guarde
  essa informação, ela vale para o chamado.
- **A descoberta lista `mtls_endpoint_aliases`** → existe um endpoint de token
  separado para mTLS e é ele que deve ser usado. Isso é fácil de passar batido
  lendo manual em PDF, e sozinho explicaria semanas de tentativa.

## O que fazer, em ordem

1. **Rode o diagnóstico.** Cinco minutos, e ele fecha ou abre hipóteses.
2. **Entre no Portal de Serviços escolhendo certificado digital** (e-CNPJ, não
   gov.br/CPF) — o certificado já está instalado no Chrome. Se aparecer
   qualquer tela pedindo dados, e-mail ou aceite de termo, **é exatamente essa
   a pendência**. Complete e rode o diagnóstico de novo.
3. **Se o portal não pedir nada**, a pendência é invisível para você e só o
   administrador do Keycloak enxerga. Abra o chamado com o `CHAMADO-SEFA.md`,
   anexando a saída `--json`.
4. **Enquanto o DEC não destrava**, note que ele **não bloqueia a
   DistribuiçãoDFe** — são serviços independentes, e a DistribuiçãoDFe é do
   Ambiente Nacional da Receita, não da SEFA. A fila de código do
   `CONTEXTO_ZEH.md` continua andando sem isso.

## Quando destravar — o que levar para o código do Zeh

Três coisas do plano original que continuam valendo e que o diagnóstico não
muda:

- **O Zeh nunca abre mensagem do DEC automaticamente.** Abrir registra ciência
  e faz o prazo correr. O sistema avisa que existe mensagem nova, com assunto e
  data; abrir continua sendo decisão sua.
- **Certificado e secret ficam no Secret Manager**, nunca no banco e nunca no
  repositório. O `.env` daqui é só para o diagnóstico na sua máquina.
- **Trave a frequência de consulta no banco, não no agendador.** É a mesma
  lição da rejeição 656 da DistribuiçãoDFe: agendador reinicia, banco não.
  Se a SEFA tiver limite parecido, um processo reiniciando em laço queima a
  cota do CNPJ inteiro.
