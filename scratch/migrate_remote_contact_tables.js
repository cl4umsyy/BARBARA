const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:freaky56789@db.gyargxxfsuzhepumcynf.supabase.co:5432/postgres'
});

async function main() {
  const client = await pool.connect();
  console.log('Connected to remote Supabase database. Starting contact tables migration...');

  try {
    await client.query('BEGIN');

    // 1. Create contact_information table
    console.log('Creating contact_information table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_information (
        id TEXT PRIMARY KEY,
        store_name TEXT NOT NULL,
        description TEXT NOT NULL,
        address TEXT NOT NULL,
        whatsapp TEXT NOT NULL,
        email TEXT NOT NULL,
        business_hours TEXT NOT NULL,
        instagram_url TEXT,
        tiktok_url TEXT,
        facebook_url TEXT,
        google_maps_url TEXT,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create contact_messages table
    console.log('Creating contact_messages table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Seed default contact information
    console.log('Seeding default contact details...');
    await client.query(`
      INSERT INTO contact_information (
        id, 
        store_name, 
        description, 
        address, 
        whatsapp, 
        email, 
        business_hours, 
        instagram_url, 
        tiktok_url, 
        facebook_url, 
        google_maps_url
      ) VALUES (
        'contact_info_default',
        'BARBARA',
        'Premium fashion & thrift store. Handpicked quality products for your everyday curated style.',
        'Jl. Sunan Kudus No. 100, Kudus, Jawa Tengah 59313, Indonesia',
        '6281234567890',
        'contact@barbarastore.com',
        'Senin - Minggu, 09.00 - 21.00 WIB',
        'https://instagram.com/barbara.curated',
        'https://tiktok.com/@barbara.curated',
        'https://facebook.com/barbara.curated',
        'https://maps.app.goo.gl/k5tJ8F2c6y1Q8f3M8'
      ) ON CONFLICT (id) DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('Remote contact tables migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Remote migration failed, rolled back.', err);
  } finally {
    client.release();
  }
  await pool.end();
}

main().catch(console.error);
