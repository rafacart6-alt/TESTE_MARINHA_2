// api/login.js — Vercel Serverless Function
// Dependências: npm install bcryptjs jsonwebtoken

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

// ─── USUÁRIOS ────────────────────────────────────────────────────────────────
const USERS = {
  edisson: process.env.HASH_EDISSON,
  artur: process.env.HASH_ARTUR,
  diretoria: process.env.HASH_DIRETORIA,
  marinha: process.env.HASH_MARINHA,
  obramarinha: process.env.HASH_OBRAMARINHA,
  luisfarina: process.env.HASH_LUISFARINA,
  marcelofelzky: process.env.HASH_MARCELOFELZKY,
  rafaelsantanna: process.env.HASH_RAFAELSANTANNA,
  viniciusgomes: process.env.HASH_VINICIUSGOMES,
  luisfoliatti: process.env.HASH_LUISFOLIATTI,
  sabrinagama: process.env.HASH_SABRINAGAMA,
  alessandrarenno: process.env.HASH_ALESSANDRARENNO,
  ivaldosilva: process.env.HASH_IVALDOSILVA,
  luizxavier: process.env.HASH_LUIZXAVIER,
  luizteixeira: process.env.HASH_LUIZTEIXEIRA,
  lobojunior: process.env.HASH_LOBO,
  leonardodalaqua: process.env.HASH_LEODALAQUA,
  antoniojunior: process.env.HASH_ANTONIOJUNIOR,
  andressamaboni: process.env.HASH_ANDREMABONI,
  hevilaribeiro: process.env.HASH_HEVILA,
  gabrielandrade: process.env.HASH_GABIANDRADE,
  mariaantoniassi: process.env.HASH_MARIAANTONIASSI,
  pedrochan: process.env.HASH_PEDROCHAN,
  andersonrodrigo: process.env.HASH_ANDERRODRIGO,
  eduardoleitao: process.env.HASH_EDULEITAO,
  alexandretrentin: process.env.HASH_ALEXTREINTIN,
  felipekrusche: process.env.HASH_FELIPEKRUSCHE,
  anamaia: process.env.HASH_ANAMAIA,
};

// ─── CONFIGURAÇÕES ───────────────────────────────────────────────────────────
const JWT_SECRET      = process.env.JWT_SECRET;       // string longa e aleatória
const JWT_EXPIRES_IN  = '8h';                          // sessão expira em 8h
const MAX_ATTEMPTS    = 5;
const LOCKOUT_MS      = 60 * 1000;                     // 1 minuto

// Rate limiting em memória (reseta ao cold-start da função)
const attempts = {};

function getRateKey(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
}

function isLocked(ip) {
  const r = attempts[ip];
  if (!r) return false;
  if (r.count >= MAX_ATTEMPTS) {
    if (Date.now() - r.lastAt < LOCKOUT_MS) return true;
    delete attempts[ip]; // lockout expirou
  }
  return false;
}

function registerFail(ip) {
  if (!attempts[ip]) attempts[ip] = { count: 0, lastAt: 0 };
  attempts[ip].count++;
  attempts[ip].lastAt = Date.now();
}

function resetAttempts(ip) {
  delete attempts[ip];
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  // CORS — ajuste a origem para o seu domínio em produção
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ ok: false, mensagem: 'Método não permitido.' });

  // Variáveis de ambiente obrigatórias
  if (!JWT_SECRET) {
    console.error('JWT_SECRET não configurado nas env vars do Vercel.');
    return res.status(500).json({ ok: false, mensagem: 'Erro de configuração do servidor.' });
  }

  const ip = getRateKey(req);
  if (isLocked(ip)) {
    return res.status(429).json({ ok: false, mensagem: 'Muitas tentativas. Aguarde 1 minuto.' });
  }

  const { usuario, senha } = req.body || {};

  if (!usuario || !senha) {
    return res.status(400).json({ ok: false, mensagem: 'Preencha todos os campos.' });
  }

  const nome = usuario.trim().toLowerCase();
  const hashEsperado = USERS[nome];

  // Delay constante para evitar timing attacks (mesmo quando usuário não existe)
  const senhaParaComparar = hashEsperado || '$2a$12$invalido.hash.para.evitar.timing.attacks.xxxxxxxxxxxx';

  const valido = hashEsperado
    ? await bcrypt.compare(senha, senhaParaComparar)
    : false;

  if (!valido) {
    registerFail(ip);
    return res.status(401).json({ ok: false, mensagem: 'Usuário ou senha incorretos.' });
  }

  resetAttempts(ip);

  const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  console.log(`✅ LOGIN     | ${agora} | usuario: ${nome.padEnd(20)} | ip: ${ip}`);
  
  const token = jwt.sign(
    { usuario: nome },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return res.status(200).json({ ok: true, token, usuario: nome });
};