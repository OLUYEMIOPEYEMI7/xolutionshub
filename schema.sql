CREATE TABLE IF NOT EXISTS xh_students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS xh_orders (
  id TEXT PRIMARY KEY,
  reference TEXT UNIQUE NOT NULL,
  student_id TEXT REFERENCES xh_students(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  institution TEXT,
  level TEXT,
  project_topic TEXT,
  project_description TEXT,
  items JSONB NOT NULL,
  delivery_speed TEXT NOT NULL DEFAULT 'normal',
  services_total INTEGER NOT NULL,
  handling_total INTEGER NOT NULL DEFAULT 0,
  grand_total INTEGER NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  order_status TEXT NOT NULL DEFAULT 'awaiting_payment',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document bytes stored directly in Postgres (not on disk) so uploads survive
-- Render redeploys, which wipe the ephemeral filesystem.
CREATE TABLE IF NOT EXISTS xh_order_documents (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES xh_orders(id),
  original_name TEXT NOT NULL,
  mimetype TEXT,
  data BYTEA NOT NULL,
  uploaded_by TEXT NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Login sessions (express-session via connect-pg-simple). The app creates this table
-- automatically on first start; it is listed here for reference.
CREATE TABLE IF NOT EXISTS xh_sessions (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON xh_sessions (expire);
