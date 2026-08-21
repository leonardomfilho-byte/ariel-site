# Contexto do Zeh — onde paramos

Atualizado em **21/08/2026 (madrugada)**. Este arquivo é o ponto de partida
da próxima sessão. O guia de comandos de deploy é o `GUIA-DEPLOY.md`.

**Planos detalhados nesta pasta:**
- `PLANO-DISTRIBUICAODFE.md` — download automático das notas dos fornecedores
- `PLANO-EMISSAO-NFE.md` — emissão de NF-e pelo Zeh
- `zeh-sefa/` — diagnóstico da API da SEFA, texto de chamado e script de teste

---

## O sistema está no ar

**https://zeh.web.app** — Cloud Run + Firebase Hosting, projeto GCP
`ariel-nutricao-animal`, região São Paulo. Banco Cloud SQL `zeh-db`.

Atalho na área de trabalho (`Zeh.lnk`) abre em janela própria, com ícone.

---

## O que ficou pronto até aqui

**Publicação.** O sistema saiu do computador e foi para a internet. Endereço
curto via Firebase Hosting (o Cloud Run não aceita domínio próprio em São
Paulo). Duas armadilhas resolvidas e documentadas no `GUIA-DEPLOY.md`: o
cookie da sessão precisa se chamar `__session`, e o cache do CDN precisa ser
desligado nas páginas — as duas estão explicadas lá, não desfazer sem ler.

**Relatórios imprimíveis — 15 relatórios em 5 módulos.** Financeiro (DRE,
contas a receber, contas a pagar, extrato), Comercial (vendas, tabela de
preços, clientes), Produção (produções, rastreabilidade de lote, estoque,
ficha técnica), Compras (pedidos, avaliação de fornecedores) e Pessoas
(quadro, pagamentos). Impressão pelo navegador: Ctrl+P → Salvar como PDF.

**Dados da empresa.** Razão social, CNPJ, inscrições, endereço e órgãos
fiscalizadores nas três esferas (federal, estadual, municipal) — genérico,
serve qualquer ramo.

**Papel Admin.** Acesso total, acima de Diretor, para quem implanta o sistema.
E a seção "acessos sem ficha" em Colaboradores, que tornou visíveis os logins
que antes não apareciam em tela nenhuma.

**Certificado digital A1.** Sobe pela tela, é conferido na hora (titular, CNPJ
e validade saem de dentro do arquivo) e fica guardado no cofre do Google —
nunca no banco. Testado com o certificado real da LPM, válido até 01/04/2027.

**Cadastro fiscal no banco.** Campos de NF-e em Empresa, Produto e Cliente.
Genérico: o regime tributário da empresa (CRT) é quem decide se o código do
produto vale como CSOSN ou como CST. ⚠️ **As telas para preencher esses campos
ainda não existem** — é o primeiro passo da emissão.

---

## Pendente com você

1. ~~Falar com a contadora~~ — **RESPONDIDO em 20/08.** Contadora: **Mara Paim
   (Castros Contabilidade)**. Respostas dela, por WhatsApp:
   - **Série 1, última nota emitida: 126.** Ela mandou a `nota 126.pdf` como
     referência — vale guardar, mostra os campos reais de uma nota da LPM.
   - **Série nova (série 2) para o Zeh: aprovado** ("tudo bem, sem problema").
   - **XMLs: em lote no fim do mês** — não quer e-mail a cada nota.
   - **Mudança de SC para KG: sem objeção.**
2. **Comprar um domínio próprio para o Zeh.** Necessário para o e-mail do
   sistema e para vender o produto. Hoje ele mora num endereço do Firebase.
3. **Preencher os Dados da empresa.** Enquanto não preencher, todo relatório
   sai com aviso amarelo. Os dados reais estão logo abaixo.
4. **Conferir se backup automático e PITR estão ligados no `zeh-db`.** No
   Gabriel estavam desligados, e foi por isso que o incidente de 30/07 não teve
   volta. Conferir **antes** de qualquer migration.
5. **Alerta de orçamento no Google Cloud** (R$ 30/mês) — rede de segurança.
6. **Decidir o banco de testes.** O ambiente local ainda aponta para o banco de
   produção: qualquer teste seu mexe no dado real da Ariel. Recomendação: criar
   um banco `zeh-dev` na mesma instância Cloud SQL (custo ~zero, não precisa de
   Docker) e apontar o `.env` local para ele.
7. **Abrir o chamado na SEFA** — texto pronto em `zeh-sefa/CHAMADO-SEFA.md`.
   Ver a seção do DEC: o que falta agora não está do seu lado.
