const { Client } = require('pg');

async function query(text, params) {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL || process.env.POSTGRES_URL_NO_SSL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    const result = await client.query(text, params);
    return result;
  } finally {
    await client.end();
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Create RSVPs table
    await query(`
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

    // Create index on email for faster lookups
    await query('CREATE INDEX IF NOT EXISTS idx_rsvps_email ON rsvps(email)');

    // Create index on created_at for sorting
    await query('CREATE INDEX IF NOT EXISTS idx_rsvps_created_at ON rsvps(created_at)');

    res.status(200).json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({ error: 'Failed to initialize database' });
  }
}
