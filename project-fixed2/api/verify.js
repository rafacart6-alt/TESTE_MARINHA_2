// api/verify.js — valida o JWT em requisições protegidas
const jwt = require('jsonwebtoken');

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).end();

  const auth  = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) return res.status(401).json({ ok: false });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return res.status(200).json({ ok: true, usuario: payload.usuario });
  } catch {
    return res.status(401).json({ ok: false, mensagem: 'Token inválido ou expirado.' });
  }
};
