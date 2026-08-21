# Registro do chamado na SEFA — API do DEC

Cronologia dos contatos, para acompanhamento e, se necessário, para instruir
reclamação na Ouvidoria Fazendária. A Ouvidoria pede exatamente isto: prova de
que os canais regulares foram acionados e não resolveram.

**Contribuinte:** LPM Indústria e Comércio de Produtos Alimentícios
**CNPJ:** 30.889.880/0001-60 · **IE:** 156093383
**Assunto:** integração com a API do DEC — nenhum fluxo OAuth disponível

---

## Cronologia

### 21/08/2026, 08h41 — E-mail

Enviado para `atendimento@sefa.pa.gov.br`, com o relatório técnico completo:
os dois fluxos testados, os retornos obtidos, os três Client IDs e cinco
perguntas objetivas.

**Resposta:** automática, assinada por *DAD — Diretoria de Administração,
Coordenação de Atendimento*, apenas listando os canais de atendimento
(0800, WhatsApp, chat). **Não houve resposta ao conteúdo.**

### 21/08/2026, 09h08 às 09h25 — WhatsApp 0800 725 5533

**Protocolo: 212913** · **Atendente: Eduardo**

| Hora | Ocorrência |
|---|---|
| 09h10 | Atendimento consulta o setor e informa: "o portal de API está normal"; pergunta se o "serviço do TOKEN" está com instabilidade |
| 09h14 | Reafirma: "nenhuma instabilidade foi reportada pelo setor de DTI" |
| 09h15 | Informa que **a DTI é setor interno** e o call center **não dispõe de contato para repassar ao público** |
| 09h19 | **Contribuinte registra a descrição técnica correta** (ver abaixo) |
| 09h20 | Fornecido o protocolo **212913** |
| 09h24 | Contribuinte pergunta se a solicitação foi encaminhada à DTI |
| 09h25 | Atendente responde: *"repassei as informações aos meus superiores"* — **não confirma encaminhamento à DTI** |

**Descrição registrada às 09h19, dentro do protocolo:**

> Não é instabilidade — o portal está no ar mesmo. O problema é a configuração
> das aplicações. As três aplicações do CNPJ 30.889.880/0001-60, vinculadas à
> API do DEC, retornam "Client not enabled to retrieve service account" no
> endpoint de token, e HTTP 403 no endpoint de autorização. Client IDs:
> 5d203797, de5204df e 804b5f36. Os clients criados pelo portal estão sem
> service account habilitado — configuração que só a DTI pode ajustar.

---

## O ponto central, para quem for ler depois

O atendimento respondeu sobre **disponibilidade do serviço**; a solicitação era
sobre **configuração da conta**. São coisas diferentes e ambas podem ser
verdadeiras ao mesmo tempo: o portal está no ar **e** as aplicações deste CNPJ
não obtêm token.

A contradição que sustenta o pedido:

> O fluxo `client_credentials`, publicado pela própria SEFA na página "Como
> começar" do portal de integrações, **não funciona com as aplicações que esse
> mesmo portal cria** — e não há, na área autenticada, opção para habilitar a
> configuração que falta. O fluxo alternativo (`authorization_code`) responde
> HTTP 403 no gateway.

Com adesão **Habilitada** e três aplicações **Ativas**, não há caminho de
integração aberto.

---

## Situação e próximos passos

- [x] E-mail — respondido por mensagem automática
- [x] WhatsApp — protocolo 212913, sem solução técnica
- [ ] **Protocolo digital** pelo Portal de Serviços, com certificado digital.
      Citar "complementando o atendimento 212913, de 21/08". É o canal que
      entra como documento, sem depender de intermediário traduzir o problema —
      que foi onde os dois primeiros contatos travaram.
- [ ] **Ouvidoria Fazendária** — (91) 3039-8610 / 8546 / 8545. Cabível quando
      não se obtém resposta satisfatória das unidades regulares. Este registro
      é a instrução do pedido.

**Alternativa a considerar se não houver retorno:** contratar intermediário que
já ofereça acesso pronto à caixa postal do DEC. Mesma lógica já adotada para a
emissão de NF-e no `PLANO-EMISSAO-NFE.md` — não construir o que não é o negócio
da empresa.

**Nada mais no Zeh depende disto.** A DistribuiçãoDFe é do Ambiente Nacional da
Receita, e as telas do cadastro fiscal não tocam a SEFA.
