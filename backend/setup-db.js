const pool = require('./src/db');
const bcrypt = require('bcryptjs');

async function setup() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS merchant_settings (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) DEFAULT 'Bezeid',
        password VARCHAR(255) NOT NULL
      );
    `);

    const hash = await bcrypt.hash('bezeid2026', 10);

    await pool.query(`
      INSERT INTO merchant_settings (id, name, password)
      VALUES (1, 'Bezeid', $1)
      ON CONFLICT (id) DO UPDATE SET password = $1;
    `, [hash]);

    console.log('✅ Base Supabase initialisée ! Mot de passe réinitialisé à : bezeid2026');
  } catch (err) {
    console.error('❌ Erreur de connexion / configuration :', err);
  } finally {
    await pool.end();
  }
}

setup();