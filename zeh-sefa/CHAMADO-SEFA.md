# Texto para abrir o chamado na SEFA (Fale Conosco)

O problema é de cadastro da conta no provedor de identidade deles, não de
credencial. O texto abaixo é escrito para chegar em quem cuida disso, em vez de
parar no atendimento de primeiro nível. Preencha os campos entre colchetes e
anexe a saída de `node diagnostico-sefa.mjs --json`.

---

**Assunto:** Integração DEC via API — erro `invalid_grant: Account is not fully
set up` na obtenção de token (CNPJ 30.889.880/0001-60)

Prezados,

Sou responsável pela integração de sistema próprio com a API do DEC para o
contribuinte **LPM Indústria e Comércio de Produtos Alimentícios**, CNPJ
**30.889.880/0001-60**, inscrição estadual **156093383**.

O credenciamento foi feito e possuo Client ID e Client Secret emitidos pelo
Portal de Serviços. A requisição segue o manual de integração e a conexão TLS
com o certificado digital e-CNPJ A1 da empresa é estabelecida com sucesso.

**Comportamento observado:** o endpoint de token responde **HTTP 400** com o
corpo:

```json
{ "error": "invalid_grant", "error_description": "Account is not fully set up" }
```

Esse retorno é específico do Keycloak e indica que as credenciais foram
aceitas e a identidade foi resolvida, mas a conta associada possui **ações
obrigatórias pendentes** (required actions) — por exemplo perfil incompleto,
e-mail não verificado, senha provisória ou termo de uso não aceito. Não se
trata de `invalid_client`, que é o retorno esperado para credencial incorreta.

**Hipótese:** a conta do Portal de Serviços foi criada através do login
**gov.br (CPF)**, enquanto a integração autentica com o **e-CNPJ da empresa**.
São identidades distintas, e a identidade vinculada ao e-CNPJ aparenta ter
cadastro incompleto.

**O que já tentei:**

1. Acessar o Portal de Serviços escolhendo autenticação por certificado digital
   e-CNPJ, para completar o cadastro pela interface. [descreva o que aconteceu]
2. Acessar diretamente o endpoint de autorização
   `/protocol/openid-connect/auth`, que retorna **HTTP 403 no gateway**, com e
   sem certificado de cliente — portanto a tela que normalmente exibiria e
   limparia as pendências não fica acessível por esse caminho.
3. Testar as variações de envio das credenciais (secret no corpo e no header
   `Authorization: Basic`), com e sem certificado de cliente na conexão. Todas
   retornam a mesma mensagem.

**Solicito:**

1. Verificação, no provedor de identidade, das **ações obrigatórias pendentes**
   na conta vinculada ao CNPJ 30.889.880/0001-60, e a remoção ou orientação de
   como concluí-las.
2. Confirmação de qual **grant type** o client de integração deve utilizar
   (`client_credentials` ou outro) e se é esperado o uso de **mTLS** com o
   certificado e-CNPJ na chamada ao endpoint de token.
3. Confirmação de que a conta de integração deve estar vinculada ao **e-CNPJ**
   e não ao CPF do responsável — e, em caso positivo, como fazer esse vínculo.

Dados para localizar a requisição nos logs:

- CNPJ: 30.889.880/0001-60
- Client ID: [preencha]
- Data/hora das tentativas: [preencha, com fuso]
- IP de origem: [preencha]

Anexo a saída completa do diagnóstico, sem segredos.

Atenciosamente,
[nome] — [telefone] — [e-mail]
