# Texto para abrir o chamado na SEFA

Atualizado em 20/08/2026, depois dos testes contra `apis-auth.sefa.pa.gov.br`.

O erro mudou e ficou mais específico. **Não peça "habilitem service accounts"** —
essa é uma solução possível, mas pode ser a errada, e chamado que pede a solução
errada volta com "não é assim que funciona". Pergunte qual é o fluxo correto e
apresente a contradição. A contradição é forte e eles vão ter que responder.

Preencha o que está entre colchetes e anexe a saída de
`node diagnostico-sefa.mjs --json`.

---

**Assunto:** API do DEC — aplicações do portal não aceitam `client_credentials`
("Client not enabled to retrieve service account") — CNPJ 30.889.880/0001-60

Prezados,

Integro sistema próprio à **API do Domicílio Eletrônico do Contribuinte (DEC)**
para o contribuinte **LPM Indústria e Comércio de Produtos Alimentícios**, CNPJ
**30.889.880/0001-60**, inscrição estadual **156093383**.

**Situação no portal de integrações (`apis.sefa.pa.gov.br`):**

- Adesão à API do DEC: **Habilitada**, plano Default.
- Aplicações criadas e **Ativas**: três, todas vinculadas à API do DEC
  (Client IDs `5d203797`, `de5204df` e `804b5f36`).
- Acesso ao portal por certificado digital e-CNPJ (Web PKI): funcionando.

**Requisição, exatamente como publicada por vocês em "Como começar", passo 4:**

```
POST https://apis-auth.sefa.pa.gov.br/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
client_id=<client id da aplicação>
client_secret=<client secret da aplicação>
```

**Resposta obtida, idêntica para as três aplicações:**

```json
{
  "error": "unauthorized_client",
  "error_description": "Client not enabled to retrieve service account"
}
```

**A contradição:** essa mensagem indica que os clients correspondentes às
aplicações **não possuem service account habilitado**, condição necessária para
o `client_credentials`. Ou seja, o fluxo publicado na página "Como começar" não
funciona com as aplicações que o próprio portal cria — e não há, na área
autenticada, nenhuma opção visível para habilitar essa configuração.

**Reforça a dúvida sobre o fluxo:** a documentação do endpoint `GET /vinculos`
informa que ele "retorna os vínculos vinculados ao CPF/CNPJ do usuário presente
no token JWT". Um token de service account não carrega CPF/CNPJ de pessoa, o
que sugere que o fluxo pretendido para o DEC talvez seja de **autorização com
identificação do usuário** (`authorization_code`), e não `client_credentials`.

**Solicito, por favor:**

1. **Qual é o fluxo OAuth correto para a API do DEC** — `client_credentials` ou
   `authorization_code`? A página "Como começar" indica o primeiro; o
   comportamento dos clients e a semântica de `/vinculos` sugerem o segundo.
2. **Se for `client_credentials`:** que seja habilitado o service account nos
   clients das aplicações acima (ou informado onde, na área autenticada, o
   próprio contribuinte faz isso).
3. **Se for `authorization_code`:** qual o endpoint de autorização válido, quais
   `redirect_uri` devem ser cadastrados e qual escopo utilizar. Registro que
   tentativas anteriores de acessar o endpoint de autorização retornaram
   **HTTP 403 no gateway**.
4. **Como o token deve carregar o vínculo com o CNPJ**, considerando que o
   acesso é feito por sistema, sem operador presente a cada execução.

Dados para localizar as requisições nos logs:

- CNPJ: 30.889.880/0001-60
- Client IDs testados: `5d203797`, `de5204df`, `804b5f36`
- Data/hora das tentativas: [preencha, com fuso]
- IP de origem: [preencha]

Solicito, se possível, o encaminhamento à área técnica responsável pelo portal
de integrações.

Atenciosamente,
[nome] — [telefone] — [e-mail]
