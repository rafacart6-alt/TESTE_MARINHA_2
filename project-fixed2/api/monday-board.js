// api/monday-board.js
// Busca dados do quadro Monday via API GraphQL usando o token do servidor.
// O cliente NUNCA vê o token — tudo fica no servidor.

const jwt = require('jsonwebtoken');

// Mapa de board IDs por nome interno
const BOARD_IDS = {
  'avfs':  process.env.BOARD_AVFS_ID  || '18403513994',
  'avb':   process.env.BOARD_AVB_ID   || '',
  'lean':  process.env.BOARD_LEAN_ID  || '',
  'eng':   process.env.BOARD_ENG_ID   || '',
  'sis':   process.env.BOARD_SIS_ID   || '',
  'plsrv': process.env.BOARD_PLSRV_ID || '',
  'matap': process.env.BOARD_MATAP_ID || '',
};

async function fetchMonday(query, variables = {}) {
  // fetch nativo disponível no Node 18+ (Vercel usa Node 18 por padrão)
  const res = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': process.env.MONDAY_API_TOKEN,
      'API-Version': '2024-01',
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

async function getBoardData(boardId) {
  const query = `
    query ($boardId: ID!) {
      boards(ids: [$boardId]) {
        name
        columns { id title type }
        items_page(limit: 500) {
          items {
            id
            name
            column_values { id text value }
            subitems {
              id
              name
              column_values { id text value }
            }
          }
        }
      }
    }
  `;
  return fetchMonday(query, { boardId: String(boardId) });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  // Valida JWT do usuário
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ ok: false, mensagem: 'Não autenticado.' });

  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ ok: false, mensagem: 'Token inválido ou expirado.' });
  }

  const { board } = req.query;
  const boardId = BOARD_IDS[board];
  if (!boardId) return res.status(404).json({ ok: false, mensagem: 'Board não encontrado ou ID não configurado.' });

  if (!process.env.MONDAY_API_TOKEN) {
    return res.status(500).json({ ok: false, mensagem: 'MONDAY_API_TOKEN não configurado no servidor.' });
  }

  try {
    const data = await getBoardData(boardId);
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    console.error('[MONDAY-BOARD] Erro:', e);
    return res.status(500).json({ ok: false, mensagem: 'Erro ao buscar dados do Monday: ' + e.message });
  }
};
