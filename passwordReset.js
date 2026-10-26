// Stateless, single-use password reset tokens.
// token = base64url({e: email, x: expiry}) + "." + HMAC(email|expiry|currentPasswordHash)
// Including the current hash makes a token stop working as soon as the password changes,
// so each link can only be used once. No database table needed.
const crypto = require('crypto');

const TTL_MS = 60 * 60 * 1000; // 1 hour
const secret = () => process.env.SESSION_SECRET || 'xh-dev-secret-change-me';
const sign = (email, exp, passwordHash) =>
  crypto.createHmac('sha256', secret()).update(email + '|' + exp + '|' + passwordHash).digest('base64url');

function createToken(student) {
  const exp = Date.now() + TTL_MS;
  const body = Buffer.from(JSON.stringify({ e: student.email, x: exp })).toString('base64url');
  return body + '.' + sign(student.email, exp, student.passwordHash);
}

// Returns the email the token is for (unverified), or null if malformed/expired.
function readToken(token) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) return null;
  try {
    const { e, x } = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (typeof e !== 'string' || typeof x !== 'number' || x < Date.now()) return null;
    return { email: e, exp: x, sig };
  } catch { return null; }
}

function verifyToken(parsed, student) {
  if (!parsed || !student) return false;
  const expected = Buffer.from(sign(student.email, parsed.exp, student.passwordHash));
  const given = Buffer.from(parsed.sig);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

module.exports = { createToken, readToken, verifyToken };
