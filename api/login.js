const { getDb } = require('./firebaseAdmin');
const { sanitizePhone, parseBody, sendJson, signToken } = require('./utils');

const ALLOWED_USERS = [
  { phone: '556291817556', category: 'imersao1' },
  { phone: '5527988159986', category: 'imersao1' },
  { phone: '5521965277249', category: 'imersao1' },
  { phone: '5511957868500', category: 'imersao1' },
  { phone: '558597492473', category: 'imersao1' },
  { phone: '555481349932', category: 'imersao1' },
  { phone: '557588691415', category: 'imersao1' },
  { phone: '558197025272', category: 'imersao1' },
  { phone: '556299865952', category: 'imersao1' },
  { phone: '553185936438', category: 'imersao1' },
  { phone: '557192402099', category: 'imersao1' },
  { phone: '558198286078', category: 'imersao1' },
  { phone: '5511984046177', category: 'imersao1' },
  { phone: '553197133255', category: 'imersao1' },
  { phone: '555183412500', category: 'imersao1' },
  { phone: '557183192338', category: 'imersao1' },
  { phone: '553171526961', category: 'imersao1' },
  { phone: '5524981824259', category: 'imersao1' },
  { phone: '554197656857', category: 'imersao1' },
  { phone: '553299544923', category: 'imersao1' },
  { phone: '555198553204', category: 'imersao1' },
  { phone: '5519971463920', category: 'imersao1' },
  { phone: '553194371680', category: 'imersao1' },
  { phone: '556993186232', category: 'imersao1' },
  { phone: '553191867157', category: 'imersao1' },
  { phone: '555592241771', category: 'imersao1' },
  { phone: '5524992585486', category: 'imersao1' },
  { phone: '5521968986505', category: 'imersao1' },
  { phone: '5511984662320', category: 'imersao1' },
  { phone: '5512996052271', category: 'imersao1' },
  { phone: '558393515764', category: 'imersao1' },
  { phone: '554688323216', category: 'imersao1' },
  { phone: '557192979443', category: 'imersao1' },
  { phone: '557799306262', category: 'imersao1' },
  { phone: '5521995964831', category: 'imersao1' },
  { phone: '558898058046', category: 'imersao1' },
  { phone: '5511961458686', category: 'imersao1' },
  { phone: '5511917477678', category: 'imersao1' },
  { phone: '553199138178', category: 'imersao1' },
  { phone: '5524992910708', category: 'imersao1' },
  { phone: '5524992478084', category: 'imersao1' },
  { phone: '5524999157259', category: 'imersao1' },
  { phone: '5521959520375', category: 'imersao1' },
];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Metodo nao permitido.' });
  }

  let body = {};
  try {
    body = await parseBody(req);
  } catch (err) {
    return sendJson(res, 400, { error: 'JSON invalido.' });
  }

  const name = (body.name || '').trim();
  const phone = sanitizePhone(body.phone);
  if (!name || !phone) {
    return sendJson(res, 400, { error: 'Nome e telefone sao obrigatorios.' });
  }

  const allowed = ALLOWED_USERS.find(u => u.phone === phone);
  if (!allowed) {
    return sendJson(res, 401, { error: 'Telefone nao autorizado.' });
  }

  const user = { name, phone, category: allowed.category };

  try {
    const db = getDb();
    await db.collection('users').doc(phone).set({
      ...user,
      updatedAt: new Date(),
      createdAt: new Date(),
    }, { merge: true });

    const token = signToken({
      ...user,
      exp: Date.now() + (1000 * 60 * 60 * 24 * 30), // 30 dias
    });

    return sendJson(res, 200, { user, token });
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: 'Falha ao salvar acesso.' });
  }
};
