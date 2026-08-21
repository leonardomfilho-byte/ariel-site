#!/usr/bin/env node
/**
 * Diagnóstico da integração com a API da SEFA-PA (DEC).
 *
 * Roda uma bateria de tentativas de obtenção de token contra o Keycloak da
 * SEFA e mostra, para cada uma, exatamente o que foi enviado e o que voltou.
 * O objetivo é separar três causas que produzem sintomas parecidos:
 *
 *   1. credencial errada  -> "invalid_client" / "unauthorized_client"
 *   2. fluxo errado       -> "unsupported_grant_type" / "invalid_grant"
 *   3. conta incompleta   -> "Account is not fully set up"  <- o caso atual
 *
 * Não altera nada e não abre mensagem nenhuma do DEC. Só lê.
 *
 * Uso:
 *   node diagnostico-sefa.mjs            # bateria completa
 *   node diagnostico-sefa.mjs --json     # saída em JSON, para colar em chamado
 */

import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const JSON_MODE = process.argv.includes('--json');

// ---------------------------------------------------------------- .env

function carregarEnv() {
  for (const nome of ['.env', '.env.local']) {
    const arquivo = path.join(AQUI, nome);
    if (!fs.existsSync(arquivo)) continue;
    for (const linha of fs.readFileSync(arquivo, 'utf8').split('\n')) {
      const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const valor = m[2].replace(/^["']|["']$/g, '');
      if (!(m[1] in process.env)) process.env[m[1]] = valor;
    }
  }
}
carregarEnv();

const cfg = {
  issuer: process.env.SEFA_ISSUER_URL || '',
  tokenUrl: process.env.SEFA_TOKEN_URL || '',
  clientId: process.env.SEFA_CLIENT_ID || '',
  clientSecret: process.env.SEFA_CLIENT_SECRET || '',
  scope: process.env.SEFA_SCOPE || '',
  cnpj: (process.env.SEFA_CNPJ || '').replace(/\D/g, ''),
  pfxPath: process.env.SEFA_CERT_PFX || '',
  pfxSenha: process.env.SEFA_CERT_SENHA || '',
  apiUrl: process.env.SEFA_API_URL || '',
};

const faltando = ['tokenUrl', 'clientId', 'clientSecret'].filter((k) => !cfg[k]);
if (faltando.length) {
  console.error(`\nFaltam variáveis no .env: ${faltando.join(', ')}`);
  console.error('Copie o .env.example para .env e preencha.\n');
  process.exit(2);
}

// ---------------------------------------------------------------- certificado

let pfx = null;
if (cfg.pfxPath) {
  try {
    pfx = fs.readFileSync(cfg.pfxPath);
  } catch (e) {
    console.error(`Não consegui ler o certificado em ${cfg.pfxPath}: ${e.message}`);
    console.error('Os testes com mTLS vão ser pulados.\n');
  }
}

// ---------------------------------------------------------------- HTTP

/** POST application/x-www-form-urlencoded, opcionalmente com certificado de cliente. */
function post(url, campos, { comCert, headers = {} } = {}) {
  return new Promise((resolve) => {
    const corpo = new URLSearchParams(campos).toString();
    const u = new URL(url);
    const opcoes = {
      method: 'POST',
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'content-length': Buffer.byteLength(corpo),
        accept: 'application/json',
        'user-agent': 'Zeh/diagnostico-sefa',
        ...headers,
      },
      // Nunca desligar a verificação de TLS. Se der erro de cadeia, o problema
      // é a cadeia — não é para contornar.
      rejectUnauthorized: true,
    };
    if (comCert && pfx) {
      opcoes.pfx = pfx;
      opcoes.passphrase = cfg.pfxSenha;
    }

    const req = https.request(opcoes, (res) => {
      let dados = '';
      res.on('data', (c) => (dados += c));
      res.on('end', () => {
        let corpoJson = null;
        try {
          corpoJson = JSON.parse(dados);
        } catch { /* resposta não-JSON, fica só o texto */ }
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          headers: res.headers,
          texto: dados.slice(0, 1200),
          json: corpoJson,
        });
      });
    });

    req.on('error', (e) => {
      resolve({ ok: false, status: 0, erroRede: e.message, code: e.code });
    });
    req.write(corpo);
    req.end();
  });
}

