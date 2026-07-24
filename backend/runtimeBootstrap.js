const bcrypt = require('bcryptjs');
const pool = require('./db');

async function bootstrapRuntime() {
  if (process.env.MIGRATE_ON_START !== 'true') return;
  const email = process.env.PROVISION_ADMIN_EMAIL;
  const password = process.env.PROVISION_ADMIN_PASSWORD;
  if (!email || !password) throw new Error('runtime admin credentials are required');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'staff',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ai_results (
      id SERIAL PRIMARY KEY,
      feature VARCHAR(100) NOT NULL,
      input_summary TEXT NOT NULL,
      result_text TEXT NOT NULL,
      result_json JSONB,
      model_used VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  const passwordHash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash, name=EXCLUDED.name, role='admin'`,
    [email.toLowerCase(), passwordHash, process.env.PROVISION_ADMIN_NAME || 'Runtime Admin']
  );
}

module.exports = { bootstrapRuntime };