8. 🔴 **Apagar `zeh-sefa\_to_delete\` e conferir se não foi para o GitHub.**
   Os arquivos de teste de 21/08 contêm client secrets das aplicações da SEFA.
   Se algum commit os pegou, **rotacionar os segredos no portal** — não basta
   apagar o arquivo, o histórico do git guarda.

---

## Seus dados fiscais reais (extraídos dos XMLs)

Fonte: `G:\Meu Drive\...\Ariel Nutrição Animal\Administrativo e Financeiro\Financeiro\Arquivos XML`

| Campo | Valor |
|---|---|
| Razão social | LPM Indústria e Comércio de Produtos Alimentícios |
| Nome fantasia | Ariel Alimentos |
| CNPJ | 30.889.880/0001-60 |
| Inscrição estadual | 156093383 |
| Regime (CRT) | 1 — Simples Nacional |
| Endereço | Rua Bem Te Vi, Quadra 08B, SN — Distrito Empresarial |
| Município | Canaã dos Carajás/PA · CEP 68537000 · **código IBGE 1502152** |
| Ração (Bovleite) | NCM **23099010** · CFOP **5101** · CSOSN **102** · origem **0** |

**Unidade — DECIDIDO em 20/08:** a nota passa a sair em **KG** (embalagem de
40 kg), com a quantidade de sacos registrada no campo `infAdProd` de cada item.
Histórico anterior estava em SC. Ver `PLANO-EMISSAO-NFE.md`, seção 4.

**Venda interestadual:** você nunca vendeu para fora do Pará (só CFOP 5101).
Venda interestadual tem CFOP diferente e DIFAL — pergunta para o contador, não
para o sistema.

---

## Onde parou o DEC (SEFA) — reescrito em 21/08

O DEC é a caixa postal oficial da Fazenda: mensagem entregue ali vale como
intimação, com prazo correndo.

**A anotação anterior está superada.** Ela dizia que o travamento era
`Account is not fully set up` e que a causa provável era conta de portal
incompleta. Isso caiu. Segue a leitura correta.

### O portal certo é outro

A SEFA tem **dois sistemas separados**, e boa parte do tempo perdido veio de
confundir os dois:

- **Portal do contribuinte** — onde se entra com certificado digital pela
  extensão **Web PKI** (Lacuna). Funciona, você acessa normalmente.
- **Portal de integrações** — `apis.sefa.pa.gov.br`, um **Red Hat 3scale**.
  É de onde saem Client ID e Secret. Só apareceu no radar em 20/08.

Situação atual no portal de integrações, conferida em tela:

- **Adesão ao DEC: Habilitada**, plano Default.
- **Três aplicações ativas**, todas para o DEC: `5d203797`, `de5204df` e
  `804b5f36`. Duas se chamam `https://zeh.web.app` — o campo é `redirect_uri`.
- **Endpoint de token** (deles, em "Como começar", passo 4):
  `https://apis-auth.sefa.pa.gov.br/protocol/openid-connect/token`,
  `grant_type=client_credentials`, **sem certificado**.
  Note que o caminho **não tem `/realms/...`** no meio.
- **Base da API:** `https://apis-publicas-gw.sefa.pa.gov.br/dec`.

**A URL no `dec.service.ts` já estava correta.** Testado em 21/08.

### ⚠️ Correção de 21/08, 00h26 — o DEC exige mTLS

A página **Documentação** do portal (`apis.sefa.pa.gov.br/docs`) diz:

> "Algumas APIs, como por exemplo a do **DEC**, exigem autenticação com
> **mTLS**, usando certificado digital **e-CPF ou e-CNPJ**. (...) você deve
> realizar a **requisição de autenticação também com o certificado digital**,
> além do Client ID e Client Secret."

"Requisição de autenticação" é a chamada de **token**. A página "Como começar"
não menciona isso porque é genérica para todo o catálogo.

**O teste que deu `Client not enabled to retrieve service account` foi feito
SEM certificado, e portanto não é conclusivo.** Refazer com mTLS antes de
concluir qualquer coisa e antes de abrir o chamado.

Isso também **derruba a hipótese do `authorization_code`** registrada abaixo:
se eles documentam mTLS + Client ID + Secret, o fluxo é `client_credentials`
mesmo, e o certificado é o que identifica a empresa no lugar do CPF/CNPJ de
uma pessoa — o que explicaria a semântica de `/vinculos`.

