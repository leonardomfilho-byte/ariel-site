# Contexto do Zeh — onde paramos

Atualizado em **24/08/2026, 16h**. Este arquivo é o ponto de partida da
próxima sessão. O guia de comandos de deploy é o `GUIA-DEPLOY.md`.

> **O DEC está com a SEFA.** Investigação encerrada em 21/08: os dois fluxos
> OAuth foram testados nas três aplicações e ambos estão bloqueados. O chamado
> foi aberto — e-mail às 08h41 e atendimento por WhatsApp, **protocolo 212913**.
> Não há mais teste a fazer nem código a escrever do nosso lado. **Nada mais no
> Zeh depende disso**; a fila de código segue normal.

**Planos detalhados nesta pasta:**
- `PLANO-DISTRIBUICAODFE.md` — download automático das notas dos fornecedores
- `PLANO-EMISSAO-NFE.md` — emissão de NF-e pelo Zeh
- `zeh-sefa/` — diagnóstico da API da SEFA, script de teste e código de
  referência. Dentro dela, dois arquivos de acompanhamento:
  `CHAMADOSEFA.md` (texto do chamado) e `REGISTRO-CHAMADO-SEFA.md`
  (cronologia dos contatos, para a Ouvidoria se for preciso)

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
4. ~~Conferir backup automático e PITR no `zeh-db`~~ — **CONFERIDO em 24/08:
   os dois estão ativados.** Ver "Infraestrutura do banco" abaixo. ⚠️ **Mas o
   Gabriel continua desprotegido** — o painel dele ainda acusa "Proteção de
   dados" em laranja quase um mês depois do incidente de 30/07. Repetir lá o
   mesmo procedimento, é o mesmo caminho e leva cinco minutos.
5. **Alerta de orçamento no Google Cloud** (R$ 30/mês) — rede de segurança.
6. **Decidir o banco de testes.** O ambiente local ainda aponta para o banco de
   produção: qualquer teste seu mexe no dado real da Ariel. Recomendação: criar
   um banco `zeh-dev` na mesma instância Cloud SQL (custo ~zero, não precisa de
   Docker) e apontar o `.env` local para ele.
7. ~~Abrir o chamado na SEFA~~ — **FEITO em 21/08.** E-mail às 08h41 e
   atendimento por WhatsApp, **protocolo 212913**. Ver a seção do DEC. O que
   resta é **abrir protocolo digital** pelo Portal de Serviços (opcional, e
   pode ser na segunda) — é o canal que entra como documento, sem depender de
   atendente traduzir. Citar "complementando o atendimento 212913".
8. ~~Apagar `_to_delete` e conferir o GitHub~~ — **CONFERIDO em 21/08: nunca
   entrou em commit nenhum.** `zeh-sefa/` inteira está como não-rastreada, e o
   `.gitignore` da pasta agora cobre `_to_delete/`. **Não é preciso rotacionar
   segredo.** Apagar a pasta continua sendo boa higiene.

---

## Infraestrutura do banco — conferido em 24/08/2026

Retrato da instância, para não precisar levantar tudo de novo na próxima vez.

**Instância:** `zeh-db`, projeto `ariel-nutricao-animal`,
região `southamerica-east1` (São Paulo), **PostgreSQL 18.4**, edição Enterprise.

**Máquina:** `db-f1-micro` — 1 vCPU, **628 MB de RAM**, 10 GB SSD, zona única.

**Proteção de dados — tudo ligado:**

| Item | Estado |
|---|---|
| Backups automatizados | Ativados, janela 01h–05h (GMT-3), 7 dias retidos |
| Recuperação pontual (PITR) | Ativada, 7 dias de registros |
| Impedir exclusão da instância | Ligado em 24/08 |
| Reter backups após exclusão | Ligado em 24/08 |
| Backup final na exclusão | Ligado em 24/08 |

Os três últimos foram ligados juntos, e o segundo é o menos óbvio: **sem ele,
apagar a instância apagaria os backups junto** — ter 7 dias de backup e perder
tudo no mesmo clique.

