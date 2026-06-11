// api/dashboard.js — confirma que o usuário está autenticado e retorna info da sessão.
// As URLs dos boards NÃO são mais enviadas ao frontend.
// Use /api/signed-url?board=ID&type=dash para obter um link temporário.

const jwt = require('jsonwebtoken');

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  const auth  = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ ok: false, mensagem: 'Não autenticado.' });

  let usuarioLogado;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    usuarioLogado = payload.usuario;
  } catch {
    return res.status(401).json({ ok: false, mensagem: 'Token inválido ou expirado.' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  console.log(`[DASHBOARD] usuario=${usuarioLogado} | ip=${ip}`);

  // Retorna apenas confirmação — sem URLs
  return res.status(200).json({ ok: true, usuario: usuarioLogado });
};
