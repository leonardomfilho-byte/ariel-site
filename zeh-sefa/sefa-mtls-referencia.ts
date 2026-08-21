/**
 * Referência de como falar com a API do DEC (SEFA-PA) usando mTLS.
 *
 * Não é para copiar inteiro: é para comparar com o `dec.service.ts` atual e
 * conferir ponto a ponto. O que importa aqui são as quatro decisões marcadas
 * com ARMADILHA — cada uma delas falha em silêncio, que é o pior modo de
 * falhar num serviço que roda sozinho de madrugada.
 *
 * Requisito documentado pela SEFA em apis.sefa.pa.gov.br/docs:
 *
 *   "Algumas APIs, como por exemplo a do DEC, exigem autenticação com mTLS,
 *    usando certificado digital e-CPF ou e-CNPJ. (...) você deve realizar a
 *    requisição de autenticação também com o certificado digital, além do
 *    Client ID e Client Secret."
 *
 * "Requisição de autenticação" = a chamada de token. O certificado entra nas
 * duas pontas: token e API.
 */

import https from 'node:https';
import { URL, URLSearchParams } from 'node:url';

// Configuráveis por ambiente para permitir apontar para homologação e para
// os testes, sem editar código. Os valores padrão são os de produção.
const TOKEN_URL =
  process.env.SEFA_TOKEN_URL ??
  'https://apis-auth.sefa.pa.gov.br/protocol/openid-connect/token';
const API_BASE =
  process.env.SEFA_API_BASE ?? 'https://apis-publicas-gw.sefa.pa.gov.br/dec';

interface CredenciaisSefa {
  clientId: string;
  clientSecret: string;
  /** Conteúdo do .pfx/.p12. Em produção vem do Secret Manager, nunca do disco. */
  pfx: Buffer;
  senhaPfx: string;
}

/* -------------------------------------------------------------------------
 * ARMADILHA 1 — o `fetch` nativo do Node ignora `agent`.
 *
 * Isto NÃO envia certificado nenhum, e não dá erro:
 *
 *     fetch(url, { agent: new https.Agent({ pfx }) })   // ❌ silenciosamente sem mTLS
 *
 * O `fetch` do Node não conhece a opção `agent` — ele a descarta. A conexão
 * sai sem certificado e o servidor responde como se você nunca tivesse
 * mandado um. É indistinguível de "a SEFA não configurou nada".
 *
 * Alternativas que de fato funcionam:
 *   - `https.request` do próprio Node, como abaixo (zero dependência nova);
 *   - axios: `new https.Agent({ pfx, passphrase })` em `httpsAgent`;
 *   - fetch + undici: `new Agent({ connect: { pfx, passphrase } })` passado
 *     em `dispatcher` (exige `npm i undici`).
 *
 * Se o `dec.service.ts` usa `fetch` com `agent`, é aqui que ele quebra —
 * e explica um erro de servidor que parece ser "culpa deles".
 *
 * VERIFICADO em 21/08 contra um servidor que exige certificado de cliente:
 *
 *   fetch + agent   -> HTTP 401  {"error":"invalid_client", ...}   sem exceção
 *   https.request   -> HTTP 200  {"access_token":"...", ...}
 *
 * Mesmo certificado, mesma senha, mesmo servidor. A diferença é só o cliente
 * HTTP. Repare que o 401 é indistinguível de "credencial recusada" — por isso
 * essa armadilha custa dias: o erro aponta para o lugar errado.
 * ------------------------------------------------------------------------- */

function requisicaoMtls(
  url: string,
  opcoes: { metodo: 'GET' | 'POST'; corpo?: string; headers?: Record<string, string> },
  cred: CredenciaisSefa,
): Promise<{ status: number; corpo: string }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      {
        method: opcoes.metodo,
        hostname: u.hostname,
        port: u.port || 443,
        path: u.pathname + u.search,
        headers: {
          accept: 'application/json',
          ...(opcoes.corpo
            ? {
                'content-type': 'application/x-www-form-urlencoded',
                'content-length': Buffer.byteLength(opcoes.corpo),
              }
            : {}),
          ...opcoes.headers,
        },
        pfx: cred.pfx,
        passphrase: cred.senhaPfx,

        // ARMADILHA 2 — nunca `rejectUnauthorized: false`. Ele "resolve" erro
        // de cadeia desligando a verificação do servidor, o que abre a porta
        // para interceptação. Erro de cadeia se resolve arrumando a cadeia.
        rejectUnauthorized: true,
      },
      (res) => {
        let dados = '';
        res.on('data', (c) => (dados += c));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, corpo: dados }));
      },
    );
    req.on('error', reject);
    if (opcoes.corpo) req.write(opcoes.corpo);
    req.end();
  });
}

