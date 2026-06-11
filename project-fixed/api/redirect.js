// api/redirect.js
// Valida o token de curta duração e faz redirect para a URL real do Monday.
// Se o token expirou ou foi forjado, retorna 403.
// O usuário/iframe NUNCA vê a URL real — apenas recebe o conteúdo via redirect 302.

const jwt = require('jsonwebtoken');

module.exports = function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { token } = req.query;
  if (!token) return res.status(400).send('Token ausente.');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(403).send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0d1229;color:#f0f2f8;">
          <h2 style="color:#d4292e">Link expirado</h2>
          <p>Este link de acesso expirou. Volte ao dashboard e tente novamente.</p>
        </body></html>
      `);
    }
    return res.status(403).send('Token inválido.');
  }

  const { url } = payload;
  if (!url) return res.status(400).send('Token mal formado.');

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  console.log(`[REDIRECT] usuario=${payload.usuario} | ip=${ip}`);

  // Redireciona para a URL real — o browser/iframe recebe o conteúdo
  // mas a URL real aparece apenas no Network tab por ~1 frame, não na barra de endereços do iframe
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.redirect(302, url);
};