**Prática boa já em andamento:** backup manual antes de cada migration
(visível na lista de backups: "antes da migration classe_produto", "antes de
remover os dados de exemplo do seed"). Manter.

**Local dos backups: multirregião `us`.** DECIDIDO em 24/08: **manter assim.**
Não é descuido — é o padrão e é a escolha certa. Backup existe para sobreviver
ao que derrubou o original; guardá-lo na mesma região do banco é deixar a cópia
da chave dentro de casa. Não existe multirregião na América do Sul (só `us`,
`eu`, `asia`), e a própria documentação do Google diz para usar local
personalizado **apenas se alguma regulamentação exigir**. Reavaliar só se um
cliente do Zeh exigir residência de dados no Brasil por contrato — aí é
cláusula comercial, não decisão técnica. Mudar o local **não move os backups
já existentes**, então trocar por impulso deixaria backups espalhados em dois
lugares.

**Ignorados de propósito** (o painel de integridade insiste neles):

- *"Ative a alta disponibilidade"* — **dobra a conta mensal** e exige
  reiniciar. Protege contra a zona cair.
- *"Crie uma réplica entre regiões"* — custo proporcional. Protege contra a
  região inteira cair.

Ambos são preocupação de banco e hospital, não de indústria que fatura de dia.
Não ligar, sobretudo com o orçamento apertado.

### 🔔 Gatilho: quando revisar a máquina

O `db-f1-micro` é a **menor máquina que o Cloud SQL oferece**, com núcleo
compartilhado. É ela que mantém a conta baixa e cabe no alerta de R$ 30/mês —
e funciona bem para o volume de hoje.

**Se o Zeh ficar lento sem motivo aparente, olhar aqui primeiro**, antes de
caçar problema no código. Sinais de que a máquina apertou:

- telas demorando a carregar em horários de mais uso, mas rápidas fora deles
- relatórios pesados (DRE, rastreabilidade de lote) travando ou dando timeout
- lentidão que piora conforme o banco cresce, sem mudança no código
- erro de conexão recusada quando mais de uma pessoa usa ao mesmo tempo —
  628 MB de RAM limita o número de conexões simultâneas

Nesse caso, subir para uma máquina de núcleo dedicado é mudança de uma linha na
tela de edição — mas **reinicia a instância** e aumenta a conta. Conferir o
custo antes, e fazer fora do horário da fábrica.

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

## Onde parou o DEC (SEFA)

O DEC é a caixa postal oficial da Fazenda: mensagem entregue ali vale como
intimação, com prazo correndo.

### O portal certo é outro

A SEFA tem **dois sistemas separados**, e boa parte do tempo perdido veio de
confundir os dois:

- **Portal do contribuinte** — onde se entra com certificado digital pela
  extensão **Web PKI** (Lacuna). Funciona, você acessa normalmente.
- **Portal de integrações** — `apis.sefa.pa.gov.br`, um **Red Hat 3scale**.
  É de onde saem Client ID e Secret. Só apareceu no radar em 20/08.

Situação no portal de integrações, conferida em tela:

- **Adesão ao DEC: Habilitada**, plano Default.
- **Três aplicações ativas**, todas para o DEC: `5d203797`, `de5204df` e
  `804b5f36`. Duas se chamam `https://zeh.web.app` — o campo é `redirect_uri`.
- **Endpoint de token** (deles, em "Como começar", passo 4):
  `https://apis-auth.sefa.pa.gov.br/protocol/openid-connect/token`.
  Note que o caminho **não tem `/realms/...`** no meio.
- **Base da API:** `https://apis-publicas-gw.sefa.pa.gov.br/dec`.

**A URL no `dec.service.ts` já estava correta.** Testado em 21/08.

### ✅ INVESTIGAÇÃO ENCERRADA — os dois fluxos estão fechados

Testados os **dois** fluxos OAuth possíveis, com as **três** aplicações. Não há
caminho de integração aberto hoje.

| Fluxo | Endpoint | Resultado nas três aplicações |
|---|---|---|
| `client_credentials` | `/protocol/openid-connect/token` | HTTP 401 — `Client not enabled to retrieve service account` |
| `authorization_code` | `/protocol/openid-connect/auth` | HTTP 403 — `Request forbidden by administrative rules` |

O `/.well-known/openid-configuration` do mesmo host também responde **403** — é
por isso que não dá para descobrir sozinho se existe endpoint mTLS separado.

### 📞 Os contatos com a SEFA — 21/08

Cronologia completa em `zeh-sefa/REGISTRO-CHAMADO-SEFA.md`. Resumo:

**08h41 — e-mail** para `atendimento@sefa.pa.gov.br`, com o relatório técnico
completo. **Respondido por mensagem automática** da Coordenação de Atendimento,
só listando os canais. Ninguém técnico leu.

**09h08 a 09h25 — WhatsApp 0800 725 5533.** Protocolo **212913**, atendente
**Eduardo**. O que aconteceu, e vale entender porque explica o impasse:

- O atendimento traduziu o pedido como *"o sistema está fora do ar"* e
  consultou o setor, que respondeu: **"portal normal, nenhuma instabilidade"**.
  Resposta correta para a pergunta errada — o portal está no ar **e** as
  aplicações não obtêm token; as duas coisas convivem.
- Informado que **a DTI é setor interno** e o call center **não repassa contato
  ao público**.
- Às **09h19** foi registrada, dentro do protocolo, a descrição técnica
  correta (erro exato, três Client IDs, e que é configuração e não
  instabilidade). Isso importa: evita o caso ser arquivado como falso alarme.
- Perguntado se encaminhou à DTI, o atendente respondeu **"repassei aos meus
  superiores"** — sem confirmar a DTI. Guardado para eventual cobrança.

**Conclusão dos contatos:** a SEFA não tem hoje um canal montado para receber
problema de integração de API. O portal é novo e o atendimento não acompanhou.

### O que ainda pode ser feito, sem pressa

1. **Protocolo digital** pelo Portal de Serviços, com certificado. Entra como
   documento e é encaminhado por assunto — não depende de intermediário
   traduzir, que foi onde os dois primeiros contatos travaram.
2. **Ouvidoria Fazendária** — (91) 3039-8610 / 8546 / 8545. Cabível quando não
   se obtém resposta satisfatória das unidades regulares. O
   `REGISTRO-CHAMADO-SEFA.md` já é a instrução do pedido.
3. **Alternativa comercial:** contratar intermediário que já venda o acesso
   pronto ao DEC. Mesma lógica do `PLANO-EMISSAO-NFE.md` — não construir o que
   não é o negócio da empresa. Vale reconsiderar se não houver retorno.

### Por que o certificado não muda o primeiro resultado

Registrado porque custou tempo e a intuição aqui engana. A página de
Documentação da SEFA de fato exige mTLS para o DEC (citação preservada abaixo),
e por isso ficou a hipótese de que o teste sem certificado fosse inconclusivo.
**Não é**, e a razão está na própria mensagem de erro:

No Keycloak, a checagem acontece em duas etapas, nesta ordem:

1. **Autenticar o client** — quem é você? Falha aqui produz `invalid_client`.
2. **Autorizar o grant** — você pode usar `client_credentials`? Falha aqui
   produz `unauthorized_client: Client not enabled to retrieve service account`.

O erro recebido é o **da segunda etapa**. Ou seja, a primeira **passou**: o
Keycloak aceitou `client_id` + `client_secret` e identificou o client. mTLS é
método de *autenticação* — atua na etapa 1, que já estava passando. Ele não
liga a flag `serviceAccountsEnabled`, que é configuração do client e é o que
falta.

O certificado continua provavelmente necessário para as chamadas à API em
`apis-publicas-gw`, quando o acesso abrir. Só não é o que destrava o token.

**Citação preservada** (`apis.sefa.pa.gov.br/docs`, conferida em tela 21/08):

> "Algumas APIs, como por exemplo a do **DEC**, exigem autenticação com
> **mTLS**, usando certificado digital **e-CPF ou e-CNPJ**. (...) você deve
> realizar a **requisição de autenticação também com o certificado digital**,
> além do Client ID e Client Secret."

### Por que as três aplicações falham igual

Consistente com a arquitetura: o portal é **Red Hat 3scale**, e o componente
**Zync** replica cada aplicação como um client do Keycloak montado para o fluxo
de **redirecionamento**, sem service account. Não é uma aplicação quebrada — é
o molde. Por isso criar uma quarta aplicação não adiantaria.

E a contradição que sustenta o chamado: **o fluxo que eles publicam em "Como
começar" (`client_credentials`) não funciona com as aplicações que o portal
deles mesmo cria**, e o fluxo alternativo está bloqueado no gateway.

### Semântica dos erros de `/vinculos`, para quando o acesso abrir

| Código | Significado publicado |
|---|---|
| 200 | Lista de vínculos retornada com sucesso |
| 401 | Token inválido, ausente ou **usuário não encontrado no token** |
| 403 | **Usuário autenticado, porém sem vínculo** ou autorização |

O 403 separa "o acesso não funciona" de "o acesso funciona mas não está ligado
à LPM". Vê-lo depois de resolver o token é **progresso, não retrocesso**.

### Se a resposta for `authorization_code`, duas armadilhas

- **Rotação:** muitos realms invalidam o refresh token a cada uso e devolvem um
  novo. Gravar o novo a cada renovação, ou o acesso morre na segunda vez.
- **Expiração silenciosa:** quando o refresh expirar, o sistema tem que
  **avisar** que precisa refazer o login, não falhar calado. Mesma lição do
  `enviadoContadorEm` no plano de e-mail.

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
2. 🔴 **Responsividade — o layout não cabe em tela estreita.** É o item mais
   incômodo hoje, e os dois relatos abaixo são **o mesmo defeito**, não dois:
   largura mínima fixa, herdada de um painel desenhado em monitor grande.
   Corrigir de uma vez só, senão vira conserto em duplicata.

   **Sintomas relatados:**
   - *20/08, no desktop:* "o zoom do painel está cortando as informações". A
     tela do Leo é **1366×768** — diminuir o zoom para caber é a reação, não a
     causa. Conferir também no atalho `Zeh.lnk`, que abre em janela própria,
     com área útil ainda menor.
   - *21/08, no celular:* **só dá para entender girando o aparelho.** Em
     retrato o conteúdo não cabe. Ou seja: o Zeh hoje não é utilizável no
     celular do jeito que as pessoas seguram o celular.

   **O que precisa mudar:**
   - **Layout fluido de verdade**, funcionando de ~360px (celular em retrato)
     até monitor grande. Investigar `min-width` fixo, `overflow` e o grid.
     Testar em 360, 390, 768 e 1366 — se passar nesses quatro, passa em todos.
   - **Tamanho de fonte que caiba nos cards.** Hoje o texto estoura. Escala
     tipográfica por breakpoint, em vez de tamanho único.
   - **Sidebar recolhida por padrão em tela estreita**, aparecendo só quando
     acionada (menu deslizante / off-canvas, com botão de fechar e toque fora
     para fechar). Em tela larga, continua como está.

   **Por que vale priorizar:** o Leo usa o sistema na fábrica, e fábrica se
   anda com o celular na mão. Um sistema que exige girar o aparelho para ser
   lido não é usado em pé, no meio do galpão — que é justamente onde a
   informação é necessária. E a Oba Sucos já viu a tela de login.
3. **Telas do cadastro fiscal** (Empresa, Produto, Cliente). Pré-requisito de
   toda a emissão, sem risco e sem SEFAZ. É por onde a emissão começa.
4. **DistribuiçãoDFe, Etapa 0 e 1** — ver o plano. **Não depende da SEFA.**

O DEC não entra nesta fila enquanto a SEFA não responder — não há código a
escrever enquanto o acesso não abre.

**Uma exceção pequena, achada na revisão de 21/08:** o `dec.service.ts` foi
comparado com `zeh-sefa/sefamtlsreferencia.ts` e passou nas armadilhas que
importam — usa `https.request` com certificado (não `fetch` com `agent`, que
mandaria a chamada sem certificado e sem erro), nunca desliga
`rejectUnauthorized`, e preserva o corpo do erro da SEFA. **Falta só o cache de
token em memória:** hoje toda consulta pede token novo. Não é urgente enquanto
o acesso está fechado, mas vale arrumar antes de ligar o serviço — é a mesma
lição da rejeição 656, tráfego repetido vira bloqueio.

---

## Aviso sobre ferramentas (atualizado 21/08)

- O `C:\Zeh` **já é repositório git**, com `.gitignore` correto (bloqueia
  `zeh-Anthropic.txt` e todos os `.env`). **Histórico auditado em 20/08:
  limpo** — o único arquivo sensível que já passou por algum commit é o
  `.env.example`, que só tem placeholders.
- ✅ **`_to_delete` auditado em 21/08: limpo.** Os arquivos de teste com client
  secrets criados naquele dia **nunca entraram em commit nenhum** — `zeh-sefa/`
  inteira está como não-rastreada (`??` no `git status`), e o `.gitignore` da
  pasta agora cobre `_to_delete/`. **Não é preciso rotacionar segredo.**
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
- **URL com `&` não se cola no PowerShell.** O `&` é operador lá e quebra o
  comando. Endereço de site vai na barra do Chrome, não no terminal.
- **Para printar comando com segredo:** ponha o segredo numa variável antes
  (`$s = "..."`), rode `cls` para limpar a tela, e use `$s` no comando. O print
  mostra `client_secret=$s` em vez do valor — tela cheia, sem vazar credencial.