**Falta ler:** o "Passo a passo para integração" da página `/docs` continua
abaixo da dobra. Pode trazer host ou porta específicos para mTLS — gateways
costumam expor o endpoint mTLS em endereço separado.

### O travamento real

Com a URL certa e as três aplicações, todas retornam o mesmo:

```json
{ "error": "unauthorized_client",
  "error_description": "Client not enabled to retrieve service account" }
```

Ou seja: os clients criados pelo portal **não têm service account habilitado**,
que é o que o `client_credentials` exige. Não é client_id, não é secret, não é
certificado, não é conta de usuário — e **não há botão para ligar isso** na área
autenticada.

Isso é consistente com a arquitetura: no 3scale, o componente **Zync** replica
cada aplicação como um client do Keycloak montado para o fluxo de
**redirecionamento**, sem service account. Por isso as três falham igual — é o
molde, não uma aplicação quebrada.

### A hipótese que vale testar antes do chamado

Há indício razoável de que **o fluxo certo para o DEC seja `authorization_code`**
e que a página "Como começar" — genérica para todas as APIs do portal — esteja
errada para esta:

- `GET /vinculos` devolve "os vínculos vinculados ao **CPF/CNPJ do usuário**
  presente no token JWT". Token de service account não carrega CPF/CNPJ de
  pessoa.
- Duas das três aplicações têm **URL como nome** — assinatura de `redirect_uri`.

**Teste que ninguém fez ainda** (o 403 anotado antes foi obtido em **outro
host**, antes de `apis-auth` ser conhecido — aquele registro não vale aqui):

```
https://apis-auth.sefa.pa.gov.br/protocol/openid-connect/auth
  ?client_id=<CLIENT_ID>&response_type=code&scope=openid
  &redirect_uri=<a redirect_uri exata da aplicação>
```

Abrir **no navegador**, que é onde o Web PKI vive:

- **Tela de login** → é esse o fluxo. Trocar o `code` por token, guardar o
  `refresh_token` no Secret Manager, renovar sozinho depois.
- **403 do gateway** → nenhum caminho está aberto; chamado, com prova.
- **`invalid_redirect_uri`** → o fluxo existe, só falta acertar a URI no
  portal. Resolve sozinho.

### Se for `authorization_code`, duas armadilhas

- **Rotação:** muitos realms invalidam o refresh token a cada uso e devolvem um
  novo. Gravar o novo a cada renovação, ou o acesso morre na segunda vez.
- **Expiração silenciosa:** quando o refresh expirar, o sistema tem que
  **avisar** que precisa refazer o login, não falhar calado. Mesma lição do
  `enviadoContadorEm` no plano de e-mail.

Isso não conflita com a regra de manter o humano no circuito — encaixa nela.

**Regra que não muda:** o Zeh **nunca abre** mensagem do DEC automaticamente.
Abrir registra ciência e faz o prazo correr. O sistema avisa que existe
mensagem nova, com assunto e data; abrir continua sendo decisão sua.

---

## Nota de sessão (20/08) — planejamento da DistribuiçãoDFe e da emissão

Sessão de planejamento, sem código. Nada foi alterado no sistema.

### DistribuiçãoDFe — planejada, ver `PLANO-DISTRIBUICAODFE.md`

**Correção importante:** a anotação anterior dizia que ela "fala direto com o
SVRS". **Está errado** — a DistribuiçãoDFe é do **Ambiente Nacional** da
Receita. O SVRS atende o Pará para *autorização* de NF-e, que é outro serviço.
Continua verdadeiro que **não depende do DEC**.

**Descoberta que muda o escopo:** a DistribuiçãoDFe **não entrega o XML
completo**. Antes da manifestação vem só o resumo (`resNFe`): chave, emitente,
valor, data — **sem os itens**. Para receber a nota inteira é preciso registrar
**Ciência da Operação (210210)**, que é ato jurídico. Por isso o trabalho tem
duas etapas, e a recomendação é que **o Zeh não manifeste sozinho** — mesma
regra já adotada para o DEC.

**Regra operacional que derruba sistema:** consultar de novo em menos de 1 hora
depois de um retorno "nenhum documento" gera **rejeição 656 (consumo indevido)
e bloqueia o CNPJ por 1 hora** — bloqueio que atinge qualquer outra ferramenta
fiscal da empresa junto. A trava tem que viver no banco, não só no agendador.

### Emissão de NF-e — planejada, ver `PLANO-EMISSAO-NFE.md`