function get(url, headers = {}, comCert = false) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const opcoes = {
      method: 'GET',
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      headers: { accept: 'application/json', 'user-agent': 'Zeh/diagnostico-sefa', ...headers },
      rejectUnauthorized: true,
    };
    if (comCert && pfx) {
      opcoes.pfx = pfx;
      opcoes.passphrase = cfg.pfxSenha;
    }
    const req = https.request(opcoes, (res) => {
      let dados = '';
      res.on('data', (c) => (dados += c));
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(dados); } catch { /* não-JSON */ }
        resolve({ ok: res.statusCode < 300, status: res.statusCode, texto: dados.slice(0, 1500), json });
      });
    });
    req.on('error', (e) => resolve({ ok: false, status: 0, erroRede: e.message, code: e.code }));
    req.end();
  });
}

// ---------------------------------------------------------------- utilidades

function basic(id, secret) {
  return 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64');
}

function lerJwt(token) {
  try {
    const [, payload] = token.split('.');
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function resumo(r) {
  if (r.erroRede) return `ERRO DE REDE (${r.code}): ${r.erroRede}`;
  const e = r.json?.error;
  const d = r.json?.error_description;
  if (r.ok) return `HTTP ${r.status} — token recebido`;
  if (e) return `HTTP ${r.status} — ${e}${d ? `: ${d}` : ''}`;
  return `HTTP ${r.status} — ${r.texto.replace(/\s+/g, ' ').slice(0, 200)}`;
}

// ---------------------------------------------------------------- bateria

const resultados = [];

async function tentativa(nome, descricao, executar) {
  const r = await executar();
  resultados.push({ nome, descricao, ...r });
  if (!JSON_MODE) {
    console.log(`\n[${nome}] ${descricao}`);
    console.log(`  -> ${resumo(r)}`);
    if (r.ok && r.json?.access_token) {
      const claims = lerJwt(r.json.access_token);
      if (claims) {
        console.log(`     sub=${claims.sub}  azp=${claims.azp}  exp=${new Date(claims.exp * 1000).toISOString()}`);
        if (claims.preferred_username) console.log(`     preferred_username=${claims.preferred_username}`);
      }
    }
  }
  return r;
}

async function principal() {
  if (!JSON_MODE) {
    console.log('='.repeat(72));
    console.log('DIAGNÓSTICO — API SEFA-PA (DEC)');
    console.log('='.repeat(72));
    console.log(`token_endpoint : ${cfg.tokenUrl}`);
    console.log(`client_id      : ${cfg.clientId}`);
    console.log(`client_secret  : ${cfg.clientSecret ? '(definido, ' + cfg.clientSecret.length + ' chars)' : '(VAZIO)'}`);
    console.log(`certificado    : ${pfx ? cfg.pfxPath : '(não carregado)'}`);
    console.log(`CNPJ           : ${cfg.cnpj || '(não informado)'}`);
  }

  // 0. Descoberta do realm. Diz quais grants o servidor aceita de verdade,
  //    em vez de a gente adivinhar pelo manual.
  const issuer = cfg.issuer || cfg.tokenUrl.replace(/\/protocol\/openid-connect\/token.*$/, '');
  if (issuer) {
    const wk = await get(`${issuer}/.well-known/openid-configuration`);
    resultados.push({ nome: 'descoberta', descricao: 'well-known/openid-configuration', ...wk });
    if (!JSON_MODE) {
      console.log(`\n[descoberta] ${issuer}/.well-known/openid-configuration`);
      console.log(`  -> HTTP ${wk.status}`);
      if (wk.json) {
        console.log(`     grant_types_supported: ${JSON.stringify(wk.json.grant_types_supported)}`);
        console.log(`     token_endpoint_auth_methods: ${JSON.stringify(wk.json.token_endpoint_auth_methods_supported)}`);
        if (wk.json.mtls_endpoint_aliases) {
          console.log(`     mtls_endpoint_aliases.token: ${wk.json.mtls_endpoint_aliases.token_endpoint}`);
          console.log('     >> o servidor publica endpoints mTLS separados; use ESTE para o token');
        }
      }
    }
  }

  // 1..N — as combinações. A comparação entre elas é o diagnóstico.
  await tentativa('A', 'client_credentials, secret no corpo, COM certificado', () =>
    post(cfg.tokenUrl, {
      grant_type: 'client_credentials',
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      ...(cfg.scope ? { scope: cfg.scope } : {}),
    }, { comCert: true }));

  await tentativa('B', 'client_credentials, secret no header Basic, COM certificado', () =>
    post(cfg.tokenUrl, {
      grant_type: 'client_credentials',
      ...(cfg.scope ? { scope: cfg.scope } : {}),
    }, { comCert: true, headers: { authorization: basic(cfg.clientId, cfg.clientSecret) } }));

  await tentativa('C', 'client_credentials, secret no corpo, SEM certificado', () =>
    post(cfg.tokenUrl, {
      grant_type: 'client_credentials',
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      ...(cfg.scope ? { scope: cfg.scope } : {}),
    }, { comCert: false }));

  // D — só faz sentido se o manual deles mandar usar o CNPJ como usuário.
  if (cfg.cnpj && process.env.SEFA_USUARIO_SENHA) {
    await tentativa('D', 'password grant (CNPJ como usuário), COM certificado', () =>
      post(cfg.tokenUrl, {
        grant_type: 'password',
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        username: cfg.cnpj,
        password: process.env.SEFA_USUARIO_SENHA,
      }, { comCert: true }));
  }

  // E — se algum token saiu, testa a API de fato.
  const comToken = resultados.find((r) => r.ok && r.json?.access_token);
  if (comToken && cfg.apiUrl) {
    const r = await get(cfg.apiUrl, { authorization: `Bearer ${comToken.json.access_token}` }, true);
    resultados.push({ nome: 'E', descricao: 'chamada à API do DEC com o token', ...r });
    if (!JSON_MODE) {
      console.log(`\n[E] chamada à API do DEC (${cfg.apiUrl})`);
      console.log(`  -> ${resumo(r)}`);
    }
  }

  if (JSON_MODE) {
    // Sem segredo na saída — é para colar em chamado.
    console.log(JSON.stringify(resultados.map((r) => ({
      nome: r.nome, descricao: r.descricao, status: r.status,
      error: r.json?.error, error_description: r.json?.error_description,
      erroRede: r.erroRede, texto: r.json ? undefined : r.texto,
    })), null, 2));
    return;
  }

  // ------------------------------------------------------------ veredito
  console.log('\n' + '='.repeat(72));
  console.log('VEREDITO');
  console.log('='.repeat(72));

  const descricoes = resultados.map((r) => r.json?.error_description || '').join(' | ');
  const erros = resultados.map((r) => r.json?.error || '').join(' | ');
  const algumOk = resultados.some((r) => r.ok && r.json?.access_token);

  if (algumOk) {
    const bom = resultados.find((r) => r.ok && r.json?.access_token);
    console.log(`\nToken obtido na tentativa [${bom.nome}]: ${bom.descricao}`);
    console.log('É essa a combinação que o Zeh deve usar em produção.');
  } else if (/not fully set up/i.test(descricoes)) {
    console.log(`
"Account is not fully set up" veio de volta.

O que esse erro significa, ao pé da letra: o Keycloak da SEFA ACEITOU as
credenciais, resolveu uma identidade de usuário, e recusou o token porque
essa identidade tem pendência de cadastro em aberto (required action) —
tipicamente perfil incompleto, e-mail não verificado, senha provisória ou
termo de uso não aceito.

Ou seja: não é client_id errado, não é secret errado, não é certificado
errado. É a CONTA no lado deles. E a pendência só pode ser resolvida por
quem tem acesso à conta (você, pelo portal) ou pelo administrador do
Keycloak (a SEFA).

Como o /openid-connect/auth responde 403 no gateway, a tela que normalmente
limparia a pendência não está acessível para você. Restam dois caminhos, e
vale fazer os dois:

  1. Entrar no Portal de Serviços da SEFA escolhendo CERTIFICADO DIGITAL
     (e-CNPJ, não gov.br/CPF) e completar o que ele pedir.
  2. Abrir chamado no Fale Conosco. Use o texto pronto em CHAMADO-SEFA.md.
`);
  } else if (/invalid_client|unauthorized_client/i.test(erros)) {
    console.log('\nErro de credencial: client_id ou client_secret não conferem, ou o');
    console.log('client não está habilitado para esse grant. Confira no portal.');
  } else if (/unsupported_grant_type/i.test(erros)) {
    console.log('\nO grant usado não está habilitado nesse client. Veja a linha');
    console.log('grant_types_supported da descoberta, acima.');
  } else {
    console.log('\nNão reconheci o padrão do erro. Rode com --json e leve o resultado');
    console.log('para o chamado — a resposta crua deles é a informação que falta.');
  }

  console.log('\nDica: `node diagnostico-sefa.mjs --json` gera a saída sem segredos,');
  console.log('pronta para anexar no chamado.\n');
}

principal().catch((e) => {
  console.error('\nFalhou:', e);
  process.exit(1);
});
