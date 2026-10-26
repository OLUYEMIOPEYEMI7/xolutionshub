// Ensures every address in ADMIN_EMAILS (comma-separated) has an admin account.
// New accounts are created without a usable password; the owner sets one with
// "Forgot password?" on /login, which emails a one-time link. Existing accounts are
// promoted to admin. Nothing is ever demoted or deleted here.
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { UNACTIVATED_PREFIX } = require('./routes/admin');

module.exports = async function bootstrapAdmins() {
  const emails = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  for (const email of emails) {
    const existing = await db.findStudentByEmail(email);
    if (!existing) {
      await db.createStudent({
        id: uuidv4(), name: 'XOLUTIONS HUB Admin', email, phone: null, isAdmin: true,
        passwordHash: UNACTIVATED_PREFIX + crypto.randomBytes(16).toString('hex')
      });
      console.log('Admin account created (set its password via Forgot password):', email);
    } else if (!existing.isAdmin) {
      await db.setStudentAdmin(existing.id);
      console.log('Existing account promoted to admin:', email);
    }
  }
};
