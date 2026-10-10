// One-off script: create or promote an admin account.
// Usage: DATABASE_URL=... node scripts/create-admin.js "Full Name" email@example.com
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

async function main() {
  const [name, email] = process.argv.slice(2);
  if (!name || !email) {
    console.error('Usage: node scripts/create-admin.js "Full Name" email@example.com');
    process.exit(1);
  }
  const tempPassword = require('crypto').randomBytes(9).toString('base64url');
  let student = await db.findStudentByEmail(email);
  if (student) {
    await db.query('UPDATE xh_students SET is_admin = TRUE, password_hash = $1 WHERE id = $2', [bcrypt.hashSync(tempPassword, 10), student.id]);
    console.log('Promoted existing account to admin:', email);
  } else {
    await db.createStudent({ id: uuidv4(), name, email, phone: null, passwordHash: bcrypt.hashSync(tempPassword, 10), isAdmin: true });
    console.log('Created new admin account:', email);
  }
  console.log('Temporary password:', tempPassword);
  console.log('Log in at /login then you can change it is not yet supported in UI — re-run this script to reset.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