/* -------------------------------------------------------------------------
 * ARMADILHA 3 — pedir token a cada chamada.
 *
 * O token vale por `expires_in` segundos. Pedir um novo a cada consulta
 * multiplica as chamadas ao Keycloak sem necessidade e, num serviço que
 * reinicia em laço, vira tráfego de ataque aos olhos de quem monitora.
 * Guardar em memória com margem de segurança resolve.
 *
 * A margem existe porque o token pode expirar entre o "ainda vale" e a
 * chegada da requisição do outro lado.
 * ------------------------------------------------------------------------- */

let tokenEmCache: { valor: string; expiraEm: number } | null = null;
const MARGEM_MS = 30_000;

export async function obterToken(cred: CredenciaisSefa): Promise<string> {
  if (tokenEmCache && Date.now() < tokenEmCache.expiraEm - MARGEM_MS) {
    return tokenEmCache.valor;
  }

  const corpo = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: cred.clientId,
    client_secret: cred.clientSecret,
  }).toString();

  const r = await requisicaoMtls(TOKEN_URL, { metodo: 'POST', corpo }, cred);

  if (r.status !== 200) {
    // ARMADILHA 4 — engolir o corpo do erro.
    //
    // O Keycloak diz exatamente o que está errado no `error_description`, e
    // cada mensagem aponta para um lugar diferente:
    //
    //   "Client not enabled to retrieve service account"
    //        -> o client não tem service account habilitado (config da SEFA)
    //   "Account is not fully set up"
    //        -> caiu num fluxo de usuário; conta com pendência de cadastro
    //   "invalid_client"
    //        -> client_id/secret errados ou de aplicações diferentes
    //   "unsupported_grant_type"
    //        -> o grant não está habilitado nesse client
    //
    // Um log com só "falha ao obter token" apaga justamente a informação que
    // decide o próximo passo. Preservar o corpo.
    throw new Error(`SEFA token HTTP ${r.status}: ${r.corpo}`);
  }

  const json = JSON.parse(r.corpo) as { access_token: string; expires_in: number };
  tokenEmCache = {
    valor: json.access_token,
    expiraEm: Date.now() + json.expires_in * 1000,
  };
  return json.access_token;
}

/** O certificado vai também nas chamadas da API, não só na de token. */
export async function chamarApiDec(
  caminho: string,
  cred: CredenciaisSefa,
): Promise<unknown> {
  const token = await obterToken(cred);
  const r = await requisicaoMtls(
    `${API_BASE}${caminho}`,
    { metodo: 'GET', headers: { authorization: `Bearer ${token}` } },
    cred,
  );

  if (r.status === 401 || r.status === 403) {
    // Token pode ter sido revogado antes de expirar. Descarta o cache para
    // que a próxima tentativa peça um novo, em vez de repetir o inválido.
    tokenEmCache = null;
  }
  if (r.status !== 200) {
    throw new Error(`SEFA ${caminho} HTTP ${r.status}: ${r.corpo}`);
  }
  return JSON.parse(r.corpo);
}

/**
 * Teste mais barato de "o acesso está de pé?": devolve os vínculos do
 * CPF/CNPJ que o token carrega. Não abre mensagem nenhuma.
 */
export const consultarVinculos = (cred: CredenciaisSefa) => chamarApiDec('/vinculos', cred);

/* -------------------------------------------------------------------------
 * O que este arquivo deliberadamente NÃO faz
 *
 * Não abre mensagem do DEC. Abrir registra ciência e faz o prazo legal
 * correr — é decisão do Leo, não do sistema. Qualquer função que marque
 * mensagem como lida precisa ser disparada por clique humano, nunca por
 * agendador. Vale a mesma regra da manifestação na DistribuiçãoDFe.
 * ------------------------------------------------------------------------- */
