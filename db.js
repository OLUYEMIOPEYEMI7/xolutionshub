const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
    ? { rejectUnauthorized: false }
    : false
});

async function query(text, params) {
  const result = await pool.query(text, params);
  return result.rows;
}

module.exports = {
  pool,
  query,

  // Students
  async findStudentByEmail(email) {
    const rows = await query('SELECT id, name, email, phone, password_hash AS "passwordHash", is_admin AS "isAdmin", created_at AS "createdAt" FROM xh_students WHERE email = $1', [email.toLowerCase()]);
    return rows[0] || null;
  },
  async findStudentById(id) {
    const rows = await query('SELECT id, name, email, phone, password_hash AS "passwordHash", is_admin AS "isAdmin", created_at AS "createdAt" FROM xh_students WHERE id = $1', [id]);
    return rows[0] || null;
  },
  async createStudent({ id, name, email, phone, passwordHash, isAdmin }) {
    const rows = await query(
      'INSERT INTO xh_students (id, name, email, phone, password_hash, is_admin) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, email, phone, is_admin AS "isAdmin", created_at AS "createdAt"',
      [id, name, email.toLowerCase(), phone || null, passwordHash, !!isAdmin]
    );
    return rows[0];
  },

  // Orders
  async createOrder(o) {
    const rows = await query(
      `INSERT INTO xh_orders
        (id, reference, student_id, name, email, phone, institution, level, project_topic, project_description,
         items, delivery_speed, services_total, handling_total, grand_total, payment_status, order_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [o.id, o.reference, o.studentId || null, o.name, o.email, o.phone || null, o.institution || null, o.level || null,
       o.projectTopic || null, o.projectDescription || null, JSON.stringify(o.items), o.deliverySpeed,
       o.servicesTotal, o.handlingTotal, o.grandTotal, o.paymentStatus || 'pending', o.orderStatus || 'awaiting_payment']
    );
    return rows[0];
  },
  async findOrderByReference(reference) {
    const rows = await query('SELECT * FROM xh_orders WHERE reference = $1', [reference]);
    return rows[0] || null;
  },
  async findOrderById(id) {
    const rows = await query('SELECT * FROM xh_orders WHERE id = $1', [id]);
    return rows[0] || null;
  },
  async ordersForStudent(studentId) {
    return query('SELECT * FROM xh_orders WHERE student_id = $1 ORDER BY created_at DESC', [studentId]);
  },
  async ordersForEmail(email) {
    return query('SELECT * FROM xh_orders WHERE email = $1 ORDER BY created_at DESC', [email.toLowerCase()]);
  },
  async updateOrderPaymentStatus(reference, paymentStatus, orderStatus) {
    await query('UPDATE xh_orders SET payment_status = $1, order_status = $2, updated_at = NOW() WHERE reference = $3', [paymentStatus, orderStatus, reference]);
  },
  async linkOrderToStudent(orderId, studentId) {
    await query('UPDATE xh_orders SET student_id = $1, updated_at = NOW() WHERE id = $2', [studentId, orderId]);
  },
  async setStudentPassword(id, passwordHash) {
    await query('UPDATE xh_students SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
  },
  async updateOrderStatus(id, orderStatus, adminNotes) {
    await query('UPDATE xh_orders SET order_status = $1, admin_notes = COALESCE($2, admin_notes), updated_at = NOW() WHERE id = $3', [orderStatus, adminNotes, id]);
  },
  async allOrders() {
    return query('SELECT * FROM xh_orders ORDER BY created_at DESC', []);
  },

  // Documents
  async addDocument({ id, orderId, originalName, mimetype, data, uploadedBy }) {
    await query('INSERT INTO xh_order_documents (id, order_id, original_name, mimetype, data, uploaded_by) VALUES ($1,$2,$3,$4,$5,$6)',
      [id, orderId, originalName, mimetype, data, uploadedBy || 'student']);
  },
  async documentsForOrder(orderId) {
    return query('SELECT id, order_id AS "orderId", original_name AS "originalName", mimetype, uploaded_by AS "uploadedBy", created_at AS "createdAt" FROM xh_order_documents WHERE order_id = $1 ORDER BY created_at DESC', [orderId]);
  },
  async getDocument(id) {
    const rows = await query('SELECT * FROM xh_order_documents WHERE id = $1', [id]);
    return rows[0] || null;
  }
};
