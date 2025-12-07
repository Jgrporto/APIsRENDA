const crypto = require('crypto');

function sanitizePhone(value = '') {
  return String(value || '').replace(/\D/g, '');
}

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body) {
      if (typeof req.body === 'object') {
        return resolve(req.body);
      }
      if (typeof req.body === 'string') {
        try {
          return resolve(JSON.parse(req.body));
        } catch (err) {
          return reject(err);
        }
      }
    }
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function requireSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('Defina SESSION_SECRET nas variaveis de ambiente.');
  }
  return secret;
}

function signToken(payload) {
  const secret = requireSessionSecret();
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const secret = requireSessionSecret();
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  if (expected !== sig) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (err) {
    return null;
  }
}

function authFromRequest(req) {
  const header = req.headers?.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  return verifyToken(token);
}

module.exports = {
  sanitizePhone,
  sendJson,
  parseBody,
  signToken,
  verifyToken,
  authFromRequest,
};