**Recomendação:** **não construir o motor de emissão dentro do Zeh.** Usar um
provedor de API (Focus NFe, PlugNotas ou Webmania), mantendo o Zeh como dono da
informação. Motivo: assinatura digital, contingência e o acompanhamento
permanente das Notas Técnicas são o que mata projeto caseiro — e se a emissão
quebrar, a fábrica não fatura. A DistribuiçãoDFe faz sentido em casa porque é
leitura e ninguém para se falhar; emissão é o oposto nos três pontos.

**Quem emite hoje:** o **contador**, por emissor gratuito. Isso significa que
ele é hoje a última conferência humana antes de existir documento fiscal — se o
Zeh assumir, essa conferência precisa ser recolocada de propósito (o Zeh monta,
o Leo confere na tela, e só então emite).

**Numeração:** o Zeh deve emitir numa **série nova** (série 2), deixando a série
atual intacta com o contador. Continuar a numeração dele é o jeito mais fácil
de tomar rejeição no primeiro dia.

### E-mail do sistema — DECISÃO DE ARQUITETURA

O contador vai receber cópia de cada nota assim que autorizada. Como o Zeh será
vendido para outras indústrias, **não** se conecta a conta de e-mail de
cliente: isso esbarra na verificação de app do Google (6 a 12 semanas) e no
DMARC (o cliente teria que editar DNS).

**Adotado:** domínio próprio do Zeh + serviço de e-mail transacional, com o nome
do cliente no remetente e o e-mail real dele no "responder a". Zero campo
técnico no onboarding, e o Zeh nunca guarda senha de caixa de cliente.

**Duas armadilhas do envio automático:** (1) o contador precisa receber também o
XML do **cancelamento**, senão a escrituração sai errada; (2) e-mail falha em
silêncio — precisa de `enviadoContadorEm` no banco, tela do que não foi enviado,
botão de reenviar, e uma **lista mensal** como rede de segurança.

---

## Fila de código (para a próxima sessão no Claude do computador)

Em ordem, do mais barato ao mais caro:

1. **Corrigir o texto "NF-e integrada"** na tela de login. Não é verdade hoje —
   o sistema só lê XML de fornecedor — e **a Oba Sucos já viu essa tela**.
   Cinco minutos.
2. **Corrigir o corte de informação nas telas.** Relatado em 20/08: "o zoom do
   painel está cortando as informações". Suspeita: **não é zoom** — a tela do
   Leo é **1366×768**, e painel desenhado em monitor grande corta nessa
   largura; diminuir o zoom para caber é a reação, não a causa. Investigar
   largura mínima, `overflow` e grid do layout. Conferir também no atalho
   `Zeh.lnk`, que abre em janela própria com área útil menor.
3. **Telas do cadastro fiscal** (Empresa, Produto, Cliente). Pré-requisito de
   toda a emissão, sem risco e sem SEFAZ. É por onde a emissão começa.
4. **DistribuiçãoDFe, Etapa 0 e 1** — ver o plano. **Não depende da SEFA.**

O DEC não entra nesta fila enquanto a SEFA não responder — não há código a
escrever enquanto o acesso não abre.

---

## Aviso sobre ferramentas (atualizado 21/08)

- O `C:\Zeh` **já é repositório git**, com `.gitignore` correto (bloqueia
  `zeh-Anthropic.txt` e todos os `.env`). **Histórico auditado em 20/08:
  limpo** — o único arquivo sensível que já passou por algum commit é o
  `.env.example`, que só tem placeholders.
- 🔴 **Reauditar antes de subir para o GitHub.** Em 21/08 foram criados
  arquivos de teste com client secrets em `zeh-sefa\_to_delete\`. Conferir se
  o `.gitignore` cobre esse caminho e se algum commit os pegou. Se pegou,
  **rotacionar os segredos no portal da SEFA** — apagar o arquivo não limpa o
  histórico.
- **Ainda não há remoto configurado.** A tentativa de subir em 20/08 falhou por
  incidente do próprio GitHub (erro 500 no login pelo Google), não por problema
  local. Tentar de novo outro dia.
- O comando `claude` **não está instalado** no PowerShell. O trabalho no código
  é feito pelo **aplicativo** do Claude no computador, apontando para `C:\Zeh`.
- **Sessões do Claude na web não enxergam o `C:\Zeh`.** Elas rodam num
  computador na nuvem e só veem o repositório que estiver ligado a elas. Para
  mexer no código, é o aplicativo do computador. Para pesquisar, diagnosticar e
  escrever documento, a web serve — foi assim que a sessão de 21/08 achou o
  portal de integrações.
