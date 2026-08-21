# SEFA — o que está travado e o que você faz agora

Escrito para você ler, não para programador. O arquivo `README.md` desta mesma
pasta é a versão técnica — é o que você mostra para o Claude do computador.

## CORREÇÃO 21/08 — o teste anterior não valia

Apareceu, numa página que a gente ainda não tinha visto, uma frase que muda o
teste:

> *"Algumas APIs, como por exemplo a do DEC, exigem autenticação com mTLS,
> usando certificado digital e-CPF ou e-CNPJ."*

Traduzindo: **o DEC exige o certificado digital na hora de pedir a chave de
entrada.** Não é só para entrar no portal — é para pedir a chave também.

Eu tinha escrito o contrário no arquivo de configuração, mandando deixar o
certificado de fora. Me baseei na página "Como começar", que não fala de
certificado nenhum — só que aquela página vale para todas as APIs da SEFA em
geral, e a exigência do DEC está escondida em **outra** página.

Ou seja: **o teste que deu "cliente não habilitado" foi feito sem o
certificado**, seguindo instrução minha que estava errada. Ele não vale.

### Voltando à analogia da portaria

Não é que o crachá seja do tipo errado, como eu disse antes. É que **o crachá
sozinho não abre a porta do DEC** — ali, além do crachá, o porteiro exige
também a sua identidade na mão. E a gente foi lá só com o crachá.

Talvez o crachá esteja certo esse tempo todo.

### O que fazer agora

Refazer o teste, com o certificado junto. Peça ao Claude do computador:

> *"O DEC exige mTLS — o certificado digital tem que ir junto na chamada de
> token, não só na API. Preenche SEFA_CERT_PFX e SEFA_CERT_SENHA no .env do
> zeh-sefa e roda o diagnóstico de novo, testando as três aplicações."*

**Não abra o chamado ainda.** Se o erro sumir com o certificado, você não
precisa da SEFA para nada. E se persistir, o chamado fica muito mais forte —
porque aí você terá feito exatamente o que a documentação deles manda.

---

## ATUALIZAÇÃO 21/08 — o erro mudou, e agora sabemos o porquê

Testando no endereço certo, com as três aplicações, a resposta passou a ser:

> *"Cliente não habilitado para obter conta de serviço."*

Isso é **outro** problema, mais específico — e é a melhor notícia até agora,
porque é a primeira mensagem que aponta para um lugar concreto.

### O que aconteceu, na analogia da portaria

Você pediu **três crachás** no portal da SEFA, e recebeu os três. Eles estão
ativos, a adesão está habilitada, está tudo certo do seu lado.

Só que os três crachás são do **tipo errado**.

São crachás de **visitante acompanhado** — funcionam quando *uma pessoa* passa
pela catraca com eles. O Zeh precisa de um crachá de **funcionário da limpeza
noturna**: aquele que entra sozinho, de madrugada, sem ninguém junto.

E o portal da SEFA **só emite o primeiro tipo**. Não existe, em lugar nenhum da
tela, botão para pedir o segundo.

### E aí vem a parte estranha

A **própria página "Como começar" da SEFA** manda usar o crachá de funcionário
noturno. Está escrito lá, no passo 4.

Ou seja: **a instrução deles não funciona com o crachá que eles mesmos emitem.**

Isso não é erro seu. Não tem configuração sua para arrumar. É uma inconsistência
no sistema deles — e agora dá para provar isso em duas linhas.

### Mas talvez o crachá esteja certo e a instrução é que esteja errada

Tem uma pista de que o caminho é outro. O primeiro serviço da API se chama
"vínculos", e a descrição diz que ele devolve *"os vínculos do CPF/CNPJ do
usuário presente no token"*.

Repare: **do usuário**. O sistema do DEC quer saber **qual pessoa** está pedindo,
e a quais empresas ela está ligada. Um crachá de funcionário noturno não tem
nome de pessoa nenhum — então talvez ele nunca fosse servir mesmo.

Se for isso, o caminho certo é: **você faz login uma vez**, autoriza o Zeh, e
daí em diante ele se vira sozinho renovando o acesso. Isso, aliás, combina com
a regra que você já escolheu — o Zeh nunca abre mensagem sozinho de qualquer
jeito.

### Os dois próximos passos

**1. Um teste de 30 segundos, que pode resolver hoje.** Está descrito na
conversa: é colar um endereço no navegador e ver o que aparece. Se abrir tela de
login, achamos o caminho certo e nem precisamos da SEFA.

**2. Se não abrir, o chamado.** O `CHAMADO-SEFA.md` já está reescrito com esse
erro novo. E ele agora faz a **pergunta certa** em vez de pedir uma solução que
pode ser a errada — o que é a diferença entre ser respondido e ser ignorado.

### ⚠️ Uma coisa para fazer agora, antes de dormir

Os arquivos de teste que ficaram na pasta `zeh-sefa\_to_delete\` **contêm as
senhas das aplicações**. Apague a pasta. E confira que ela não foi enviada para
o GitHub junto com o resto — senha de aplicação em repositório é como deixar a
chave de casa embaixo do tapete.

---

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
