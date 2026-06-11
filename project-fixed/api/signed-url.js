// api/signed-url.js
// Gera um token temporário (30s) para um board específico.
// O frontend NUNCA recebe a URL real do Monday — apenas esse token.

const jwt = require('jsonwebtoken');

// Mapa interno de board → URL real (vive APENAS no servidor)
function getBoardUrl(boardId, type) {
  const map = {
    avfs:  { dash: process.env.AVS_URL,   data: process.env.AVFS_DADOS_URL  },
    avb:   { dash: process.env.AVB_URL,   data: process.env.AVFB_DADOS_URL  },
    lean:  { dash: process.env.LEAN_URL,  data: process.env.LEAN_DADOS_URL  },
    eng:   { dash: process.env.ENG_URL,   data: process.env.ENG_DADOS_URL   },
    sis:   { dash: process.env.SIS_URL,   data: process.env.SIS_DADOS_URL   },
    plsrv: { dash: process.env.PLSRV_URL, data: process.env.PLSRV_DADOS_URL },
    matap: { dash: process.env.MATAP_URL, data: process.env.MATAP_DADOS_URL },
  };
  return map[boardId]?.[type] || null;
}

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')    return res.status(405).end();

  // 1. Valida o JWT do usuário
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

  // 2. Valida os parâmetros da requisição
  const { board, type = 'dash' } = req.query;
  if (!board) return res.status(400).json({ ok: false, mensagem: 'Parâmetro "board" obrigatório.' });

  const targetUrl = getBoardUrl(board, type);
  if (!targetUrl) return res.status(404).json({ ok: false, mensagem: 'Board não encontrado.' });

  // 3. Gera um token de curta duração (30 segundos) que contém a URL real
  // Esse token é assinado com JWT_SECRET — não pode ser forjado
  const signedToken = jwt.sign(
    { url: targetUrl, usuario: usuarioLogado },
    process.env.JWT_SECRET,
    { expiresIn: '30s' }
  );

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  console.log(`[SIGNED-URL] usuario=${usuarioLogado} | board=${board} | type=${type} | ip=${ip}`);

  return res.status(200).json({
    ok: true,
    // Frontend recebe apenas a URL de redirecionamento — sem a URL real do Monday
    redirect_url: `/api/redirect?token=${encodeURIComponent(signedToken)}`
  });
};
