# API da SEFA-PA (DEC) — diagnóstico e configuração

Material de trabalho para destravar a integração do Zeh com o DEC (Domicílio
Eletrônico do Contribuinte da SEFA-PA), parada em `Account is not fully set up`.

> Este material foi escrito para ser copiado para o `C:\Zeh`. Ele mora aqui
> porque foi produzido numa sessão que só tinha acesso ao repositório do site.

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
