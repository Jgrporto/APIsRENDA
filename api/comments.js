const { getDb } = require('./firebaseAdmin');
const { parseBody, sendJson, authFromRequest } = require('./utils');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Metodo nao permitido.' });
  }

  const user = authFromRequest(req);
  if (!user) {
    return sendJson(res, 401, { error: 'Nao autenticado.' });
  }

  let body = {};
  try {
    body = await parseBody(req);
  } catch (err) {
    return sendJson(res, 400, { error: 'JSON invalido.' });
  }

  const videoId = (body.videoId || '').trim();
  const text = (body.text || '').trim();

  if (!videoId || !text) {
    return sendJson(res, 400, { error: 'videoId e texto sao obrigatorios.' });
  }

  try {
    const db = getDb();
    await db.collection('comments').add({
      videoId,
      userName: user.name,
      phone: user.phone,
      category: user.category,
      text,
      createdAt: new Date(),
    });
    return sendJson(res, 200, { ok: true });
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: 'Falha ao registrar comentario.' });
  }
};
