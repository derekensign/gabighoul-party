const { Client } = require('pg');

async function createTable() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL || process.env.POSTGRES_URL_NO_SSL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Create the rsvps table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rsvps (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        guests INTEGER NOT NULL DEFAULT 1,
        payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
        stripe_payment_intent_id VARCHAR(255),
        stripe_refund_id VARCHAR(255),
        refund_amount INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    console.log('✅ Table created successfully!');

    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_rsvps_email ON rsvps(email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_rsvps_created_at ON rsvps(created_at)');
    
    console.log('✅ Indexes created successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

createTable();
