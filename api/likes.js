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
  const liked = Boolean(body.liked);

  if (!videoId) {
    return sendJson(res, 400, { error: 'videoId obrigatorio.' });
  }

  try {
    const db = getDb();
    await db.collection('likes').doc(`${videoId}-${user.phone}`).set({
      videoId,
      userName: user.name,
      phone: user.phone,
      category: user.category,
      liked,
      updatedAt: new Date(),
    }, { merge: true });
    return sendJson(res, 200, { ok: true });
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: 'Falha ao registrar like.' });
  }
};
