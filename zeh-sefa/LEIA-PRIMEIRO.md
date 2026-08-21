# SEFA — o que está travado e o que você faz agora

Escrito para você ler, não para programador. O arquivo `README.md` desta mesma
pasta é a versão técnica — é o que você mostra para o Claude do computador.

## ATUALIZAÇÃO 20/08, 23h — achamos o endereço certo

Depois que você abriu o portal de integrações da SEFA
(`apis.sefa.pa.gov.br`), apareceu uma informação que muda o diagnóstico.

**A SEFA tem dois prédios diferentes.** Um é o portal do contribuinte, onde
você entra com o certificado digital pela extensão. O outro é o portal de
integrações, que é de onde os sistemas pegam a chave de entrada.

Na página "Como começar" deles, passo 4, está escrito o endereço certo:

```
https://apis-auth.sefa.pa.gov.br/protocol/openid-connect/token
```

E o modo de entrar é **só Client ID e Client Secret — sem certificado
digital nenhum.**

**Por que isso importa tanto:** a mensagem "conta não está totalmente
configurada" é o tipo de recusa que aparece quando o sistema acha que é
**uma pessoa** tentando entrar, não um programa. Se o Zeh estava pedindo a
chave no prédio errado — o do contribuinte, onde sua conta existe como
pessoa física e está com cadastro incompleto — a resposta seria exatamente
essa.

Ou seja: você tentou de tudo, mas possivelmente no lugar errado. E o lugar
certo só apareceu agora.

**Duas coisas já descartadas:**

- A **adesão** ao DEC está *Habilitada*. Não falta isso.
- As **aplicações** estão ativas. Mas existem **três** delas, todas para o
  DEC. Só uma está configurada no Zeh — e se o Client ID for de uma e a
  senha for de outra, também não funciona.

**O que fazer:** peça ao Claude do computador para comparar o endereço que
está configurado hoje no Zeh com o de cima, e testar as três aplicações.
Se o endereço estiver diferente, é uma linha de configuração — resolve sem
depender de ninguém da SEFA.

---

## O que está acontecendo, sem termo técnico

O Zeh tenta entrar no sistema da SEFA e leva a seguinte resposta:

> *"Conta não está totalmente configurada."*

Pensa numa portaria de prédio. Você chega, mostra o documento, e o porteiro
**reconhece você** — sabe seu nome, sabe que você mora ali. Mas ele olha o
sistema e diz: *"sua ficha de cadastro está incompleta, não posso liberar."*

É exatamente isso. A SEFA **reconheceu a empresa e o certificado digital**.
O que falta é um campo do cadastro dela, do lado deles.

## A boa notícia: isso elimina três suspeitas

Essa mensagem específica prova que **não é**:

- ❌ **Senha ou código de acesso errado** — se fosse, a resposta seria "não te
  conheço", e não "sua ficha está incompleta".
- ❌ **Certificado digital com problema** — ele foi aceito. A conversa nem
  teria chegado nesse ponto se o certificado estivesse errado.
- ❌ **Erro de programação do Zeh** — o Zeh está pedindo do jeito certo. A
  recusa é sobre o cadastro, não sobre o pedido.

Ou seja: **pare de mexer no certificado e nas senhas.** O problema não está aí,
e mexer nisso só ia gastar seus dias.

## Por que o cadastro está incompleto

Sua suspeita anotada estava certa. Você criou a conta no portal da SEFA
entrando pelo **gov.br, com seu CPF**. Mas o Zeh entra usando o **certificado
da empresa, o e-CNPJ**.

Para o sistema da SEFA, isso são **duas pessoas diferentes**:

- A conta do **seu CPF** está completa — o gov.br preencheu tudo.
- A conta do **CNPJ da empresa** nasceu sozinha, no primeiro contato do Zeh,
  sem passar por tela nenhuma. Por isso está sem os dados obrigatórios.

E tem um agravante que você já descobriu: a tela que normalmente pediria esses
dados **dá erro de acesso** no site deles. Então ela não aparece sozinha para
você preencher.

## O que você faz — nesta ordem

### 1. Entrar no portal da SEFA pelo certificado (10 minutos)

Vá em **app.sefa.pa.gov.br/pservicos**. Na hora de entrar, **escolha
"certificado digital"** — **não** clique em gov.br. O certificado já está
instalado no seu Chrome, então ele deve aparecer para você selecionar.

Aí é só prestar atenção numa coisa:

- **Se aparecer qualquer tela pedindo dados** — nome, e-mail, telefone,
  confirmar e-mail, aceitar um termo de uso — **é exatamente esse o problema.**
  Preencha tudo e salve.
- **Se não pedir nada e entrar direto**, vá para o passo 3.

### 2. Testar de novo

Peça para o Claude do computador (aquele que abre no `C:\Zeh`):

> *"Roda o diagnóstico da SEFA que está na pasta zeh-sefa."*

Ele sabe o que fazer — as instruções estão no `README.md`. Se der certo,
acabou. Se ainda der o mesmo erro, passo 3.

### 3. Abrir chamado na SEFA

Se o portal não pediu nada, é porque a pendência está **invisível para você**.
Só o pessoal técnico da SEFA consegue ver e resolver.

Use o arquivo `CHAMADO-SEFA.md`. Ele é **propositalmente técnico** — não é para
você entender, é para o técnico deles entender e não devolver com "reinstale o
certificado". Você só precisa:

1. Preencher o que está entre colchetes `[assim]` — data, telefone, e-mail.
2. Colar no Fale Conosco do site da SEFA.

Se preferir por telefone: **0800 725 5533**. Mas por escrito é melhor, porque
fica registrado e chega no time certo.

## Enquanto isso, o Zeh não está parado

Importante: **o DEC travado não impede o resto.** O download automático das
notas dos fornecedores (a tal DistribuiçãoDFe) é de **outro órgão** — é da
Receita Federal, não da SEFA. Não depende disso aqui.

Então a fila de trabalho do `CONTEXTO_ZEH.md` continua andando normalmente:
o texto errado na tela de login, o corte de informação nas telas, as telas do
cadastro fiscal. Nada disso espera a SEFA.

## Uma regra que continua valendo

Quando o DEC funcionar, ele **não vai abrir mensagem nenhuma sozinho**.

Abrir uma mensagem do DEC conta como você ter tomado ciência dela — e o prazo
legal começa a correr naquele instante. O Zeh vai apenas **avisar** que chegou
mensagem nova, mostrando o assunto e a data. Abrir continua sendo decisão sua.
